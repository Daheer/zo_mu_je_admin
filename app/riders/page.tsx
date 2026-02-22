import { getRiders } from "@/lib/db";
import { RidersTableWithSearch } from "./RidersTableWithSearch";

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
      <RidersTableWithSearch riders={riders} />
    </div>
  );
}
