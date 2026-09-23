import { toggleSource } from "@/modules/sources/actions";
import { sourceTierLabels, sourceTypeLabels, type Source } from "@/modules/sources/types";

function formatFetchTime(value: string | null) {
  if (!value) {
    return "ยังไม่เคยดึงข้อมูล";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function SourceTable({ sources }: { sources: Source[] }) {
  if (sources.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
        <h3 className="text-lg font-semibold">ยังไม่มีแหล่งข่าว</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">เพิ่มแหล่งข่าว Tier 1 หรือ Tier 2 อย่างน้อยหนึ่งรายการเพื่อเริ่ม News Stack</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
      <div className="border-b border-[var(--line)] px-5 py-4">
        <h3 className="font-semibold">Allowlist ที่ใช้งานอยู่</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">แหล่งข่าว</th>
              <th className="px-5 py-3 font-semibold">ประเภท / Tier</th>
              <th className="px-5 py-3 font-semibold">สถานะการดึง</th>
              <th className="px-5 py-3 font-semibold">สถานะ</th>
              <th className="px-5 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {sources.map((source) => (
              <tr key={source.id}>
                <td className="px-5 py-4">
                  <p className="font-medium text-[var(--ink)]">{source.name}</p>
                  <a className="mt-1 block max-w-xs truncate text-xs text-[var(--brand)] hover:underline" href={source.base_url} rel="noreferrer" target="_blank">
                    {source.base_url}
                  </a>
                </td>
                <td className="px-5 py-4 text-slate-700">
                  <p>{sourceTypeLabels[source.source_type]}</p>
                  <p className="mt-1 text-xs text-slate-500">{sourceTierLabels[source.tier]}</p>
                </td>
                <td className="px-5 py-4 text-slate-600">{formatFetchTime(source.last_success_at)}</td>
                <td className="px-5 py-4">
                  <span className={source.enabled ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700" : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"}>
                    {source.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <form action={toggleSource}>
                    <input name="sourceId" type="hidden" value={source.id} />
                    <input name="nextEnabled" type="hidden" value={String(!source.enabled)} />
                    <button className="text-sm font-semibold text-[var(--brand)] hover:underline" type="submit">
                      {source.enabled ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
