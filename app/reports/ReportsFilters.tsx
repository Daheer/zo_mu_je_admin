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
        <label className="block text-xs text-[#7F8C8D] mb-1">Status</label>
        <select
          value={currentStatus}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[#2C3E50]"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-[#7F8C8D] mb-1">Reporter role</label>
        <select
          value={currentRole}
          onChange={(e) => updateFilter("role", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[#2C3E50]"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All" : r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-[#7F8C8D] mb-1">Category</label>
        <input
          type="text"
          placeholder="Filter by category"
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-[#2C3E50]"
        />
      </div>
    </div>
  );
}
