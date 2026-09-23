import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AppRole = "admin" | "editor" | "approver";

export type AuthContext =
  | { configured: false }
  | { configured: true; user: null }
  | {
      configured: true;
      user: { id: string; email: string | null };
      profile: { role: AppRole; active: boolean } | null;
    };

export async function getAuthContext(): Promise<AuthContext> {
  if (!isSupabaseConfigured()) {
    return { configured: false };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { configured: true, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  return {
    configured: true,
    user: { id: user.id, email: user.email ?? null },
    profile: profile as { role: AppRole; active: boolean } | null,
  };
}

export async function requireActiveUser() {
  const context = await getAuthContext();

  if (!context.configured) {
    throw new Error("Supabase configuration is required before accessing this area.");
  }

  if (!context.user) {
    redirect("/login");
  }

  if (!context.profile?.active) {
    throw new Error("This account has no active Sports News Admin profile.");
  }

  return { user: context.user, profile: context.profile };
}

export async function requireAdmin() {
  const context = await requireActiveUser();

  if (context.profile.role !== "admin") {
    throw new Error("Administrator permission is required for this action.");
  }

  return context;
}
