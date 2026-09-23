import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/env";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="grid min-h-screen bg-[#102542] lg:grid-cols-[1fr_520px]">
      <section className="hidden p-12 text-white lg:block">
        <p className="text-sm font-bold tracking-[0.2em] text-[#8fc7ff]">SPORTS NEWS ADMIN</p>
        <h1 className="mt-6 max-w-lg text-5xl font-bold leading-tight">สร้างข่าวกีฬาที่คนไทยเชื่อถือ</h1>
        <p className="mt-6 max-w-md text-lg leading-8 text-[#c3d0df]">
          จัดการแหล่งข่าว สร้างร่าง และอนุมัติโพสต์อย่างมีหลักฐานก่อนออกสู่ Facebook Page
        </p>
      </section>
      <section className="flex items-center bg-[var(--canvas)] px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link className="text-sm font-semibold text-[var(--brand)]" href="/">
            ← Sports News Admin
          </Link>
          <h2 className="mt-8 text-3xl font-bold text-[var(--ink)]">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">ใช้บัญชีแอดมินที่สร้างไว้ใน Supabase</p>
          {!configured ? (
            <p className="mt-5 rounded-lg border border-[#f2c77f] bg-[#fff8e8] px-3 py-2 text-sm text-[#8a4b00]">
              ยังไม่พบค่า Supabase โปรดตั้งค่า <code>.env.local</code> ก่อนเข้าสู่ระบบ
            </p>
          ) : null}
          <div className="mt-7 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <LoginForm configured={configured} />
          </div>
        </div>
      </section>
    </main>
  );
}
