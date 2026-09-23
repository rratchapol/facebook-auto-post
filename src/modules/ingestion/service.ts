import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { categorizeStory, normalizeTitle, scoreStory, titleSimilarity } from "@/modules/stories/scoring";
import type { SourceTier } from "@/modules/sources/types";

import { parseFeedPayload, sourceItemFingerprint } from "./rss";
import type { IngestibleSource, IngestionResult, ParsedSourceItem } from "./types";

const sourceTypeByMode = {
  approved: ["rss", "api"] as const,
  discovery: ["google_news_discovery"] as const,
};

function sourceTierRank(tier: SourceTier) {
  return tier === "tier_1_official" ? 3 : tier === "tier_2_established_media" ? 2 : 1;
}

function evidenceRole(tier: SourceTier) {
  return tier === "tier_3_discovery" ? "discovery" : "primary";
}

function dedupeKey(title: string, publishedAt: string | null) {
  const day = (publishedAt ?? new Date().toISOString()).slice(0, 10);
  return `${normalizeTitle(title)}:${day}`;
}

async function getEnabledSources(mode: keyof typeof sourceTypeByMode) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, source_type, tier, feed_url")
    .eq("enabled", true)
    .in("source_type", [...sourceTypeByMode[mode]]);

  if (error) {
    throw new Error("Unable to list active sources.");
  }

  return (data ?? []) as IngestibleSource[];
}

async function recordFetch(input: {
  sourceId: string;
  status: "succeeded" | "failed";
  startedAt: string;
  itemsFound?: number;
  httpStatus?: number;
  errorCode?: string;
  safeErrorDetail?: string;
}) {
  const supabase = createServiceSupabaseClient();
  await supabase.from("source_fetches").insert({
    source_id: input.sourceId,
    status: input.status,
    started_at: input.startedAt,
    finished_at: new Date().toISOString(),
    items_found: input.itemsFound ?? 0,
    http_status: input.httpStatus ?? null,
    error_code: input.errorCode ?? null,
    safe_error_detail: input.safeErrorDetail ?? null,
  });

  await supabase
    .from("sources")
    .update(input.status === "succeeded" ? { last_success_at: new Date().toISOString() } : { last_failure_at: new Date().toISOString() })
    .eq("id", input.sourceId);
}

async function findOrCreateStory(item: ParsedSourceItem, tier: SourceTier) {
  const supabase = createServiceSupabaseClient();
  const normalizedTitle = normalizeTitle(item.title);
  const key = dedupeKey(item.title, item.publisherPublishedAt);
  const { data: exactStory } = await supabase.from("story_groups").select("*").eq("dedupe_key", key).maybeSingle();

  if (exactStory) {
    return exactStory;
  }

  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: recentStories } = await supabase
    .from("story_groups")
    .select("*")
    .gte("created_at", cutoff)
    .neq("status", "archived")
    .limit(100);
  const similarStory = (recentStories ?? []).find(
    (story) => titleSimilarity(story.normalized_title, normalizedTitle) >= 0.72,
  );

  if (similarStory) {
    return similarStory;
  }

  const initialScore = scoreStory({ tier, publishedAt: item.publisherPublishedAt, evidenceCount: 1 });
  const { data: story, error } = await supabase
    .from("story_groups")
    .insert({
      category: categorizeStory(item.title),
      dedupe_key: key,
      normalized_title: normalizedTitle,
      highest_tier: tier,
      evidence_count: 0,
      score: initialScore.score,
      score_explanation: initialScore.explanation,
    })
    .select("*")
    .single();

  if (error || !story) {
    throw new Error("Unable to create a story group.");
  }

  return story;
}

async function addItemToStory(input: {
  sourceId: string;
  sourceTier: SourceTier;
  item: ParsedSourceItem;
}) {
  const supabase = createServiceSupabaseClient();
  const { data: existing } = await supabase
    .from("source_items")
    .select("id")
    .eq("source_id", input.sourceId)
    .eq("canonical_url", input.item.canonicalUrl)
    .maybeSingle();

  const { data: sourceItem, error } = await supabase
    .from("source_items")
    .upsert(
      {
        source_id: input.sourceId,
        external_id: input.item.externalId,
        canonical_url: input.item.canonicalUrl,
        title: input.item.title,
        excerpt: input.item.excerpt,
        publisher_published_at: input.item.publisherPublishedAt,
        fetched_at: new Date().toISOString(),
        content_hash: sourceItemFingerprint(input.item),
      },
      { onConflict: "source_id,canonical_url" },
    )
    .select("id")
    .single();

  if (error || !sourceItem) {
    throw new Error("Unable to store a source item.");
  }

  const story = await findOrCreateStory(input.item, input.sourceTier);
  const { error: evidenceError } = await supabase.from("story_evidence").upsert(
    {
      story_id: story.id,
      source_item_id: sourceItem.id,
      evidence_role: evidenceRole(input.sourceTier),
    },
    { onConflict: "story_id,source_item_id", ignoreDuplicates: true },
  );

  if (evidenceError) {
    throw new Error("Unable to link source evidence.");
  }

  const { count } = await supabase
    .from("story_evidence")
    .select("*", { count: "exact", head: true })
    .eq("story_id", story.id);
  const evidenceCount = count ?? 1;
  const highestTier = sourceTierRank(input.sourceTier) > sourceTierRank(story.highest_tier as SourceTier)
    ? input.sourceTier
    : (story.highest_tier as SourceTier);
  const score = scoreStory({
    tier: highestTier,
    publishedAt: input.item.publisherPublishedAt,
    evidenceCount,
  });

  await supabase
    .from("story_groups")
    .update({ highest_tier: highestTier, evidence_count: evidenceCount, score: score.score, score_explanation: score.explanation })
    .eq("id", story.id);
  await supabase.from("source_items").update({ status: "grouped" }).eq("id", sourceItem.id);

  return { isNew: !existing, storyId: story.id };
}

async function ingestSource(source: IngestibleSource) {
  if (!source.feed_url) {
    throw new Error("Source does not have a feed URL.");
  }

  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(source.feed_url, {
      headers: { Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
      redirect: "error",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.text();
    const items = parseFeedPayload(payload, response.headers.get("content-type"));
    let newItems = 0;
    const storyIds = new Set<string>();

    for (const item of items) {
      const result = await addItemToStory({ sourceId: source.id, sourceTier: source.tier, item });
      if (result.isNew) newItems += 1;
      storyIds.add(result.storyId);
    }

    await recordFetch({ sourceId: source.id, status: "succeeded", startedAt, itemsFound: items.length, httpStatus: response.status });
    return { newItems, groupedStories: storyIds.size };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await recordFetch({
      sourceId: source.id,
      status: "failed",
      startedAt,
      errorCode: "FETCH_OR_PARSE_ERROR",
      safeErrorDetail: message.slice(0, 500),
    });
    throw error;
  }
}

export async function ingestSources(mode: keyof typeof sourceTypeByMode): Promise<IngestionResult> {
  const sources = await getEnabledSources(mode);
  const result: IngestionResult = {
    attemptedSources: sources.length,
    successfulSources: 0,
    failedSources: 0,
    newItems: 0,
    groupedStories: 0,
    errors: [],
  };

  for (const source of sources) {
    try {
      const outcome = await ingestSource(source);
      result.successfulSources += 1;
      result.newItems += outcome.newItems;
      result.groupedStories += outcome.groupedStories;
    } catch (error) {
      result.failedSources += 1;
      result.errors.push({
        sourceName: source.name,
        message: error instanceof Error ? error.message : "Unknown ingestion error",
      });
    }
  }

  return result;
}
