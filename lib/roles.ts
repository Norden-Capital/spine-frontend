// Roles: OWNER and MEMBER only. All role checks of the app live here
// (server and client: plain functions, no "use client").
import type { Role } from "@/lib/auth-types";

/**
 * The owner has the Admin area (users, categories, trash), manages company
 * repeat expenses, edits/deletes any company transaction and may filter by person.
 * Members do none of this (the backend also says 403).
 */
export function isOwner(who: { role: Role } | Role | null | undefined): boolean {
  const role = typeof who === "string" ? who : who?.role;
  return role === "OWNER";
}

export const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", MEMBER: "Member" };

/** "Owner" / "Member" (the raw value if the backend sends something new). */
export function roleLabel(role: Role): string {
  return ROLE_LABEL[role] ?? role;
}
