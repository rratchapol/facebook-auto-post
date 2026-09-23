"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/modules/identity/session";

import type { SourceTier, SourceType } from "./types";

export type SourceActionState = { error?: string; success?: string };

const sourceTypes = new Set<SourceType>(["rss", "api", "google_news_discovery", "x_api"]);
const sourceTiers = new Set<SourceTier>([
  "tier_1_official",
  "tier_2_established_media",
  "tier_3_discovery",
]);

function parseUrl(value: FormDataEntryValue | null, fieldName: string, required: boolean) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue && !required) {
    return null;
  }

  try {
    return new URL(rawValue).toString();
  } catch {
    throw new Error(`${fieldName} ต้องเป็น URL ที่ถูกต้อง`);
  }
}

async function writeAuditEvent(input: {
  actorId: string;
  entityId: string;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("audit_events").insert({
    actor_id: input.actorId,
    entity_type: "source",
    entity_id: input.entityId,
    action: input.action,
    before_json: input.before ?? null,
    after_json: input.after ?? null,
    reason: input.reason ?? null,
  });

  if (error) {
    throw new Error("Unable to save the audit event.");
  }
}

export async function createSource(_: SourceActionState, formData: FormData): Promise<SourceActionState> {
  try {
    const { user } = await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    const sourceType = String(formData.get("sourceType") ?? "") as SourceType;
    const tier = String(formData.get("tier") ?? "") as SourceTier;
    const baseUrl = parseUrl(formData.get("baseUrl"), "เว็บไซต์หลัก", true);
    const feedUrl = parseUrl(formData.get("feedUrl"), "RSS/API URL", sourceType !== "x_api");

    if (name.length < 2 || name.length > 120) {
      return { error: "ชื่อแหล่งข่าวต้องมีความยาว 2–120 ตัวอักษร" };
    }

    if (!sourceTypes.has(sourceType) || !sourceTiers.has(tier)) {
      return { error: "ประเภทหรือ Tier ของแหล่งข่าวไม่ถูกต้อง" };
    }

    if (sourceType === "google_news_discovery" && tier !== "tier_3_discovery") {
      return { error: "Google News ต้องถูกกำหนดเป็น Tier 3 Discovery" };
    }

    if (sourceType !== "google_news_discovery" && tier === "tier_3_discovery") {
      return { error: "Tier 3 ใช้ได้เฉพาะแหล่ง Discovery ใน MVP" };
    }

    const supabase = await createServerSupabaseClient();
    const { data: source, error } = await supabase
      .from("sources")
      .insert({
        name,
        source_type: sourceType,
        tier,
        base_url: baseUrl,
        feed_url: feedUrl,
      })
      .select("id, name, source_type, tier, base_url, feed_url, enabled")
      .single();

    if (error || !source) {
      return { error: "บันทึกแหล่งข่าวไม่สำเร็จ URL นี้อาจมีอยู่แล้ว" };
    }

    await writeAuditEvent({
      actorId: user.id,
      entityId: source.id,
      action: "source.created",
      after: source,
    });
    revalidatePath("/sources");

    return { success: "เพิ่มแหล่งข่าวแล้ว" };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ" };
  }
}

export async function toggleSource(formData: FormData) {
  const { user } = await requireAdmin();
  const sourceId = String(formData.get("sourceId") ?? "");
  const nextEnabled = String(formData.get("nextEnabled") ?? "") === "true";

  if (!sourceId) {
    throw new Error("Source ID is required.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: before, error: beforeError } = await supabase
    .from("sources")
    .select("id, name, enabled")
    .eq("id", sourceId)
    .single();

  if (beforeError || !before) {
    throw new Error("ไม่พบแหล่งข่าวที่ต้องการแก้ไข");
  }

  const { error } = await supabase.from("sources").update({ enabled: nextEnabled }).eq("id", sourceId);

  if (error) {
    throw new Error("ไม่สามารถเปลี่ยนสถานะแหล่งข่าวได้");
  }

  await writeAuditEvent({
    actorId: user.id,
    entityId: sourceId,
    action: nextEnabled ? "source.enabled" : "source.disabled",
    before,
    after: { ...before, enabled: nextEnabled },
  });
  revalidatePath("/sources");
}
