"use client";

import { Role } from "@prisma/client";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

type MembersPanelProps = {
  isAdmin: boolean;
  currentUserId: string;
};

export function MembersPanel({ isAdmin, currentUserId }: MembersPanelProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(Role.ANALYST);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadMembers() {
    setLoading(true);
    setError("");

    const response = await fetch("/api/members");
    const data = (await response.json()) as {
      members?: Member[];
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to load members");
      return;
    }

    setMembers(data.members ?? []);
  }

  useEffect(() => {
    if (isAdmin) {
      void loadMembers();
    }
  }, [isAdmin]);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    const response = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = (await response.json()) as { error?: string };

    setIsSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to invite member");
      return;
    }

    setName("");
    setEmail("");
    setPassword("");
    setRole(Role.ANALYST);
    setSuccess("Member added successfully.");
    await loadMembers();
  }

  async function handleRoleChange(memberId: string, newRole: Role) {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    const data = (await response.json()) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Unable to update role");
      return;
    }

    setSuccess("Role updated.");
    await loadMembers();
  }

  if (!isAdmin) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Only workspace admins can manage members and roles.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <form onSubmit={handleInvite} className="grid gap-4 md:grid-cols-2">
        <Input
          label="Name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Temporary password"
          name="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Select
          label="Role"
          name="role"
          value={role}
          onChange={(event) => setRole(event.target.value as Role)}
          options={[
            { value: Role.ADMIN, label: "Admin" },
            { value: Role.ANALYST, label: "Analyst" },
            { value: Role.VIEWER, label: "Viewer" },
          ]}
        />
        <div className="md:col-span-2">
          <Button type="submit" isLoading={isSubmitting}>
            Add member
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Loading members...</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="px-4 py-3 text-slate-900">{member.name}</td>
                  <td className="px-4 py-3 text-slate-600">{member.email}</td>
                  <td className="px-4 py-3">
                    {member.id === currentUserId ? (
                      <Badge tone="info">{member.role}</Badge>
                    ) : (
                      <select
                        value={member.role}
                        onChange={(event) =>
                          void handleRoleChange(member.id, event.target.value as Role)
                        }
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value={Role.ADMIN}>ADMIN</option>
                        <option value={Role.ANALYST}>ANALYST</option>
                        <option value={Role.VIEWER}>VIEWER</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
