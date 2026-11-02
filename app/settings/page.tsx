import { requireAdmin, adminAuth } from "@/lib/admin-auth";
import { getSettings, getSettingsHistory } from "@/lib/settings-store";
import { requireProtectedSettingsRules } from "@/lib/settings-rules";
import { getAdminDb } from "@/lib/firebase-admin";
import { SettingsForm } from "./SettingsForm";
import { StaffPanel } from "./StaffPanel";
export default async function SettingsPage() {
  const actor = await requireAdmin();
  const [version, history] = await Promise.all([getSettings(), getSettingsHistory()]);
  let setupError = "";
  try { await requireProtectedSettingsRules(); } catch (error) { setupError = error instanceof Error ? error.message : "Could not verify database protection. Saves are locked."; }
  const staff = [];
  if (actor.role === "owner") {
    let pageToken: string | undefined;
    do {
      const page = await adminAuth().listUsers(1000, pageToken);
      staff.push(...page.users.filter(u => ["operator", "viewer"].includes(u.customClaims?.adminRole)).map(u => ({ uid: u.uid, email: u.email || u.uid, role: u.customClaims!.adminRole as "operator" | "viewer", disabled: u.disabled })));
      pageToken = page.pageToken;
    } while (pageToken);
  }
  const accessHistory = actor.role === "owner" ? Object.values((await getAdminDb().ref("adminAccessHistory").orderByKey().limitToLast(20).get()).val() || {}) as { at: number; actor: string; target: string; role: string; action: string; disabled: boolean; outcome?: string }[] : [];
  return <div className="mx-auto max-w-5xl space-y-10">
    <header><h1 className="text-2xl font-bold">Platform settings</h1><p className="mt-2 text-sm text-muted-foreground max-w-prose">Control new bookings, fares and rider requirements. Existing rides keep the prices and voucher limits saved when they were requested.</p><p className="mt-2 text-sm">Signed in as {actor.label} · {actor.role}</p></header>
    <nav aria-label="Settings sections" className="flex flex-wrap gap-2">{["Pricing", "Ride matching", "Service availability", "Rider verification", "Rewards and vouchers", "Operations and support"].map(title => <a key={title} className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground hover:text-primary" href={`#settings-${title.toLowerCase().replaceAll(" ", "-")}`}>{title}</a>)}{actor.role === "owner" && <a href="#admin-access" className="rounded-lg bg-muted px-3 py-2 text-sm hover:text-primary">Admin access</a>}<a href="#settings-history" className="rounded-lg bg-muted px-3 py-2 text-sm hover:text-primary">History</a></nav>
    {setupError && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{setupError}</p>}
    <SettingsForm initial={version} canEdit={actor.role === "owner"} />
    {actor.role === "owner" && <StaffPanel staff={staff} />}
    <section id="settings-history" className="scroll-mt-6" aria-labelledby="history-title"><h2 id="history-title" className="text-xl font-semibold">Settings history</h2><p className="mt-1 text-sm text-muted-foreground">Latest 30 changes. Each saved revision includes the previous and new values.</p>
      {history.length === 0 ? <p className="mt-4 text-sm">No settings have been changed yet.</p> : <ol className="mt-4 divide-y divide-border">{history.map(h => <li key={h.revision} className="py-4"><p className="text-sm font-medium">Revision {h.revision} · {h.actor}</p><p className="text-xs text-muted-foreground mt-1">{new Date(h.at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT</p><p className="mt-2 text-sm break-words">{h.reason}</p><details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">View {h.changes.length} changed fields</summary><dl className="mt-3 space-y-3">{h.changes.map(c => <div key={c.path}><dt className="font-medium break-words">{c.path}</dt><dd className="text-muted-foreground break-words">{c.before} → {c.after}</dd></div>)}</dl></details></li>)}</ol>}
    </section>
    {accessHistory.length > 0 && <section><h2 className="text-xl font-semibold">Staff access history</h2><ul className="mt-4 divide-y divide-border">{accessHistory.reverse().map((h, i) => <li key={i} className="py-3 text-sm break-words">{h.actor}: {h.action} {h.target} · {h.role}{h.disabled ? " · disabled" : ""} · {h.outcome || "applied"}<p className="text-xs text-muted-foreground mt-1">{new Date(h.at).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })} WAT</p></li>)}</ul></section>}
  </div>;
}
