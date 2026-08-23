import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-2xl font-semibold text-slate-900">Create your workspace</h2>
      <p className="mt-1 text-sm text-slate-500">
        Sign up to start collecting and analyzing customer feedback.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
    </div>
  );
}
