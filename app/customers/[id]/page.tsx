import Link from "next/link";
import { notFound } from "next/navigation";
import { getUserById, getRideRequestsByCustomer } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id).catch(() => null);
  if (!user) notFound();

  const trips = await getRideRequestsByCustomer(
    user.name ?? "",
    user.email ?? ""
  ).catch(() => []);
  const endedTrips = trips.filter((t) => t.status === "ended");

  return (
    <div className="space-y-6 [overflow-wrap:anywhere]">
      <div className="flex items-center gap-4">
        <Link
          href="/customers"
          className="text-muted-foreground hover:text-primary text-sm"
        >
          ← Customers
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <h1 className="text-2xl font-bold text-foreground">
          {user.name ?? "Unnamed customer"}
        </h1>
        <p className="text-muted-foreground mt-1">ID: {user.id}</p>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Phone</dt>
            <dd className="text-foreground font-medium">{user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Email</dt>
            <dd className="text-foreground font-medium">{user.email ?? "—"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-muted-foreground">Address</dt>
            <dd className="text-foreground">{user.address ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Total trips</dt>
            <dd className="text-foreground font-medium">{endedTrips.length}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-2xl border border-border bg-background p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Trip history
        </h2>
        {trips.length === 0 ? (
          <p className="text-muted-foreground">No trips yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 pr-4">Time</th>
                  <th className="pb-3 pr-4">Rider</th>
                  <th className="pb-3 pr-4">Route</th>
                  <th className="pb-3 pr-4">Fare</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {trips
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
                        {t.rider_name ?? (t.riderId === "waiting" ? "—" : t.riderId)}
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
