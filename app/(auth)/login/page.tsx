import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
      <p className="mt-1 text-sm text-slate-500">
        Log in to your workspace to continue.
      </p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
