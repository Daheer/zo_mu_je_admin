import { requireAdmin } from "@/lib/admin-auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getRiderById,
  getRideRequestsByRiderId,
} from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { RiderStatusToggle } from "./RiderStatusToggle";
import { format } from "date-fns";

const ID_TYPE_LABELS: Record<string, string> = {
  nin: "NIN (National ID)",
  drivers_licence: "Driver's Licence",
  voter_card: "Voter's Card",
  international_passport: "International Passport",
};

function formatIdType(idType: string): string {
  return ID_TYPE_LABELS[idType] ?? idType;
}

export default async function RiderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requireAdmin();
  const { id } = await params;
  const rider = await getRiderById(id).catch(() => null);
  if (!rider) notFound();

  const riderTrips = await getRideRequestsByRiderId(id).catch(() => []);
  const endedTrips = riderTrips.filter((t) => t.status === "ended");

  return (
    <div className="space-y-6 [overflow-wrap:anywhere]">
      <div className="flex items-center gap-4">
        <Link
          href="/riders"
          className="text-muted-foreground hover:text-primary text-sm"
        >
          ← Riders
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {rider.name ?? "Unnamed rider"}
            </h1>
            <p className="text-muted-foreground mt-1">ID: {rider.id}</p>
          </div>
          {actor.role !== "viewer" ? <RiderStatusToggle
            riderId={rider.id}
            currentStatus={
              (rider.status as "pending" | "active" | "inactive") ?? "active"
            }
          /> : <p className="text-sm text-muted-foreground">Your account has read-only access.</p>}
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-foreground font-medium">{rider.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-foreground font-medium">{rider.email ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Address</dt>
            <dd className="text-foreground">{rider.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Vehicle type</dt>
            <dd className="text-foreground">
              {rider.vehicle_details?.vehicle_type ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Vehicle number</dt>
            <dd className="text-foreground">
              {rider.vehicle_details?.vehicle_number ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Vehicle model</dt>
            <dd className="text-foreground">
              {rider.vehicle_details?.vehicle_model ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Ratings</dt>
            <dd className="text-foreground">{rider.ratings ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Total earnings</dt>
            <dd className="text-foreground font-medium">
              {rider.earnings != null && rider.earnings !== ""
                ? `₦${parseFloat(rider.earnings).toLocaleString()}`
                : "₦0"}
            </dd>
          </div>
        </dl>
      </div>

      {rider.idPhotoUrl && (
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            ID verification
          </h2>
          <div className="space-y-3">
            {rider.idType && (
              <p className="text-sm text-muted-foreground">
                ID type:{" "}
                <span className="font-medium text-foreground">
                  {formatIdType(rider.idType)}
                </span>
              </p>
            )}
            <a
              href={rider.idPhotoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={rider.idPhotoUrl}
                alt="Rider ID"
                className="w-full max-w-sm rounded-lg border border-border object-contain max-h-64"
              />
            </a>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Trip history ({endedTrips.length} completed)
        </h2>
        {riderTrips.length === 0 ? (
          <p className="text-muted-foreground">No trips yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Customer</th>
                  <th className="pb-3 pr-4">Route</th>
                  <th className="pb-3 pr-4">Fare</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {riderTrips
                  .sort(
                    (a, b) =>
                      new Date(b.time ?? 0).getTime() -
                      new Date(a.time ?? 0).getTime()
                  )
                  .map((t) => (
                    <tr key={t.id} className="border-b border-border/60">
                      <td className="py-3 pr-4 text-foreground">
                        {t.time
                          ? format(new Date(t.time), "MMM d, yyyy HH:mm")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {t.userName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground max-w-[200px] truncate">
                        {t.originAddress ?? "—"} → {t.destinationAddress ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-foreground">
                        {t.fareAmount
                          ? `₦${parseFloat(t.fareAmount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={t.status ?? "—"} />
                      </td>
                      <td className="py-3">
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
