"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Rider } from "@/lib/types";

const statuses = ["all", "pending", "active", "inactive"] as const;

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function RidersTableWithSearch({
  riders,
}: {
  riders: Rider[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<typeof statuses[number]>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return riders.filter(
      (r) =>
        (status === "all" || (r.status ?? "active") === status) &&
        (!q || [r.id, r.name, r.email, r.phone].some(value => value?.toLowerCase().includes(q)))
    );
  }, [riders, query, status]);

  return (
    <div className="space-y-4">
      <div role="group" aria-label="Filter riders by status" className="flex flex-wrap gap-2">
        {statuses.map(value => {
          const count = value === "all" ? riders.length : riders.filter(r => (r.status ?? "active") === value).length;
          return <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)}
            className={`rounded-xl border px-4 py-2 text-sm font-medium ${status === value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
            {value === "all" ? "All" : value[0].toUpperCase() + value.slice(1)} ({count})
          </button>;
        })}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>
        <label htmlFor="search-riders" className="sr-only">Search riders by ID, name, email, or phone</label>
        <input
          id="search-riders"
          type="search"
          placeholder="Search by name, email, phone, or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p role="status">Showing {filtered.length} of {riders.length} riders</p>
        {(query || status !== "all") && <button type="button" className="text-primary hover:underline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</button>}
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center">
            {riders.length === 0
              ? "No riders yet"
              : query ? "No riders match your search and status filter" : `No ${status === "all" ? "matching" : status} riders`}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-muted-foreground">
                  <th className="pb-3 pt-4 px-4">Name</th>
                  <th className="pb-3 pt-4 px-4">Phone</th>
                  <th className="pb-3 pt-4 px-4">Vehicle type</th>
                  <th className="pb-3 pt-4 px-4">Vehicle number</th>
                  <th className="pb-3 pt-4 px-4">Ratings</th>
                  <th className="pb-3 pt-4 px-4">Earnings</th>
                  <th className="pb-3 pt-4 px-4">Status</th>
                  <th className="pb-3 pt-4 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 font-medium text-foreground">
                      {r.name ?? "—"}
                      {r.email && <span className="mt-1 block text-xs font-normal text-muted-foreground">{r.email}</span>}
                    </td>
                    <td className="py-3 px-4 text-foreground">{r.phone ?? "—"}</td>
                    <td className="py-3 px-4 text-foreground">
                      {r.vehicle_details?.vehicle_type ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {r.vehicle_details?.vehicle_number ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {r.ratings ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground">
                      {r.earnings != null && r.earnings !== ""
                        ? `₦${parseFloat(r.earnings).toLocaleString()}`
                        : "₦0"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={r.status ?? "active"}
                        label={
                          r.status === "pending"
                            ? "Pending"
                            : r.status === "inactive"
                              ? "Inactive"
                              : "Active"
                        }
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/riders/${r.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
