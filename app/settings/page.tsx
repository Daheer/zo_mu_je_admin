import { backendEnabled, backendRequest } from "@/lib/ride-backend";
import { requireAdmin, adminAuth } from "@/lib/admin-auth";
import { getSettings, getSettingsHistory } from "@/lib/settings-store";
import { requireProtectedSettingsRules } from "@/lib/settings-rules";
import { getAdminDb } from "@/lib/firebase-admin";
import { SettingsWorkspace } from "./SettingsWorkspace";
export default async function SettingsPage() {
  const actor = await requireAdmin();
  const [version, history] = await Promise.all([getSettings(), getSettingsHistory()]);
  let setupError = "";
  try { await requireProtectedSettingsRules(); } catch (error) { setupError = error instanceof Error ? error.message : "Could not verify database protection. Saves are locked."; }
  const staff = [];
  if (actor.role === "owner" && backendEnabled()) {
    staff.push(...await backendRequest<{uid:string;email:string;role:"operator"|"viewer";disabled:boolean}[]>("/v1/admin/staff"));
  } else if (actor.role === "owner") {
    let pageToken: string | undefined;
    do {
      const page = await adminAuth().listUsers(1000, pageToken);
      staff.push(...page.users.filter(u => ["operator", "viewer"].includes(u.customClaims?.adminRole)).map(u => ({ uid: u.uid, email: u.email || u.uid, role: u.customClaims!.adminRole as "operator" | "viewer", disabled: u.disabled })));
      pageToken = page.pageToken;
    } while (pageToken);
  }
  const accessHistory = actor.role === "owner" && backendEnabled() ? await backendRequest<{ at: number; actor: string; target: string; role: string; action: string; disabled: boolean; outcome?: string }[]>("/v1/admin/access-history") : actor.role === "owner" ? Object.values((await getAdminDb().ref("adminAccessHistory").orderByKey().limitToLast(20).get()).val() || {}) as { at: number; actor: string; target: string; role: string; action: string; disabled: boolean; outcome?: string }[] : [];
  const historyContent = <section aria-labelledby="history-title">
    <header className="settings-panel-heading"><h2 id="history-title">Change history</h2><p>See what changed, when, and who changed it. Showing the latest 30 revisions.</p></header>
    <div className="settings-panel-body">
      {history.length === 0 ? <div className="settings-empty"><h3>No changes yet</h3><p>Saved settings will appear here with a reason and a record of the previous values.</p></div> : <ol>{history.map(h => <li key={h.revision} className="settings-history-entry">
        <div className="settings-history-meta"><span>Revision {h.revision}</span><time dateTime={new Date(h.at).toISOString()}>{new Date(h.at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WAT</time></div>
        <h3>{h.reason}</h3><p>Changed by {h.actor}</p>
        <details><summary>View {h.changes.length} changed {h.changes.length === 1 ? "field" : "fields"}</summary><dl>{h.changes.map(c => <div key={c.path}><dt>{c.path.split(".").map(part => part.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, ch => ch.toUpperCase())).join(" / ")}</dt><dd>{c.before} → {c.after}</dd></div>)}</dl></details>
      </li>)}</ol>}
      {accessHistory.length > 0 && <div className="settings-subsection"><h3>Staff access</h3><ul>{accessHistory.reverse().map((h, i) => <li key={i} className="settings-history-entry"><div className="settings-history-meta"><span>{h.role} · {h.outcome || "applied"}</span><time>{new Date(h.at).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WAT</time></div><h3>{h.target}</h3><p>{h.actor} · {h.action === "create" ? "Account created" : h.disabled ? "Access disabled" : "Access updated"}</p></li>)}</ul></div>}
    </div>
  </section>;
  return <SettingsWorkspace initial={version} role={actor.role} staff={staff} history={historyContent} setupError={actor.role === "owner" ? setupError : ""} />;
}
