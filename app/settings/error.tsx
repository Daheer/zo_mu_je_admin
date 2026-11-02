"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export default function SettingsError({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <div className="mx-auto max-w-xl space-y-4">
    <h1 className="text-2xl font-bold">Could not load platform settings</h1>
    <p role="alert" className="text-sm text-muted-foreground">The server could not read the current configuration. Try again before making changes.</p>
    <button disabled={pending} onClick={() => startTransition(() => { router.refresh(); reset(); })} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? "Loading settings…" : "Try again"}</button>
  </div>;
}
