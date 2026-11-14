import type { Metadata } from "next";
import { PageHeader } from "@/components/spine-ui";
import { NotificationsSettings } from "@/components/push/notifications-settings";

export const metadata: Metadata = { title: "Notifications" };

/** Settings › Notifications: push on this device (the state is read in the browser). */
export default function NotificationsPage() {
  return (
    <>
      <PageHeader back={{ href: "/settings", label: "Back to settings" }} title="Notifications" />
      <NotificationsSettings />
    </>
  );
}
