import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { Source } from "./types";

export async function listSources(): Promise<Source[]> {
  const supabase = await createServerSupabaseClient();
  const { data: sourceData, error } = await supabase
    .from("sources")
    .select("id, name, source_type, tier, base_url, feed_url, enabled, last_success_at, last_failure_at, created_at")
    .order("enabled", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load sources.");
  }

  const sources = sourceData ?? [];
  if (sources.length === 0) {
    return [];
  }

  const { data: fetchData, error: fetchError } = await supabase
    .from("source_fetches")
    .select("source_id, status, started_at, http_status, items_found, error_code, safe_error_detail")
    .in("source_id", sources.map((source) => source.id))
    .order("started_at", { ascending: false });

  if (fetchError) {
    throw new Error("Unable to load source fetch status.");
  }

  const latestFetchBySource = new Map<string, Source["latest_fetch"]>();
  for (const fetch of fetchData ?? []) {
    if (!latestFetchBySource.has(fetch.source_id)) {
      latestFetchBySource.set(fetch.source_id, fetch);
    }
  }

  return sources.map((source) => ({ ...source, latest_fetch: latestFetchBySource.get(source.id) ?? null })) as Source[];
}
