import { createServerSupabaseClient } from "@/lib/supabase/server";

import type { Source } from "./types";

export async function listSources(): Promise<Source[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sources")
    .select("id, name, source_type, tier, base_url, feed_url, enabled, last_success_at, last_failure_at, created_at")
    .order("enabled", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load sources.");
  }

  return (data ?? []) as Source[];
}
