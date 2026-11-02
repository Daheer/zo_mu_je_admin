import { getAdminDb } from "./firebase-admin";
import { DEFAULT_SETTINGS, validateSettings, changedSettings, type SettingsVersion, type SettingsChange, type PlatformSettings } from "./platform-settings";
export function readVersion(raw: unknown): SettingsVersion {
  if (raw == null) return { schemaVersion: 1, revision: 0, values: structuredClone(DEFAULT_SETTINGS), updatedAt: 0, updatedBy: "Default configuration" };
  const v = raw as SettingsVersion;
  if (v.schemaVersion !== 1 || !Number.isInteger(v.revision) || v.revision < 1) throw new Error("Unsupported platform settings. Contact the platform owner.");
  // Realtime Database omits empty arrays.
  return { ...v, values: validateSettings({ ...v.values, service: { ...v.values.service, zones: v.values.service.zones ?? [] } }) };
}
export async function getSettings() {
  return readVersion((await getAdminDb().ref("platformControl/current").get()).val());
}
export async function getSettingsHistory(): Promise<SettingsChange[]> {
  const snapshot = await getAdminDb().ref("platformControl/history").orderByKey().limitToLast(30).get();
  return Object.values(snapshot.val() || {}).sort((a, b) => (b as SettingsChange).at - (a as SettingsChange).at) as SettingsChange[];
}
export async function saveSettings(values: PlatformSettings, revision: number, actor: string, reason: string) {
  const validated = validateSettings(values);
  if (!Number.isInteger(revision) || revision < 0) throw new Error("Reload settings before saving.");
  if (typeof reason !== "string" || reason.trim().length < 5 || reason.length > 300) throw new Error("Explain this change in 5–300 characters.");
  let failure = "Settings were changed by another admin. Reload the page, review the latest values and try again.";
  const at = Date.now();
  const key = getAdminDb().ref().push().key!;
  // ponytail: one atomic settings/history transaction; archive history if it becomes large.
  const result = await getAdminDb().ref("platformControl").transaction(raw => {
    // Admin SDK may first call the updater with an empty local cache.
    if (raw == null && revision > 0) return null;
    const current = readVersion(raw?.current);
    if (current.revision !== revision) { failure = "Settings were changed by another admin. Reload the page, review the latest values and try again."; return; }
    const changes = changedSettings(current.values, validated);
    if (!Object.keys(changes).length) { failure = "No settings changed."; return raw == null ? null : undefined; }
    return { ...raw, current: { schemaVersion: 1, revision: revision + 1, values: validated, updatedAt: at, updatedBy: actor }, history: { ...raw?.history, [key]: { revision: revision + 1, at, actor, reason: reason.trim(), changes: Object.entries(changes).map(([path, c]) => ({ path, before: JSON.stringify(c.before), after: JSON.stringify(c.after) })) } } };
  });
  if (!result.committed || result.snapshot.child("current/revision").val() !== revision + 1) throw new Error(failure);
  return readVersion(result.snapshot.child("current").val());
}
