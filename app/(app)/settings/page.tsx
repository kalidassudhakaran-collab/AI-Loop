import { Role } from "@prisma/client";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { Card, CardHeader } from "@/components/ui/Card";
import { getAuthenticatedUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await getAuthenticatedUser();
  const isAdmin = user.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage workspace members and roles.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Workspace members"
          description="Admins can invite teammates and assign ADMIN, ANALYST, or VIEWER roles."
        />
        <MembersPanel isAdmin={isAdmin} currentUserId={user.id} />
      </Card>
    </div>
  );
}
