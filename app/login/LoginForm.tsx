"use client";

import { useFormState, useFormStatus } from "react-dom";

type State = { error?: string } | null;
type Action = (prev: State, formData: FormData) => Promise<State>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-wait">
      {pending ? "Logging in…" : "Log in"}
    </button>
  );
}

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm mb-1">Email (leave blank for owner recovery)</label>
        <input id="email" name="email" type="email" autoComplete="username" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground" />
      </div>
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
