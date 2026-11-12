import type { Metadata } from "next";
import { IconAdmin, IconCalendar, IconClock, IconSuccess } from "@/components/spine-ui";
import { roleLabel } from "@/lib/roles";
import { formatDate, formatDateTime, todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { IconTile, PageHeader, RowGroup, SpBadge, SpPanel, SpRow, type SpBadgeProps } from "@/components/spine-ui";
import { AccountDetailsForm } from "@/components/settings/account-details-form";
import { getMe } from "@/components/settings/settings-data";
import { SettingsProfile, STATUS } from "@/components/settings/settings-profile";
import { LoadError, SignInsCard } from "@/components/settings/sign-ins-card";

export const metadata: Metadata = { title: "My account" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

const STATUS_TONE: Record<string, SpBadgeProps["tone"]> = { ACTIVE: "success", INVITED: "warning", DISABLED: "danger" };

function Value({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 text-[0.75rem] font-medium text-(--sp-text)">{children}</span>;
}

export default async function AccountPage() {
  const [me, dates] = await Promise.all([getMe("/settings/account"), getDateSettings()]);

  return (
    <>
      <PageHeader back={{ href: "/settings", label: "Back to settings" }} title="My account" />
      {me ? <SettingsProfile me={me} dates={dates} /> : null}

      <SpPanel title="Your details" description="Your name shows on your expenses and comments.">
        {me ? (
          <AccountDetailsForm email={me.email} firstName={me.firstName} lastName={me.lastName} />
        ) : (
          <LoadError what="Your details" />
        )}
      </SpPanel>

      {me ? (
        <RowGroup title="Account">
          <SpRow
            leading={<IconTile tone="violet"><IconAdmin /></IconTile>}
            title="Role"
            trailing={<SpBadge tone="accent">{roleLabel(me.role)}</SpBadge>}
            className="pr-[14px]"
          />
          <SpRow
            leading={<IconTile tone="green"><IconSuccess /></IconTile>}
            title="Status"
            trailing={<SpBadge tone={STATUS_TONE[me.status] ?? "neutral"}>{STATUS[me.status] ?? me.status}</SpBadge>}
            className="pr-[14px]"
          />
          <SpRow
            leading={<IconTile tone="sun"><IconCalendar /></IconTile>}
            title="Created"
            trailing={<Value>{formatDate(me.createdAt, dates)}</Value>}
            className="pr-[14px]"
          />
          <SpRow
            leading={<IconTile tone="ink"><IconClock /></IconTile>}
            title="Last login"
            trailing={<Value>{me.lastLoginAt ? formatDateTime(me.lastLoginAt, dates) : "Never"}</Value>}
            className="pr-[14px]"
          />
        </RowGroup>
      ) : (
        <SpPanel title="Account">
          <LoadError what="Your account" />
        </SpPanel>
      )}

      <SignInsCard path="/me/sign-ins" today={todayIn(dates.zone)} variant="activity" />
    </>
  );
}
