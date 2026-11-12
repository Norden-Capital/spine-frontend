import { SpBadge, type SpBadgeProps } from "@/components/spine-ui";
import { ROLE_LABEL, type Role, type UserStatus } from "@/lib/auth-types";

const STATUS: Record<UserStatus, { label: string; tone: SpBadgeProps["tone"] }> = {
  ACTIVE: { label: "Active", tone: "success" },
  INVITED: { label: "Invited", tone: "warning" },
  DISABLED: { label: "Disabled", tone: "neutral" },
};

/** Owner / Admin in purple, Employee in gray. */
export function RoleBadge({ role }: { role: Role }) {
  return <SpBadge tone={role === "EMPLOYEE" ? "neutral" : "accent"}>{ROLE_LABEL[role] ?? role}</SpBadge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <SpBadge tone={s.tone}>{s.label}</SpBadge>;
}
