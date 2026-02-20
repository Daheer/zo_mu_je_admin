import Link from "next/link";
import { getUsers, getRideRequests } from "@/lib/db";

export default async function CustomersPage() {
  let users: Awaited<ReturnType<typeof getUsers>> = [];
  let trips: Awaited<ReturnType<typeof getRideRequests>> = [];
  try {
    [users, trips] = await Promise.all([getUsers(), getRideRequests()]);
  } catch (e) {
    console.error(e);
  }

  const tripCountByUser = new Map<string, number>();
  trips.forEach((t) => {
    const key = t.userEmail ?? t.userName ?? "";
    if (key) tripCountByUser.set(key, (tripCountByUser.get(key) ?? 0) + 1);
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Customers</h1>

      <div className="rounded-2xl border border-border bg-background shadow-card overflow-hidden">
        {users.length === 0 ? (
          <p className="text-[#7F8C8D] p-8 text-center">No customers yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-[#7F8C8D]">
                  <th className="pb-3 pt-4 px-4">Name</th>
                  <th className="pb-3 pt-4 px-4">Phone</th>
                  <th className="pb-3 pt-4 px-4">Email</th>
                  <th className="pb-3 pt-4 px-4">Total trips</th>
                  <th className="pb-3 pt-4 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const count =
                    tripCountByUser.get(u.email ?? "") ??
                    tripCountByUser.get(u.name ?? "") ??
                    0;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/60 hover:bg-muted/30"
                    >
                      <td className="py-3 px-4 font-medium text-[#2C3E50]">
                        {u.name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-[#2C3E50]">
                        {u.phone ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-[#2C3E50]">
                        {u.email ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-[#2C3E50]">{count}</td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/customers/${encodeURIComponent(u.id)}`}
                          className="text-primary hover:underline font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
