// Server-only session check. Cookie presence (checked in proxy.ts) is not
// trusted: every protected render asks the backend who the user is.
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, type CurrentUser } from "./auth-types";

const BACKEND_URL = process.env.BACKEND_URL;

/** GET a backend path from the server, sending the browser's cookies along. */
export async function backendGet(path: string): Promise<Response> {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not set");
  }
  const cookieHeader = (await cookies()).toString();
  return fetch(`${BACKEND_URL}/api${path}`, {
    headers: { cookie: cookieHeader, accept: "application/json" },
    cache: "no-store",
    // A hung backend must not keep the page loading forever: after 15 s the
    // page shows its error state (with "Try again") instead.
    signal: AbortSignal.timeout(15_000),
  });
}

/** Returns the logged-in user, or null if there is no valid session. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  // No session cookie: no need to ask the backend.
  if (!(await cookies()).has(SESSION_COOKIE_NAME)) return null;

  const res = await backendGet("/auth/me");
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) {
    throw new Error(`Session check failed (${res.status})`);
  }
  const user = (await res.json()) as CurrentUser;
  return {
    id: String(user.id),
    email: user.email,
    role: user.role,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    // The chosen face (or the default one); the top bar and menu draw it.
    avatarSeed: user.avatarSeed,
  };
});

export async function requireUser(nextPath = "/"): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(nextPath === "/" ? "/login" : `/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}
