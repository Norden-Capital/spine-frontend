import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { GUEST_ONLY_PATHS, SESSION_COOKIE_NAME } from "@/lib/auth-types";

const BACKEND_URL = process.env.BACKEND_URL;

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Ask the backend if the session cookie is still valid. */
async function sessionStatus(request: NextRequest): Promise<"valid" | "expired" | "unknown"> {
  if (!BACKEND_URL) return "unknown";
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: { cookie: request.headers.get("cookie") ?? "", accept: "application/json" },
      cache: "no-store",
    });
    if (res.ok) return "valid";
    if (res.status === 401) return "expired";
  } catch {
    // Backend down: let the page decide.
  }
  return "unknown";
}

// Two kinds of pages:
// - guest-only (/login, /forgot-password, /set-password): only for people NOT
//   logged in. A valid session goes to "/".
// - private (everything else): no session cookie, or the backend says the
//   session is over (401) -> /login, keeping the wanted path. The server
//   layout in app/(app)/layout.tsx checks again, and the backend is the
//   final guard.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (matches(pathname, GUEST_ONLY_PATHS)) {
    if (!hasCookie) return NextResponse.next();
    // Only the cookie is not enough: an expired one would loop
    // /login -> / -> /login. So ask the backend.
    const status = await sessionStatus(request);
    if (status === "valid") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const response = NextResponse.next();
    // Drop the dead cookie so later requests skip this check.
    if (status === "expired") response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  const wanted = pathname + search;
  const toLogin = () => {
    const url = new URL("/login", request.url);
    if (wanted !== "/") url.searchParams.set("next", wanted);
    return NextResponse.redirect(url);
  };

  if (!hasCookie) return toLogin();

  // Cookie there but the session may be over: check now, so the redirect
  // happens before anything renders (no empty page on a link click).
  if ((await sessionStatus(request)) === "expired") {
    const response = toLogin();
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  // Pass the wanted path on, so the server layout can send the user back
  // here after login if the session turns out to be expired.
  const headers = new Headers(request.headers);
  headers.set("x-spine-path", wanted);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Skip the backend proxy, Next internals and files with an extension, so
  // static files stay public without a login (/email/spine-logo.png, the app
  // icons like /apple-touch-icon.png that iOS fetches with no session).
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\..*).*)"],
};
