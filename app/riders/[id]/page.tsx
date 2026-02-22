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
  const { id } = await params;
  const rider = await getRiderById(id).catch(() => null);
  if (!rider) notFound();

  const riderTrips = await getRideRequestsByRiderId(id).catch(() => []);
  const endedTrips = riderTrips.filter((t) => t.status === "ended");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/riders"
          className="text-[#7F8C8D] hover:text-primary text-sm"
        >
          ← Riders
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2C3E50]">
              {rider.name ?? "Unnamed rider"}
            </h1>
            <p className="text-[#7F8C8D] mt-1">ID: {rider.id}</p>
          </div>
          <RiderStatusToggle
            riderId={rider.id}
            currentStatus={
              (rider.status as "pending" | "active" | "inactive") ?? "active"
            }
          />
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-[#7F8C8D]">Phone</dt>
            <dd className="text-[#2C3E50] font-medium">{rider.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Email</dt>
            <dd className="text-[#2C3E50] font-medium">{rider.email ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-[#7F8C8D]">Address</dt>
            <dd className="text-[#2C3E50]">{rider.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Vehicle type</dt>
            <dd className="text-[#2C3E50]">
              {rider.vehicle_details?.vehicle_type ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Vehicle number</dt>
            <dd className="text-[#2C3E50]">
              {rider.vehicle_details?.vehicle_number ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Vehicle model</dt>
            <dd className="text-[#2C3E50]">
              {rider.vehicle_details?.vehicle_model ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Ratings</dt>
            <dd className="text-[#2C3E50]">{rider.ratings ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[#7F8C8D]">Total earnings</dt>
            <dd className="text-[#2C3E50] font-medium">
              {rider.earnings != null && rider.earnings !== ""
                ? `₦${parseFloat(rider.earnings).toLocaleString()}`
                : "₦0"}
            </dd>
          </div>
        </dl>
      </div>

      {rider.idPhotoUrl && (
        <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
          <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">
            ID verification
          </h2>
          <div className="space-y-3">
            {rider.idType && (
              <p className="text-sm text-[#7F8C8D]">
                ID type:{" "}
                <span className="font-medium text-[#2C3E50]">
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
                className="max-w-sm rounded-lg border border-border object-contain max-h-64"
              />
            </a>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <h2 className="text-lg font-semibold text-[#2C3E50] mb-4">
          Trip history ({endedTrips.length} completed)
        </h2>
        {riderTrips.length === 0 ? (
          <p className="text-[#7F8C8D]">No trips yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[#7F8C8D]">
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
                      <td className="py-3 pr-4 text-[#2C3E50]">
                        {t.time
                          ? format(new Date(t.time), "MMM d, yyyy HH:mm")
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-[#2C3E50]">
                        {t.userName ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-[#7F8C8D] max-w-[200px] truncate">
                        {t.originAddress ?? "—"} → {t.destinationAddress ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-[#2C3E50]">
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
