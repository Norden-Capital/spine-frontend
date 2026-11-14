"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BatteryEmpty, EmptyWalletTime } from "iconsax-react";
import { IconBell, IconCalendarRepeat, IconLock, IconOffice, IconRepeat, IconSuccess, IconWarning } from "@/components/spine-ui";
import { BulkIcon } from "@/components/balances/balance-parts";
import { api, errorMessage } from "@/lib/api";
import type { Alert } from "@/lib/alerts-server";
import { useDates } from "@/components/prefs/prefs-provider";
import { AlertRow, DueBadge, SectionCard, SpButton, type AlertTone } from "@/components/spine-ui";
import { todayIn } from "@/lib/prefs";
import { dueState } from "@/lib/repeat-schedule";

const ICONS: Record<string, React.ReactNode> = {
  BUDGET_80: <IconWarning aria-hidden />,
  BUDGET_100: <IconWarning aria-hidden />,
  RECURRING_CREATED: <IconRepeat aria-hidden />,
  RECURRING_DUE_TOMORROW: <IconCalendarRepeat aria-hidden />,
  // Company repeat expense due: link "/recurring/due/<occurrenceId>".
  COMPANY_RECURRING_DUE: <IconCalendarRepeat aria-hidden />,
  // Company balances: link "/balances/<id>".
  BALANCE_EMPTY: <BulkIcon icon={BatteryEmpty} />,
  BALANCE_LOW: <IconWarning aria-hidden />,
  BALANCE_SOON: <BulkIcon icon={EmptyWalletTime} />,
};

const TONES: Record<string, AlertTone> = {
  BUDGET_80: "warning",
  BUDGET_100: "danger",
  RECURRING_CREATED: "success",
  RECURRING_DUE_TOMORROW: "info",
  COMPANY_RECURRING_DUE: "warning",
  BALANCE_EMPTY: "danger",
  BALANCE_LOW: "danger",
  BALANCE_SOON: "warning",
};

/** Company or private: the backend's `scope`, else guessed from the kind (older alerts). */
const scopeOf = (a: Alert): "COMPANY" | "PRIVATE" =>
  a.scope ?? (a.kind.startsWith("COMPANY_") || a.kind.startsWith("BALANCE_") ? "COMPANY" : "PRIVATE");

/** COMPANY_RECURRING_DUE body: "USD 1200.00 · due 2026-11-12. Tap to add it…" → "2026-11-12". */
const dueDateOf = (a: Alert) =>
  a.kind === "COMPANY_RECURRING_DUE" ? (/\bdue (\d{4}-\d{2}-\d{2})\b/.exec(a.body ?? "")?.[1] ?? null) : null;

/** Only links inside the app (the backend sends a path hint). */
const safeLink = (link: string | null) => (link && link.startsWith("/") && !link.startsWith("//") ? link : null);

/** Alerts, newest first. Tap = mark read + open the item. "Mark all read". */
export function AlertsList({ items, unread }: { items: Alert[]; unread: number }) {
  const router = useRouter();
  const dates = useDates();
  const [list, setList] = useState(items);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const count = list.filter((a) => !a.read).length;
  const today = todayIn(dates.settings.zone);

  /** The row is a link; tapping it also marks the alert read. */
  async function markRead(a: Alert) {
    if (a.read) return;
    setList((l) => l.map((x) => (x.id === a.id ? { ...x, read: true } : x)));
    try {
      await api(`/alerts/${encodeURIComponent(a.id)}/read`, { method: "POST" });
      router.refresh();
    } catch {
      // Not important enough to stop the user.
    }
  }

  async function readAll() {
    setBusy(true);
    setError(null);
    try {
      await api("/alerts/read-all", { method: "POST" });
      setList((l) => l.map((x) => ({ ...x, read: true })));
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-[12px]">
        <h1 className="text-[1.375rem] leading-snug font-medium text-(--sp-text)">Alerts</h1>
        {(count > 0 || unread > 0) && (
          <SpButton
            variant="secondary"
            size="md"
            icon={<IconSuccess aria-hidden />}
            onClick={() => void readAll()}
            disabled={busy}
          >
            Mark all read
          </SpButton>
        )}
      </div>
      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
      {list.length === 0 ? (
        <PageEmpty icon={<IconBell />} title="No alerts" text="Company and private alerts show here: balances, repeat expenses and budgets." />
      ) : (
        <SectionCard title="Latest">
          <ul className="flex flex-col">
            {list.map((a) => {
              // Unread repeat-expense reminder: how urgent it is (read = done, skipped or seen).
              const dueDate = a.read ? null : dueDateOf(a);
              const due = dueDate ? dueState(dueDate, today, { dateFormat: dates.settings.dateFormat }) : null;
              return (
              <li key={a.id} onClick={() => void markRead(a)}>
                <AlertRow
                  icon={ICONS[a.kind] ?? <IconBell aria-hidden />}
                  tone={TONES[a.kind] ?? "info"}
                  title={a.title}
                  message={a.body || undefined}
                  time={dates.dateTime(a.createdAt)}
                  unread={!a.read}
                  href={safeLink(a.link) ?? "/alerts"}
                />
                {/* Plain text under the row (no pill): Company or Private, then how urgent. */}
                <div className="-mt-[2px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] pb-[8px] pl-[57.8px]">
                  <ScopeLabel scope={scopeOf(a)} />
                  {due && (
                    <span data-testid="alert-due-badge">
                      <DueBadge state={due.state} label={due.label} />
                    </span>
                  )}
                </div>
              </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

/** "Company" (building) or "Private" (lock): gray text with its icon, no background. */
function ScopeLabel({ scope }: { scope: "COMPANY" | "PRIVATE" }) {
  const company = scope === "COMPANY";
  return (
    <span
      data-testid="alert-scope"
      data-scope={scope}
      className="inline-flex items-center gap-[4px] text-[0.625rem] leading-[1.5] font-medium text-(--sp-text-muted) [&_svg]:size-[12px]"
    >
      {company ? <IconOffice aria-hidden /> : <IconLock aria-hidden />}
      {company ? "Company" : "Private"}
    </span>
  );
}
