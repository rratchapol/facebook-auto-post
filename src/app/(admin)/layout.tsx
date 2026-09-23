import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { SetupRequired } from "@/components/admin/setup-required";
import { getAuthContext } from "@/modules/identity/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await getAuthContext();

  if (!context.configured) {
    return <SetupRequired />;
  }

  if (!context.user) {
    redirect("/login");
  }

  if (!context.profile?.active) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
        <section className="rounded-2xl border border-[#f2c77f] bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-[var(--warning)]">บัญชียังไม่พร้อมใช้งาน</p>
          <h1 className="mt-2 text-2xl font-bold">ต้องกำหนดสิทธิ์แอดมินใน Supabase</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            บัญชีนี้เข้าสู่ระบบแล้ว แต่ยังไม่มี profile ที่ active โปรดสร้างหรือกำหนด role ในตาราง
            <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5">profiles</code>ก่อนดำเนินการต่อ
          </p>
        </section>
      </main>
    );
  }

  return (
    <AdminShell email={context.user.email} role={context.profile.role}>
      {children}
    </AdminShell>
  );
}
