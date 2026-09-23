"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/identity/session";

type CurrentVersion = {
  id: string;
  version_number: number;
  headline: string;
  caption: string;
  why_it_matters: string;
  hashtags_json: string[];
  primary_source_item_id: string | null;
  image_asset_id: string | null;
  base_prompt_version_id: string | null;
  preset_version_id: string | null;
  brand_version_id: string | null;
  instruction: string;
};

type EvidenceRow = {
  source_item_id: string;
  evidence_role: string;
  source_items: { title: string; sources: { tier: string } | null } | null;
};

async function audit(actorId: string, entityId: string, action: string, after?: Record<string, unknown>) {
  const supabase = await createServerSupabaseClient();
  await supabase.from("audit_events").insert({ actor_id: actorId, entity_type: "editorial_post", entity_id: entityId, action, after_json: after ?? null });
}

async function getPostAndVersion(postId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase.from("editorial_posts").select("*").eq("id", postId).single();
  if (error || !post?.current_version_id) throw new Error("ไม่พบร่างโพสต์");
  const { data: version, error: versionError } = await supabase.from("post_versions").select("*").eq("id", post.current_version_id).single();
  if (versionError || !version) throw new Error("ไม่พบเวอร์ชันของร่างโพสต์");
  return { post, version: version as CurrentVersion };
}

async function appendVersion(postId: string, previous: CurrentVersion, patch: Partial<CurrentVersion>, actorId: string) {
  const supabase = await createServerSupabaseClient();
  const next = { ...previous, ...patch };
  const { data: version, error } = await supabase.from("post_versions").insert({
    post_id: postId, version_number: previous.version_number + 1, headline: next.headline, caption: next.caption,
    why_it_matters: next.why_it_matters, hashtags_json: next.hashtags_json, primary_source_item_id: next.primary_source_item_id,
    image_asset_id: next.image_asset_id, base_prompt_version_id: next.base_prompt_version_id, preset_version_id: next.preset_version_id,
    brand_version_id: next.brand_version_id, instruction: next.instruction, created_by: actorId,
  }).select("id").single();
  if (error || !version) throw new Error("บันทึกเวอร์ชันใหม่ไม่สำเร็จ");
  await supabase.from("editorial_posts").update({ current_version_id: version.id, status: "drafting", approved_at: null, approved_by: null }).eq("id", postId);
  return version.id;
}

export async function selectStory(formData: FormData) {
  const { user } = await requireAdmin();
  const storyId = String(formData.get("storyId") ?? "");
  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase.from("editorial_posts").select("id").eq("story_id", storyId).maybeSingle();
  if (existing) redirect(`/composer/${storyId}`);
  const { data: evidence } = await supabase.from("story_evidence").select("source_item_id, evidence_role, source_items(title, excerpt, canonical_url, sources(tier))").eq("story_id", storyId);
  const eligibleEvidence = (evidence ?? []) as unknown as EvidenceRow[];
  const primary = eligibleEvidence.find((item) => item.evidence_role === "primary" && item.source_items?.sources?.tier !== "tier_3_discovery");
  if (!primary) throw new Error("ต้องมีหลักฐาน Tier 1 หรือ Tier 2 ก่อนสร้างร่างโพสต์");
  const primarySource = primary.source_items;
  if (!primarySource) throw new Error("ไม่พบข้อมูลหลักฐานต้นทาง");
  const { data: prompts } = await supabase.from("prompt_versions").select("id, kind").eq("status", "active");
  const { data: brand } = await supabase.from("brand_versions").select("id").eq("status", "active").maybeSingle();
  const base = (prompts ?? []).find((prompt) => prompt.kind === "base");
  const preset = (prompts ?? []).find((prompt) => prompt.kind === "preset");
  if (!base || !preset || !brand) throw new Error("ยังไม่มี Prompt หรือ Brand เวอร์ชันที่เปิดใช้งาน");
  const title = primarySource.title;
  const { data: post, error } = await supabase.from("editorial_posts").insert({ story_id: storyId, created_by: user.id }).select("id").single();
  if (error || !post) throw new Error("สร้างร่างโพสต์ไม่สำเร็จ");
  const { data: version, error: versionError } = await supabase.from("post_versions").insert({
    post_id: post.id, version_number: 1, headline: title, caption: `สรุปจากแหล่งข่าว: ${title}\n\nโปรดตรวจสอบและเรียบเรียงเนื้อหาก่อนอนุมัติโพสต์`, why_it_matters: "ระบุผลกระทบของข่าวนี้ต่อแฟนกีฬา", hashtags_json: [], primary_source_item_id: primary.source_item_id,
    base_prompt_version_id: base.id, preset_version_id: preset.id, brand_version_id: brand.id, created_by: user.id,
  }).select("id").single();
  if (versionError || !version) throw new Error("สร้างเนื้อหาร่างไม่สำเร็จ");
  await supabase.from("editorial_posts").update({ current_version_id: version.id }).eq("id", post.id);
  await supabase.from("story_groups").update({ status: "selected", selected_at: new Date().toISOString() }).eq("id", storyId);
  await audit(user.id, post.id, "editorial_post.created", { storyId });
  redirect(`/composer/${storyId}`);
}

export async function savePostVersion(formData: FormData) {
  const { user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const { version } = await getPostAndVersion(postId);
  const hashtags = String(formData.get("hashtags") ?? "").split(/[\s,]+/).map((tag) => tag.trim()).filter(Boolean).slice(0, 3);
  await appendVersion(postId, version, { headline: String(formData.get("headline") ?? "").trim(), caption: String(formData.get("caption") ?? "").trim(), why_it_matters: String(formData.get("whyItMatters") ?? "").trim(), hashtags_json: hashtags, instruction: String(formData.get("instruction") ?? "").trim() }, user.id);
  await audit(user.id, postId, "editorial_post.saved");
  revalidatePath(`/composer/${String(formData.get("storyId") ?? "")}`);
}

export async function createFallbackGraphic(formData: FormData) {
  const { user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const { version } = await getPostAndVersion(postId);
  const supabase = await createServerSupabaseClient();
  const { data: asset, error } = await supabase.from("assets").upsert({ storage_path: "/news-editorial-template.svg", mime_type: "image/svg+xml", width: 1080, height: 1350, origin: "derived" }, { onConflict: "storage_path" }).select("id").single();
  if (error || !asset) throw new Error("สร้างภาพกราฟิกเริ่มต้นไม่สำเร็จ");
  await appendVersion(postId, version, { image_asset_id: asset.id }, user.id);
  await audit(user.id, postId, "editorial_post.fallback_graphic_created");
  revalidatePath(`/composer/${String(formData.get("storyId") ?? "")}`);
}

export async function approvePost(formData: FormData) {
  const { user } = await requireAdmin();
  const postId = String(formData.get("postId") ?? "");
  const { version } = await getPostAndVersion(postId);
  if (!version.headline || !version.caption || !version.why_it_matters || !version.primary_source_item_id || !version.image_asset_id) throw new Error("ร่างต้องมีหัวข้อ เนื้อหา เหตุผลความสำคัญ แหล่งข่าว และภาพก่อนอนุมัติ");
  const supabase = await createServerSupabaseClient();
  await supabase.from("approvals").insert({ post_id: postId, post_version_id: version.id, decision: "approved", decided_by: user.id });
  await supabase.from("editorial_posts").update({ status: "approved", approved_at: new Date().toISOString(), approved_by: user.id }).eq("id", postId);
  await audit(user.id, postId, "editorial_post.approved");
  revalidatePath(`/composer/${String(formData.get("storyId") ?? "")}`);
}
