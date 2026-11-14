// Spine service worker: Web Push only (no offline cache).
// Payload from the backend (docs/push-api.md): { title, body, url, tag, unread }.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/** "2026-11-14" → "Sat 14 Nov" (the backend writes days as ISO dates). */
function niceDates(text) {
  return String(text || "").replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, (all, y, m, d) => {
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (Number.isNaN(date.getTime())) return all;
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
  });
}

function setBadge(unread) {
  if (typeof unread !== "number" || !self.navigator.setAppBadge) return Promise.resolve();
  return (unread > 0 ? self.navigator.setAppBadge(unread) : self.navigator.clearAppBadge()).catch(() => {});
}

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const url = typeof data.url === "string" && data.url.startsWith("/") && !data.url.startsWith("//") ? data.url : "/alerts";
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Spine", {
        body: niceDates(data.body),
        tag: data.tag || undefined,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        data: { url, tag: data.tag || null },
      }),
      setBadge(data.unread),
    ])
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const { url = "/alerts", tag = null } = event.notification.data || {};
  const target = new URL(url, self.location.origin);
  // The app marks the alert read when it opens (the worker has no CSRF token).
  if (tag && tag !== "spine-test") target.searchParams.set("pushAlert", tag);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        if ("navigate" in open) return open.navigate(target.href);
        return undefined;
      }
      return self.clients.openWindow(target.href);
    })()
  );
});
