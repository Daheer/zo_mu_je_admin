"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Rider } from "@/lib/types";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter(
      (r) =>
        (r.id && r.id.toLowerCase().includes(q)) ||
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q))
    );
  }, [riders, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>
        <label htmlFor="search-riders" className="sr-only">Search riders by ID, name, or email</label>
        <input
          id="search-riders"
          type="search"
          placeholder="Search by ID, name, or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground p-8 text-center">
            {riders.length === 0
              ? "No riders yet"
              : "No riders match your search"}
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
