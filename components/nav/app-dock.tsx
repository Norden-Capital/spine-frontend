"use client";

import { usePathname } from "next/navigation";
import { IconAdmin, IconExpenses, IconHome, IconSettings, IconWallet } from "@/components/spine-ui";
import { createContext, use, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { DOCK_SPACE_CLASS, FloatingDock, type DockItem } from "@/components/spine-ui";
import { hasSkeleton, OwnerContext, RouteSkeleton } from "@/components/nav/route-skeleton";

/** Add / edit forms hide the dock: their Save button sits in a bottom bar instead. */
export function isFormPath(pathname: string): boolean {
  return /^\/(wallet\/)?transactions\/(new|[^/]+\/edit)\/?$/.test(pathname);
}

/* ------------------------------------------------------------------ tap feedback
 *
 * Why: the app pages wait for the server on purpose (session check, no data
 * flash). Next can only show a loading.tsx skeleton at once if it already
 * knows the new page from a prefetch. With no finished prefetch (always in
 * `next dev`, and on a slow phone network or before the prefetch is done in
 * production) the router waits for the server's answer first: the old page
 * stays, with no feedback, for the whole server time.
 *
 * Fix: when a Next <Link> starts a navigation to another page, we show that
 * page's skeleton ourselves (the same one loading.tsx uses) after a short
 * delay, and move the dock to the tapped item. As soon as the URL changes,
 * Next's own loading.tsx or the real page takes over. Only gray blocks:
 * the session check in the layouts still runs first, before any data.
 */

/** Wait this long before showing the skeleton: a fast navigation shows no flash. */
const SHOW_AFTER_MS = 80;
/** If the navigation never happens (error, cancelled), show the page again. */
const GIVE_UP_MS = 15_000;

/** The page the user just tapped while it loads, else null. */
const PendingPathContext = createContext<string | null>(null);

/** Where the user is, or is going (right after a tap). */
function useShownPath(): string {
  const pathname = usePathname();
  return use(PendingPathContext) ?? pathname;
}

/**
 * Watches link taps for the whole app area (top bar, page, dock).
 * `owner`: only the owner gets Admin skeletons (members have no Admin area).
 */
export function NavPending({ owner, children }: { owner: boolean; children: ReactNode }) {
  const pathname = usePathname();
  // `from`: the page we were on. When the URL changes the pending tap is over
  // (no state reset needed: it simply no longer matches).
  const [pending, setPending] = useState<{ to: string; from: string } | null>(null);
  const here = useRef(pathname);
  useEffect(() => {
    here.current = pathname;
  }, [pathname]);

  useEffect(() => {
    let showTimer: number | undefined;
    let giveUpTimer: number | undefined;
    // Bubble phase on window: runs after React's handlers, so a click that a
    // Next <Link> turned into a client navigation is already defaultPrevented.
    const onClick = (e: MouseEvent) => {
      if (!e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(link instanceof HTMLAnchorElement) || (link.target && link.target !== "_self") || link.hasAttribute("download")) {
        return;
      }
      const url = new URL(link.href, window.location.href);
      const from = here.current;
      // Same page (month / filter change, hash): it stays, no skeleton.
      if (url.origin !== window.location.origin || url.pathname === from || !hasSkeleton(url.pathname, owner)) return;
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
      showTimer = window.setTimeout(() => {
        if (here.current !== from) return; // already there
        setPending({ to: url.pathname, from });
        window.scrollTo(0, 0);
      }, SHOW_AFTER_MS);
      giveUpTimer = window.setTimeout(() => setPending(null), GIVE_UP_MS);
    };
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("click", onClick);
      window.clearTimeout(showTimer);
      window.clearTimeout(giveUpTimer);
    };
  }, [owner]);

  const to = pending && pending.from === pathname ? pending.to : null;
  return (
    <OwnerContext value={owner}>
      <PendingPathContext value={to}>{children}</PendingPathContext>
    </OwnerContext>
  );
}

/**
 * The page area: bottom space for the dock, except on form pages (no dock
 * there). Shows the tapped page's skeleton while it loads, and plays the
 * short page-change motion (app/globals.css, "Motion") when the page changes.
 * Only <main> moves: the top bar and the dock stay still.
 */
export function AppMain({ children }: { children: ReactNode }) {
  const pending = use(PendingPathContext);
  const shown = useShownPath();
  const ref = useRef<HTMLElement>(null);
  const lastShown = useRef(shown);

  // Page changed (tap skeleton shown, or new URL without one): restart the
  // CSS animation. Skeleton -> real page of the same path does not replay it.
  useLayoutEffect(() => {
    if (lastShown.current === shown) return;
    lastShown.current = shown;
    const el = ref.current;
    if (!el) return;
    el.removeAttribute("data-sp-enter");
    void el.offsetWidth; // restart the animation
    el.setAttribute("data-sp-enter", "");
  }, [shown]);

  return (
    <main
      ref={ref}
      aria-busy={pending ? true : undefined}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) e.currentTarget.removeAttribute("data-sp-enter");
      }}
      className={`relative flex-1 pt-[17.5px] ${isFormPath(shown) ? "" : DOCK_SPACE_CLASS}`}
    >
      {/* The old page stays mounted (its state is kept), only hidden. */}
      <div className={pending ? "hidden" : "contents"}>{children}</div>
      {pending ? <RouteSkeleton path={pending} /> : null}
    </main>
  );
}

/**
 * The floating dock (Design kit): Home · Transactions · Wallet · Settings,
 * plus Admin for the owner (members: no Admin item). The active item shows
 * its label; it moves to the tapped item right away.
 */
export function AppDock({ owner }: { owner: boolean }) {
  const pathname = useShownPath();
  if (isFormPath(pathname)) return null;
  const items: DockItem[] = [
    { href: "/", label: "Home", icon: <IconHome />, active: pathname === "/" },
    {
      href: "/transactions",
      label: "Expenses",
      icon: <IconExpenses />,
      active: pathname.startsWith("/transactions"),
    },
    { href: "/wallet", label: "Wallet", icon: <IconWallet />, active: pathname.startsWith("/wallet") },
    { href: "/settings", label: "Settings", icon: <IconSettings />, active: pathname.startsWith("/settings") },
    ...(owner
      ? [{ href: "/admin/users", label: "Admin", icon: <IconAdmin />, active: pathname.startsWith("/admin") }]
      : []),
  ];
  return <FloatingDock items={items} />;
}
