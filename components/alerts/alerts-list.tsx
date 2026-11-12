"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconBell, IconCalendarRepeat, IconRepeat, IconSuccess, IconWarning } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import type { Alert } from "@/lib/alerts-server";
import { useDates } from "@/components/prefs/prefs-provider";
import { Button } from "@/components/ui/button";
import { AlertRow, DueBadge, SectionCard, type AlertTone } from "@/components/spine-ui";
import { todayIn } from "@/lib/prefs";
import { dueState } from "@/lib/repeat-schedule";

const ICONS: Record<string, React.ReactNode> = {
  BUDGET_80: <IconWarning aria-hidden />,
  BUDGET_100: <IconWarning aria-hidden />,
  RECURRING_CREATED: <IconRepeat aria-hidden />,
  RECURRING_DUE_TOMORROW: <IconCalendarRepeat aria-hidden />,
  // Company repeat expense due: link "/recurring/due/<occurrenceId>".
  COMPANY_RECURRING_DUE: <IconCalendarRepeat aria-hidden />,
};

const TONES: Record<string, AlertTone> = {
  BUDGET_80: "warning",
  BUDGET_100: "danger",
  RECURRING_CREATED: "success",
  RECURRING_DUE_TOMORROW: "info",
  COMPANY_RECURRING_DUE: "warning",
};

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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-[22px] font-medium text-(--sp-text)">Alerts</h1>
        {(count > 0 || unread > 0) && (
          <Button variant="ghost" size="lg" className="h-11" onClick={() => void readAll()} disabled={busy}>
            <IconSuccess aria-hidden />
            Mark all read
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {list.length === 0 ? (
        <PageEmpty icon={<IconBell />} title="No alerts" text="Budget and recurring alerts show here." />
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
                {due && (
                  <div className="-mt-[2px] pb-[8px] pl-[57.8px]" data-testid="alert-due-badge">
                    <DueBadge state={due.state} label={due.label} />
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
