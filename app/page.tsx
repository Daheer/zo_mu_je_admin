import Link from "next/link";
import {
  getRideRequests,
  getRiders,
  getUsers,
  getReports,
} from "@/lib/db";
import { StatsCard } from "@/components/StatsCard";
import { StatusBadge } from "@/components/StatusBadge";
import { DashboardCharts } from "@/components/DashboardCharts";
import { format } from "date-fns";

export default async function DashboardPage() {
  let riders: Awaited<ReturnType<typeof getRiders>> = [];
  let users: Awaited<ReturnType<typeof getUsers>> = [];
  let trips: Awaited<ReturnType<typeof getRideRequests>> = [];
  let reports: Awaited<ReturnType<typeof getReports>> = [];

  try {
    [riders, users, trips, reports] = await Promise.all([
      getRiders(),
      getUsers(),
      getRideRequests(),
      getReports(),
    ]);
  } catch (e) {
    console.error("Firebase not configured or error:", e);
  }

  const endedTrips = trips.filter((t) => t.status === "ended");
  const totalRevenue = endedTrips.reduce(
    (sum, t) => sum + (parseFloat(t.fareAmount ?? "0") || 0),
    0
  );
  const openReports = reports.filter(
    (r) => r.status === "open" || r.status === "under_review"
  ).length;

  const recentTrips = [...trips]
    .sort((a, b) => {
      const ta = new Date(a.time ?? 0).getTime();
      const tb = new Date(b.time ?? 0).getTime();
      return tb - ta;
    })
    .slice(0, 20);

  const statusCounts: Record<string, number> = {};
  trips.forEach((t) => {
    const s = t.status ?? "unknown";
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });
  const pieData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace(/_/g, " "),
    value,
  }));

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const earningsByDay = last7Days.map((d) => {
    const dayStr = format(d, "yyyy-MM-dd");
    const dayTrips = endedTrips.filter((t) => {
      const tTime = t.time ?? "";
      return tTime.startsWith(dayStr);
    });
    const total = dayTrips.reduce(
      (s, t) => s + (parseFloat(t.fareAmount ?? "0") || 0),
      0
    );
    return {
      date: format(d, "MM/dd"),
      earnings: Math.round(total),
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Trips" value={trips.length} />
        <StatsCard
          title="Total Revenue"
          value={`₦${totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`}
        />
        <StatsCard title="Active Riders" value={riders.length} />
        <StatsCard title="Registered Customers" value={users.length} />
        <StatsCard title="Open Reports" value={openReports} />
      </div>

      <DashboardCharts pieData={pieData} earningsByDay={earningsByDay} />

      <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
        <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">
          Recent trips
        </h2>
        {recentTrips.length === 0 ? (
          <p className="text-[#7F8C8D] py-6 text-center">No trips yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[#7F8C8D]">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Rider</th>
                  <th className="pb-3 pr-4">Route</th>
                  <th className="pb-3 pr-4">Fare</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((t) => (
                  <tr key={t.id} className="border-b border-border/60">
                    <td className="py-3 pr-4 text-[#2C3E50]">
                      {t.time
                        ? format(new Date(t.time), "MMM d, HH:mm")
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-[#2C3E50]">
                      {t.userName ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-[#2C3E50]">
                      {t.rider_name ?? (t.riderId === "waiting" ? "—" : t.riderId)}
                    </td>
                    <td className="py-3 pr-4 text-[#7F8C8D] max-w-[200px] truncate">
                      {t.originAddress ?? "—"} → {t.destinationAddress ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-[#2C3E50]">
                      {t.fareAmount
                        ? `₦${parseFloat(t.fareAmount).toLocaleString()}`
                        : t.estimatedFare
                          ? `₦${parseFloat(t.estimatedFare).toLocaleString()}`
                          : "—"}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={t.status ?? "waiting"} />
                    </td>
                    <td className="py-3 pl-2">
                      <Link
                        href={`/trips/${t.id}`}
                        className="text-primary hover:underline"
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
