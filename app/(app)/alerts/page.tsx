import type { Metadata } from "next";
import { getAlerts } from "@/lib/alerts-server";
import { AlertsList } from "@/components/alerts/alerts-list";
import { AlertsGate } from "@/components/push/alerts-gate";
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
  // Forced opt-in: with notifications off on this device, no list (only the "turn on" screen).
  return (
    <AlertsGate
      unread={alerts.unreadCount}
      title={<h1 className="text-[1.375rem] leading-snug font-medium text-(--sp-text)">Alerts</h1>}
    >
      <AlertsList items={alerts.items} unread={alerts.unreadCount} />
    </AlertsGate>
  );
}
