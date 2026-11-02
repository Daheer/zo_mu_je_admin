"use client";

import { useState } from "react";
import type { SettingsVersion } from "@/lib/platform-settings";
import { SettingsForm } from "./SettingsForm";
import { StaffPanel, type Staff } from "./StaffPanel";

export type SettingsSection = "general" | "pricing" | "matching" | "service" | "verification" | "rewards" | "team" | "history";
export const sections: { id: SettingsSection; label: string; description: string }[] = [
  { id: "general", label: "General", description: "Manage booking availability and support contacts." },
  { id: "pricing", label: "Pricing", description: "Set the fare structure for each vehicle type." },
  { id: "matching", label: "Ride matching", description: "Choose how far and how long to search for a rider." },
  { id: "service", label: "Service areas & hours", description: "Choose where and when customers can book." },
  { id: "verification", label: "Rider verification", description: "Set the requirements riders must meet to go online." },
  { id: "rewards", label: "Rewards & vouchers", description: "Manage referral rewards and voucher redemption." },
  { id: "team", label: "Team & access", description: "Give your team the right level of admin access." },
  { id: "history", label: "Change history", description: "See what changed, when, and who changed it." },
];

const paths: Record<SettingsSection, React.ReactNode> = {
  general: <><path d="M4 7h9m4 0h3M4 17h3m4 0h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/></>,
  pricing: <><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 9h.01M18 15h.01"/></>,
  matching: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h7a4 4 0 0 1 0 8H9a3 3 0 0 0 0 6h7"/></>,
  service: <><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  verification: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></>,
  rewards: <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12M12 8H8a2.5 2.5 0 1 1 2.5-2.5L12 8Zm0 0h4a2.5 2.5 0 1 0-2.5-2.5L12 8Z"/></>,
  team: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/></>,
  history: <><path d="M3 11a9 9 0 1 1 2.6 7M3 4v7h7M12 7v5l3 2"/></>,
};
export function SettingsIcon({ name, className = "" }: { name: SettingsSection; className?: string }) {
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export function SettingsWorkspace({ initial, role, staff, history, setupError }: {
  initial: SettingsVersion;
  role: "owner" | "operator" | "viewer";
  staff: Staff[];
  history: React.ReactNode;
  setupError: string;
}) {
  const [active, setActive] = useState<SettingsSection>("general");
  const [hasDraft, setHasDraft] = useState(false);
  const available = sections.filter(s => s.id !== "team" || role === "owner");
  return <div className="settings-workspace">
    <header className="settings-page-header">
      <div><h1>Platform settings</h1><p>Manage your service, fares and team.</p></div>
      <span className="settings-role"><SettingsIcon name="verification" />{role === "owner" ? "Owner access" : role === "operator" ? "Operator access" : "View-only access"}</span>
    </header>
    {setupError && <details className="settings-setup"><summary>Complete database setup to enable saves</summary><p>{setupError}</p></details>}
    <div className="settings-layout">
      <aside className="settings-navigation">
        <label className="settings-mobile-navigation">Settings section<select value={active} onChange={e => setActive(e.target.value as SettingsSection)}>{available.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
        <nav aria-label="Settings sections" className="settings-desktop-navigation">{available.map(s => <button key={s.id} type="button" aria-current={active === s.id ? "page" : undefined} aria-controls="settings-panel" onClick={() => setActive(s.id)}><SettingsIcon name={s.id}/><span>{s.label}</span>{active === s.id && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>}</button>)}</nav>
        <div className="settings-version"><span className={`settings-status-dot${hasDraft ? " is-draft" : ""}`} /><span>{hasDraft ? "Unsaved changes" : initial.revision ? `Revision ${initial.revision}` : "Default configuration"}</span>{initial.updatedAt > 0 && <small>Updated {new Date(initial.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" })}</small>}</div>
      </aside>
      <div id="settings-panel" className="settings-panel">
        <div hidden={active === "team" || active === "history"}><SettingsForm initial={initial} canEdit={role === "owner"} activeSection={active} onSectionChange={setActive} onDirtyChange={setHasDraft} heading={available.find(s => s.id === active)!} /></div>
        {role === "owner" && <div hidden={active !== "team"}><StaffPanel staff={staff}/></div>}
        <div hidden={active !== "history"}>{history}</div>
      </div>
    </div>
  </div>;
}
