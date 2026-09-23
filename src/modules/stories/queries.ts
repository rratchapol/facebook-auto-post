import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { SourceTier } from "@/modules/sources/types";

export type StoryEvidence = {
  id: string;
  role: "discovery" | "primary" | "supporting";
  title: string;
  url: string;
  publishedAt: string | null;
  sourceName: string;
  tier: SourceTier;
};

export type StoryCandidate = {
  id: string;
  category: string;
  score: number;
  scoreExplanation: string;
  highestTier: SourceTier;
  evidenceCount: number;
  createdAt: string;
  eligible: boolean;
  evidence: StoryEvidence[];
};

type RawEvidence = {
  evidence_role: StoryEvidence["role"];
  source_items: {
    id: string;
    title: string;
    canonical_url: string;
    publisher_published_at: string | null;
    sources: { name: string; tier: SourceTier } | null;
  } | null;
};

type RawStory = {
  id: string;
  category: string;
  score: number;
  score_explanation: string;
  highest_tier: SourceTier;
  evidence_count: number;
  created_at: string;
  story_evidence: RawEvidence[] | null;
};

export async function listStoryCandidates(): Promise<StoryCandidate[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("story_groups")
    .select(
      "id, category, score, score_explanation, highest_tier, evidence_count, created_at, story_evidence(evidence_role, source_items(id, title, canonical_url, publisher_published_at, sources(name, tier)))",
    )
    .eq("status", "candidate")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    throw new Error("Unable to load story candidates.");
  }

  return ((data ?? []) as unknown as RawStory[]).map((story) => {
    const evidence = (story.story_evidence ?? [])
      .map((entry) => {
        const sourceItem = entry.source_items;
        const source = sourceItem?.sources;
        if (!sourceItem || !source) return null;
        return {
          id: sourceItem.id,
          role: entry.evidence_role,
          title: sourceItem.title,
          url: sourceItem.canonical_url,
          publishedAt: sourceItem.publisher_published_at,
          sourceName: source.name,
          tier: source.tier,
        };
      })
      .filter((entry): entry is StoryEvidence => entry !== null);

    return {
      id: story.id,
      category: story.category,
      score: story.score,
      scoreExplanation: story.score_explanation,
      highestTier: story.highest_tier,
      evidenceCount: story.evidence_count,
      createdAt: story.created_at,
      eligible: evidence.some((item) => item.role === "primary" && item.tier !== "tier_3_discovery"),
      evidence,
    };
  });
}
