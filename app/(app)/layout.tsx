import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-types";
import { isOwner } from "@/lib/roles";
import { appLayoutPrefsScript } from "@/lib/prefs";
import { deviceZone, getPreferences, isFallbackPrefs } from "@/lib/prefs-server";
import { AppDock, AppMain, NavPending } from "@/components/nav/app-dock";
import { WalletAutoLock } from "@/components/wallet/wallet-auto-lock";
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
  const owner = isOwner(user);
  // Members have no Admin area: /admin/* typed in is "Page not found", before
  // anything of this layout (or a loading skeleton) renders. The admin layout
  // checks again (for in-app navigations, where this layout does not re-run).
  if (!owner && /^\/admin(\/|\?|$)/.test(wanted)) notFound();
  const device = await deviceZone();

  return (
    <PrefsProvider initialPrefs={prefs} deviceZone={device}>
      {/* Runs before the page below paints: applies the saved prefs (they may
          differ from the cookie the <head> script used, e.g. changed on
          another phone) and refreshes that cookie. */}
      {/* If loading the prefs failed, keep the look already saved on this
          device (the <head> script applied it) instead of saving defaults. */}
      {!isFallbackPrefs(prefs) && <InlineScript html={appLayoutPrefsScript(prefs)} />}
      {/* Spine UI kit layout: 18px sides, top bar, page, floating dock. */}
      {/* Tap feedback: the tapped page's skeleton and dock item show at once. */}
      {/* The private wallet locks as soon as you leave it. */}
      <WalletAutoLock />
      <NavPending owner={owner}>
        <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col px-(--sp-gutter) pt-3">
          <AppTopBar user={user} unread={unread} />
          {/* Form pages (add / edit) hide the dock and its bottom space. */}
          <AppMain>{children}</AppMain>
          <AppDock owner={owner} />
        </div>
      </NavPending>
    </PrefsProvider>
  );
}
