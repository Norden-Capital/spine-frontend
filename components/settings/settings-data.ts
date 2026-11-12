// Server-only data for the Settings hub and subpages. cache(): the hub and
// a page may ask for the same thing in one render; it is fetched once.
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { backendGet } from "@/lib/auth";
import type { MyAccount } from "@/lib/auth-types";
import { todayIn, type DateSettings } from "@/lib/prefs";
import type { SignInDay } from "@/lib/sign-ins";
import type { Passkey } from "./passkeys-section";

/** GET /me. 401 -> login (back to `next`); other errors -> null. */
export const getMe = cache(async (next: string): Promise<MyAccount | null> => {
  const res = await backendGet("/me");
  if (res.status === 401) redirect(`/login?next=${encodeURIComponent(next)}`);
  return res.ok ? ((await res.json()) as MyAccount) : null;
});

/** GET /me/passkeys (null = load failed). */
export const getPasskeys = cache(async (): Promise<Passkey[] | null> => {
  try {
    const res = await backendGet("/me/passkeys");
    return res.ok ? ((await res.json()) as Passkey[]) : null;
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    return null;
  }
});

/** Successful sign-ins since the 1st of this month (user's zone), from GET /me/sign-ins. null = load failed. */
export const getSignInsThisMonth = cache(async (zone: string): Promise<number | null> => {
  const from = `${todayIn(zone).slice(0, 7)}-01`;
  try {
    const res = await backendGet(`/me/sign-ins?from=${from}`);
    if (!res.ok) return null;
    const days = (await res.json()) as SignInDay[];
    return days.filter((d) => d.date >= from).reduce((sum, d) => sum + d.ok, 0);
  } catch (err) {
    unstable_rethrow(err);
    return null;
  }
});

function safeZone(zone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

/** "Sep 2026" in the user's zone. */
export function monthYear(iso: string, zone: string): string {
  return new Date(iso).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: safeZone(zone) });
}

/** Last login split for a stat tile: value "Today" / "Yesterday" / a date, and the time "08:12". */
export function lastLoginParts(iso: string, s: DateSettings): { day: string; time: string } {
  const zone = safeZone(s.zone);
  const date = new Date(iso);
  const ymd = date.toLocaleDateString("en-CA", { timeZone: zone });
  const today = todayIn(zone);
  const y = new Date(`${today}T12:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone });
  const [yy, mm, dd] = ymd.split("-");
  const day =
    ymd === today
      ? "Today"
      : ymd === yesterday
        ? "Yesterday"
        : s.dateFormat === "MM/DD/YYYY"
          ? `${mm}/${dd}/${yy}`
          : s.dateFormat === "YYYY-MM-DD"
            ? ymd
            : `${dd}/${mm}/${yy}`;
  return { day, time };
}
