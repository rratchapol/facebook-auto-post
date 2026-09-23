import { createServiceSupabaseClient } from "@/lib/supabase/service";
import { ingestSources } from "@/modules/ingestion/service";

export async function runIngestionJob(mode: "approved" | "discovery") {
  const supabase = createServiceSupabaseClient();
  const now = new Date();
  const intervalMinutes = mode === "approved" ? 15 : 30;
  const roundedMinutes = Math.floor(now.getUTCMinutes() / intervalMinutes) * intervalMinutes;
  const scheduledWindow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), roundedMinutes),
  ).toISOString();
  const idempotencyKey = `ingest-${mode}:${scheduledWindow}`;
  const { data: job, error } = await supabase
    .from("job_runs")
    .insert({ job_name: `ingest-${mode}`, idempotency_key: idempotencyKey, status: "running" })
    .select("id")
    .maybeSingle();

  if (error && error.code === "23505") {
    return { duplicate: true, result: null };
  }

  if (error || !job) {
    throw new Error("Unable to create a job run.");
  }

  try {
    const result = await ingestSources(mode);
    await supabase
      .from("job_runs")
      .update({ status: "succeeded", finished_at: new Date().toISOString(), counters_json: result })
      .eq("id", job.id);
    return { duplicate: false, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job error";
    await supabase
      .from("job_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), safe_error_detail: message.slice(0, 500) })
      .eq("id", job.id);
    throw error;
  }
}
