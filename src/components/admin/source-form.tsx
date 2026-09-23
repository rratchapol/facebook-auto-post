"use client";

import { useActionState } from "react";

import { createSource, type SourceActionState } from "@/modules/sources/actions";

const initialState: SourceActionState = {};

export function SourceForm() {
  const [state, formAction, isPending] = useActionState(createSource, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm md:grid-cols-2">
      <div className="md:col-span-2">
        <h3 className="text-lg font-semibold">เพิ่มแหล่งข่าว</h3>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Tier 1 คือแหล่งทางการ, Tier 2 คือสื่อกีฬาหลัก และ Google News เป็น Discovery เท่านั้น
        </p>
      </div>
      <label className="text-sm font-medium">
        ชื่อแหล่งข่าว
        <input className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" maxLength={120} name="name" required />
      </label>
      <label className="text-sm font-medium">
        ประเภท
        <select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue="rss" name="sourceType">
          <option value="rss">RSS</option>
          <option value="api">API (JSON Feed)</option>
          <option value="google_news_discovery">Google News Discovery</option>
          <option value="x_api">X API</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        Tier ความน่าเชื่อถือ
        <select className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2" defaultValue="tier_1_official" name="tier">
          <option value="tier_1_official">Tier 1 · ทางการ</option>
          <option value="tier_2_established_media">Tier 2 · สื่อหลัก</option>
          <option value="tier_3_discovery">Tier 3 · Discovery</option>
        </select>
      </label>
      <label className="text-sm font-medium">
        เว็บไซต์หลัก
        <input
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
          name="baseUrl"
          placeholder="https://example.com"
          required
          type="url"
        />
      </label>
      <label className="text-sm font-medium md:col-span-2">
        RSS / API URL
        <input
          className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2"
          name="feedUrl"
          placeholder="https://example.com/feed.xml"
          type="url"
        />
      </label>
      {state.error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 md:col-span-2">{state.error}</p> : null}
      {state.success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2">{state.success}</p> : null}
      <div className="flex justify-end md:col-span-2">
        <button
          className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "กำลังบันทึก..." : "เพิ่มแหล่งข่าว"}
        </button>
      </div>
    </form>
  );
}
