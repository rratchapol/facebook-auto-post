import { SourceForm } from "@/components/admin/source-form";
import { SourceTable } from "@/components/admin/source-table";
import { requireAdmin } from "@/modules/identity/session";
import { listSources } from "@/modules/sources/queries";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  await requireAdmin();
  const sources = await listSources();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm font-semibold text-[var(--brand)]">SOURCE REGISTRY</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">แหล่งข่าวที่อนุมัติ</h2>
        <p className="mt-2 max-w-3xl leading-7 text-[var(--muted)]">
          ระบบจะรับข่าวจากรายการนี้เท่านั้น Tier 1 และ Tier 2 ใช้เป็นแหล่งอ้างอิงของโพสต์ได้ ส่วน Google News เป็นเพียงช่องทางค้นพบข่าว
        </p>
      </header>
      <SourceForm />
      <SourceTable sources={sources} />
    </div>
  );
}
