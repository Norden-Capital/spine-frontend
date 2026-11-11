export type Role = "OWNER" | "ADMIN" | "EMPLOYEE";

/** OWNER > ADMIN > EMPLOYEE. Owners and admins manage users; employees never see admin things. */
export function canSeeUsers(role: Role): boolean {
  return role === "OWNER" || role === "ADMIN";
}

/** Roles this user may invite: owner -> Admin or Employee; admin -> Employee only. */
export function invitableRoles(role: Role): Role[] {
  if (role === "OWNER") return ["ADMIN", "EMPLOYEE"];
  if (role === "ADMIN") return ["EMPLOYEE"];
  return [];
}

export const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner", ADMIN: "Admin", EMPLOYEE: "Employee" };
export type UserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  firstName: string | null;
  lastName: string | null;
};

/** GET /api/me: the user's own account. */
export type MyAccount = CurrentUser & {
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
};

/** "Anna Smith", or the email if no name is set. */
export function displayName(user: Pick<CurrentUser, "email" | "firstName" | "lastName">): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

/** "AS" from the name, or the first letter of the email. */
export function initials(user: Pick<CurrentUser, "email" | "firstName" | "lastName">): string {
  const letters = [user.firstName, user.lastName].map((n) => n?.trim()[0] ?? "").join("");
  return (letters || user.email[0] || "?").toUpperCase();
}

export type AdminUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  /** The backend says if I may act on this user (disable, reset, ...). */
  canManage: boolean;
};

// Name of the HttpOnly session cookie the backend sets on login. Proxy only
// checks that it exists; the real check is GET /api/auth/me on the server.
// Confirmed by the Backend department: "SESSION", Path=/, HttpOnly, SameSite=Lax.
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "SESSION";

// Guest-only pages: only for people NOT logged in (proxy.ts and the (auth)
// layout send a logged-in user to "/"). Everything else is private.
export const GUEST_ONLY_PATHS = ["/login", "/forgot-password", "/set-password"];

/** Only allow same-site paths like "/admin/users", never "//evil.com". */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
