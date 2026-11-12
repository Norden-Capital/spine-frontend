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
    public field?: string,
    /** The whole error body, for errors that carry data (e.g. possible_duplicate matches). */
    public data?: Record<string, unknown>
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
  name_taken: "This name is already used. Pick another one.",
  tag_archived: "This tag exists but is archived. A manager can bring it back.",
  category_not_found: "This category no longer exists.",
  tag_not_found: "This tag no longer exists.",
  passkey_invalid: "This Face ID / fingerprint is not known here. Log in with your password.",
  passkey_not_found: "This passkey no longer exists.",
  file_too_large: "This file is too big. The limit is 10 MB.",
  file_type_not_allowed: "This file type is not allowed. Use a photo or a PDF.",
  proof_required: "Add at least one proof (photo or PDF).",
  future_date: "The date can't be in the future.",
  transaction_not_found: "This transaction no longer exists.",
  file_not_found: "This file no longer exists.",
  possible_duplicate: "This looks like a transaction that is already saved.",
  comment_not_found: "This comment no longer exists.",
  pin_exists: "You already have a PIN.",
  no_pin: "Create your PIN first.",
  invalid_pin: "Wrong PIN. Try again.",
  invalid_password: "Your password is wrong.",
  wallet_locked: "Your wallet is locked. Enter your PIN.",
  budget_exists: "There is already a budget for this currency and category.",
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

/** Build the ApiError for a failed response (status + raw body text). */
function errorFrom(status: number, body: string): ApiError {
  let code = "unknown_error";
  let field: string | undefined;
  let data: Record<string, unknown> | undefined;
  try {
    data = JSON.parse(body);
    if (typeof data?.error === "string") code = data.error as string;
    // validation_error messages look like "email: must be a well-formed email address".
    if (code === "validation_error" && typeof data?.message === "string") {
      const match = /^([A-Za-z][\w.]*):/.exec(data.message as string);
      if (match) field = match[1];
    }
  } catch {
    // Not JSON: keep the generic message.
  }
  // Too big / wrong type can also come from a proxy, without our JSON.
  if (code === "unknown_error" && status === 413) code = "file_too_large";
  if (code === "unknown_error" && status === 415) code = "file_type_not_allowed";
  // A locked wallet: the wallet screens show the PIN pad again.
  if (code === "wallet_locked" && typeof window !== "undefined") {
    window.dispatchEvent(new Event("spine:wallet-locked"));
  }
  return new ApiError(status, code, friendlyMessage(status, code, field), field, data);
}

async function readError(res: Response): Promise<ApiError> {
  return errorFrom(res.status, await res.text().catch(() => ""));
}

/**
 * Upload one file (POST /api/files, multipart "file"). XHR, not fetch, so we
 * can show progress (0..1). Abort with the signal. Throws ApiError.
 */
export async function uploadFile<T = unknown>(
  file: File,
  { onProgress, signal }: { onProgress?: (part: number) => void; signal?: AbortSignal } = {}
): Promise<T> {
  const send = async (freshCsrf: boolean) => {
    const token = await csrfToken(freshCsrf);
    return new Promise<{ status: number; body: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/files");
      xhr.setRequestHeader(CSRF_HEADER, token);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
      xhr.onerror = () => reject(new ApiError(0, "network_error", ERROR_MESSAGES.network_error));
      xhr.onabort = () => reject(new DOMException("Upload stopped", "AbortError"));
      signal?.addEventListener("abort", () => xhr.abort(), { once: true });
      const form = new FormData();
      form.append("file", file, file.name);
      xhr.send(form);
    });
  };
  let res = await send(false);
  if (res.status === 403 && res.body.includes("csrf_invalid")) res = await send(true);
  if (res.status < 200 || res.status >= 300) {
    const error = errorFrom(res.status, res.body);
    if (error.code === "unauthorized") goToLogin();
    throw error;
  }
  return JSON.parse(res.body) as T;
}

type ApiOptions = { method?: string; body?: unknown };

/** Call the backend; returns the JSON body. Throws ApiError on failure. */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  return (await apiWithStatus<T>(path, options)).data;
}

/** Same as api(), plus the HTTP status (e.g. 200 "already there" vs 201 "created"). */
export async function apiWithStatus<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<{ status: number; data: T }> {
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
    return { status: res.status, data: undefined as T };
  }
  const text = await res.text();
  return { status: res.status, data: (text ? JSON.parse(text) : undefined) as T };
}
