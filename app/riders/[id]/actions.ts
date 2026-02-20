"use server";

import { updateRiderStatus } from "@/lib/db";

export async function setRiderStatus(
  riderId: string,
  status: "active" | "inactive"
) {
  await updateRiderStatus(riderId, status);
}
