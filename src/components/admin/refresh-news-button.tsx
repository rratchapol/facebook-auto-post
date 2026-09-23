"use client";

import { useActionState } from "react";

import { refreshApprovedSources, type RefreshActionState } from "@/modules/ingestion/actions";

const initialState: RefreshActionState = {};

export function RefreshNewsButton() {
  const [state, formAction, isPending] = useActionState(refreshApprovedSources, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center justify-end gap-2">
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700">{state.success}</p> : null}
      <button
        className="rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "กำลังดึง..." : "ดึงข่าวตอนนี้"}
      </button>
    </form>
  );
}
