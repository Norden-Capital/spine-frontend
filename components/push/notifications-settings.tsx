"use client";

import { useState } from "react";
import { BatteryEmpty, CalendarTick, Danger, Notification, NotificationBing, Refresh, Send2, type Icon as IconsaxIcon } from "iconsax-react";
import { IconLock, IconOffice, IconTile, SpButton, SpPanel } from "@/components/spine-ui";
import { api, ApiError } from "@/lib/api";
import { startPush, turnOffPush, turnOnPush, useDevice, usePushState, type PushState } from "@/lib/push";
import { cn } from "@/lib/utils";

const bulk = (Icon: IconsaxIcon, cls = "size-[20px]") => <Icon variant="Bulk" color="currentColor" className={cls} aria-hidden />;

/** "On on this phone" (green dot) / "Off on this phone" (gray): plain text, no pill. */
export function PushStatusText({ state }: { state?: PushState }) {
  const live = usePushState();
  const push = state ?? live;
  const where = `this ${useDevice().word}`;
  const on = push === "on";
  const text =
    push === "loading"
      ? "Checking…"
      : on
        ? `On on ${where}`
        : push === "denied"
          ? `Blocked on ${where}`
          : push === "unsupported"
            ? `Not possible on ${where}`
            : push === "disabled"
              ? "Not set up yet"
              : `Off on ${where}`;
  return (
    <span
      data-testid="push-status"
      data-push={push}
      className={cn("inline-flex items-center gap-[6px] font-medium", on ? "text-(--sp-success)" : "text-(--sp-text-muted)")}
    >
      <span aria-hidden className={cn("size-[7px] rounded-full", on ? "bg-(--sp-success)" : "bg-(--sp-text-muted)")} />
      {text}
    </span>
  );
}

const WHAT = [
  { icon: bulk(BatteryEmpty, "size-[16px]"), title: "Balances", text: "Empty, below the limit, runs out soon", company: true },
  { icon: bulk(CalendarTick, "size-[16px]"), title: "Repeat expenses", text: "Due tomorrow, due today", company: true },
  { icon: bulk(Danger, "size-[16px]"), title: "Budgets", text: "80% used, used up", company: false },
];

/** Settings › Notifications: this device on/off, a test, what you get. */
export function NotificationsSettings() {
  const push = usePushState();
  const [pending, setPending] = useState(false);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const { word: device, ios } = useDevice();
  const name = device === "phone" ? (ios ? "This iPhone" : "This phone") : "This computer";
  const on = push === "on";

  /** Runs a button action; it returns an error text, or null when done. */
  async function run(fn: () => Promise<{ error?: string; done?: string } | null>) {
    setPending(true);
    setNote(null);
    const r = await fn();
    setPending(false);
    setNote(r?.error ? { text: r.error, error: true } : r?.done ? { text: r.done } : null);
  }

  const turnOn = async () => {
    const error = await turnOnPush();
    return error ? { error } : null;
  };
  const turnOff = async () => {
    const error = await turnOffPush();
    return error ? { error } : { done: `Turned off on this ${device}.` };
  };
  const test = async () => {
    try {
      const r = await api<{ devices: number; sent: number }>("/push/test", { method: "POST" });
      return { done: `Test sent to ${r.sent} of ${r.devices} ${r.devices === 1 ? "device" : "devices"}.` };
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) return { error: "Too many tests. Please wait a few minutes." };
      return { error: err instanceof ApiError ? err.message : "Could not send the test. Please try again." };
    }
  };

  const text =
    push === "loading"
      ? "Checking this device…"
      : on
        ? `Every alert also comes to this ${device}, even when Spine is closed.`
        : push === "denied"
          ? ios
            ? "Notifications are blocked for Spine. Allow them in iPhone Settings › Notifications › Spine, then check again."
            : "Notifications are blocked for Spine in this browser. Allow them in the site settings, then check again."
          : push === "unsupported"
            ? ios
              ? "Open Spine from your Home Screen to get notifications (iOS 16.4 or newer)."
              : "This browser can't show notifications."
            : push === "disabled"
              ? "Notifications are not set up on the server yet. Your alerts stay in the app."
              : "Alerts stay locked until notifications are on. Turn them on to see your alerts.";

  return (
    <>
      <SpPanel>
        <div className="flex items-center gap-[12px]">
          <IconTile tone={on ? "red" : "soft"} size={44}>
            {bulk(on ? NotificationBing : Notification, "size-[18px]")}
          </IconTile>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] leading-snug font-medium text-(--sp-text)">{name}</p>
            <p className="mt-[2px] text-[0.75rem] leading-snug">
              <PushStatusText state={push} />
            </p>
          </div>
        </div>
        <p className="mt-[14px] text-[0.75rem] leading-snug text-(--sp-text-muted)">{text}</p>
        {push === "loading" || push === "unsupported" || push === "disabled" ? null : (
          <div className="mt-[16px] space-y-[8px]">
            {on ? (
              <>
                <SpButton
                  variant="secondary"
                  icon={bulk(Send2)}
                  className="w-full"
                  disabled={pending}
                  onClick={() => void run(test)}
                  data-testid="push-test"
                >
                  Send a test notification
                </SpButton>
                <SpButton
                  variant="danger"
                  className="w-full"
                  disabled={pending}
                  onClick={() => void run(turnOff)}
                  data-testid="push-turn-off"
                >
                  {`Turn off on this ${device}`}
                </SpButton>
              </>
            ) : push === "denied" ? (
              <SpButton icon={bulk(Refresh)} className="w-full" onClick={() => void startPush(true)} data-testid="push-check-again">
                Check again
              </SpButton>
            ) : (
              <SpButton
                icon={bulk(NotificationBing)}
                className="w-full"
                disabled={pending}
                onClick={() => void run(turnOn)}
                data-testid="push-turn-on"
              >
                {pending ? "Turning on…" : "Turn on notifications"}
              </SpButton>
            )}
          </div>
        )}
        {note ? (
          <p
            role={note.error ? "alert" : "status"}
            className={cn("mt-[10px] px-[4px] text-[0.75rem] leading-snug", note.error ? "text-(--sp-danger)" : "text-(--sp-text-2)")}
          >
            {note.text}
          </p>
        ) : null}
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
                  <span className="inline-flex items-center gap-[4px] text-[0.625rem] leading-[1.5] font-medium text-(--sp-text-muted) [&_svg]:size-[12px]!">
                    {w.company ? <IconOffice aria-hidden /> : <IconLock aria-hidden />}
                    {w.company ? "Company" : "Private"}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </SpPanel>

      <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
        Set per {device}: turn them on again on each phone or computer you use. Company alerts go to everyone in the company.
        Private alerts go only to you.
      </p>
    </>
  );
}
