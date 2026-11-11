import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL, type Role, type UserStatus } from "@/lib/auth-types";

const STATUS: Record<UserStatus, { label: string; variant: "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Active", variant: "secondary" },
  INVITED: { label: "Invited", variant: "outline" },
  DISABLED: { label: "Disabled", variant: "destructive" },
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant={role === "EMPLOYEE" ? "secondary" : "default"}>{ROLE_LABEL[role] ?? role}</Badge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
