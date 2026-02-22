import { getUsers, getRideRequests } from "@/lib/db";
import {
  CustomersTableWithSearch,
  type CustomerWithTripCount,
} from "./CustomersTableWithSearch";

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

  const customers: CustomerWithTripCount[] = users.map((u) => ({
    ...u,
    tripCount:
      tripCountByUser.get(u.email ?? "") ??
      tripCountByUser.get(u.name ?? "") ??
      0,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#2C3E50]">Customers</h1>
      <CustomersTableWithSearch customers={customers} />
    </div>
  );
}
