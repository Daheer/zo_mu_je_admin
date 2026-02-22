"use client";

import { useFormState } from "react-dom";

type State = { error?: string } | null;
type Action = (prev: State, formData: FormData) => Promise<State>;

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-4">
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
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-[#2C3E50] placeholder:text-[#7F8C8D] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        Log in
      </button>
    </form>
  );
}
