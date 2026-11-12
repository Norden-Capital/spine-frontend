import { SpBadge, type SpBadgeProps } from "@/components/spine-ui";
import type { Role, UserStatus } from "@/lib/auth-types";
import { roleLabel } from "@/lib/roles";

const STATUS: Record<UserStatus, { label: string; tone: SpBadgeProps["tone"] }> = {
  ACTIVE: { label: "Active", tone: "success" },
  INVITED: { label: "Invited", tone: "warning" },
  DISABLED: { label: "Disabled", tone: "neutral" },
};

/** Owner in purple, Member in gray. */
export function RoleBadge({ role }: { role: Role }) {
  return <SpBadge tone={role === "OWNER" ? "accent" : "neutral"}>{roleLabel(role)}</SpBadge>;
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const s = STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <SpBadge tone={s.tone}>{s.label}</SpBadge>;
}
