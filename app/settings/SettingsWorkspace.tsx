"use client";

import { useState } from "react";
import type { SettingsVersion } from "@/lib/platform-settings";
import { SettingsForm } from "./SettingsForm";
import { StaffPanel, type Staff } from "./StaffPanel";

export type SettingsSection = "general" | "pricing" | "matching" | "service" | "verification" | "rewards" | "team" | "history";
export const sections: { id: SettingsSection; label: string }[] = [
  { id: "general", label: "General" },
  { id: "pricing", label: "Pricing" },
  { id: "matching", label: "Ride matching" },
  { id: "service", label: "Service" },
  { id: "verification", label: "Verification" },
  { id: "rewards", label: "Rewards" },
  { id: "team", label: "Team & access" },
  { id: "history", label: "History" },
];

export function SettingsWorkspace({ initial, role, staff, history, setupError }: {
  initial: SettingsVersion;
  role: "owner" | "operator" | "viewer";
  staff: Staff[];
  history: React.ReactNode;
  setupError: string;
}) {
  const [active, setActive] = useState<SettingsSection>("general");
  const available = sections.filter(s => s.id !== "team" || role === "owner");
  return <div className="settings-workspace space-y-6">
    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
    {setupError && <details className="settings-setup"><summary>Complete database setup to enable saves</summary><p>{setupError}</p></details>}
    <nav aria-label="Settings sections" className="settings-navigation">
      {available.map(section => <button key={section.id} type="button" aria-current={active === section.id ? "page" : undefined} aria-controls="settings-panel" onClick={() => setActive(section.id)}>{section.label}</button>)}
    </nav>
    <div id="settings-panel" className="settings-panel">
      <div hidden={active === "team" || active === "history"}><SettingsForm initial={initial} canEdit={role === "owner"} activeSection={active} onSectionChange={setActive} heading={available.find(s => s.id === active)!} /></div>
      {role === "owner" && <div hidden={active !== "team"}><StaffPanel staff={staff}/></div>}
      <div hidden={active !== "history"}>{history}</div>
    </div>
  </div>;
}
