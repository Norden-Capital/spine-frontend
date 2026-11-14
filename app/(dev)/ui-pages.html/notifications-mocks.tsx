"use client";

// Push notifications module — DESIGN MOCKS ONLY (dev). Fake data, "today" = Sat 14 Nov 2026.
// Not wired to the app. Screens: forced opt-in (off / can't push / blocked),
// alerts list (on), Settings › Notifications (hub, on, off), the bell,
// and the iPhone lock screen. No shared kit file is changed.

import type { ReactNode } from "react";
import {
  AddSquare,
  BatteryEmpty,
  CalendarTick,
  Danger,
  Export,
  Mobile,
  Notification,
  NotificationBing,
  Refresh,
  Send2,
  Setting2,
  type Icon as IconsaxIcon,
} from "iconsax-react";
import {
  AlertRow,
  Avatar,
  DueBadge,
  EmptyState,
  FloatingDock,
  IconLock,
  IconOffice,
  IconPalette,
  IconSuccess,
  IconTile,
  IconUser,
  IconWarning,
  PageHeader,
  RowGroup,
  SectionCard,
  SpButton,
  SpPanel,
  SpRow,
  SpineLogo,
  TopBar,
  type DockItem,
} from "@/components/spine-ui";
import { cn } from "@/lib/utils";
import { I } from "./icon-set";

/* ---------- frame (same as the live app) ---------- */

function dock(active: "home" | "settings" = "home"): DockItem[] {
  return [
    { href: "#home", label: "Home", icon: <I.House />, activeIcon: <I.House fill="currentColor" />, active: active === "home" },
    { href: "#expenses", label: "Expenses", icon: <I.ArrowLeftRight /> },
    { href: "#wallet", label: "Wallet", icon: <I.Wallet /> },
    { href: "#settings", label: "Settings", icon: <I.Settings />, active: active === "settings" },
  ];
}

/** The live top bar: logo left, bell with the unread count, avatar. */
function Top({ unread = 3, ring }: { unread?: number; ring?: boolean }) {
  return (
    <TopBar
      left={
        <span className="flex size-[44px] items-center justify-center rounded-[12px] bg-(--sp-panel) text-(--sp-text)">
          <SpineLogo className="size-[20px]" />
        </span>
      }
      right={
        <>
          <span
            className={cn(
              "relative inline-flex size-[44px] items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text)",
              ring && "ring-2 ring-(--sp-card-front) ring-offset-2 ring-offset-(--sp-bg)"
            )}
            aria-label={unread > 0 ? `Alerts, ${unread} unread` : "Alerts"}
          >
            <I.Bell className="size-[18px]" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--sp-card-front) px-1 text-[10px] leading-snug font-semibold text-white ring-2 ring-(--sp-bg)">
                {unread}
              </span>
            )}
          </span>
          <Avatar name="Sam Tremblay" />
        </>
      }
    />
  );
}

function Page({ children, fill, active, ring }: { children: ReactNode; fill?: boolean; active?: "home" | "settings"; ring?: boolean }) {
  return (
    <>
      <Top ring={ring} />
      <div className={cn("mt-[16px] space-y-[16px]", fill && "flex flex-1 flex-col")}>{children}</div>
      <div className="pointer-events-none sticky bottom-(--sp-dock-gap) z-10 mt-auto flex justify-center pt-[24px] pb-[9px]">
        <FloatingDock position="static" items={dock(active)} />
      </div>
    </>
  );
}

const bulk = (Icon: IconsaxIcon, cls = "size-[20px]") => <Icon variant="Bulk" color="currentColor" className={cls} />;

/** Alerts title row, like the live page (no "Mark all read" while locked). */
function AlertsTitle({ readAll }: { readAll?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <h1 className="text-[1.375rem] leading-snug font-medium text-(--sp-text)">Alerts</h1>
      {readAll ? (
        <SpButton variant="secondary" size="md" icon={<IconSuccess aria-hidden />}>
          Mark all read
        </SpButton>
      ) : null}
    </div>
  );
}

/** Numbered steps (plain list in a panel). The icon shows the button to look for. */
function Steps({ title, steps }: { title: string; steps: { text: ReactNode; icon?: ReactNode }[] }) {
  return (
    <SpPanel title={title} className="w-full text-left">
      <ol className="space-y-[12px]">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-[12px]">
            <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-[0.75rem] leading-[1.5] font-semibold text-(--sp-text) tabular-nums">
              {i + 1}
            </span>
            <p className="mt-[2px] min-w-0 flex-1 text-[0.8125rem] leading-snug text-(--sp-text)">{s.text}</p>
            {s.icon ? <span className="mt-[1px] shrink-0 text-(--sp-card-front)">{s.icon}</span> : null}
          </li>
        ))}
      </ol>
    </SpPanel>
  );
}

/* ---------- 1–3. forced opt-in ---------- */

type Gate = "off" | "unsupported" | "denied";

/**
 * Alerts with push not on: NO alert list. Full-height screen, centred in the
 * free space (like PageEmpty). The bell count still shows in the top bar.
 */
export function AlertsGate({ gate }: { gate: Gate }) {
  const icon =
    gate === "unsupported" ? bulk(Mobile, "size-[26px]") : gate === "denied" ? bulk(Notification, "size-[26px]") : bulk(NotificationBing, "size-[26px]");
  const text =
    gate === "unsupported"
      ? "Notifications only work when Spine is opened from your Home Screen."
      : gate === "denied"
        ? "Notifications are blocked for Spine on this phone. Allow them in your iPhone Settings."
        : "So you never miss a payment or an empty balance.";

  return (
    <Page fill>
      <AlertsTitle />
      <div className="flex flex-1 flex-col items-center justify-center gap-[16px]">
        <EmptyState
          className="w-full py-[24px]"
          icon={icon}
          tone="accent"
          title="Turn on notifications to see your alerts"
          text={text}
          action={
            gate === "off" ? (
              <SpButton icon={bulk(NotificationBing, "size-[20px]")} className="w-full min-w-[260px]">
                Turn on notifications
              </SpButton>
            ) : undefined
          }
        />

        {gate === "off" ? (
          <p className="-mt-[4px] max-w-[280px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            3 alerts are waiting. Your iPhone will ask you once: tap Allow.
          </p>
        ) : null}

        {gate === "unsupported" ? (
          <>
            <Steps
              title="Add Spine to your Home Screen"
              steps={[
                { text: <>In Safari, tap <b className="font-semibold">Share</b> at the bottom.</>, icon: bulk(Export) },
                { text: <>Tap <b className="font-semibold">Add to Home Screen</b>, then Add.</>, icon: bulk(AddSquare) },
                { text: <>Open Spine from the new icon on your Home Screen.</>, icon: <SpineLogo className="size-[20px]" /> },
                { text: <>Come back to Alerts and tap <b className="font-semibold">Turn on notifications</b>.</>, icon: bulk(NotificationBing) },
              ]}
            />
            <p className="max-w-[300px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
              Needs iOS 16.4 or newer. Older iPhone? Update it in Settings › General › Software Update.
            </p>
          </>
        ) : null}

        {gate === "denied" ? (
          <>
            <Steps
              title="Allow notifications again"
              steps={[
                { text: <>Open your iPhone <b className="font-semibold">Settings</b>.</>, icon: bulk(Setting2) },
                { text: <>Tap <b className="font-semibold">Notifications</b>, then <b className="font-semibold">Spine</b>.</>, icon: bulk(Notification) },
                { text: <>Turn on <b className="font-semibold">Allow Notifications</b>.</> },
                { text: <>Come back here and tap <b className="font-semibold">Check again</b>.</> },
              ]}
            />
            <SpButton icon={bulk(Refresh)} className="w-full">
              Check again
            </SpButton>
          </>
        ) : null}
      </div>
    </Page>
  );
}

/* ---------- 4. alerts, notifications on ---------- */

/** "Company" (building) or "Private" (lock): gray text with its icon, no background (as live). */
function Scope({ company }: { company?: boolean }) {
  return (
    <span className="inline-flex items-center gap-[4px] text-[0.625rem] leading-[1.5] font-medium text-(--sp-text-muted) [&_svg]:size-[12px]">
      {company ? <IconOffice aria-hidden /> : <IconLock aria-hidden />}
      {company ? "Company" : "Private"}
    </span>
  );
}

/** Scope icon before the title (user edit): building = Company, lock = Private. Text only for screen readers. */
const scopeIcon = (company?: boolean) => (company ? <IconOffice aria-hidden /> : <IconLock aria-hidden />);

function Row({ children, company, due }: { children: ReactNode; company?: boolean; due?: ReactNode }) {
  return (
    <li>
      <span className="sr-only">{company ? "Company" : "Private"}</span>
      {children}
      {due ? <div className="-mt-[2px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] pb-[8px] pl-[57.8px]">{due}</div> : null}
    </li>
  );
}

export function AlertsOn() {
  return (
    <Page>
      <AlertsTitle readAll />
      <SectionCard title="Latest">
        <ul className="flex flex-col">
          <Row company>
            <AlertRow titleIcon={scopeIcon(true)} unread tone="danger" icon={<IconWarning aria-hidden />} title="Twilio SMS is below $25" message="About $18.40 left. Your limit is $25.00." time="Today 9:00" href="#twilio" />
          </Row>
          <Row company due={<DueBadge state="today" label="Due today" />}>
            <AlertRow titleIcon={scopeIcon(true)} unread tone="warning" icon={bulk(CalendarTick, "size-[15px]")} title="Internet Bill is due today" message="$55.00 · Rogers. Tap to add it." time="Today 8:00" href="#internet" />
          </Row>
          <Row>
            <AlertRow titleIcon={scopeIcon(false)} unread tone="danger" icon={<IconWarning aria-hidden />} title="Budget used up" message="Meals: you used $400.00 of $400.00 in November." time="Today 7:45" href="#budget" />
          </Row>
          <Row company>
            <AlertRow titleIcon={scopeIcon(true)} tone="danger" icon={bulk(BatteryEmpty, "size-[15px]")} title="Mailgun is empty" message="Spine guesses $0.00 since Thu 12 Nov." time="12 Nov" href="#mailgun" />
          </Row>
        </ul>
      </SectionCard>
    </Page>
  );
}

/* ---------- 5. settings ---------- */

/** Status as plain coloured text with a dot (no pill). */
function OnOff({ on }: { on: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-[6px] font-medium", on ? "text-(--sp-success)" : "text-(--sp-text-muted)")}>
      <span aria-hidden className={cn("size-[7px] rounded-full", on ? "bg-(--sp-success)" : "bg-(--sp-text-muted)")} />
      {on ? "On on this phone" : "Off on this phone"}
    </span>
  );
}

export function SettingsHub() {
  const rows: { title: string; subtitle: ReactNode; icon: ReactNode; tone: "violet" | "ink" | "sun" | "red" }[] = [
    { title: "My account", subtitle: "Name, email, role, sign-ins", icon: <IconUser />, tone: "violet" },
    { title: "Notifications", subtitle: <OnOff on />, icon: bulk(NotificationBing, "size-[18px]"), tone: "red" },
    { title: "Security", subtitle: "Password, Face ID / fingerprint", icon: <IconLock />, tone: "ink" },
    { title: "Preferences", subtitle: "Theme, text size, font, dates", icon: <IconPalette />, tone: "sun" },
  ];
  return (
    <Page active="settings">
      <PageHeader title="Settings" />
      <RowGroup>
        <nav aria-label="Settings">
          {rows.map((r) => (
            <SpRow
              key={r.title}
              href="#"
              leading={
                <IconTile tone={r.tone} size={44}>
                  {r.icon}
                </IconTile>
              }
              title={<span className="text-[0.9375rem]">{r.title}</span>}
              subtitle={<span className="text-[0.75rem]">{r.subtitle}</span>}
              className="min-h-[60px]"
            />
          ))}
        </nav>
      </RowGroup>
    </Page>
  );
}

const WHAT = [
  { icon: bulk(BatteryEmpty, "size-[16px]"), title: "Balances", text: "Empty, below the limit, runs out soon", company: true },
  { icon: bulk(CalendarTick, "size-[16px]"), title: "Repeat expenses", text: "Due tomorrow, due today", company: true },
  { icon: bulk(Danger, "size-[16px]"), title: "Budgets", text: "80% used, used up", company: false },
];

export function SettingsNotifications({ on }: { on: boolean }) {
  return (
    <Page active="settings">
      <PageHeader back={{ href: "#settings", label: "Back to settings" }} title="Notifications" />

      <SpPanel>
        <div className="flex items-center gap-[12px]">
          <IconTile tone={on ? "red" : "soft"} size={44}>
            {bulk(on ? NotificationBing : Notification, "size-[18px]")}
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] leading-snug font-medium text-(--sp-text)">This iPhone</p>
            <p className="mt-[2px] text-[0.75rem] leading-snug">
              <OnOff on={on} />
            </p>
          </div>
        </div>
        <p className="mt-[14px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
          {on
            ? "Every alert also comes to this phone, even when Spine is closed."
            : "Alerts stay locked until notifications are on. Turn them on to see your alerts."}
        </p>
        <div className="mt-[16px] space-y-[8px]">
          {on ? (
            <>
              <SpButton variant="secondary" icon={bulk(Send2, "size-[20px]")} className="w-full">
                Send a test notification
              </SpButton>
              <SpButton variant="danger" className="w-full">
                Turn off on this phone
              </SpButton>
            </>
          ) : (
            <SpButton icon={bulk(NotificationBing, "size-[20px]")} className="w-full">
              Turn on notifications
            </SpButton>
          )}
        </div>
      </SpPanel>

      <SpPanel title="What you get">
        <ul className="space-y-[14px]">
          {WHAT.map((w) => (
            <li key={w.title} className="flex items-start gap-[12px]">
              <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text)">{w.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] leading-snug font-medium text-(--sp-text)">{w.title}</p>
                <p className="mt-[2px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">{w.text}</p>
                <p className="mt-[4px] flex">
                  <Scope company={w.company} />
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SpPanel>

      <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        Set per phone: turn them on again on each phone or computer you use. Company alerts go to everyone in the company. Private alerts go only to you.
      </p>
    </Page>
  );
}

/* ---------- 6. the bell ---------- */

export function BellMock() {
  return (
    <Page ring>
      <div className="rounded-(--sp-radius) border border-dashed border-(--sp-text-faint) px-[14px] py-[12px]">
        <p className="text-[0.8125rem] leading-snug font-medium text-(--sp-text)">Design note: the bell</p>
        <ul className="mt-[8px] list-disc space-y-[4px] pl-[18px] text-[0.75rem] leading-snug text-(--sp-text-2)">
          <li>The count shows as now (3 unread), on or off.</li>
          <li>Tap with notifications on: the Alerts list.</li>
          <li>Tap with notifications off: the “Turn on notifications” screen. No list.</li>
          <li>The phone icon badge (on the Home Screen) shows the same count, when on.</li>
        </ul>
      </div>
      <p className="px-[4px] text-[0.75rem] leading-snug text-(--sp-text-muted)">(The rest of Home stays as it is.)</p>
    </Page>
  );
}

/* ---------- 7. iPhone lock screen ---------- */

type Push = { body: string; detail: string; time: string; opens: string; company: boolean };

const PUSHES: Push[] = [
  { body: "Twilio SMS is below $25", detail: "About $18.40 left. Your limit is $25.00.", time: "now", opens: "Balances › Twilio SMS", company: true },
  { body: "Internet Bill is due today", detail: "$55.00 · Rogers. Tap to add it.", time: "8:00", opens: "Repeat › Internet Bill (add it)", company: true },
  { body: "Budget used up", detail: "Meals: you used $400.00 of $400.00 in November.", time: "7:45", opens: "Wallet › Budgets › Meals", company: false },
];

/** One iOS notification banner (system look, not our kit): app icon, title, time, body. */
function Banner({ p }: { p: Push }) {
  return (
    <div className="flex items-start gap-[10px] rounded-[22px] bg-white/72 px-[12px] py-[11px] text-black shadow-[0_1px_2px_rgb(0_0_0/.08)] backdrop-blur-xl [#mock.dark_&]:bg-[rgb(30_30_32/.78)] [#mock.dark_&]:text-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/apple-touch-icon.png" alt="" className="size-[38px] shrink-0 rounded-[9px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-[8px]">
          <p className="text-[15px] leading-[1.3] font-semibold">Spine</p>
          <p className="text-[13px] leading-[1.3] opacity-55">{p.time}</p>
        </div>
        <p className="text-[15px] leading-[1.3]">{p.body}</p>
        <p className="text-[15px] leading-[1.3] opacity-80">{p.detail}</p>
      </div>
    </div>
  );
}

export function LockScreen() {
  return (
    <>
      <div className="-mx-(--sp-gutter) -mt-[12px] flex min-h-[700px] flex-col bg-[linear-gradient(160deg,#3b1a63_0%,#7121a8_45%,#e0a3ff_100%)] px-[10px] pb-[24px] [#mock.dark_&]:bg-[linear-gradient(160deg,#0d0614_0%,#3d1361_55%,#7121a8_100%)]">
        <div className="flex items-center justify-between px-[22px] pt-[14px] text-[15px] font-semibold text-white">
          <span>9:41</span>
          <span className="flex items-center gap-[6px] text-[12px]">
            <IconLock aria-hidden className="size-[14px]" />
          </span>
        </div>
        <p className="mt-[28px] text-center text-[19px] leading-[1.3] font-medium text-white/90">Saturday 14 November</p>
        <p className="text-center text-[84px] leading-[1.1] font-semibold tracking-tight text-white">9:41</p>
        <div className="mt-auto space-y-[8px] pt-[48px]">
          {PUSHES.map((p) => (
            <Banner key={p.body} p={p} />
          ))}
        </div>
      </div>

      <SpPanel title="Tap a notification" className="mt-[16px]" description="Face ID unlocks, Spine opens on that alert's page. The alert is marked read.">
        <ul className="space-y-[12px]">
          {PUSHES.map((p) => (
            <li key={p.body} className="flex items-start gap-[12px]">
              <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[15px]">
                {p.company ? <IconOffice aria-hidden /> : <IconLock aria-hidden />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.8125rem] leading-snug font-medium text-(--sp-text)">{p.body}</p>
                <p className="mt-[2px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
                  {p.company ? "Company: everyone gets it" : "Private: only you"} · opens {p.opens}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SpPanel>
      <div className="h-[24px]" />
    </>
  );
}

/* ---------- registry ---------- */

export const NOTIFICATION_MOCKS: Record<string, () => ReactNode> = {
  "notif-1-alerts-off": () => <AlertsGate gate="off" />,
  "notif-2-alerts-unsupported": () => <AlertsGate gate="unsupported" />,
  "notif-3-alerts-blocked": () => <AlertsGate gate="denied" />,
  "notif-4-alerts-on": () => <AlertsOn />,
  "notif-5-settings-hub": () => <SettingsHub />,
  "notif-5-settings-on": () => <SettingsNotifications on />,
  "notif-5-settings-off": () => <SettingsNotifications on={false} />,
  "notif-6-bell": () => <BellMock />,
  "notif-7-lock-screen": () => <LockScreen />,
};
