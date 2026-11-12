// Server-only: the logged-in user's preferences, read once per request.
import { cache } from "react";
import { cookies } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import { DEFAULT_PREFERENCES, DEVICE_ZONE_COOKIE, type DateSettings, type Preferences } from "./prefs";

/** The saved prefs, or the defaults if the backend can't answer. */
export const getPreferences = cache(async (): Promise<Preferences> => {
  try {
    const res = await backendGet("/me/preferences");
    if (!res.ok) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...((await res.json()) as Partial<Preferences>) };
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    return DEFAULT_PREFERENCES;
  }
});

/** The device zone, from the cookie the <head> script sets ("UTC" if unknown yet). */
export async function deviceZone(): Promise<string> {
  const device = (await cookies()).get(DEVICE_ZONE_COOKIE)?.value;
  return device ? decodeURIComponent(device) : "UTC";
}

/** Zone used to show dates: the saved one, else the device's. */
export async function effectiveZone(prefs: Preferences): Promise<string> {
  return prefs.timeZone ?? (await deviceZone());
}

export async function getDateSettings(): Promise<DateSettings> {
  const prefs = await getPreferences();
  return { dateFormat: prefs.dateFormat, zone: await effectiveZone(prefs) };
}
