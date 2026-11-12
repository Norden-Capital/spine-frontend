import type { Metadata } from "next";
import { getAlerts } from "@/lib/alerts-server";
import { AlertsList } from "@/components/alerts/alerts-list";
import { EmptyState, IconWarning } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Alerts" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function AlertsPage() {
  const alerts = await getAlerts();
  if (!alerts) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<IconWarning aria-hidden />}
        title="Alerts could not be loaded"
        text="Please try again later."
      />
    );
  }
  return <AlertsList items={alerts.items} unread={alerts.unreadCount} />;
}
