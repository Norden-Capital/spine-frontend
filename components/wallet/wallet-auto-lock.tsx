"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const isWallet = (path: string | null) => path === "/wallet" || Boolean(path?.startsWith("/wallet/"));

function xsrfToken(): string {
  const part = document.cookie.split("; ").find((p) => p.startsWith("XSRF-TOKEN="));
  return part ? decodeURIComponent(part.slice("XSRF-TOKEN=".length)) : "";
}

/**
 * Lock the private wallet on the server (same endpoint as the Lock button).
 * `keepalive` lets the request finish while the page is going away (iPhone
 * too); sendBeacon can't send the CSRF header, so plain fetch is used.
 */
function lockWallet() {
  try {
    void fetch("/api/wallet/lock", {
      method: "POST",
      credentials: "same-origin",
      keepalive: true,
      headers: { "X-XSRF-TOKEN": xsrfToken() },
    }).catch(() => {});
  } catch {
    // Nothing else to do: the 15-minute idle lock still applies.
  }
}

/**
 * The wallet locks as soon as you leave it:
 * - going from a /wallet page to any other page (dock, menu, back, links, alerts);
 * - the app going to the background or the page closing while on a wallet page.
 * Moving between wallet pages does not lock. When a wallet page comes back
 * (from the background or the back/forward cache) it is checked again, so
 * the PIN screen shows instead of old wallet data.
 */
export function WalletAutoLock() {
  const pathname = usePathname();
  const router = useRouter();
  const prev = useRef(pathname);
  const lockedInBackground = useRef(false);
  const lockedOnLeave = useRef(false);

  useEffect(() => {
    const was = isWallet(prev.current);
    const now = isWallet(pathname);
    prev.current = pathname;
    if (was && !now) {
      // Left the wallet for another page.
      lockWallet();
      lockedOnLeave.current = true;
    } else if (!was && now && lockedOnLeave.current) {
      // Back in the wallet (e.g. the back button): the router may still hold
      // the old wallet page, so ask the server again -> PIN screen.
      lockedOnLeave.current = false;
      router.refresh();
    }
  }, [pathname, router]);

  useEffect(() => {
    const onHide = () => {
      if (!isWallet(window.location.pathname)) return;
      lockWallet();
      lockedInBackground.current = true;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHide();
      else if (lockedInBackground.current && isWallet(window.location.pathname)) {
        lockedInBackground.current = false;
        // Ask the server again: the wallet layout now shows the PIN screen.
        router.refresh();
      }
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // Restored from the back/forward cache: never show the old wallet page.
      if (e.persisted && isWallet(window.location.pathname)) window.location.reload();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
