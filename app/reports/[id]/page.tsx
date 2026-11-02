import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getReportById, getRideRequestById } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { ReportUpdateForm } from "./ReportUpdateForm";
import { format } from "date-fns";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdmin();
  const { id } = await params;
  const report = await getReportById(id).catch(() => null);
  if (!report) notFound();

  const linkedTrip = report.rideRequestId
    ? await getRideRequestById(report.rideRequestId).catch(() => null)
    : null;

  return (
    <div className="space-y-6 [overflow-wrap:anywhere]">
      <div className="flex items-center gap-4">
        <Link
          href="/reports"
          className="text-muted-foreground hover:text-primary text-sm"
        >
          ← Reports
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">
            Report #{id.slice(0, 8)}
          </h1>
          <StatusBadge status={report.status ?? "open"} />
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Reporter</dt>
            <dd className="text-foreground font-medium">
              {report.reporterName ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Role</dt>
            <dd className="text-foreground capitalize">
              {report.reporterRole ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Category</dt>
            <dd className="text-foreground">{report.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Created</dt>
            <dd className="text-foreground">
              {report.createdAt
                ? format(new Date(report.createdAt as string), "MMM d, yyyy HH:mm")
                : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <dt className="text-sm text-muted-foreground">Description</dt>
          <dd className="mt-1 text-foreground whitespace-pre-wrap">
            {report.description ?? "—"}
          </dd>
        </div>

        {linkedTrip && (
          <div className="mt-6 rounded-xl border border-border p-4 bg-muted/30">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Linked trip
            </h3>
            <p className="text-foreground text-sm">
              {linkedTrip.originAddress ?? "—"} →{" "}
              {linkedTrip.destinationAddress ?? "—"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {linkedTrip.time
                ? format(new Date(linkedTrip.time), "MMM d, yyyy HH:mm")
                : ""}{" "}
              · {linkedTrip.userName ?? "—"} / {linkedTrip.rider_name ?? "—"}
            </p>
            <Link
              href={`/trips/${report.rideRequestId}`}
              className="inline-block mt-2 text-primary hover:underline text-sm font-medium"
            >
              View trip →
            </Link>
          </div>
        )}

        {report.adminNotes && (
          <div className="mt-6">
            <dt className="text-sm text-muted-foreground">Admin notes</dt>
            <dd className="mt-1 text-foreground whitespace-pre-wrap">
              {report.adminNotes}
            </dd>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-border">
          {actor.role !== "viewer" ? <ReportUpdateForm
            reportId={report.id}
            currentStatus={report.status ?? "open"}
            currentAdminNotes={report.adminNotes ?? ""}
          /> : <p className="text-sm text-muted-foreground">Your account has read-only access.</p>}
        </div>
      </div>
    </div>
  );
}
