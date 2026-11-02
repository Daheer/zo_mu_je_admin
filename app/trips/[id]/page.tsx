import Link from "next/link";
import { notFound } from "next/navigation";
import { getRideRequestById } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

const STATUS_ORDER = ["waiting", "accepted", "arrived", "ontrip", "ended"];

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trip = await getRideRequestById(id).catch(() => null);
  if (!trip) notFound();

  const currentIndex = STATUS_ORDER.indexOf(trip.status ?? "waiting");
  const currentIdx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="space-y-6 [overflow-wrap:anywhere]">
      <div className="flex items-center gap-4">
        <Link
          href="/trips"
          className="text-muted-foreground hover:text-primary text-sm"
        >
          ← Trips
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Trip #{id.slice(0, 8)}</h1>
          <StatusBadge status={trip.status ?? "waiting"} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Origin</h3>
            <p className="text-foreground">{trip.originAddress ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Destination</h3>
            <p className="text-foreground">{trip.destinationAddress ?? "—"}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <span className="text-sm text-muted-foreground">Time</span>
            <p className="text-foreground font-medium">
              {trip.time
                ? format(new Date(trip.time), "MMM d, yyyy HH:mm")
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Ride type</span>
            <p className="text-foreground font-medium">{trip.rideType ?? "—"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Estimated fare</span>
            <p className="text-foreground font-medium">
              {trip.estimatedFare
                ? `₦${parseFloat(trip.estimatedFare).toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Final fare</span>
            <p className="text-foreground font-medium">
              {trip.fareAmount
                ? `₦${parseFloat(trip.fareAmount).toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Voucher used</span>
            <p className="text-foreground font-medium">
              {trip.voucherAppliedAmount
                ? `₦${parseFloat(trip.voucherAppliedAmount).toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Cash due</span>
            <p className="text-foreground font-medium">
              {trip.cashAmountDue
                ? `₦${parseFloat(trip.cashAmountDue).toLocaleString()}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Status timeline</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_ORDER.map((status, i) => {
              const reached = i <= currentIdx;
              return (
                <div key={status} className="flex items-center gap-2">
                  <div
                    className={`rounded-full w-3 h-3 ${
                      reached ? "bg-primary" : "bg-border"
                    }`}
                  />
                  <span
                    className={`text-sm ${
                      reached ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                  {i < STATUS_ORDER.length - 1 && (
                    <span className="text-muted-foreground">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Customer</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground font-medium">{trip.userName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{trip.userPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="text-foreground">{trip.userEmail ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h3 className="text-lg font-semibold text-foreground mb-4">Rider</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground font-medium">{trip.rider_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{trip.rider_phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="text-foreground">{trip.vehicle_details ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ratings</dt>
              <dd className="text-foreground">{trip.ratings ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
