import { createClient } from "@supabase/supabase-js";

import { requireSupabasePublicConfig } from "@/lib/env";

export function createServiceSupabaseClient() {
  const { url } = requireSupabasePublicConfig();
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for background ingestion.");
  }

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
