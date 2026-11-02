"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSettingsAction } from "./actions";
import { changedSettings, validateSettings, type SettingsVersion, type PlatformSettings } from "@/lib/platform-settings";
import type { SettingsSection } from "./SettingsWorkspace";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return <label className="settings-field"><span className="settings-field-label">{label}</span>{children}{hint && <span className="settings-field-hint">{hint}</span>}</label>;
}
function Note({ children }: { children: React.ReactNode }) {
  return <div className="settings-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></svg><p>{children}</p></div>;
}
export function SettingsForm({ initial, canEdit, activeSection, onSectionChange, onDirtyChange, heading }: {
  initial: SettingsVersion;
  canEdit: boolean;
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onDirtyChange: (dirty: boolean) => void;
  heading: { label: string; description: string };
}) {
  const [version, setVersion] = useState(initial);
  const [values, setValues] = useState<PlatformSettings>(() => structuredClone(initial.values));
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const router = useRouter();
  const dirty = JSON.stringify(values) !== JSON.stringify(version.values);
  const changeCount = Object.keys(changedSettings(version.values, values)).length;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  const edit = (change: (s: PlatformSettings) => void) => {
    setValues(previous => { const next = structuredClone(previous); change(next); return next; });
    setMessage(""); setError("");
  };
  const numeric = (label: string, value: number, update: (n: number) => void, min: number, max: number, step = 1, hint?: string, unit?: string) => (
    <Field label={label} hint={hint}><div className="settings-input-wrap">
      {unit === "₦" && <span className="settings-unit prefix" aria-hidden="true">₦</span>}
      <input className={`settings-input${unit === "₦" ? " has-prefix" : unit ? " has-suffix" : ""}`} type="number" required min={min} max={max} step={step} value={Number.isNaN(value) ? "" : value} onChange={e => update(e.target.valueAsNumber)} />
      {unit && unit !== "₦" && <span className="settings-unit suffix" aria-hidden="true">{unit}</span>}
    </div></Field>
  );
  const toggle = (label: string, description: string, checked: boolean, update: (b: boolean) => void) => (
    <label className="settings-toggle-row"><span className="settings-toggle-copy"><strong>{label}</strong><small>{description}</small></span><input type="checkbox" role="switch" className="settings-switch" checked={checked} onChange={e => update(e.target.checked)} /></label>
  );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || !canEdit) return;
    const invalid = event.currentTarget.querySelector<HTMLInputElement | HTMLTextAreaElement>("input:invalid, textarea:invalid, select:invalid");
    if (invalid) {
      const section = invalid.closest<HTMLElement>("[data-settings-section]")?.dataset.settingsSection as SettingsSection | undefined;
      if (section) onSectionChange(section);
      requestAnimationFrame(() => { invalid.focus(); invalid.reportValidity(); });
      return;
    }
    saving.current = true; setPending(true); setError(""); setMessage("");
    try {
      const response = await saveSettingsAction(validateSettings(values), version.revision, reason);
      if (!response.ok) throw new Error(response.error);
      setVersion(response.version); setValues(structuredClone(response.version.values));
      setReason(""); setMessage(`Revision ${response.version.revision} saved.`); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Could not save settings. Please try again."); }
    finally { saving.current = false; setPending(false); }
  }
  return <form onSubmit={submit} noValidate>
    <header className="settings-panel-heading"><h2>{heading.label}</h2><p>{heading.description}</p></header>
    {!canEdit && <p className="settings-readonly">Your account has read-only access to settings. Ask the owner to make changes.</p>}
    {initial.revision > version.revision && <p role="alert" className="settings-feedback error">A newer revision is available. <button type="button" className="underline" onClick={() => window.location.reload()}>Reload settings</button> before saving.</p>}
    <fieldset disabled={!canEdit || pending} className="settings-panel-body">
      <section data-settings-section="general" hidden={activeSection !== "general"}>
        <div className="settings-subsection">
          <h3>Booking availability</h3>
          {toggle("Accept new bookings", "Allow customers to request rides and riders to go online.", values.operations.bookingsEnabled, b => edit(s => { s.operations.bookingsEnabled = b; }))}
          {toggle("Maintenance mode", "Temporarily pause new bookings while you make changes.", values.operations.maintenanceMode, b => edit(s => { s.operations.maintenanceMode = b; }))}
          <div className="mt-4"><Field label="Unavailable message" hint="Shown in the apps when bookings are paused."><textarea required maxLength={300} rows={2} className="settings-input" value={values.operations.maintenanceMessage} onChange={e => edit(s => { s.operations.maintenanceMessage = e.target.value; })} /></Field></div>
          <Note>Rides that are already matched can finish while new bookings are paused.</Note>
        </div>
        <div className="settings-subsection">
          <h3>Support contacts</h3><p className="settings-description">Give customers and riders a way to reach your team. Leave a contact blank to hide it in the apps.</p>
          <div className="settings-fields">
            <Field label="Support phone"><input type="tel" maxLength={30} className="settings-input" placeholder="+234 …" value={values.operations.supportPhone} onChange={e => edit(s => { s.operations.supportPhone = e.target.value; })} /></Field>
            <Field label="Support email"><input type="email" maxLength={300} className="settings-input" placeholder="support@your-domain.com" value={values.operations.supportEmail} onChange={e => edit(s => { s.operations.supportEmail = e.target.value; })} /></Field>
          </div>
        </div>
      </section>
      <section data-settings-section="pricing" hidden={activeSection !== "pricing"}>
        {(["Tricycle", "Motorcycle"] as const).map(type => <div className="settings-vehicle" key={type}>
          <div className="settings-vehicle-heading"><h3>{type}</h3>{type === "Tricycle" && <span>Keke</span>}</div>
          <div className="settings-fields three">
            {numeric("Per kilometre (₦)", values.pricing[type].perKm, n => edit(s => { s.pricing[type].perKm = n; }), 0, 10000, .01, undefined, "₦")}
            {numeric("Per minute (₦)", values.pricing[type].perMinute, n => edit(s => { s.pricing[type].perMinute = n; }), 0, 10000, .01, undefined, "₦")}
            {numeric("Minimum fare (₦)", values.pricing[type].minimumFare, n => edit(s => { s.pricing[type].minimumFare = n; }), 1, 100000, .01, undefined, "₦")}
          </div>
        </div>)}
        <Note>Fares combine distance and time charges, subject to the minimum. New prices apply to new rides; booked rides keep their original rates.</Note>
      </section>
      <section data-settings-section="matching" hidden={activeSection !== "matching"}>
        <div className="settings-fields">
          {numeric("Request timeout (seconds)", values.matching.requestTimeoutSeconds, n => edit(s => { s.matching.requestTimeoutSeconds = n; }), 15, 300, 1, "Total time allowed to find a rider.", "sec")}
          {numeric("Rider search radius (km)", values.matching.searchRadiusKm, n => edit(s => { s.matching.searchRadiusKm = n; }), .5, 50, .1, "Measured from the selected pickup.", "km")}
          {numeric("Additional searches", values.matching.maxRetries, n => edit(s => { s.matching.maxRetries = n; }), 0, 5, 1, "Set to 0 to turn retries off.")}
          {numeric("Time between searches (seconds)", values.matching.retryIntervalSeconds, n => edit(s => { s.matching.retryIntervalSeconds = n; }), 5, 120, 1, "All retries must fit within the timeout.", "sec")}
        </div>
        <Note>Each retry looks for newly eligible riders. A rider receives the same request only once.</Note>
      </section>
      <section data-settings-section="service" hidden={activeSection !== "service"}>
        <div className="settings-subsection">
          <h3>Trip distance</h3><p className="settings-description">Limit the driving distance between pickup and destination.</p>
          <div className="max-w-xs">{numeric("Maximum trip distance (km)", values.service.maxTripDistanceKm, n => edit(s => { s.service.maxTripDistanceKm = n; }), 1, 500, .1, undefined, "km")}</div>
        </div>
        <div className="settings-subsection">
          <h3>Operating hours</h3>
          {toggle("Limit bookings to operating hours", "Use your weekly schedule instead of accepting bookings all day.", values.service.hoursEnabled, b => edit(s => { s.service.hoursEnabled = b; }))}
          <div className="settings-schedule">
            <div className="settings-fields">
              <Field label="Opening time"><input type="time" required className="settings-input" value={values.service.opensAt} onChange={e => edit(s => { s.service.opensAt = e.target.value; })} /></Field>
              <Field label="Closing time"><input type="time" required className="settings-input" value={values.service.closesAt} onChange={e => edit(s => { s.service.closesAt = e.target.value; })} /></Field>
            </div>
            <fieldset><legend className="settings-field-label">Operating days</legend><div className="settings-day-options">{days.map((day, i) => <label key={day} className="settings-day"><input type="checkbox" aria-label={day} checked={values.service.daysOfWeek.includes(i + 1)} onChange={e => edit(s => { s.service.daysOfWeek = e.target.checked ? [...s.service.daysOfWeek, i + 1].sort() : s.service.daysOfWeek.filter(d => d !== i + 1); })}/><span>{day.slice(0,3)}</span></label>)}</div><p className="settings-field-hint">West Africa Time · Lagos (UTC+1). Overnight hours belong to the opening day.</p></fieldset>
          </div>
        </div>
        <div className="settings-subsection">
          <h3>Service areas</h3><p className="settings-description">Pickup and destination must each fall inside one of your service areas.</p>
          {values.service.zones.length === 0 && <div className="settings-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg><h3>All locations are eligible</h3><p>Add an area to limit bookings to the places you serve.</p></div>}
          {values.service.zones.map((z, i) => <fieldset key={i} className="settings-zone"><legend className="sr-only">Area {i + 1}</legend><div className="settings-zone-top"><h3>Area {i + 1}</h3><button type="button" aria-label={`Remove area ${i + 1}`} className="settings-button ghost danger" onClick={() => edit(s => { s.service.zones.splice(i,1); })}>Remove area</button></div>
            <Field label="Area name"><input required maxLength={80} className="settings-input" value={z.name} placeholder="e.g. Central Lafia" onChange={e => edit(s => { s.service.zones[i].name = e.target.value; })} /></Field>
            <div className="settings-fields three">
              {numeric("Latitude", z.latitude, n => edit(s => { s.service.zones[i].latitude = n; }), -90, 90, .000001)}
              {numeric("Longitude", z.longitude, n => edit(s => { s.service.zones[i].longitude = n; }), -180, 180, .000001)}
              {numeric("Radius (km)", z.radiusKm, n => edit(s => { s.service.zones[i].radiusKm = n; }), .5, 100, .1, undefined, "km")}
            </div>
          </fieldset>)}
          <button type="button" disabled={values.service.zones.length >= 20} className="settings-button mt-4" onClick={() => edit(s => { s.service.zones.push({ name: "", latitude: 0, longitude: 0, radiusKm: 5 }); })}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> Add service area</button>
        </div>
      </section>
      <section data-settings-section="verification" hidden={activeSection !== "verification"}>
        <div className="settings-subsection"><h3>Required information</h3>
          {toggle("Require complete vehicle details", "Vehicle model, registration number and colour must be provided.", values.verification.requireVehicleDetails, b => edit(s => { s.verification.requireVehicleDetails = b; }))}
          {toggle("Require an ID photo", "Riders must upload an identification photo before activation.", values.verification.requireIdPhoto, b => edit(s => { s.verification.requireIdPhoto = b; }))}
        </div>
        <fieldset className="settings-subsection"><legend>Allowed vehicle types</legend><p className="settings-description">Choose at least one vehicle type riders can register and use.</p><div className="settings-checks">{["Tricycle", "Motorcycle"].map(type => <label className="settings-check" key={type}><input type="checkbox" checked={values.verification.allowedVehicleTypes.includes(type)} onChange={e => edit(s => { s.verification.allowedVehicleTypes = e.target.checked ? [...s.verification.allowedVehicleTypes,type] : s.verification.allowedVehicleTypes.filter(t => t !== type); })}/>{type}</label>)}</div></fieldset>
        <Note>Admin activation is always required. These checks also apply when a rider goes online or is selected for a new ride.</Note>
      </section>
      <section data-settings-section="rewards" hidden={activeSection !== "rewards"}>
        <div className="settings-subsection"><h3>Referral rewards</h3>
          {toggle("Enable new referral rewards", "Reward successful invitations and welcome referred users.", values.rewards.enabled, b => edit(s => { s.rewards.enabled = b; }))}
          <div className="settings-fields mt-4">
            {numeric("Inviter reward (₦)", values.rewards.inviterAmount, n => edit(s => { s.rewards.inviterAmount = n; }), 0, 100000, .01, "Credited after the referred customer’s first ride.", "₦")}
            {numeric("Welcome voucher (₦)", values.rewards.welcomeAmount, n => edit(s => { s.rewards.welcomeAmount = n; }), 0, 100000, .01, "Given to a new user who uses an invite code.", "₦")}
          </div>
        </div>
        <div className="settings-subsection"><h3>Voucher redemption</h3><p className="settings-description">Set how much of a ride can be paid using a voucher balance.</p>
          <div className="settings-fields">
            {numeric("Maximum fare paid with vouchers (%)", values.rewards.maxVoucherPercent, n => edit(s => { s.rewards.maxVoucherPercent = n; }), 0, 100, .01, "Set to 0 to pause voucher redemption.", "%")}
            {numeric("Voucher cap per ride (₦)", values.rewards.maxVoucherAmount, n => edit(s => { s.rewards.maxVoucherAmount = n; }), 0, 100000, .01, "0 means no additional naira cap.", "₦")}
          </div>
        </div>
        <Note>Existing voucher balances and referral promises are preserved. New amounts apply to new registrations and new ride requests.</Note>
      </section>
    </fieldset>
    {error && <p role="alert" className="settings-feedback error">{error}</p>}
    {message && <p role="status" className="settings-feedback success">{message}</p>}
    {canEdit && <footer className="settings-save-area">
      {dirty && <div className="settings-save-note"><Field label="Reason for this change"><textarea required disabled={pending} minLength={5} maxLength={300} className="settings-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="A short note for your change history" /></Field></div>}
      <div className="settings-save-row"><p className="settings-save-caption">{dirty ? `${changeCount} unsaved ${changeCount === 1 ? "change" : "changes"}` : "All changes saved"}</p><div className="settings-save-buttons">{dirty && <button type="button" disabled={pending} className="settings-button ghost" onClick={() => { setValues(structuredClone(version.values)); setReason(""); setError(""); }}>Discard</button>}<button disabled={pending || !dirty} className="settings-button primary">{pending ? "Saving…" : "Save changes"}</button></div></div>
    </footer>}
  </form>;
}
