import Link from "next/link";

import { approvePost, createFallbackGraphic, savePostVersion } from "@/modules/editorial/service";
import { getComposer } from "@/modules/editorial/queries";
import { requireAdmin } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

type EvidenceRow = {
  evidence_role: string;
  source_items: { title: string; canonical_url: string; sources: { name: string; tier: string } | null } | null;
};

export default async function ComposerPage({ params }: { params: Promise<{ storyId: string }> }) {
  await requireAdmin();
  const { storyId } = await params;
  const { post, version, evidence } = await getComposer(storyId);
  const evidenceRows = evidence as unknown as EvidenceRow[];
  const hasImage = Boolean(version.image_asset_id);

  return <div className="space-y-7">
    <header className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold text-[var(--brand)]">EDITORIAL COMPOSER</p><h2 className="mt-1 text-3xl font-bold">ร่างโพสต์</h2><p className="mt-2 text-[var(--muted)]">การแก้เนื้อหาจะสร้างเวอร์ชันใหม่และยกเลิกการอนุมัติเก่าเสมอ</p></div><Link className="text-sm font-semibold text-[var(--brand)]" href="/news-stack">← กลับ News Stack</Link></header>
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5"><h3 className="font-semibold">หลักฐานต้นทาง</h3><ul className="mt-3 space-y-2 text-sm">{evidenceRows.map((item, index) => <li key={index}><a className="text-[var(--brand)] hover:underline" href={item.source_items?.canonical_url} target="_blank">{item.source_items?.sources?.name}: {item.source_items?.title}</a></li>)}</ul></section>
    <form action={savePostVersion} className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-5">
      <input name="postId" type="hidden" value={post.id} /><input name="storyId" type="hidden" value={storyId} />
      <label className="block text-sm font-medium">พาดหัว<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={version.headline} name="headline" required /></label>
      <label className="block text-sm font-medium">สรุปข่าว (6–7 บรรทัด)<textarea className="mt-1 min-h-44 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={version.caption} name="caption" required /></label>
      <label className="block text-sm font-medium">ทำไมเรื่องนี้สำคัญ<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={version.why_it_matters} name="whyItMatters" required /></label>
      <label className="block text-sm font-medium">Hashtags (ไม่เกิน 3)<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={(version.hashtags_json ?? []).join(" ")} name="hashtags" /></label>
      <label className="block text-sm font-medium">คำสั่งเสริมสำหรับ AI<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue={version.instruction} name="instruction" placeholder="เช่น เน้นผลกระทบต่อแฟนบอลไทย" /></label>
      <button className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white" type="submit">บันทึกเวอร์ชันใหม่</button>
    </form>
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-5"><div><h3 className="font-semibold">ภาพประกอบ</h3><p className="mt-1 text-sm text-[var(--muted)]">{hasImage ? "มีภาพกราฟิกแนบแล้ว" : "ยังไม่มีภาพ จึงอนุมัติไม่ได้"}</p></div><form action={createFallbackGraphic}><input name="postId" type="hidden" value={post.id}/><input name="storyId" type="hidden" value={storyId}/><button className="rounded-lg border border-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-[var(--brand)]" type="submit">สร้างภาพกราฟิกเริ่มต้น</button></form></section>
    <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-5"><div><h3 className="font-semibold">อนุมัติโพสต์</h3><p className="mt-1 text-sm text-[var(--muted)]">สถานะปัจจุบัน: {post.status}</p></div><form action={approvePost}><input name="postId" type="hidden" value={post.id}/><input name="storyId" type="hidden" value={storyId}/><button className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={!hasImage} type="submit">อนุมัติร่าง</button></form></section>
  </div>;
}
