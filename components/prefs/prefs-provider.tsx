"use client";

import { createContext, use, useCallback, useMemo, useState } from "react";
import {
  applyPrefs,
  formatDate,
  formatDateTime,
  formatDay,
  type DateSettings,
  type Preferences,
} from "@/lib/prefs";

type PrefsContextValue = {
  prefs: Preferences;
  /** The zone dates are shown in (saved zone, or the device zone). */
  zone: string;
  /** The phone's own zone (what "Auto" means). */
  deviceZone: string;
  /** Apply new prefs now (theme, font, size, dates) without a reload. */
  setPrefs: (next: Preferences) => void;
};

const PrefsContext = createContext<PrefsContextValue | null>(null);

/**
 * Holds the logged-in user's prefs for client components. The device zone
 * comes from the server (read from a cookie), so server and browser format
 * dates the same way (no hydration mismatch).
 */
export function PrefsProvider({
  initialPrefs,
  deviceZone,
  children,
}: {
  initialPrefs: Preferences;
  deviceZone: string;
  children: React.ReactNode;
}) {
  const [prefs, setState] = useState(initialPrefs);

  const setPrefs = useCallback((next: Preferences) => {
    applyPrefs(next);
    setState(next);
  }, []);

  const value = useMemo(
    () => ({ prefs, zone: prefs.timeZone ?? deviceZone, deviceZone, setPrefs }),
    [prefs, deviceZone, setPrefs]
  );
  return <PrefsContext value={value}>{children}</PrefsContext>;
}

export function usePrefs(): PrefsContextValue {
  const value = use(PrefsContext);
  if (!value) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return value;
}

/** Date helpers bound to the user's date format and zone. */
export function useDates() {
  const { prefs, zone } = usePrefs();
  return useMemo(() => {
    const s: DateSettings = { dateFormat: prefs.dateFormat, zone };
    return {
      settings: s,
      date: (iso: string | null | undefined) => formatDate(iso, s),
      dateTime: (iso: string | null | undefined) => formatDateTime(iso, s),
      day: (day: string) => formatDay(day, s),
    };
  }, [prefs.dateFormat, zone]);
}
