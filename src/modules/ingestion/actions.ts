"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/modules/identity/session";

import { ingestSources } from "./service";

export type RefreshActionState = { error?: string; success?: string };

export async function refreshApprovedSources(previousState: RefreshActionState): Promise<RefreshActionState> {
  void previousState;
  try {
    await requireAdmin();
    const result = await ingestSources("approved");
    revalidatePath("/news-stack");
    revalidatePath("/sources");
    return {
      success: `ดึง ${result.successfulSources}/${result.attemptedSources} แหล่งข่าว พบรายการใหม่ ${result.newItems} รายการ`,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "ไม่สามารถดึงข่าวได้" };
  }
}
