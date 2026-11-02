"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateReportAction } from "./actions";

const STATUS_OPTIONS = [
  "open",
  "under_review",
  "resolved",
  "dismissed",
] as const;

export function ReportUpdateForm({
  reportId,
  currentStatus,
  currentAdminNotes,
}: {
  reportId: string;
  currentStatus: string;
  currentAdminNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateReportAction(reportId, {
        status: status as (typeof STATUS_OPTIONS)[number],
        adminNotes: adminNotes.trim() || undefined,
      });
      router.refresh();
    } catch {
      setError("Could not save the report. Your notes are still here. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">
        Update report
      </h3>
      <div>
        <label htmlFor="report-status" className="block text-sm text-muted-foreground mb-1">Status</label>
        <select
          id="report-status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground w-full max-w-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-notes" className="block text-sm text-muted-foreground mb-1">Admin notes</label>
        <textarea
          id="report-notes"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          placeholder="Add notes for resolution..."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground w-full"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
      {error && <p role="alert" className="text-sm text-red-800 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
    </form>
  );
}
