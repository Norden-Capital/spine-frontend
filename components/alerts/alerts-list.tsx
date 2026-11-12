"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, CalendarClock, CheckCheck, Repeat } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Alert } from "@/lib/alerts-server";
import { useDates } from "@/components/prefs/prefs-provider";
import { Button } from "@/components/ui/button";
import { AlertRow, SectionCard, type AlertTone } from "@/components/spine-ui";

const ICONS: Record<string, React.ReactNode> = {
  BUDGET_80: <AlertTriangle aria-hidden />,
  BUDGET_100: <AlertTriangle aria-hidden />,
  RECURRING_CREATED: <Repeat aria-hidden />,
  RECURRING_DUE_TOMORROW: <CalendarClock aria-hidden />,
};

const TONES: Record<string, AlertTone> = {
  BUDGET_80: "warning",
  BUDGET_100: "danger",
  RECURRING_CREATED: "success",
  RECURRING_DUE_TOMORROW: "info",
};

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
            <CheckCheck aria-hidden />
            Mark all read
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-(--sp-radius) bg-(--sp-panel) px-4 py-10 text-center">
          <Bell className="size-8 text-(--sp-text-faint)" aria-hidden />
          <p className="text-sm text-(--sp-text-muted)">No alerts. Budget and recurring alerts show here.</p>
        </div>
      ) : (
        <SectionCard title="Latest">
          <ul className="flex flex-col">
            {list.map((a) => (
              <li key={a.id} onClick={() => void markRead(a)}>
                <AlertRow
                  icon={ICONS[a.kind] ?? <Bell aria-hidden />}
                  tone={TONES[a.kind] ?? "info"}
                  title={a.title}
                  message={a.body || undefined}
                  time={dates.dateTime(a.createdAt)}
                  unread={!a.read}
                  href={safeLink(a.link) ?? "/alerts"}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}
