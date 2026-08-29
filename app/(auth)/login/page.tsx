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
      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <p className="font-medium text-slate-800">Demo workspace</p>
        <ul className="mt-2 space-y-1">
          <li>Admin — admin@demo.loop / DemoAdmin123!</li>
          <li>Analyst — analyst@demo.loop / DemoAnalyst123!</li>
          <li>Viewer — viewer@demo.loop / DemoViewer123!</li>
        </ul>
      </div>
    </div>
  );
}
