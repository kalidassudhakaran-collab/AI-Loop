import { AskLoopPanel } from "@/components/ask-loop/AskLoopPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { FEEDBACK_READ_ROLES, hasRole } from "@/lib/permissions";
import { getAuthenticatedUser } from "@/lib/session";

export default async function AskPage() {
  const user = await getAuthenticatedUser();
  const canAsk = hasRole(user.role, FEEDBACK_READ_ROLES);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Ask LOOP</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ask natural-language questions grounded in {user.workspaceName}&apos;s
          feedback — never from invented data.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Grounded Q&A"
          description="Question → embed → retrieve → evidence → optional Claude answer with validated citations."
        />
        <AskLoopPanel canAsk={canAsk} />
      </Card>
    </div>
  );
}
