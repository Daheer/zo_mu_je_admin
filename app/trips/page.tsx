import Link from "next/link";
import { Suspense } from "react";
import { getRideRequests } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { TripsFilters } from "./TripsFilters";
import { format } from "date-fns";

const STATUS_OPTIONS = [
  "all",
  "waiting",
  "accepted",
  "arrived",
  "ontrip",
  "ended",
  "cancelled",
];
const RIDE_TYPES = ["all", "Tricycle", "Motorcycle"];

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; rideType?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  let trips: Awaited<ReturnType<typeof getRideRequests>> = [];
  try {
    trips = await getRideRequests();
  } catch (e) {
    console.error(e);
  }

  let filtered = trips;
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((t) => t.status === params.status);
  }
  if (params.rideType && params.rideType !== "all") {
    filtered = filtered.filter((t) => t.rideType === params.rideType);
  }
  if (params.from) {
    const fromDate = new Date(params.from);
    filtered = filtered.filter((t) => new Date(t.time ?? 0) >= fromDate);
  }
  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((t) => new Date(t.time ?? 0) <= toDate);
  }

  filtered = filtered.sort(
    (a, b) =>
      new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Trips</h1>

      <Suspense fallback={<div className="h-16 rounded-2xl border border-border bg-muted/30 animate-pulse" />}>
        <TripsFilters
          statusOptions={STATUS_OPTIONS}
          rideTypes={RIDE_TYPES}
          currentStatus={params.status ?? "all"}
          currentRideType={params.rideType ?? "all"}
          from={params.from}
          to={params.to}
        />
      </Suspense>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[#7F8C8D] p-8 text-center">No trips match the filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[#7F8C8D]">
                  <th className="pb-3 pt-4 px-4">Time</th>
                  <th className="pb-3 pt-4 px-4">Customer</th>
                  <th className="pb-3 pt-4 px-4">Rider</th>
                  <th className="pb-3 pt-4 px-4">Route</th>
                  <th className="pb-3 pt-4 px-4">Ride type</th>
                  <th className="pb-3 pt-4 px-4">Est. fare</th>
                  <th className="pb-3 pt-4 px-4">Final fare</th>
                  <th className="pb-3 pt-4 px-4">Status</th>
                  <th className="pb-3 pt-4 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.time
                        ? format(new Date(t.time), "MMM d, HH:mm")
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.userName ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.rider_name ?? (t.riderId === "waiting" ? "—" : t.riderId)}
                    </td>
                    <td className="py-3 px-4 text-[#7F8C8D] max-w-[180px] truncate">
                      {t.originAddress ?? "—"} → {t.destinationAddress ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.rideType ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.estimatedFare
                        ? `₦${parseFloat(t.estimatedFare).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {t.fareAmount
                        ? `₦${parseFloat(t.fareAmount).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status ?? "waiting"} />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/trips/${t.id}`}
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
