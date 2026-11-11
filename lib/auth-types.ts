export type Role = "ADMIN" | "EMPLOYEE";
export type UserStatus = "INVITED" | "ACTIVE" | "DISABLED";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

export type AdminUser = {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
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
