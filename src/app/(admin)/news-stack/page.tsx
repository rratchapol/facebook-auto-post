import { NewsStack } from "@/components/admin/news-stack";
import { RefreshNewsButton } from "@/components/admin/refresh-news-button";
import { requireActiveUser } from "@/modules/identity/session";
import { listStoryCandidates } from "@/modules/stories/queries";

export const dynamic = "force-dynamic";

export default async function NewsStackPage() {
  await requireActiveUser();
  const stories = await listStoryCandidates();

  return (
    <div className="space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-[var(--brand)]">SLICE 2 · NEWS STACK</p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight">ข่าวที่มีหลักฐานรองรับ</h2>
          <p className="mt-2 max-w-3xl leading-7 text-[var(--muted)]">
            คะแนนเป็นกติกาแบบอธิบายได้: Tier ความน่าเชื่อถือ + ความสดใหม่ + จำนวนหลักฐาน ข่าว Tier 3 จะยังสร้างโพสต์ไม่ได้จนกว่าจะมีแหล่งต้นทางที่ผ่าน allowlist
          </p>
        </div>
        <RefreshNewsButton />
      </header>
      <NewsStack stories={stories} />
    </div>
  );
}
