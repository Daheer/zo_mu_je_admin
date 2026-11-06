"use server";

import { updateRiderStatus, getRiderById } from "@/lib/db";
import { requirePermission } from "@/lib/admin-auth";
import { getSettings } from "@/lib/settings-store";
import { riderVerificationError } from "@/lib/platform-settings";

export async function setRiderStatus(
  riderId: string,
  status: "pending" | "active" | "inactive"
) {
  await requirePermission("operate");
  if (!["pending", "active", "inactive"].includes(status) || !riderId || /[.#$\[\]\/]/.test(riderId)) throw new Error("Invalid rider or status.");
  if (status === "active") {
    const rider = await getRiderById(riderId);
    if (!rider) throw new Error("Rider no longer exists.");
    const error = riderVerificationError({ ...rider, vehicle_details: rider.vehicle_details ? { ...rider.vehicle_details } : undefined }, (await getSettings()).values);
    if (error) return { error };
  }
  await updateRiderStatus(riderId, status);
}
