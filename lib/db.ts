import { getAdminDb } from "./firebase-admin";
import type { User, Rider, RideRequest, Report } from "./types";

function hasFirebaseEnv(): boolean {
  return (
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) ||
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
    .map(([id, value]) => ({ ...(value as object), id })) as Rider[];
}

export async function getRiderById(id: string): Promise<Rider | null> {
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
  if (!hasFirebaseEnv()) throw new Error("Firebase not configured");
  const db = getAdminDb();
  const ref = db.ref(`riders/${riderId}/status`);
  await ref.set(status);
}

export async function getUsers(): Promise<User[]> {
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("users");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<User>(val, "id");
}

export async function getUserById(id: string): Promise<User | null> {
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`users/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as User;
}

export async function getRideRequests(): Promise<RideRequest[]> {
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("All Ride Requests");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<RideRequest>(val, "id");
}

export async function getRideRequestById(id: string): Promise<RideRequest | null> {
  if (!hasFirebaseEnv()) return null;
  const db = getAdminDb();
  const ref = db.ref(`All Ride Requests/${id}`);
  const snapshot = await ref.get();
  const val = snapshot.val();
  if (!val) return null;
  return { ...val, id } as RideRequest;
}

export async function getReports(): Promise<Report[]> {
  if (!hasFirebaseEnv()) return [];
  const db = getAdminDb();
  const ref = db.ref("reports");
  const snapshot = await ref.get();
  const val = snapshot.val();
  return snapshotToRecord<Report>(val, "id");
}

export async function getReportById(id: string): Promise<Report | null> {
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
