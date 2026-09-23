"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(formData: FormData) {
    setError(null);

    if (!configured) {
      setError("ยังไม่ได้ตั้งค่า Supabase ใน .env.local");
      return;
    }

    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("กรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    setIsSubmitting(true);
    const supabase = createBrowserSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setIsSubmitting(false);

    if (signInError) {
      setError("เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบอีเมลและรหัสผ่าน");
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <label className="block text-sm font-medium text-slate-800" htmlFor="email">
        อีเมล
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base shadow-sm"
          id="email"
          name="email"
          placeholder="admin@example.com"
          required
          type="email"
        />
      </label>
      <label className="block text-sm font-medium text-slate-800" htmlFor="password">
        รหัสผ่าน
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base shadow-sm"
          id="password"
          name="password"
          required
          type="password"
        />
      </label>
      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <button
        className="w-full rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting || !configured}
        type="submit"
      >
        {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
