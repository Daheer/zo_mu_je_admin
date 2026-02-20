import Link from "next/link";
import { Suspense } from "react";
import { getReports } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportsFilters } from "./ReportsFilters";
import { format } from "date-fns";

const STATUS_OPTIONS = ["all", "open", "under_review", "resolved", "dismissed"];
const ROLE_OPTIONS = ["all", "customer", "rider"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; role?: string; category?: string }>;
}) {
  const params = await searchParams;
  let reports: Awaited<ReturnType<typeof getReports>> = [];
  try {
    reports = await getReports();
  } catch (e) {
    console.error(e);
  }

  let filtered = reports;
  if (params.status && params.status !== "all") {
    filtered = filtered.filter((r) => r.status === params.status);
  }
  if (params.role && params.role !== "all") {
    filtered = filtered.filter((r) => r.reporterRole === params.role);
  }
  if (params.category) {
    filtered = filtered.filter(
      (r) =>
        r.category?.toLowerCase().includes(params.category!.toLowerCase())
    );
  }

  filtered = filtered.sort((a, b) => {
    const ta = new Date((a.createdAt as string) ?? 0).getTime();
    const tb = new Date((b.createdAt as string) ?? 0).getTime();
    return tb - ta;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Reports</h1>

      <Suspense fallback={<div className="h-16 rounded-2xl border border-border bg-muted/30 animate-pulse" />}>
        <ReportsFilters
          statusOptions={STATUS_OPTIONS}
          roleOptions={ROLE_OPTIONS}
          currentStatus={params.status ?? "all"}
          currentRole={params.role ?? "all"}
          category={params.category ?? ""}
        />
      </Suspense>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[#7F8C8D] p-8 text-center">
            No reports yet. Reports are created when drivers or customers submit
            issues from the app.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[#7F8C8D]">
                  <th className="pb-3 pt-4 px-4">Date</th>
                  <th className="pb-3 pt-4 px-4">Reporter</th>
                  <th className="pb-3 pt-4 px-4">Role</th>
                  <th className="pb-3 pt-4 px-4">Category</th>
                  <th className="pb-3 pt-4 px-4">Trip</th>
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
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.createdAt
                        ? format(
                            new Date(r.createdAt as string),
                            "MMM d, yyyy HH:mm"
                          )
                        : "—"}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#2C3E50]">
                      {r.reporterName ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50] capitalize">
                      {r.reporterRole ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.category ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      {r.rideRequestId ? (
                        <Link
                          href={`/trips/${r.rideRequestId}`}
                          className="text-primary hover:underline"
                        >
                          View trip
                        </Link>
                      ) : (
                        <span className="text-[#7F8C8D]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={r.status ?? "open"} />
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/reports/${r.id}`}
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
