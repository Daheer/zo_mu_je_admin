import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAuth } from "firebase-admin/auth";
import { getAdminDb } from "./firebase-admin";
import { verifySession } from "./admin-session";

export type AdminRole = "owner" | "operator" | "viewer";
export interface AdminIdentity { uid: string; label: string; role: AdminRole }
export function adminAuth() { getAdminDb(); return getAuth(); }
export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
  const value = cookies().get("admin_session")?.value;
  const session = value && await verifySession(value, process.env.ADMIN_COOKIE_SECRET || "");
  if (!session) redirect("/login");
  if (session.uid === "owner") return { ...session, role: "owner" };
  try {
    const user = await adminAuth().getUser(session.uid);
    const role = user.customClaims?.adminRole;
    if (session.version === (user.customClaims?.adminSessionVersion || "") && !user.disabled && (role === "operator" || role === "viewer") && (!user.tokensValidAfterTime || session.issuedAt >= Date.parse(user.tokensValidAfterTime))) return { uid: user.uid, label: user.email || session.label, role };
  } catch { /* Expired, disabled or revoked staff access. */ }
  redirect("/login");
});
export async function requirePermission(permission: "operate" | "settings") {
  const actor = await requireAdmin();
  if (actor.role === "viewer" || (permission === "settings" && actor.role !== "owner")) throw new Error("Your account does not have permission to make this change.");
  return actor;
}
