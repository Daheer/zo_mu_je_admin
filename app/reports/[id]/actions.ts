"use server";

import { updateReport } from "@/lib/db";
import type { ReportStatus } from "@/lib/types";

export async function updateReportAction(
  reportId: string,
  updates: { status?: ReportStatus; adminNotes?: string }
) {
  const payload: Parameters<typeof updateReport>[1] = {};
  if (updates.status) payload.status = updates.status;
  if (updates.adminNotes !== undefined) payload.adminNotes = updates.adminNotes;
  if (updates.status === "resolved" || updates.status === "dismissed") {
    payload.resolvedAt = new Date().toISOString();
  }
  await updateReport(reportId, payload);
}
