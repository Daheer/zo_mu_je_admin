export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export interface AdminSession { uid: string; label: string; issuedAt: number; version?: string }
function decode(value: string) { return Uint8Array.from(atob(value.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)); }
export async function verifySession(value: string, secret: string, now = Date.now()): Promise<AdminSession | null> {
  try {
    const parts = value.split(".");
    if (parts.length !== 2 || !secret) return null;
    const [payload, signature] = parts;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decode(signature), new TextEncoder().encode(payload))) return null;
    // Previous owner sessions were issued in both seconds and milliseconds.
    const session: AdminSession = /^\d+$/.test(payload)
      ? { uid: "owner", label: "Owner", issuedAt: Number(payload) * (payload.length <= 10 ? 1000 : 1) }
      : JSON.parse(new TextDecoder().decode(decode(payload)));
    if (typeof session.uid !== "string" || !session.uid || typeof session.label !== "string" || (session.version !== undefined && typeof session.version !== "string") || !Number.isFinite(session.issuedAt) || session.issuedAt > now + 30000 || session.issuedAt < now - SESSION_SECONDS * 1000) return null;
    return session;
  } catch { return null; }
}
