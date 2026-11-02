"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { setRiderStatus } from "./actions";

export function RiderStatusToggle({
  riderId,
  currentStatus,
}: {
  riderId: string;
  currentStatus: "pending" | "active" | "inactive";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isPending = currentStatus === "pending";
  const isActive = currentStatus === "active";

  async function handleToggle() {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await setRiderStatus(riderId, isActive ? "inactive" : "active");
      router.refresh();
    } catch {
      setError("Could not update this rider. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2">
    <button
      type="button"
      onClick={handleToggle}
      disabled={saving}
      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-red-100 text-red-800 hover:bg-red-200"
          : "bg-green-100 text-green-800 hover:bg-green-200"
      } disabled:opacity-50 disabled:cursor-wait`}
    >
      {saving ? "Updating…" : isPending ? "Activate rider" : isActive ? "Deactivate rider" : "Reactivate rider"}
    </button>
    {error && <p role="alert" className="max-w-xs rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}
