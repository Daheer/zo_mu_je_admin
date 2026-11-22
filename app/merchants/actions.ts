"use server";

import { requirePermission } from "@/lib/admin-auth";
import { backendRequest } from "@/lib/ride-backend";

const merchantIdPattern = /^[A-Za-z0-9_-]{1,128}$/;

export async function issueMerchantKey(input: { partnerId: string; name?: string; environment: string }) {
  await requirePermission("settings");
  try {
    const { partnerId, ...body } = input;
    if (!merchantIdPattern.test(partnerId)) {
      return { ok: false as const, error: "Use letters, numbers, hyphens or underscores for the merchant ID." };
    }
    if (body.name !== undefined && !body.name.trim()) {
      return { ok: false as const, error: "Enter a merchant name." };
    }
    const key = await backendRequest<{ id: string; apiKey: string }>(
      `/v1/admin/merchants/${encodeURIComponent(partnerId)}/keys`, "POST", body,
    );
    return { ok: true as const, key };
  } catch (error) {
    if (error instanceof Error && error.message === "merchant already exists") {
      return { ok: false as const, error: "That merchant ID already exists. Select the existing merchant or enter a new ID." };
    }
    return { ok: false as const, error: "Could not confirm key creation. Check the key list before trying again." };
  }
}

export async function revokeMerchantKey(partnerId: string, keyId: string) {
  await requirePermission("settings");
  if (!merchantIdPattern.test(partnerId) || !/^[a-f0-9]{64}$/.test(keyId)) {
    return { ok: false as const, error: "Invalid merchant or key ID." };
  }
  try {
    await backendRequest(`/v1/admin/merchants/${encodeURIComponent(partnerId)}/keys/${encodeURIComponent(keyId)}`, "DELETE");
    return { ok: true as const };
  } catch {
    return { ok: false as const, error: "Could not confirm revocation. Check the key’s status before trying again." };
  }
}
