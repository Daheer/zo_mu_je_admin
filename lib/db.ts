import { backendEnabled, backendRequest, backendList } from "./ride-backend";
import { getAdminDb } from "./firebase-admin";
import type { User, Rider, RideRequest, Report } from "./types";

export function hasFirebaseEnv(): boolean {
  return (
    backendEnabled() || Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
  );
}

function snapshotToRecord<T extends { id: string }>(
  snapshot: Record<string, unknown> | null,
  idKey: string
): T[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  return Object.entries(snapshot).map(([id, value]) => ({
    ...(value as object),
    [idKey]: id,
  })) as T[];
}

export async function getRiders(): Promise<Rider[]> {
  if (backendEnabled()) return backendList<Rider>("/v1/admin/profiles?role=rider");
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("riders");
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val || typeof val !== "object" || Array.isArray(val)) return [];
  // Only include entries whose value is an object (real rider nodes). Skip any
  // stray root-level keys under "riders" (e.g. earnings/ratings stored at root).
  return (Object.entries(val) as [string, unknown][])
    .filter(
      ([, v]) =>
        v != null && typeof v === "object" && !Array.isArray(v)
    )
    .map(([id, value]) => ({ ...(value as Rider), id }))
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export async function getRiderById(id: string): Promise<Rider | null> {
  if (backendEnabled()) return backendRequest<Rider | null>(`/v1/admin/profiles/${encodeURIComponent(id)}`);
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`riders/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as Rider;
}

export async function updateRiderStatus(
  riderId: string,
  status: "pending" | "active" | "inactive"
): Promise<void> {
  if (backendEnabled()) { await backendRequest(`/v1/admin/riders/${encodeURIComponent(riderId)}/status`, "POST", { status }); return; }
  if (!hasFirebaseEnv()) throw new Error("Firebase not configured");
  const db = getAdminDb();
  const ref = db.ref(`riders/${riderId}/status`);
  await ref.set(status);
}

export async function getUsers(): Promise<User[]> {
  if (backendEnabled()) return backendList<User>("/v1/admin/profiles?role=customer");
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("users");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<User>(val, "id");
}

export async function getUserById(id: string): Promise<User | null> {
  if (backendEnabled()) return backendRequest<User | null>(`/v1/admin/profiles/${encodeURIComponent(id)}`);
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`users/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as User;
}

export async function getRideRequests(): Promise<RideRequest[]> {
  if (backendEnabled()) return (await backendList<BackendRide>("/v1/admin/rides")).map(mapRide);
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("All Ride Requests");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<RideRequest>(val, "id");
}

export async function getRideRequestById(id: string): Promise<RideRequest | null> {
  if (backendEnabled()) { const ride = await backendRequest<BackendRide | null>(`/v1/admin/rides/${encodeURIComponent(id)}`); return ride ? mapRide(ride) : null; }
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`All Ride Requests/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as RideRequest;
}

export async function getReports(): Promise<Report[]> {
  if (backendEnabled()) return backendList<Report>("/v1/admin/reports");
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("reports");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<Report>(val, "id");
}

export async function getReportById(id: string): Promise<Report | null> {
  if (backendEnabled()) return backendRequest<Report | null>(`/v1/admin/reports/${encodeURIComponent(id)}`);
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`reports/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as Report;
}

export async function updateReport(
  reportId: string,
  updates: Partial<Pick<Report, "status" | "adminNotes" | "resolvedAt">>
): Promise<void> {
  if (backendEnabled()) { await backendRequest(`/v1/admin/reports/${encodeURIComponent(reportId)}`, "PATCH", { status: updates.status, adminNotes: updates.adminNotes || "" }); return; }
  if (!hasFirebaseEnv()) throw new Error("Firebase not configured");
  const db = getAdminDb();
  const ref = db.ref(`reports/${reportId}`);
  await ref.update(updates);
}

export async function getRideRequestsByRiderId(
  riderId: string
): Promise<RideRequest[]> {
  const all = await getRideRequests();
  return all.filter((r) => r.riderId === riderId);
}

export async function getRideRequestsByUserName(
  userName: string
): Promise<RideRequest[]> {
  const all = await getRideRequests();
  return all.filter((r) => r.userName === userName);
}

export async function getRideRequestsByUserEmail(
  userEmail: string
): Promise<RideRequest[]> {
  const all = await getRideRequests();
  return all.filter((r) => r.userEmail === userEmail);
}

export async function getRideRequestsByCustomer(
  userName: string,
  userEmail: string
): Promise<RideRequest[]> {
  const all = await getRideRequests();
  return all.filter(
    (r) => r.userName === userName || r.userEmail === userEmail
  );
}

interface BackendRide {
  id: string; customerId: string; riderId?: string; createdAt: number; status: string; vehicleType: string; fareMinor: number;
  pickup: { latitude: number; longitude: number; address: string }; dropoff: { latitude: number; longitude: number; address: string };
  customer?: { name?: string; email?: string; phone?: string }; rider?: { name?: string; phone?: string; vehicleModel?: string; vehicleNumber?: string; vehicleColor?: string };
  receipt?: { fareMinor: number; voucherMinor: number; cashMinor: number };
}
function mapRide(r: BackendRide): RideRequest {
  const point = (p: BackendRide["pickup"]) => ({ latitude: String(p.latitude), longitude: String(p.longitude) });
  return { id: r.id, origin: point(r.pickup), destination: point(r.dropoff), originAddress: r.pickup.address, destinationAddress: r.dropoff.address, userName: r.customer?.name, userEmail: r.customer?.email, userPhone: r.customer?.phone, rideType: r.vehicleType, vehicle_type: r.vehicleType, riderId: r.riderId, time: new Date(r.createdAt).toISOString(), estimatedFare: String(r.fareMinor / 100), fareAmount: r.receipt ? String(r.receipt.fareMinor / 100) : undefined, voucherAppliedAmount: r.receipt ? String(r.receipt.voucherMinor / 100) : undefined, cashAmountDue: r.receipt ? String(r.receipt.cashMinor / 100) : undefined, paymentMethod: "cash", status: r.status, rider_name: r.rider?.name, rider_phone: r.rider?.phone, vehicle_details: r.rider ? [r.rider.vehicleModel, r.rider.vehicleNumber, r.rider.vehicleColor].filter(Boolean).join(" · ") : undefined };
}
