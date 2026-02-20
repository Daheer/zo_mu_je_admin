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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/trips"
          className="text-[#7F8C8D] hover:text-primary text-sm"
        >
          ← Trips
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-[#2C3E50]">Trip #{id.slice(0, 8)}</h1>
          <StatusBadge status={trip.status ?? "waiting"} />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-[#7F8C8D] mb-2">Origin</h3>
            <p className="text-[#2C3E50]">{trip.originAddress ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[#7F8C8D] mb-2">Destination</h3>
            <p className="text-[#2C3E50]">{trip.destinationAddress ?? "—"}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <span className="text-sm text-[#7F8C8D]">Time</span>
            <p className="text-[#2C3E50] font-medium">
              {trip.time
                ? format(new Date(trip.time), "MMM d, yyyy HH:mm")
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-[#7F8C8D]">Ride type</span>
            <p className="text-[#2C3E50] font-medium">{trip.rideType ?? "—"}</p>
          </div>
          <div>
            <span className="text-sm text-[#7F8C8D]">Estimated fare</span>
            <p className="text-[#2C3E50] font-medium">
              {trip.estimatedFare
                ? `₦${parseFloat(trip.estimatedFare).toLocaleString()}`
                : "—"}
            </p>
          </div>
          <div>
            <span className="text-sm text-[#7F8C8D]">Final fare</span>
            <p className="text-[#2C3E50] font-medium">
              {trip.fareAmount
                ? `₦${parseFloat(trip.fareAmount).toLocaleString()}`
                : "—"}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-medium text-[#7F8C8D] mb-3">Status timeline</h3>
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
                      reached ? "text-[#2C3E50] font-medium" : "text-[#7F8C8D]"
                    }`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                  {i < STATUS_ORDER.length - 1 && (
                    <span className="text-border">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">Customer</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[#7F8C8D]">Name</dt>
              <dd className="text-[#2C3E50] font-medium">{trip.userName ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#7F8C8D]">Phone</dt>
              <dd className="text-[#2C3E50]">{trip.userPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#7F8C8D]">Email</dt>
              <dd className="text-[#2C3E50]">{trip.userEmail ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-4">Rider</h3>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[#7F8C8D]">Name</dt>
              <dd className="text-[#2C3E50] font-medium">{trip.rider_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#7F8C8D]">Phone</dt>
              <dd className="text-[#2C3E50]">{trip.rider_phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#7F8C8D]">Vehicle</dt>
              <dd className="text-[#2C3E50]">{trip.vehicle_details ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[#7F8C8D]">Ratings</dt>
              <dd className="text-[#2C3E50]">{trip.ratings ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
