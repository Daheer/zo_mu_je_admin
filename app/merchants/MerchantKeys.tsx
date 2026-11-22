"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { issueMerchantKey, revokeMerchantKey } from "./actions";

type MerchantKey = { id: string; environment: "sandbox" | "live"; status: "active" | "revoked"; createdAt: number };
export type Merchant = { id: string; name: string; keys: MerchantKey[] };

const issuedDate = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Lagos" });

export function MerchantKeys({ merchants }: { merchants: Merchant[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState(merchants[0]?.id ?? "");
  const [issued, setIssued] = useState<{ id: string; apiKey: string } | null>(null);
  const [pending, setPending] = useState<"issue" | "revoke" | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [feedback, setFeedback] = useState<{ error?: string; message?: string }>({});

  async function issue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || issued) return;
    const data = new FormData(event.currentTarget);
    const name = selected ? undefined : String(data.get("name")).trim();
    const partnerId = selected || String(data.get("partnerId")).trim();
    setPending("issue");
    setFeedback({});
    try {
      const result = await issueMerchantKey({ partnerId, name, environment: String(data.get("environment")) });
      if (!result.ok) {
        setFeedback({ error: result.error });
        return;
      }
      setIssued(result.key);
      setSelected(partnerId);
      setCopyMessage("");
    } catch {
      setFeedback({ error: "Could not confirm key creation. Check the key list before trying again." });
    } finally {
      setPending(null);
      router.refresh();
    }
  }

  async function revoke(merchant: Merchant, key: MerchantKey) {
    if (pending || !window.confirm(`Revoke the ${key.environment} key for ${merchant.name}? Requests using it will stop working immediately.`)) return;
    setPending("revoke");
    setFeedback({});
    try {
      const result = await revokeMerchantKey(merchant.id, key.id);
      if (!result.ok) {
        setFeedback({ error: result.error });
        return;
      }
      if (issued?.id === key.id) setIssued(null);
      setFeedback({ message: `Key revoked for ${merchant.name}.` });
    } catch {
      setFeedback({ error: "Could not confirm revocation. Check the key’s status before trying again." });
    } finally {
      setPending(null);
      router.refresh();
    }
  }

  async function copyKey(apiKey: string) {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopyMessage("Copied to clipboard.");
    } catch {
      setCopyMessage("Select the key and copy it manually.");
    }
  }

  return (
    <>
      <section className="settings-panel" aria-labelledby="issue-key-title">
        <header className="settings-panel-heading">
          <h2 id="issue-key-title">Issue an API key</h2>
        </header>
        <form className="settings-panel-body" onSubmit={issue}>
          <fieldset className="settings-fields" disabled={pending !== null || issued !== null}>
            <label className="settings-field">
              <span className="settings-field-label">Merchant</span>
              <select className="settings-input" value={selected} onChange={event => setSelected(event.target.value)}>
                <option value="">New merchant</option>
                {selected && !merchants.some(merchant => merchant.id === selected) && <option value={selected}>{selected}</option>}
                {merchants.map(merchant => <option key={merchant.id} value={merchant.id}>{merchant.name} ({merchant.id})</option>)}
              </select>
            </label>
            <label className="settings-field">
              <span className="settings-field-label">Environment</span>
              <select className="settings-input" name="environment" defaultValue="sandbox">
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
              <span className="settings-field-hint">Sandbox is for testing. Live keys can book billable deliveries.</span>
            </label>
            {!selected && <>
              <label className="settings-field">
                <span className="settings-field-label">Merchant name</span>
                <input className="settings-input" name="name" required maxLength={100} />
              </label>
              <label className="settings-field">
                <span className="settings-field-label">Merchant ID</span>
                <input className="settings-input" name="partnerId" required maxLength={128} pattern={"[A-Za-z0-9_\\-]+"} />
                <span className="settings-field-hint">Use letters, numbers, hyphens or underscores.</span>
              </label>
            </>}
          </fieldset>
          <button className="settings-button primary mt-5" disabled={pending !== null || issued !== null}>
            {pending === "issue" ? "Issuing key…" : "Issue key"}
          </button>
          {issued && <div className="settings-feedback success !mx-0" aria-labelledby="new-key-title">
            <p id="new-key-title" className="font-semibold" role="status">API key issued</p>
            <p className="mt-1">Key ID <code>{issued.id.slice(0, 12)}</code>. Copy the key now and share it securely with the merchant. It is shown only once.</p>
            <code className="mt-3 block select-all break-all rounded-lg bg-background p-3 text-foreground">{issued.apiKey}</code>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button type="button" className="settings-button" onClick={() => copyKey(issued.apiKey)}>Copy key</button>
              <button type="button" className="settings-button ghost" onClick={() => setIssued(null)}>Dismiss</button>
              <span role="status">{copyMessage}</span>
            </div>
          </div>}
        </form>
      </section>

      {feedback.error && <p role="alert" className="settings-feedback error !mx-0">{feedback.error}</p>}
      {feedback.message && <p role="status" className="settings-feedback success !mx-0">{feedback.message}</p>}

      <section className="settings-panel" aria-labelledby="merchant-key-list">
        <header className="settings-panel-heading"><h2 id="merchant-key-list">Issued keys</h2></header>
        <div className="settings-panel-body">
          {merchants.length === 0 && <p className="text-muted-foreground">No merchants yet.</p>}
          {merchants.map(merchant => (
            <div className="settings-subsection" key={merchant.id}>
              <h3>{merchant.name}</h3>
              <p className="break-all text-xs text-muted-foreground">{merchant.id}</p>
              {merchant.keys.length === 0 ? <p className="mt-3 text-muted-foreground">No keys issued.</p> : (
                <ul className="mt-2 divide-y divide-border">
                  {[...merchant.keys].sort((a, b) => b.createdAt - a.createdAt).map(key => (
                    <li key={key.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3">
                      <div>
                        <p className="capitalize">{key.environment} · {key.status}</p>
                        <p className="text-xs text-muted-foreground">
                          Key ID <code>{key.id.slice(0, 12)}</code> · Issued {issuedDate.format(key.createdAt)}
                        </p>
                      </div>
                      {key.status === "active" && (
                        <button type="button" className="settings-button danger" disabled={pending !== null}
                          aria-label={`Revoke ${merchant.name}'s ${key.environment} key ${key.id.slice(0, 12)}`}
                          onClick={() => revoke(merchant, key)}>
                          Revoke key
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
