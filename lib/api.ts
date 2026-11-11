// Browser-side helper for calling the backend through the same-origin
// `/api/*` proxy (see next.config.ts). Cookies go along automatically.
//
// All error texts live here (ERROR_MESSAGES), so screens just show
// `errorMessage(err)` and only special-case codes that change the flow.

import { GUEST_ONLY_PATHS } from "./auth-types";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** For validation_error: the field the backend complained about. */
    public field?: string
  ) {
    super(message);
  }
}

/** Short, friendly text for every error code the backend can send. */
const ERROR_MESSAGES: Record<string, string> = {
  // Session and security
  unauthorized: "Your session has ended. Please log in again.",
  forbidden: "You are not allowed to do this.",
  csrf_invalid: "Your session was out of date. Please reload the page and try again.",
  csrf_missing: "Could not start a secure session. Please reload the page.",
  invalid_credentials: "Email or password is wrong.",
  too_many_attempts: "Too many attempts. Please wait a few minutes and try again.",
  // Input
  validation_error: "Some information is not valid. Please check and try again.",
  bad_request: "Some information is not valid. Please check and try again.",
  weak_password: "This password is too weak. Use a longer password.",
  invalid_current_password: "Your current password is wrong.",
  // Links
  token_invalid: "This link has expired or was already used.",
  // Admin: users
  user_not_found: "This user no longer exists.",
  cannot_disable_self: "You can't disable your own account.",
  not_invited: "This user already set a password. No invite needed.",
  last_admin: "You can't do this: there must always be at least one active admin.",
  email_taken: "This email already has an account.",
  not_active: "This user is not active, so no reset email can be sent.",
  // Client side
  network_error: "Can't reach the server. Check your connection.",
};

const STATUS_MESSAGES: Record<number, string> = {
  401: ERROR_MESSAGES.unauthorized,
  403: ERROR_MESSAGES.forbidden,
  404: "We could not find this.",
  429: ERROR_MESSAGES.too_many_attempts,
};

const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

/** The text to show the user for any error thrown by `api()`. */
export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : FALLBACK_MESSAGE;
}

function friendlyMessage(status: number, code: string, field?: string): string {
  if (code === "validation_error" && field) {
    // "firstName" -> "first name"
    const name = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
    return `Please check the ${name} field.`;
  }
  return ERROR_MESSAGES[code] ?? STATUS_MESSAGES[status] ?? FALLBACK_MESSAGE;
}

const CSRF_COOKIE = "XSRF-TOKEN";
const CSRF_HEADER = "X-XSRF-TOKEN";

function readCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

async function refreshCsrfCookie(): Promise<void> {
  try {
    await fetch("/api/auth/csrf", { credentials: "same-origin" });
  } catch {
    // The next request will fail with network_error anyway.
  }
}

/** Read the token fresh every time: it changes at login. */
async function csrfToken(forceRefresh = false): Promise<string> {
  let token = forceRefresh ? null : readCookie(CSRF_COOKIE);
  if (!token) {
    await refreshCsrfCookie();
    token = readCookie(CSRF_COOKIE);
  }
  if (!token) {
    throw new ApiError(0, "csrf_missing", ERROR_MESSAGES.csrf_missing);
  }
  return token;
}

/** Session is gone on a protected page: go to login and come back after. */
function goToLogin() {
  const { pathname, search } = window.location;
  const onGuestPage = GUEST_ONLY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  if (onGuestPage) return;
  const wanted = pathname + search;
  const next = wanted === "/" ? "" : `?next=${encodeURIComponent(wanted)}`;
  // Full page load on purpose: it drops every cached page of the old session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login${next}`);
}

async function readError(res: Response): Promise<ApiError> {
  let code = "unknown_error";
  let field: string | undefined;
  try {
    const data = await res.json();
    if (typeof data?.error === "string") code = data.error;
    // validation_error messages look like "email: must be a well-formed email address".
    if (code === "validation_error" && typeof data?.message === "string") {
      const match = /^([A-Za-z][\w.]*):/.exec(data.message);
      if (match) field = match[1];
    }
  } catch {
    // Not JSON: keep the generic message.
  }
  return new ApiError(res.status, code, friendlyMessage(res.status, code, field), field);
}

export async function api<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const method = options.method ?? "GET";
  const needsCsrf = method !== "GET" && method !== "HEAD";

  async function send(freshCsrf: boolean): Promise<Response> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (needsCsrf) headers[CSRF_HEADER] = await csrfToken(freshCsrf);
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    try {
      return await fetch(`/api${path}`, {
        method,
        headers,
        credentials: "same-origin",
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError(0, "network_error", ERROR_MESSAGES.network_error);
    }
  }

  let res = await send(false);
  let error = res.ok ? null : await readError(res);

  // Old or missing CSRF token: get a new one and try ONE more time.
  if (error?.code === "csrf_invalid" && needsCsrf) {
    res = await send(true);
    error = res.ok ? null : await readError(res);
  }

  if (error) {
    if (error.code === "unauthorized") goToLogin();
    throw error;
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
