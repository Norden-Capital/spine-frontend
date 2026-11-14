import type { Metadata } from "next";
import { IconLock, IconPalette, IconUser } from "@/components/spine-ui";
import { getDateSettings } from "@/lib/prefs-server";
import { IconTile, PageHeader, RowGroup, SpRow } from "@/components/spine-ui";
import { LogoutButton } from "@/components/auth/logout-button";
import { getMe } from "@/components/settings/settings-data";
import { SettingsProfile } from "@/components/settings/settings-profile";
import { NotificationBing } from "iconsax-react";
import { PushStatusText } from "@/components/push/notifications-settings";

export const metadata: Metadata = { title: "Settings" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

const ENTRIES = [
  {
    href: "/settings/account",
    title: "My account",
    subtitle: "Name, email, role, sign-ins",
    icon: <IconUser />,
    tone: "violet",
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    // This device's push state, read in the browser.
    subtitle: <PushStatusText />,
    icon: <NotificationBing variant="Bulk" color="currentColor" className="size-[18px]" aria-hidden />,
    tone: "red",
  },
  {
    href: "/settings/security",
    title: "Security",
    subtitle: "Password, Face ID / fingerprint",
    icon: <IconLock />,
    tone: "ink",
  },
  {
    href: "/settings/preferences",
    title: "Preferences",
    subtitle: "Theme, text size, font, dates",
    icon: <IconPalette />,
    tone: "sun",
  },
] as const;

export default async function SettingsHubPage() {
  const [me, dates] = await Promise.all([getMe("/settings"), getDateSettings()]);

  return (
    <>
      <PageHeader title="Settings" />
      {me ? <SettingsProfile me={me} dates={dates} /> : null}
      <RowGroup>
        <nav aria-label="Settings">
          {ENTRIES.map((e) => (
            <SpRow
              key={e.href}
              href={e.href}
              leading={
                <IconTile tone={e.tone} size={44}>
                  {e.icon}
                </IconTile>
              }
              title={<span className="text-[0.9375rem]">{e.title}</span>}
              subtitle={<span className="text-[0.75rem]">{e.subtitle}</span>}
              className="min-h-[60px]"
            />
          ))}
        </nav>
      </RowGroup>
      <LogoutButton />
    </>
  );
}
