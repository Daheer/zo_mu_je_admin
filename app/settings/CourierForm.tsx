"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CourierSettings, CourierValues, PackageSize } from "@/lib/courier";
import { saveCourierSettingsAction } from "./actions";

export function CourierForm({ initial, canEdit }: { initial: CourierSettings | null; canEdit: boolean }) {
  const [version, setVersion] = useState(initial);
  const [values, setValues] = useState(() => initial ? structuredClone(initial.values) : null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const router = useRouter();
  if (!initial || !version || !values) return <section><header className="settings-panel-heading"><h2>Courier</h2></header><div className="settings-panel-body"><p>Courier settings are unavailable. Check that the backend includes the courier update, then reload.</p></div></section>;
  const dirty = JSON.stringify(values) !== JSON.stringify(version.values);
  const edit = (change: (draft: CourierValues) => void) => {
    setValues(previous => { const next = structuredClone(previous!); change(next); return next; });
    setMessage(""); setError("");
  };
  const number = (label: string, value: number, update: (n: number) => void, min: number, max: number) => <label className="settings-field"><span className="settings-field-label">{label}</span><input className="settings-input" type="number" required min={min} max={max} step="0.01" value={Number.isNaN(value) ? "" : value} onChange={e => update(e.target.valueAsNumber)} /></label>;
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canEdit || saving.current || !values || !version) return;
    saving.current = true; setPending(true); setError(""); setMessage("");
    try {
      const result = await saveCourierSettingsAction(values, version.revision, reason);
      if (!result.ok) throw new Error(result.error);
      setVersion(result.version); setValues(structuredClone(result.version.values));
      setReason(""); setMessage("Courier settings saved."); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save courier settings."); }
    finally { saving.current = false; setPending(false); }
  }
  return <form onSubmit={submit}>
    <header className="settings-panel-heading"><h2>Courier</h2></header>
    {!canEdit && <p className="settings-readonly">Only the owner can change courier settings.</p>}
    {initial.revision > version.revision && <p role="alert" className="settings-feedback error">A newer courier revision is available. Reload before saving.</p>}
    <fieldset disabled={!canEdit || pending} className="settings-panel-body">
      <section className="settings-subsection">
        <label className="settings-toggle-row"><span className="settings-toggle-copy"><strong>Accept package bookings</strong><small>Motorcycle riders must also opt in to deliveries.</small></span><input type="checkbox" role="switch" className="settings-switch" checked={values.enabled} disabled={!initial.emailConfigured && !values.enabled} onChange={e => edit(v => { v.enabled = e.target.checked; })} /></label>
        <p className="settings-note">{initial.emailConfigured ? "Receiver email is configured. Complete the app delivery checks before enabling bookings." : "Configure Gmail SMTP on the backend before enabling package bookings."} Cash is collected from the sender or receiver, as selected when booking.</p>
      </section>
      <section className="settings-subsection"><h3>Delivery pricing</h3><div className="settings-fields three">
        {number("Per kilometre (₦)", values.pricing.perKm, n => edit(v => { v.pricing.perKm = n; }), 0, 10000)}
        {number("Per minute (₦)", values.pricing.perMinute, n => edit(v => { v.pricing.perMinute = n; }), 0, 10000)}
        {number("Minimum fare (₦)", values.pricing.minimumFare, n => edit(v => { v.pricing.minimumFare = n; }), 1, 100000)}
      </div><p className="settings-note">Distance and time charges are subject to the minimum fare, then the package surcharge is added. Quotes stay locked for five minutes. These starting rates need your operating review.</p></section>
      {(["small", "medium", "large"] as PackageSize[]).map(size => <section className="settings-subsection" key={size}><h3>{size[0].toUpperCase() + size.slice(1)} package</h3><div className="settings-fields three">
        {number("Maximum weight (kg)", values.sizes[size].maxWeightKg, n => edit(v => { v.sizes[size].maxWeightKg = n; }), .01, 5)}
        {number("Length (cm)", values.sizes[size].lengthCm, n => edit(v => { v.sizes[size].lengthCm = n; }), .01, 40)}
        {number("Width (cm)", values.sizes[size].widthCm, n => edit(v => { v.sizes[size].widthCm = n; }), .01, 30)}
        {number("Height (cm)", values.sizes[size].heightCm, n => edit(v => { v.sizes[size].heightCm = n; }), .01, 30)}
        {number("Surcharge (₦)", values.sizes[size].surcharge, n => edit(v => { v.sizes[size].surcharge = n; }), 0, 10000)}
      </div></section>)}
      <section className="settings-subsection"><label className="settings-field"><span className="settings-field-label">Prohibited items</span><textarea className="settings-input" required minLength={20} maxLength={2000} rows={4} value={values.prohibitedItems} onChange={e => edit(v => { v.prohibitedItems = e.target.value; })} /></label><p className="settings-note">Customers must accept this policy and the displayed package limits before booking. Current motorcycle handling limits cap all sizes at 5 kg and 40 × 30 × 30 cm.</p></section>
    </fieldset>
    {error && <p role="alert" className="settings-feedback error">{error}</p>}
    {message && <p role="status" className="settings-feedback success">{message}</p>}
    {canEdit && <div className="settings-save-area"><div className="settings-save-note"><label className="settings-field"><span className="settings-field-label">Reason for change</span><textarea className="settings-input" required={dirty} minLength={5} maxLength={300} rows={2} disabled={pending} value={reason} onChange={e => setReason(e.target.value)} /></label></div><div className="settings-save-row"><span className="settings-save-caption">{dirty ? "Unsaved courier changes" : "Courier settings are up to date"}</span><div className="settings-save-buttons"><button type="button" className="settings-button" disabled={!dirty || pending} onClick={() => { setValues(structuredClone(version.values)); setReason(""); setError(""); }}>Discard</button><button className="settings-button primary" type="submit" disabled={!dirty || pending || reason.trim().length < 5}>{pending ? "Saving…" : "Save courier settings"}</button></div></div></div>}
  </form>;
}
