"use server";

import { updateReport } from "@/lib/db";
import type { ReportStatus } from "@/lib/types";
import { requirePermission } from "@/lib/admin-auth";

export async function updateReportAction(
  reportId: string,
  updates: { status?: ReportStatus; adminNotes?: string }
) {
  await requirePermission("operate");
  if (!reportId || /[.#$\[\]\/]/.test(reportId) || (updates.status && !["open", "under_review", "resolved", "dismissed"].includes(updates.status)) || (updates.adminNotes !== undefined && (typeof updates.adminNotes !== "string" || updates.adminNotes.length > 10000))) throw new Error("Invalid report update.");
  const payload: Parameters<typeof updateReport>[1] = {};
  if (updates.status) payload.status = updates.status;
  if (updates.adminNotes !== undefined) payload.adminNotes = updates.adminNotes;
  if (updates.status === "resolved" || updates.status === "dismissed") {
    payload.resolvedAt = new Date().toISOString();
  }
  await updateReport(reportId, payload);
}
