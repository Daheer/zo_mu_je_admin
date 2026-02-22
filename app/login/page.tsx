import { loginAction } from "./actions";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-background p-8 shadow-card">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#2C3E50]">Zo Mu Je Admin</h1>
          <p className="mt-2 text-sm text-[#7F8C8D]">Enter the admin password to continue</p>
        </div>
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
