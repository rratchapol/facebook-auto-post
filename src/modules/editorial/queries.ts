import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function getComposer(storyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase.from("editorial_posts").select("*").eq("story_id", storyId).single();
  if (error || !post?.current_version_id) throw new Error("ไม่พบร่างโพสต์สำหรับข่าวนี้");
  const { data: version, error: versionError } = await supabase.from("post_versions").select("*").eq("id", post.current_version_id).single();
  if (versionError || !version) throw new Error("ไม่พบเนื้อหาร่างโพสต์");
  const { data: evidence } = await supabase.from("story_evidence").select("evidence_role, source_items(title, canonical_url, sources(name, tier))").eq("story_id", storyId);
  return { post, version, evidence: evidence ?? [] };
}
