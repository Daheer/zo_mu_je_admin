"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { manageStaffAction } from "./actions";
type Staff = { uid: string; email: string; role: "operator" | "viewer"; disabled: boolean };
const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
export function StaffPanel({ staff }: { staff: Staff[] }) {
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const busy = useRef(false), form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  async function manage(input: Parameters<typeof manageStaffAction>[0]) {
    const response = await manageStaffAction(input);
    if (!response.ok) throw new Error(response.error);
  }
  async function run(work: () => Promise<void>, success: string) {
    if (busy.current) return; busy.current = true; setPending(true); setError(""); setMessage("");
    try { await work(); setMessage(success); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not update staff access. Try again."); }
    finally { busy.current = false; setPending(false); }
  }
  return <section id="admin-access" className="scroll-mt-6 border-t border-border pt-6" aria-labelledby="staff-title"><h2 id="staff-title" className="text-xl font-semibold">Admin access</h2><p className="text-sm text-muted-foreground mt-2 max-w-prose">The owner manages settings and staff. Operators manage riders and reports. Viewers can read the dashboard. Disabling an account revokes its existing sessions.</p>
    <ul className="mt-4 divide-y divide-border">{staff.map(s => <li key={s.uid} className="py-4"><p className="text-sm break-words">{s.email} · {s.disabled ? "Disabled" : "Active"}</p><div className="mt-2 flex flex-wrap gap-3"><label className="text-sm">Role<select aria-label={`Role for ${s.email}`} className={`${input} mt-1`} value={s.role} disabled={pending} onChange={e => run(() => manage({ action: "update", uid: s.uid, role: e.target.value as Staff["role"], disabled: s.disabled }), "Staff role updated.")}><option value="operator">Operator</option><option value="viewer">Viewer</option></select></label><button type="button" disabled={pending} className="self-end rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60" onClick={() => run(() => manage({ action: "update", uid: s.uid, role: s.role, disabled: !s.disabled }), "Staff access updated.")}>{s.disabled ? "Enable" : "Disable"} account</button></div></li>)}</ul>
    {staff.length === 0 && <p className="mt-4 text-sm">No staff accounts yet.</p>}
    <form ref={form} className="mt-6 space-y-4" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); run(async () => { await manage({ action: "create", email: String(data.get("email")), password: String(data.get("password")), role: String(data.get("role")) as Staff["role"] }); form.current?.reset(); }, "Staff account created. Share the credentials privately."); }}><h3 className="text-base font-semibold">Add staff account</h3><fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Staff email<input className={`${input} mt-2`} name="email" type="email" required autoComplete="off" /></label><label className="text-sm">Initial password<input className={`${input} mt-2`} name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><label className="text-sm">Role<select name="role" className={`${input} mt-2`}><option value="viewer">Viewer</option><option value="operator">Operator</option></select></label></fieldset><button disabled={pending} className="rounded-xl border border-border px-4 py-3 text-sm hover:bg-muted disabled:opacity-60">{pending ? "Updating access…" : "Create staff account"}</button></form>
    {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="mt-4 text-sm">{message}</p>}
  </section>;
}
