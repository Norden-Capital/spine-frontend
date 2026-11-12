import type { Metadata } from "next";
import { getAlerts } from "@/lib/alerts-server";
import { AlertsList } from "@/components/alerts/alerts-list";

export const metadata: Metadata = { title: "Alerts" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function AlertsPage() {
  const alerts = await getAlerts();
  if (!alerts) {
    return (
      <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
        Alerts could not be loaded. Please try again later.
      </p>
    );
  }
  return <AlertsList items={alerts.items} unread={alerts.unreadCount} />;
}
