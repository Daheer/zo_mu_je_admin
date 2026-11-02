"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { manageStaffAction } from "./actions";
export type Staff = { uid: string; email: string; role: "operator" | "viewer"; disabled: boolean };
export function StaffPanel({ staff }: { staff: Staff[] }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const busy = useRef(false);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  async function manage(input: Parameters<typeof manageStaffAction>[0]) {
    const response = await manageStaffAction(input);
    if (!response.ok) throw new Error(response.error);
  }
  async function run(work: () => Promise<void>, success: string) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError(""); setMessage("");
    try { await work(); setMessage(success); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update staff access. Try again."); }
    finally { busy.current = false; setPending(false); }
  }
  return <section aria-labelledby="staff-title">
    <header className="settings-panel-heading"><h2 id="staff-title">Team & access</h2><p>Give your team the right level of admin access.</p></header>
    <div className="settings-panel-body">
      <div className="flex items-center justify-between gap-4"><h3 className="font-semibold text-sm">Team members</h3><button type="button" disabled={pending} className="settings-button" onClick={() => setAdding(!adding)} aria-expanded={adding} aria-controls="add-staff-form"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Add staff</button></div>
      <ul className="settings-team-list">
        <li className="settings-team-row"><span className="settings-avatar" aria-hidden="true">O</span><div className="settings-team-identity"><strong>Platform owner</strong><small>Full access · Owner password</small></div><span className="text-xs font-medium">Owner</span></li>
        {staff.map(s => <li key={s.uid} className="settings-team-row">
          <span className="settings-avatar" aria-hidden="true">{s.email.slice(0,2).toUpperCase()}</span>
          <div className="settings-team-identity"><strong>{s.email}</strong><small>{s.disabled ? "Access disabled" : "Active account"}</small></div>
          <select aria-label={`Role for ${s.email}`} className="settings-input settings-team-role" value={s.role} disabled={pending} onChange={e => run(() => manage({ action: "update", uid: s.uid, role: e.target.value as Staff["role"], disabled: s.disabled }), "Staff role updated.")}><option value="operator">Operator</option><option value="viewer">Viewer</option></select>
          <button type="button" aria-label={`${s.disabled ? "Enable" : "Disable"} ${s.email}`} disabled={pending} className={`settings-button ghost${s.disabled ? "" : " danger"}`} onClick={() => run(() => manage({ action: "update", uid: s.uid, role: s.role, disabled: !s.disabled }), "Staff access updated.")}>{s.disabled ? "Enable" : "Disable"} account</button>
        </li>)}
      </ul>
      {staff.length === 0 && !adding && <p className="settings-description mt-4">Working with a team? Add an operator to manage riders and reports, or a viewer for read-only access.</p>}
      {adding && <form id="add-staff-form" ref={form} className="settings-subsection mt-6" onSubmit={e => {
        e.preventDefault(); const data = new FormData(e.currentTarget);
        run(async () => { await manage({ action: "create", email: String(data.get("email")), password: String(data.get("password")), role: String(data.get("role")) as Staff["role"] }); form.current?.reset(); setAdding(false); }, "Staff account created. Share the credentials privately.");
      }}>
        <h3 className="font-semibold text-sm mb-4">Add staff account</h3>
        <fieldset disabled={pending} className="settings-fields">
          <label className="settings-field"><span className="settings-field-label">Staff email</span><input className="settings-input" name="email" type="email" required autoComplete="off" /></label>
          <label className="settings-field"><span className="settings-field-label">Initial password</span><input className="settings-input" name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /><span className="settings-field-hint">At least 12 characters.</span></label>
          <label className="settings-field"><span className="settings-field-label">Role</span><select name="role" className="settings-input"><option value="viewer">Viewer</option><option value="operator">Operator</option></select></label>
        </fieldset>
        <div className="flex gap-2 mt-5"><button disabled={pending} className="settings-button primary">{pending ? "Creating account…" : "Create staff account"}</button><button type="button" disabled={pending} className="settings-button ghost" onClick={() => setAdding(false)}>Cancel</button></div>
      </form>}
      {error && <p role="alert" className="settings-feedback error !mx-0">{error}</p>}
      {message && <p role="status" className="settings-feedback success !mx-0">{message}</p>}
      <div className="settings-role-guide"><div><h3>Owner</h3><p>Manages all settings, staff accounts, riders and reports.</p></div><div><h3>Operator</h3><p>Manages riders and reports. Can view platform settings.</p></div><div><h3>Viewer</h3><p>Can view the dashboard and settings. Cannot make changes.</p></div></div>
      <p className="settings-field-hint mt-5">Role and access changes save immediately. Disabling an account signs it out.</p>
    </div>
  </section>;
}
