"use client";

import { useState, type ReactNode } from "react";
import { AddSquare, Export, Mobile, Notification, NotificationBing, Refresh, Setting2, type Icon as IconsaxIcon } from "iconsax-react";
import { EmptyState, SpButton, SpPanel, SpineLogo } from "@/components/spine-ui";
import { startPush, turnOnPush, useDevice, usePushState } from "@/lib/push";

const bulk = (Icon: IconsaxIcon, cls = "size-[20px]") => <Icon variant="Bulk" color="currentColor" className={cls} aria-hidden />;

/** Numbered steps in a panel; the icon shows the button to look for. */
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

/** Push on this phone (or no push on the server): the alerts. Otherwise the "turn on" screen, no list. */
export function AlertsGate({ unread, title, children }: { unread: number; title: ReactNode; children: ReactNode }) {
  const push = usePushState();
  if (push === "on" || push === "disabled") return <>{children}</>;
  return (
    <div className="flex flex-1 flex-col gap-4" data-testid="alerts-gate" data-push={push}>
      {title}
      {push === "loading" ? null : <TurnOnScreen push={push} unread={unread} />}
    </div>
  );
}

function TurnOnScreen({ push, unread }: { push: "unsupported" | "denied" | "off"; unread: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ios } = useDevice();

  async function turnOn() {
    setPending(true);
    setError(null);
    setError(await turnOnPush());
    setPending(false);
  }

  const text =
    push === "unsupported"
      ? ios
        ? "Notifications only work when Spine is opened from your Home Screen."
        : "This browser can't show notifications. Open Spine in Chrome, Edge, Firefox or Safari."
      : push === "denied"
        ? ios
          ? "Notifications are blocked for Spine on this phone. Allow them in your iPhone Settings."
          : "Notifications are blocked for Spine in this browser. Allow them in the site settings."
        : "So you never miss a payment or an empty balance.";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[16px] pb-[24px]">
      <EmptyState
        className="w-full py-[24px]"
        icon={bulk(push === "unsupported" ? Mobile : push === "denied" ? Notification : NotificationBing, "size-[26px]")}
        tone="accent"
        title="Turn on notifications to see your alerts"
        text={text}
        action={
          push === "off" ? (
            <SpButton
              icon={bulk(NotificationBing)}
              className="w-full min-w-[260px]"
              onClick={() => void turnOn()}
              disabled={pending}
              data-testid="push-turn-on"
            >
              {pending ? "Turning on…" : "Turn on notifications"}
            </SpButton>
          ) : undefined
        }
      />

      {push === "off" ? (
        <p className="-mt-[4px] max-w-[280px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
          {unread > 0 ? `${unread} ${unread === 1 ? "alert is" : "alerts are"} waiting. ` : ""}
          {ios ? "Your iPhone will ask you once: tap Allow." : "Your browser will ask you once: click Allow."}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="max-w-[300px] text-center text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      ) : null}

      {push === "unsupported" && ios ? (
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

      {push === "denied" ? (
        <>
          <Steps
            title="Allow notifications again"
            steps={
              ios
                ? [
                    { text: <>Open your iPhone <b className="font-semibold">Settings</b>.</>, icon: bulk(Setting2) },
                    { text: <>Tap <b className="font-semibold">Notifications</b>, then <b className="font-semibold">Spine</b>.</>, icon: bulk(Notification) },
                    { text: <>Turn on <b className="font-semibold">Allow Notifications</b>.</> },
                    { text: <>Come back here and tap <b className="font-semibold">Check again</b>.</> },
                  ]
                : [
                    { text: <>Click the icon left of the address bar (site settings).</>, icon: bulk(Setting2) },
                    { text: <>Set <b className="font-semibold">Notifications</b> to <b className="font-semibold">Allow</b>.</>, icon: bulk(Notification) },
                    { text: <>Come back here and click <b className="font-semibold">Check again</b>.</> },
                  ]
            }
          />
          <SpButton icon={bulk(Refresh)} className="w-full" onClick={() => void startPush(true)} data-testid="push-check-again">
            Check again
          </SpButton>
        </>
      ) : null}
    </div>
  );
}
