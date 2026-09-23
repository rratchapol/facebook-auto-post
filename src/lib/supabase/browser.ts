import { createBrowserClient } from "@supabase/ssr";

import { requireSupabasePublicConfig } from "@/lib/env";

export function createBrowserSupabaseClient() {
  const { url, publishableKey } = requireSupabasePublicConfig();

  return createBrowserClient(url, publishableKey);
}
