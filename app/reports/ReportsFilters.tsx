"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ReportsFilters({
  statusOptions,
  roleOptions,
  currentStatus,
  currentRole,
  category,
}: {
  statusOptions: string[];
  roleOptions: string[];
  currentStatus: string;
  currentRole: string;
  category: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.push(`/reports?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-background p-4 shadow-card">
      <div>
        <label htmlFor="report-filter-status" className="block text-xs text-muted-foreground mb-1">Status</label>
        <select
          id="report-filter-status"
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-filter-role" className="block text-xs text-muted-foreground mb-1">Reporter role</label>
        <select
          id="report-filter-role"
          value={currentRole}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All" : r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="report-filter-category" className="block text-xs text-muted-foreground mb-1">Category</label>
        <input
          id="report-filter-category"
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
    </div>
  );
}
