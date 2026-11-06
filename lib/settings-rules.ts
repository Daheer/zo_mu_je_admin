import { backendEnabled } from "./ride-backend";
import { rules as expectedRules } from "../config/database.rules.json";
import { getAdminDb } from "./firebase-admin";
export async function requireProtectedSettingsRules() {
  if (backendEnabled()) return;
  const { rules } = await getAdminDb().getRulesJSON() as { rules: Record<string, unknown> };
  const safe = (raw: unknown, privateRead = false): boolean => {
    if (!raw || typeof raw !== "object") return false;
    return Object.entries(raw).every(([key, value]) => key === ".write" ? value === false : key === ".read" && privateRead ? value === false : key.startsWith(".") ? true : safe(value, privateRead));
  };
  const control = rules.platformControl as Record<string, unknown> | undefined;
  const history = rules.adminAccessHistory as Record<string, unknown> | undefined;
  const tripValidation = (rules["All Ride Requests"] as Record<string, Record<string, unknown>> | undefined)?.["$ride"]?.[".validate"];
  if (tripValidation !== expectedRules["All Ride Requests"]["$ride"][".validate"] || rules[".read"] !== false || rules[".write"] !== false || Object.keys(rules).some(k => k.startsWith("$")) || !control || control[".read"] !== false || !safe(control) || (control.history as Record<string, unknown>)?.[".read"] !== false || !safe(control.history, true) || !history || history[".read"] !== false || !safe(history, true)) {
    throw new Error("Settings are locked until the protected database rules are deployed. See PLATFORM_SETTINGS.md; the current database rules must not allow clients to overwrite settings or read admin history.");
  }
}
