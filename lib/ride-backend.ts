import { cache } from "react";
import { requireAdmin, adminAuth } from "./admin-auth";

export function backendEnabled() { return Boolean(process.env.RIDE_BACKEND_URL); }
const idToken = cache(async () => {
  const actor = await requireAdmin();
  const uid = actor.uid === "owner" ? process.env.BACKEND_OWNER_UID : actor.uid;
  if (!uid) throw new Error("Set BACKEND_OWNER_UID to the Firebase owner account.");
  const customToken = await adminAuth().createCustomToken(uid);
  const emulator = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  const endpoint = emulator ? `http://${emulator}/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken` : "https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken";
  const response = await fetch(`${endpoint}?key=${encodeURIComponent(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key")}`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: customToken, returnSecureToken: true }), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Unable to authenticate with the ride backend.");
  return (await response.json()).idToken as string;
});
export async function backendRequest<T = unknown>(path: string, method = "GET", body?: unknown): Promise<T> {
  const base = process.env.RIDE_BACKEND_URL;
  if (!base) throw new Error("Ride backend is not configured.");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) throw new Error("The ride backend requires HTTPS outside localhost.");
  const response = await fetch(`${base.replace(/\/$/, "")}${path}`, { method, cache: "no-store", headers: { Authorization: `Bearer ${await idToken()}`, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(20000) });
  const value = await response.json();
  if (!response.ok) {
    if (response.status === 404 && method === "GET") return null as T;
    const code = value.error || value.detail || "request_failed";
    throw new Error(typeof code === "string" ? code.replaceAll("_", " ") : "The backend rejected this change.");
  }
  return value as T;
}
export async function backendList<T>(path: string): Promise<T[]> {
  const items = new Map<string, T>();
  let cursor: string | null = null;
  do {
    const page: { items: (T & { id: string })[]; nextCursor: string | null } = await backendRequest(`${path}${path.includes("?") ? "&" : "?"}limit=200${cursor ? `&after=${encodeURIComponent(cursor)}` : ""}`);
    for (const item of page.items) items.set(item.id, item);
    if (page.nextCursor === cursor && cursor) throw new Error("Invalid backend page cursor.");
    cursor = page.nextCursor;
  } while (cursor);
  return Array.from(items.values());
}
