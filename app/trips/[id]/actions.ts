"use server";
import { requirePermission } from "@/lib/admin-auth";
import { backendRequest } from "@/lib/ride-backend";
import { revalidatePath } from "next/cache";
import type { DeliveryResolutionAction } from "@/lib/courier";

export async function resolveDeliveryAction(id: string, input: { action: DeliveryResolutionAction; requestId: string; reason: string; refundConfirmed: boolean }) {
  await requirePermission('operate');
  try {
    await backendRequest(`/v1/admin/courier-jobs/${encodeURIComponent(id)}/resolve`, 'POST', input);
    revalidatePath(`/trips/${id}`); revalidatePath('/trips');
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : 'Could not resolve this delivery.' }; }
}

export async function revokeDeliveryTrackingAction(id: string, reason: string) {
  await requirePermission('operate');
  try {
    await backendRequest(`/v1/admin/courier-jobs/${encodeURIComponent(id)}/revoke-tracking`, 'POST', { reason });
    return { ok: true as const };
  } catch (error) { return { ok: false as const, error: error instanceof Error ? error.message : 'Could not revoke tracking.' }; }
}
