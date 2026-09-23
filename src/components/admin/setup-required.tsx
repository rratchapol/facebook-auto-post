export function SetupRequired() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
      <section className="w-full rounded-2xl border border-[#f2c77f] bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold text-[var(--warning)]">ต้องตั้งค่าก่อนใช้งาน</p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--ink)]">เชื่อมต่อ Supabase เพื่อเปิด Slice 1</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          คัดลอก <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.example</code> เป็น
          <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code> แล้วเพิ่มค่า
          <code className="rounded bg-slate-100 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code> และ
          <code className="rounded bg-slate-100 px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>
          ก่อนสร้างบัญชีแอดมินและใช้ Source Registry
        </p>
      </section>
    </main>
  );
}
