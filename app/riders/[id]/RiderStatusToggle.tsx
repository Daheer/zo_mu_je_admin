"use client";

import { useRouter } from "next/navigation";
import { setRiderStatus } from "./actions";

export function RiderStatusToggle({
  riderId,
  currentStatus,
}: {
  riderId: string;
  currentStatus: "active" | "inactive";
}) {
  const router = useRouter();
  const isActive = currentStatus !== "inactive";

  async function handleToggle() {
    const next = isActive ? "inactive" : "active";
    await setRiderStatus(riderId, next);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-success/20 text-success hover:bg-success/30"
      }`}
    >
      {isActive ? "Deactivate rider" : "Reactivate rider"}
    </button>
  );
}
