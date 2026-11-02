"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function TripsFilters({
  statusOptions,
  rideTypes,
  currentStatus,
  currentRideType,
  from,
  to,
}: {
  statusOptions: string[];
  rideTypes: string[];
  currentStatus: string;
  currentRideType: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") next.set(key, value);
    else next.delete(key);
    router.push(`/trips?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-background p-4 shadow-card">
      <div>
        <label htmlFor="trip-filter-status" className="block text-xs text-muted-foreground mb-1">Status</label>
        <select
          id="trip-filter-status"
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
        <label htmlFor="trip-filter-type" className="block text-xs text-muted-foreground mb-1">Ride type</label>
        <select
          id="trip-filter-type"
          value={currentRideType}
          onChange={(e) => updateFilter("rideType", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {rideTypes.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All" : r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="trip-filter-from" className="block text-xs text-muted-foreground mb-1">From date</label>
        <input
          id="trip-filter-from"
          type="date"
          value={from ?? ""}
          onChange={(e) => updateFilter("from", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
      <div>
        <label htmlFor="trip-filter-to" className="block text-xs text-muted-foreground mb-1">To date</label>
        <input
          id="trip-filter-to"
          type="date"
          value={to ?? ""}
          onChange={(e) => updateFilter("to", e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>
    </div>
  );
}
