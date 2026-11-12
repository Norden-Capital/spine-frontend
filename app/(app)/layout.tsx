import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { canSeeUsers, safeNextPath } from "@/lib/auth-types";
import { appLayoutPrefsScript } from "@/lib/prefs";
import { deviceZone, getPreferences } from "@/lib/prefs-server";
import { AppDock, AppMain, NavPending } from "@/components/nav/app-dock";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { getUnreadAlerts } from "@/lib/alerts-server";
import { PrefsProvider } from "@/components/prefs/prefs-provider";
import { InlineScript } from "@/components/prefs/inline-script";

// Private pages must wait for the session check: no page, "Loading…" or
// empty state may show before we know who the user is. So this layout
// blocks on the server (no <Suspense> around the check) and redirect()
// happens before anything renders. On a link click inside the app, the
// top bar and dock stay and the new page shows its skeleton (loading.tsx,
// or NavPending/AppMain right after the tap): gray blocks only, no data.
export const instant = false;

// Second guard (proxy.ts is the first): ask the backend (GET /api/auth/me)
// who the user is. Also loads the user's preferences.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const wanted = safeNextPath((await headers()).get("x-spine-path"));
  const [user, prefs, unread] = await Promise.all([requireUser(wanted), getPreferences(), getUnreadAlerts()]);
  const device = await deviceZone();

  return (
    <PrefsProvider initialPrefs={prefs} deviceZone={device}>
      {/* Runs before the page below paints: applies the saved prefs (they may
          differ from the cookie the <head> script used, e.g. changed on
          another phone) and refreshes that cookie. */}
      <InlineScript html={appLayoutPrefsScript(prefs)} />
      {/* Spine UI kit layout: 18px sides, top bar, page, floating dock. */}
      {/* Tap feedback: the tapped page's skeleton and dock item show at once. */}
      <NavPending>
        <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-(--sp-gutter) pt-3">
          <AppTopBar user={user} unread={unread} />
          {/* Form pages (add / edit) hide the dock and its bottom space. */}
          <AppMain>{children}</AppMain>
          <AppDock isManager={canSeeUsers(user.role)} />
        </div>
      </NavPending>
    </PrefsProvider>
  );
}
