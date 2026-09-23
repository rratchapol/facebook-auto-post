import { sourceTierLabels } from "@/modules/sources/types";
import type { StoryCandidate } from "@/modules/stories/queries";
import { selectStory } from "@/modules/editorial/service";

const categoryLabels: Record<string, string> = {
  thai_football: "ฟุตบอลไทย",
  football: "ฟุตบอลต่างประเทศ",
  basketball: "บาสเกตบอล",
  motorsport: "มอเตอร์สปอร์ต",
  other: "กีฬาอื่น ๆ",
};

function formatDate(value: string | null) {
  if (!value) return "ไม่พบเวลาต้นทาง";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function NewsStack({ stories }: { stories: StoryCandidate[] }) {
  if (stories.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h3 className="text-lg font-semibold">ยังไม่มีข่าวใน Stack</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">เพิ่ม RSS ที่เปิดใช้งานแล้ว จากนั้นกด “ดึงข่าวตอนนี้” เพื่อสร้างรายการหลักฐาน</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {stories.map((story) => (
        <article className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm" key={story.id}>
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[var(--brand)]">{categoryLabels[story.category] ?? story.category}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">{sourceTierLabels[story.highestTier]}</span>
                <span className={story.eligible ? "rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700" : "rounded-full bg-amber-50 px-2.5 py-1 text-amber-800"}>
                  {story.eligible ? "พร้อมเป็น Candidate" : "ต้องเพิ่มแหล่งต้นทาง"}
                </span>
              </div>
              <h3 className="mt-3 text-lg font-semibold leading-7">{story.evidence[0]?.title ?? "ไม่พบหัวข้อข่าว"}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">{story.scoreExplanation}</p>
            </div>
            <div className="shrink-0 rounded-xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">คะแนน</p>
              <p className="mt-1 text-3xl font-bold text-[var(--ink)]">{story.score}</p>
              <p className="text-xs text-slate-500">หลักฐาน {story.evidenceCount} แหล่ง</p>
            </div>
          </div>
          <ul className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {story.evidence.map((evidence) => (
              <li className="flex flex-col justify-between gap-2 py-3 text-sm md:flex-row md:items-center" key={evidence.id}>
                <div className="min-w-0">
                  <a className="font-medium text-[var(--brand)] hover:underline" href={evidence.url} rel="noreferrer" target="_blank">
                    {evidence.sourceName}: {evidence.title}
                  </a>
                  <p className="mt-1 text-xs text-[var(--muted)]">{evidence.role} · {formatDate(evidence.publishedAt)}</p>
                </div>
                <span className="text-xs font-medium text-slate-500">{sourceTierLabels[evidence.tier]}</span>
              </li>
            ))}
          </ul>
          {story.eligible ? <form action={selectStory} className="mt-4"><input name="storyId" type="hidden" value={story.id}/><button className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white" type="submit">สร้างร่างโพสต์</button></form> : null}
        </article>
      ))}
    </div>
  );
}
