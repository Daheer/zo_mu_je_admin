import Link from "next/link";
import { getRiders } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";

export default async function RidersPage() {
  let riders: Awaited<ReturnType<typeof getRiders>> = [];
  try {
    riders = await getRiders();
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Riders</h1>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {riders.length === 0 ? (
          <p className="text-[#7F8C8D] p-8 text-center">No riders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[#7F8C8D]">
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
                {riders.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/60 hover:bg-muted/30"
                  >
                    <td className="py-3 px-4 font-medium text-[#2C3E50]">
                      {r.name ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">{r.phone ?? "—"}</td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.vehicle_details?.vehicle_type ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.vehicle_details?.vehicle_number ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.ratings ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-[#2C3E50]">
                      {r.earnings != null
                        ? `₦${parseFloat(r.earnings).toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        status={r.status ?? "active"}
                        label={
                          r.status === "inactive" ? "Inactive" : "Active"
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
