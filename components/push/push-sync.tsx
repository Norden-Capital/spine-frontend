"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { showBadge, startPush, usePushState } from "@/lib/push";

/**
 * In the app layout, no UI. On load: checks push on this device (and sends a
 * subscription the server lost again), keeps the Home Screen badge = unread,
 * and marks an alert read when it was opened from a notification
 * (the service worker adds ?pushAlert=<id> to the link).
 */
export function PushSync({ unread }: { unread: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const push = usePushState();

  useEffect(() => {
    void startPush();
  }, []);

  useEffect(() => {
    if (push === "on") showBadge(unread);
  }, [push, unread]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const id = url.searchParams.get("pushAlert");
    if (!id) return;
    url.searchParams.delete("pushAlert");
    // Through the router (a plain history.replaceState is put back on the next refresh).
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
    api(`/alerts/${encodeURIComponent(id)}/read`, { method: "POST" })
      .then(() => router.refresh())
      .catch(() => {});
  }, [pathname, router]);

  return null;
}
