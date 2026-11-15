"use client";

import { useEffect, useState } from "react";
import { useDates } from "@/components/prefs/prefs-provider";
import { HistoryList, TX_FIELDS } from "@/components/history/history-list";
import { api } from "@/lib/api";
import type { HistoryEntry } from "@/lib/transactions-types";

const ACTIONS: Record<string, string> = {
  CREATED: "Created",
  UPDATED: "Edited",
  PAUSED: "Paused",
  RESUMED: "Resumed",
  PAUSED_UNTIL: "Paused until a day",
  SKIPPED: "Skipped a date",
  UNSKIPPED: "Skip undone",
  DELETED: "Moved to trash",
  RESTORED: "Restored",
};

const FIELDS: Record<string, string> = {
  ...TX_FIELDS,
  repeat: "How often",
  startDate: "Start date",
  endDate: "End date",
  remindDays: "Remind before",
  skipDate: "Date",
  pausedUntil: "Paused until",
};

const DATE_FIELDS: ReadonlySet<string> = new Set(["startDate", "endDate", "skipDate", "pausedUntil"]);

/**
 * "History" of one company repeat expense (GET /api/recurring/{id}/history),
 * with the same timeline as the expense page. Loads again when `version`
 * changes (the sheet passes the item, replaced after each action).
 */
export function RepeatHistory({ id, version }: { id: string; version?: unknown }) {
  const dates = useDates();
  const [state, setState] = useState<{ id: string; entries: HistoryEntry[] | null; failed: boolean } | null>(null);

  useEffect(() => {
    let live = true;
    api<HistoryEntry[]>(`/recurring/${encodeURIComponent(id)}/history`)
      .then((entries) => live && setState({ id, entries, failed: false }))
      .catch(() => live && setState({ id, entries: null, failed: true }));
    return () => {
      live = false;
    };
  }, [id, version]);

  const current = state?.id === id ? state : null;
  return (
    <section aria-label="History" data-testid="repeat-history">
      <h3 className="px-[4px] pb-[6px] text-[0.8125rem] font-medium text-(--sp-text)">History</h3>
      <div className="px-[4px] pt-[4px]">
        {current?.entries ? (
          <HistoryList
            entries={current.entries}
            dates={dates.settings}
            actions={ACTIONS}
            fields={FIELDS}
            dateFields={DATE_FIELDS}
          />
        ) : current?.failed ? (
          <p className="text-[0.75rem] text-(--sp-text-muted)">History could not be loaded.</p>
        ) : (
          <p className="text-[0.75rem] text-(--sp-text-muted)">Loading…</p>
        )}
      </div>
    </section>
  );
}
