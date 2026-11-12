"use client";

import { useId, useState, type ReactNode } from "react";
import {
  BottomSheet,
  DateField,
  DueBadge,
  IconDelete,
  IconEdit,
  IconPause,
  IconPlay,
  SpBadge,
  SpButton,
} from "@/components/spine-ui";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { useDates } from "@/components/prefs/prefs-provider";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import { dueState, nextDay, repeatLabel, shortDay, type RepeatUnit, type UpcomingDate } from "@/lib/repeat-schedule";
import { formatMoney, type TxType } from "@/lib/transactions-types";
import { cn } from "@/lib/utils";

/** What the sheet shows, the same for wallet and company items. */
export type RepeatView = {
  id: string;
  name: string;
  amount: string;
  type: TxType;
  unit: RepeatUnit;
  every: number;
  nextDate: string | null;
  /** Paused with no end. */
  paused: boolean;
  pausedUntil: string | null;
  upcoming: UpcomingDate[];
  /** Logo or category icon. */
  logo: ReactNode;
  /** Wallet shows "-$12.00" for money out; company shows "$12.00". */
  minusForExpense?: boolean;
};

/** Error text for the sheet: the backend's own words for a bad date, else the friendly text. */
export function repeatErrorText(err: unknown): string {
  if (err instanceof ApiError && err.code === "validation_error" && err.field) return fieldErrorText(err);
  return errorMessage(err);
}

/**
 * "…" detail sheet of one repeat item: next date + urgency, skip the next
 * payment, the next 6 dates (skip / undo), pause until a day, pause / resume,
 * edit / delete. Every action answers with the full item (`onUpdated`).
 * `canManage` false = the same sheet, read only (members).
 */
export function RepeatSheet<T extends { id: string }>({
  open,
  onOpenChange,
  item,
  view,
  basePath,
  today,
  canManage,
  onUpdated,
  reload,
  onSkipExists,
  onEdit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: T | null;
  view: (item: T) => RepeatView;
  /** API path of the items, e.g. "/wallet/recurring" or "/admin/recurring". */
  basePath: string;
  /** My today, "YYYY-MM-DD". */
  today: string;
  canManage: boolean;
  onUpdated: (item: T) => void;
  /** Loads the full item again (when an endpoint answers without it). */
  reload: (id: string) => Promise<T>;
  /** Company: skip when the reminder for that date is already there (409 occurrence_exists). */
  onSkipExists?: (item: T, date: string) => Promise<T>;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const ids = useId();
  const dates = useDates();
  const fmt = { dateFormat: dates.settings.dateFormat, today };
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [until, setUntil] = useState("");
  const [untilError, setUntilError] = useState<string | null>(null);

  const v = item ? view(item) : null;
  const path = v ? `${basePath}/${encodeURIComponent(v.id)}` : "";
  const pausedNow = Boolean(v && (v.paused || (v.pausedUntil && v.pausedUntil > today)));
  const due = v ? dueState(v.nextDate, today, { paused: v.paused, pausedUntil: v.pausedUntil, dateFormat: fmt.dateFormat }) : null;
  const day = (d: string) => shortDay(d, { ...fmt, weekday: true });
  const minUntil = nextDay(today);

  function close(next: boolean) {
    if (!next) {
      setNotice(null);
      setUntil("");
      setUntilError(null);
    }
    onOpenChange(next);
  }

  /** Run one action; the answer (or a fresh load) replaces the item. */
  async function run(
    key: string,
    call: () => Promise<T | undefined>,
    ok: string,
    onError?: (text: string) => void
  ): Promise<boolean> {
    if (!item) return false;
    setPending(key);
    setNotice(null);
    setUntilError(null);
    try {
      const answer = await call();
      const next = answer && typeof answer === "object" && "id" in answer ? answer : await reload(item.id);
      onUpdated(next);
      setNotice({ kind: "ok", text: ok });
      return true;
    } catch (err) {
      const text = repeatErrorText(err);
      if (onError) onError(text);
      else setNotice({ kind: "error", text });
      return false;
    } finally {
      setPending(null);
    }
  }

  const skip = (date: string, key: string) =>
    run(
      key,
      async () => {
        try {
          return await api<T>(`${path}/skips`, { method: "POST", body: { date } });
        } catch (err) {
          if (err instanceof ApiError && err.code === "occurrence_exists" && onSkipExists && item) {
            return await onSkipExists(item, date);
          }
          throw err;
        }
      },
      `${day(date)} is skipped. Nothing is added that day.`
    );

  const undo = (date: string) =>
    run(
      `undo:${date}`,
      () => api<T>(`${path}/skips/${encodeURIComponent(date)}`, { method: "DELETE" }),
      `${day(date)} is back on.`
    );

  const pauseUntil = () => {
    if (!until || until <= today) {
      setUntilError("Pick a day after today.");
      return;
    }
    void run(
      "pause-until",
      () => api<T>(`${path}/pause-until`, { method: "POST", body: { date: until } }),
      `Paused until ${shortDay(until, fmt)}. It goes on by itself after.`,
      setUntilError
    ).then((done) => done && setUntil(""));
  };

  const togglePause = () =>
    run(
      pausedNow ? "resume" : "pause",
      () => api<T>(`${path}/${pausedNow ? "resume" : "pause"}`, { method: "POST" }),
      pausedNow ? "Running again. Missed dates are not added." : "Paused. Nothing is added until you resume it."
    );

  const income = v?.type === "INCOME";
  const busy = pending !== null;

  return (
    <BottomSheet open={open && v !== null} onOpenChange={close} title={v?.name ?? ""}>
      {v && (
        <div className="flex flex-col gap-[16px] pt-[2px]" data-testid="repeat-sheet" data-id={v.id}>
          {/* Header: amount, how often, next date + urgency. */}
          <div className="flex items-center gap-[12px] rounded-[16px] bg-(--sp-soft) p-[12px]">
            <span className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-panel) text-(--sp-text) [&_svg]:size-[18px] [&_svg]:stroke-[1.6]">
              {v.logo}
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-[1.25rem] leading-none font-semibold tabular-nums",
                  income ? "text-(--sp-income)" : "text-(--sp-text)"
                )}
              >
                {formatMoney(v.amount, income ? "+" : v.minusForExpense ? "-" : undefined)}
              </p>
              <p className="mt-[6px] truncate text-[0.75rem] leading-tight text-(--sp-text-muted)">
                {repeatLabel(v.unit, v.every)}
                {v.nextDate ? ` · next ${day(v.nextDate)}` : " · finished"}
              </p>
            </div>
            {due && due.state !== "later" && <DueBadge state={due.state} label={due.label} />}
          </div>

          {notice && <NoticeBox notice={notice} />}

          {canManage && v.nextDate && !pausedNow && (
            <div className="space-y-[6px]">
              <SpButton
                className="w-full"
                disabled={busy}
                onClick={() => void skip(v.nextDate!, "skip-next")}
                data-testid="repeat-skip-next"
              >
                {pending === "skip-next" ? "Skipping…" : `Skip ${shortDay(v.nextDate, fmt)}`}
              </SpButton>
              <p className="px-[4px] text-center text-[0.6875rem] leading-snug text-(--sp-text-muted)">
                Skip this payment only. The next ones still come.
              </p>
            </div>
          )}

          {/* The next 6 dates. */}
          <section aria-labelledby={`${ids}-next`}>
            <h3 id={`${ids}-next`} className="px-[4px] pb-[6px] text-[0.8125rem] font-medium text-(--sp-text)">
              Next dates
            </h3>
            {v.upcoming.length === 0 ? (
              <p className="px-[4px] text-[0.75rem] text-(--sp-text-muted)">No dates left.</p>
            ) : (
              <ul className="flex flex-col rounded-[16px] bg-(--sp-soft) px-[12px]" data-testid="repeat-upcoming">
                {v.upcoming.map((u) => {
                  const canUndo = u.status === "SKIPPED" && u.date > today;
                  const canSkip = u.status === "UPCOMING";
                  const rowDue = u.status === "DUE" ? dueState(u.date, today, fmt) : null;
                  return (
                    <li
                      key={u.date}
                      className="flex min-h-[52px] items-center gap-[8px] border-b border-(--sp-panel) py-[4px] last:border-b-0"
                      data-testid="repeat-upcoming-row"
                      data-date={u.date}
                      data-status={u.status}
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[0.8125rem] tabular-nums",
                          u.status === "SKIPPED" ? "text-(--sp-text-muted) line-through" : "text-(--sp-text)"
                        )}
                      >
                        {day(u.date)}
                      </span>
                      {u.status === "SKIPPED" ? (
                        <SpBadge>Skipped</SpBadge>
                      ) : u.status === "PAUSED" ? (
                        <DueBadge state="paused" label="Paused" />
                      ) : u.status === "DONE" ? (
                        <SpBadge tone="success">Done</SpBadge>
                      ) : rowDue ? (
                        <DueBadge state={rowDue.state} label={rowDue.label} />
                      ) : null}
                      {canManage && (canSkip || canUndo) && (
                        <SpButton
                          variant="secondary"
                          size="md"
                          className="w-[84px] shrink-0 px-[12px]"
                          disabled={busy}
                          onClick={() => void (canSkip ? skip(u.date, `skip:${u.date}`) : undo(u.date))}
                          data-testid={canSkip ? "repeat-upcoming-skip" : "repeat-upcoming-undo"}
                        >
                          {pending === `skip:${u.date}`
                            ? "Skipping…"
                            : pending === `undo:${u.date}`
                              ? "Undoing…"
                              : canSkip
                                ? "Skip"
                                : "Undo"}
                        </SpButton>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {canManage ? (
            <>
              {pausedNow ? (
                /* Paused (with or without an end date): one big way back. */
                <section className="space-y-[10px]" aria-label="Paused">
                  <p className="px-[4px] text-[0.875rem] text-(--sp-text-muted)">
                    {v.paused
                      ? "Paused until further notice. Nothing is added until you resume it."
                      : `Paused until ${shortDay(v.pausedUntil!, fmt)}. Then it goes on by itself.`}
                  </p>
                  <SpButton
                    className="w-full"
                    icon={<IconPlay />}
                    disabled={busy}
                    onClick={() => void togglePause()}
                    data-testid="repeat-resume"
                  >
                    {pending === "resume" ? "Resuming…" : "Resume"}
                  </SpButton>
                </section>
              ) : (
                <>
              <section className="space-y-[8px]" aria-label="Pause until">
                  {v.pausedUntil && v.pausedUntil > today && (
                    <div className="flex justify-end px-[4px]">
                      <DueBadge state="paused" label={`Paused until ${shortDay(v.pausedUntil, fmt)}`} />
                    </div>
                  )}
                  <div data-testid="repeat-pause-until-input">
                    <DateField
                      label="Pause until…"
                      sheetTitle="Pause until"
                      surface="panel"
                      optional
                      value={until || null}
                      onChange={(d) => {
                        setUntil(d ?? "");
                        setUntilError(null);
                      }}
                      min={minUntil}
                      today={today}
                      format={dates.day}
                      error={untilError ?? undefined}
                      hint="Nothing is added before this day. Then it goes on by itself."
                    />
                  </div>
                  <SpButton
                    variant="secondary"
                    className="w-full"
                    disabled={busy || !until}
                    onClick={pauseUntil}
                    data-testid="repeat-pause-until-confirm"
                  >
                    {pending === "pause-until"
                      ? "Pausing…"
                      : until
                        ? `Pause until ${shortDay(until, fmt)}`
                        : "Pause until this day"}
                  </SpButton>
              </section>
                  {/* The pause with no end date, right next to "Pause until…". */}
                  <SpButton
                    variant="secondary"
                    className="w-full"
                    icon={<IconPause />}
                    disabled={busy}
                    onClick={() => void togglePause()}
                    data-testid="repeat-pause"
                  >
                    {pending === "pause" ? "Pausing…" : "Pause until further notice"}
                  </SpButton>
                </>
              )}

              <div className="flex flex-col gap-[8px] border-t border-(--sp-soft) pt-[16px]">
                {(onEdit || onDelete) && (
                  <div className="grid grid-cols-2 gap-[8px]">
                    {onEdit && (
                      <SpButton variant="secondary" icon={<IconEdit />} disabled={busy} onClick={onEdit} data-testid="repeat-edit">
                        Edit
                      </SpButton>
                    )}
                    {onDelete && (
                      <SpButton variant="danger" icon={<IconDelete />} disabled={busy} onClick={onDelete} data-testid="repeat-delete">
                        Delete
                      </SpButton>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.8125rem] leading-snug text-(--sp-text)">
              Only the owner can change this.
            </p>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
