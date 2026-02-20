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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateReportAction(reportId, {
        status: status as (typeof STATUS_OPTIONS)[number],
        adminNotes: adminNotes.trim() || undefined,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-[#2C3E50]">
        Update report
      </h3>
      <div>
        <label className="block text-sm text-[#7F8C8D] mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[#2C3E50] w-full max-w-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-[#7F8C8D] mb-1">
          Admin notes
        </label>
        <textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={4}
          placeholder="Add notes for resolution..."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[#2C3E50] w-full"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
