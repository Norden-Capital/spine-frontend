import Link from "next/link";
import { headers } from "next/headers";
import { requireUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/auth-types";
import { appLayoutPrefsScript } from "@/lib/prefs";
import { deviceZone, getPreferences } from "@/lib/prefs-server";
import { UserMenu } from "@/components/auth/user-menu";
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
  const [user, prefs] = await Promise.all([requireUser(wanted), getPreferences()]);
  const device = await deviceZone();

  return (
    <PrefsProvider initialPrefs={prefs} deviceZone={device}>
      {/* Runs before the page below paints: applies the saved prefs (they may
          differ from the cookie the <head> script used, e.g. changed on
          another phone) and refreshes that cookie. */}
      <InlineScript html={appLayoutPrefsScript(prefs)} />
      <div className="flex min-h-svh flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-2xl items-center gap-3 px-4">
            <Link href="/" className="flex h-11 items-center font-semibold">
              Spine
            </Link>
            <div className="ml-auto min-w-0">
              <UserMenu user={user} />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
      </div>
    </PrefsProvider>
  );
}
