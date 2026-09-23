import { NextResponse } from "next/server";

import { isAuthorizedJobRequest } from "@/lib/jobs/authorize";
import { runIngestionJob } from "@/lib/jobs/run-ingestion";

export async function POST(request: Request) {
  if (!isAuthorizedJobRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const outcome = await runIngestionJob("approved");
    return NextResponse.json(outcome, { status: outcome.duplicate ? 200 : 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ingestion failed" },
      { status: 500 },
    );
  }
}
