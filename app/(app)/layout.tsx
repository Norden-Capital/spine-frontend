import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { canSeeUsers, safeNextPath } from "@/lib/auth-types";
import { appLayoutPrefsScript } from "@/lib/prefs";
import { deviceZone, getPreferences } from "@/lib/prefs-server";
import { AppDock } from "@/components/nav/app-dock";
import { AppTopBar } from "@/components/nav/app-top-bar";
import { DOCK_SPACE_CLASS } from "@/components/spine-ui";
import { getUnreadAlerts } from "@/lib/alerts-server";
import { PrefsProvider } from "@/components/prefs/prefs-provider";
import { InlineScript } from "@/components/prefs/inline-script";

// Private pages must wait for the session check: no page, "Loading…" or
// empty state may show before we know who the user is. So this layout
// blocks on the server (no <Suspense> around the check) and redirect()
// happens before anything renders. On a link click, the old page stays
// visible until the new one is ready.
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
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-(--sp-gutter) pt-3">
        <AppTopBar user={user} unread={unread} />
        <main className={`flex-1 pt-[17.5px] ${DOCK_SPACE_CLASS}`}>{children}</main>
        <AppDock isManager={canSeeUsers(user.role)} />
      </div>
    </PrefsProvider>
  );
}
