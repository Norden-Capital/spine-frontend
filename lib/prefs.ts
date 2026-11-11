// User preferences: types, defaults, the one date/time formatter, and the
// code that applies look-and-feel prefs to <html>. Works on server and client.

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
export type Theme = "LIGHT" | "DARK" | "SYSTEM";
export type Font = "GEIST" | "INTER" | "MANROPE" | "SYSTEM";
export type TextSize = "SMALL" | "NORMAL" | "LARGE";

export type Preferences = {
  dateFormat: DateFormat;
  /** IANA zone like "America/Toronto"; null = follow the device. */
  timeZone: string | null;
  theme: Theme;
  font: Font;
  textSize: TextSize;
};

export const DEFAULT_PREFERENCES: Preferences = {
  dateFormat: "DD/MM/YYYY",
  timeZone: null,
  theme: "SYSTEM",
  font: "GEIST",
  textSize: "NORMAL",
};

// ---------------------------------------------------------------------------
// Dates. Every date in the app goes through these, so the user's date format
// and time zone apply everywhere. `zone` is the effective zone: the saved one,
// or the device zone when the saved one is null (see lib/prefs-server.ts).

export type DateSettings = { dateFormat: DateFormat; zone: string };

function partsIn(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

function orderDate(y: string, m: string, d: string, format: DateFormat) {
  if (format === "MM/DD/YYYY") return `${m}/${d}/${y}`;
  if (format === "YYYY-MM-DD") return `${y}-${m}-${d}`;
  return `${d}/${m}/${y}`;
}

function safeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

/** "26/10/2026" for a timestamp, in the user's zone. */
export function formatDate(iso: string | null | undefined, s: DateSettings): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const p = partsIn(date, safeZone(s.zone));
  return orderDate(p.y, p.m, p.d, s.dateFormat);
}

/** "26/10/2026 14:05" (24-hour) for a timestamp, in the user's zone. */
export function formatDateTime(iso: string | null | undefined, s: DateSettings): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const p = partsIn(date, safeZone(s.zone));
  return `${orderDate(p.y, p.m, p.d, s.dateFormat)} ${p.hh}:${p.mm}`;
}

/** "Mon 26/10/2026" for a calendar day "YYYY-MM-DD" (no zone change). */
export function formatDay(day: string, s: Pick<DateSettings, "dateFormat">): string {
  const [y, m, d] = day.split("-");
  const weekday = new Date(`${day}T12:00:00Z`).toLocaleString("en-GB", { weekday: "short", timeZone: "UTC" });
  return `${weekday} ${orderDate(y, m, d, s.dateFormat)}`;
}

/** Today as "YYYY-MM-DD" in a zone. */
export function todayIn(zone: string): string {
  const p = partsIn(new Date(), safeZone(zone));
  return `${p.y}-${p.m}-${p.d}`;
}

// ---------------------------------------------------------------------------
// Look and feel on <html>. The same steps run in three places:
// - PREFS_HEAD_SCRIPT, inline in <head>, before the first paint (cookie);
// - the (app) layout, inline, with the prefs from the backend;
// - applyPrefs(), in the browser, right after the user changes a setting.

/** Cookie the head script reads: "THEME.FONT.SIZE", e.g. "DARK.INTER.LARGE". */
export const PREFS_COOKIE = "spine-prefs";
/** Cookie with the device time zone, so the server can format dates. */
export const DEVICE_ZONE_COOKIE = "spine-tz";

/** Plain JS (also inlined as a string): set theme, font and text size. */
const APPLY_JS = `function(t,f,s){var d=document.documentElement;var k=t==="DARK"||(t==="SYSTEM"&&matchMedia("(prefers-color-scheme: dark)").matches);d.dataset.theme=t;d.classList.toggle("dark",k);d.style.colorScheme=k?"dark":"light";d.dataset.font=String(f).toLowerCase();d.dataset.textSize=String(s).toLowerCase()}`;

/**
 * Runs first in <head>. Logged-out pages (login, forgot, set password) use the
 * defaults; other pages use the cookie. Also keeps the device zone cookie
 * fresh and follows the phone's light/dark switch live for "SYSTEM".
 */
export const PREFS_HEAD_SCRIPT = `(function(){try{
var apply=${APPLY_JS};
document.cookie="${DEVICE_ZONE_COOKIE}="+encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)+";path=/;max-age=31536000;samesite=lax";
var guest=/^\\/(login|forgot-password|set-password)(\\/|$)/.test(location.pathname);
var m=document.cookie.match(/(?:^|; )${PREFS_COOKIE}=([^;]*)/);
var p=(!guest&&m)?decodeURIComponent(m[1]).split("."):[];
apply(p[0]||"SYSTEM",p[1]||"GEIST",p[2]||"NORMAL");
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){var d=document.documentElement;if(d.dataset.theme==="SYSTEM")apply("SYSTEM",d.dataset.font,d.dataset.textSize)});
}catch(e){}})()`;

function cookieValue(p: Pick<Preferences, "theme" | "font" | "textSize">) {
  return `${p.theme}.${p.font}.${p.textSize}`;
}

/** Inline script for the (app) layout: apply the backend prefs + save the cookie. */
export function appLayoutPrefsScript(p: Preferences): string {
  const v = JSON.stringify(cookieValue(p));
  return `(function(){try{(${APPLY_JS})(${JSON.stringify(p.theme)},${JSON.stringify(p.font)},${JSON.stringify(p.textSize)});document.cookie="${PREFS_COOKIE}="+encodeURIComponent(${v})+";path=/;max-age=31536000;samesite=lax"}catch(e){}})()`;
}

/** Browser only: apply prefs now and remember them for the next page load. */
export function applyPrefs(p: Pick<Preferences, "theme" | "font" | "textSize">) {
  // Same steps as APPLY_JS.
  const d = document.documentElement;
  const dark = p.theme === "DARK" || (p.theme === "SYSTEM" && matchMedia("(prefers-color-scheme: dark)").matches);
  d.dataset.theme = p.theme;
  d.classList.toggle("dark", dark);
  d.style.colorScheme = dark ? "dark" : "light";
  d.dataset.font = p.font.toLowerCase();
  d.dataset.textSize = p.textSize.toLowerCase();
  document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(cookieValue(p))};path=/;max-age=31536000;samesite=lax`;
}

/** Browser only: remember prefs for the next page load, without applying them now. */
export function rememberPrefs(p: Pick<Preferences, "theme" | "font" | "textSize">) {
  document.cookie = `${PREFS_COOKIE}=${encodeURIComponent(cookieValue(p))};path=/;max-age=31536000;samesite=lax`;
}

/** Browser only: forget the prefs cookie (on logout). */
export function clearPrefsCookie() {
  document.cookie = `${PREFS_COOKIE}=;path=/;max-age=0;samesite=lax`;
}
