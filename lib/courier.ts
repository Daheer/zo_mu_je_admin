export type PackageSize = "small" | "medium" | "large";
export type PackageLimit = { maxWeightKg: number; lengthCm: number; widthCm: number; heightCm: number; surcharge: number };
export type CourierValues = {
  enabled: boolean;
  pricing: { perKm: number; perMinute: number; minimumFare: number };
  sizes: Record<PackageSize, PackageLimit>;
  prohibitedItems: string;
};
export type CourierSettings = { schemaVersion: 1; revision: number; values: CourierValues; emailConfigured?: boolean };
export type CourierJob = {
  id: string; status: string;
  package: { size: PackageSize; payer: "sender" | "receiver"; notes: string; receiver: { name: string; phone: string; email: string } };
  collection?: { amountMinor: number; payer: string; collectedAt?: number };
  pickupProof?: { photoUrl: string; at: number };
  deliveryProof?: { method: string; photoUrl?: string; reason?: string; approvedBy?: string };
  receiverEmailStatus?: { status: string; attempts: number; sentAt?: number };
  incident?: { reason: string; previousStatus: string };
  events?: Record<string, { status: string; at: number; actorId: string }>;
  resolutions?: Record<string, { action: string; reason: string; actorId: string; at: number }>;
};
export type DeliveryResolutionAction = "approve_delivery" | "return_to_sender" | "confirm_return" | "cancel_before_pickup";
