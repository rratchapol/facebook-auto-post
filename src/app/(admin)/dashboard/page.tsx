import Link from "next/link";

import { appTimezone } from "@/lib/env";

const foundationChecks = [
  ["ล็อกอินและบทบาท", "พร้อมสำหรับเชื่อม Supabase"],
  ["Source Registry", "กำลังเริ่มใช้งาน"],
  ["Audit log", "บันทึกการเปลี่ยนแปลง"],
  ["News Stack", "อยู่ใน Slice 2"],
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--brand)]">SLICE 1 · FOUNDATION</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">ศูนย์ควบคุมข่าวกีฬา</h2>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          ตั้งค่าแหล่งข่าวที่เชื่อถือได้ก่อน ระบบจะใช้รายการนี้เป็นรากฐานของ News Stack และการสร้างโพสต์ในขั้นถัดไป
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-[var(--line)]">
          <p className="text-sm text-[var(--muted)]">เขตเวลาการเผยแพร่</p>
          <p className="mt-2 text-xl font-semibold">{appTimezone}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">09:00 · 12:00 · 16:00 · 19:00</p>
        </article>
        <article className="rounded-2xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-[var(--line)]">
          <p className="text-sm text-[var(--muted)]">นโยบายแหล่งข่าว</p>
          <p className="mt-2 text-xl font-semibold">Allowlist only</p>
          <p className="mt-1 text-sm text-[var(--muted)]">Tier 1 / Tier 2 ใช้สร้างร่างได้</p>
        </article>
        <article className="rounded-2xl bg-[var(--panel)] p-5 shadow-sm ring-1 ring-[var(--line)]">
          <p className="text-sm text-[var(--muted)]">การเผยแพร่</p>
          <p className="mt-2 text-xl font-semibold">Human approval</p>
          <p className="mt-1 text-sm text-[var(--muted)]">ไม่มีการโพสต์อัตโนมัติโดยไร้การอนุมัติ</p>
        </article>
      </section>

      <section className="rounded-2xl bg-[var(--panel)] p-6 shadow-sm ring-1 ring-[var(--line)]">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-semibold">เริ่มต้นด้วยแหล่งข่าว</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">เพิ่ม RSS หรือ API ของลีก สโมสร และสื่อกีฬาที่ผ่านการคัดเลือก</p>
          </div>
          <Link className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]" href="/sources">
            เปิด Source Registry
          </Link>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">สถานะการส่งมอบ</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {foundationChecks.map(([label, detail]) => (
            <article className="rounded-xl border border-[var(--line)] bg-white px-4 py-3" key={label}>
              <p className="font-medium">{label}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
