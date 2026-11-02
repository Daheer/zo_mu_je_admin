"use server";
import crypto from "node:crypto";
import { requirePermission, adminAuth } from "@/lib/admin-auth";
import { saveSettings } from "@/lib/settings-store";
import { requireProtectedSettingsRules } from "@/lib/settings-rules";
import { getAdminDb } from "@/lib/firebase-admin";
import type { PlatformSettings } from "@/lib/platform-settings";
export async function saveSettingsAction(values: PlatformSettings, revision: number, reason: string) {
  const actor = await requirePermission("settings");
  try {
    await requireProtectedSettingsRules();
    return { ok: true as const, version: await saveSettings(values, revision, actor.label, reason) };
  } catch (error) { return { ok: false as const, error: actionError(error) }; }
}
async function manageStaffInternal(input: { action: "create" | "update"; uid?: string; email?: string; password?: string; role: "operator" | "viewer"; disabled?: boolean }) {
  const actor = await requirePermission("settings");
  if (!input || !["create", "update"].includes(input.action) || !["operator", "viewer"].includes(input.role)) throw new Error("Invalid staff change.");
  await requireProtectedSettingsRules();
  const auth = adminAuth();
  let target: string;
  let uid: string | undefined;
  let claims: Record<string, unknown> = {};
  if (input.action === "create") {
    if (typeof input.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || typeof input.password !== "string" || input.password.length < 12 || input.password.length > 128) throw new Error("Enter an email and a password of 12–128 characters.");
    target = input.email.trim();
  } else {
    if (typeof input.uid !== "string" || !input.uid || typeof input.disabled !== "boolean") throw new Error("Invalid staff account.");
    const user = await auth.getUser(input.uid);
    if (!["operator", "viewer"].includes(user.customClaims?.adminRole)) throw new Error("This account is not a staff account.");
    uid = user.uid; target = user.email || uid; claims = user.customClaims || {};
  }
  // Record the attempt first: an Auth change cannot silently lose its audit trail.
  const audit = getAdminDb().ref("adminAccessHistory").push();
  await audit.set({ at: Date.now(), actor: actor.label, target, role: input.role, action: input.action, disabled: input.disabled ?? false, outcome: "requested" });
  try {
    if (input.action === "create") {
      const user = await auth.createUser({ email: target, password: input.password });
      uid = user.uid;
      try { await auth.setCustomUserClaims(uid, { adminRole: input.role, adminSessionVersion: crypto.randomUUID() }); }
      catch (error) { await auth.deleteUser(uid); throw error; }
    } else {
      await auth.revokeRefreshTokens(uid!);
      await auth.updateUser(uid!, { disabled: input.disabled });
      await auth.setCustomUserClaims(uid!, { ...claims, adminRole: input.role, adminSessionVersion: crypto.randomUUID() });
    }
  } catch (error) {
    await audit.update({ outcome: "failed", completedAt: Date.now() });
    throw error;
  }
  try { await audit.update({ outcome: "applied", uid, completedAt: Date.now() }); }
  catch { throw new Error("Staff access was updated, but the audit completion could not be saved. Reload the staff list before making another change."); }
}

function actionError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    if (error.code === "auth/email-already-exists") return "This email already has an account. Use a separate staff email.";
    if (error.code === "auth/invalid-password") return "Use a stronger password of at least 12 characters.";
    return "The change could not be completed. Check the current values and try again.";
  }
  return error instanceof Error ? error.message : "The change could not be completed. Please try again.";
}
export async function manageStaffAction(input: Parameters<typeof manageStaffInternal>[0]) {
  await requirePermission("settings");
  try { await manageStaffInternal(input); return { ok: true as const }; }
  catch (error) { return { ok: false as const, error: actionError(error) }; }
}
