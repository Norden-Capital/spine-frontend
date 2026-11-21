"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconButton, IconCalendar, IconDelete, IconEdit, PageHeader, SpPanel } from "@/components/spine-ui";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox } from "@/components/admin/notice";
import { api, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import {
  budgetMonthName,
  budgetMonthOf,
  budgetMonthShort,
  walletCurrencyOf,
  walletMoney,
  walletMoneyParts,
  type BudgetHistory,
  type BudgetMonth,
} from "@/lib/wallet-types";
import { cn } from "@/lib/utils";
import { BudgetSheet, budgetName, perMonthText } from "./budgets-manager";
import { STATUS_TEXT, StatusIcon, TriBar } from "./tri-bar";

const STATUS_LOWER = { OK: "on track", WARNING: "near the limit", EXCEEDED: "over the limit" } as const;

/** "2,430" / "$2,430" (whole number, for the small tiles). */
function wholeMoney(amount: string, currency: string | null | undefined): string {
  return walletMoneyParts(Math.round(Number(amount) || 0), currency).main.replace(/\.00$/, "");
}

/**
 * One budget's page: this month on the purple card, the last months summary and the
 * past months (each with the limit it had). Edit and delete live here.
 */
export function BudgetDetail({
  history,
  categories,
  today,
}: {
  history: BudgetHistory;
  categories: Category[];
  /** My today ("YYYY-MM-DD", my time zone). */
  today: string;
}) {
  const router = useRouter();
  const { budget: b, months, summary } = history;
  const name = budgetName(b);
  const month = budgetMonthOf(today);
  const year = today.slice(0, 4);

  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function confirmRemove() {
    setBusy(true);
    setRemoveError(null);
    try {
      await api(`/wallet/budgets/${encodeURIComponent(b.id)}`, { method: "DELETE" });
    } catch (err) {
      setRemoveError(errorMessage(err));
      setBusy(false);
      return;
    }
    // Stays busy until the list opens.
    router.replace("/wallet/budgets");
    router.refresh();
  }

  const left = Number(b.limit) - Number(b.spent);
  const over = left < 0;
  const big = walletMoneyParts(Math.abs(left), b.currency);
  const spent = walletMoneyParts(b.spent, b.currency).main;

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[8px]">
        <PageHeader
          back={{ href: "/wallet/budgets", label: "Back to budgets" }}
          title={name}
          action={
            <div className="flex items-center gap-[8px]">
              <IconButton
                label={`Edit ${name}`}
                icon={<IconEdit aria-hidden />}
                className="[&_svg]:size-[20px]"
                onClick={() => setEditOpen(true)}
                data-testid="budget-edit"
              />
              <IconButton
                label={`Remove ${name}`}
                icon={<IconDelete aria-hidden />}
                className="text-(--sp-danger) [&_svg]:size-[20px]"
                onClick={() => {
                  setRemoveError(null);
                  setRemoveOpen(true);
                }}
                data-testid="budget-remove"
              />
            </div>
          }
        />
        <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">Budget · {perMonthText(b)}</p>
      </div>

      {notice && <NoticeBox notice={notice} />}

      <section
        data-testid="budget-this-month"
        className="flex flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-card-front) p-[18px] text-(--sp-card-front-text)"
      >
        <div className="flex items-center justify-between text-[0.8125rem]">
          <span className="font-medium">{month.name}</span>
          <span className="text-(--sp-card-front-muted)">
            {month.daysLeft} {month.daysLeft === 1 ? "day" : "days"} left
          </span>
        </div>
        <div>
          <p className="text-[0.75rem] text-(--sp-card-front-muted)">{over ? "Over this month" : "Left this month"}</p>
          <p className="mt-[2px] text-[2rem] leading-tight font-semibold tabular-nums [overflow-wrap:anywhere]">
            {big.main}{" "}
            <span className="text-[1rem] font-medium text-(--sp-card-front-muted)">of {walletMoney(b.limit, b.currency)}</span>
          </p>
        </div>
        <TriBar percent={b.percent} onCard legend label={`${name}: ${b.percent}% used`} />
        <p className="text-[0.75rem] text-(--sp-card-front-muted) tabular-nums">
          {spent} spent · {STATUS_LOWER[b.status]} ({b.percent}%)
          {!over && left > 0 ? ` · about ${walletMoney(left / month.daysLeft, b.currency)} a day` : ""}
        </p>
      </section>

      {months.length === 0 ? (
        <SpPanel title="Past months">
          <div className="flex flex-col items-center gap-[6px] py-[18px] text-center" data-testid="budget-no-months">
            <span className="flex size-[46px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text-muted) [&_svg]:size-[20px]">
              <IconCalendar aria-hidden />
            </span>
            <p className="text-[0.875rem] font-medium text-(--sp-text)">No past months yet</p>
            <p className="max-w-[260px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
              {month.name} shows here from 1 {month.nextName}.
            </p>
          </div>
        </SpPanel>
      ) : (
        <>
          {summary && summary.months > 0 ? (
            <SpPanel title={summary.months === 1 ? "Last month" : `Last ${summary.months} months`}>
              <div className="grid grid-cols-3 gap-[8px]">
                {[
                  ["Average", walletMoneyParts(summary.average, b.currency).main],
                  ["Under the limit", `${summary.underLimit} of ${summary.months}`],
                  [
                    "Biggest",
                    summary.biggest
                      ? `${budgetMonthShort(summary.biggest.month)} · ${wholeMoney(summary.biggest.spent, b.currency)}`
                      : "—",
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex min-w-0 flex-col gap-[2px] rounded-[16px] bg-(--sp-soft) px-[12px] py-[10px]">
                    <span className="truncate text-[0.6875rem] text-(--sp-text-muted)">{k}</span>
                    <span className="truncate text-[0.9375rem] font-semibold text-(--sp-text) tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </SpPanel>
          ) : null}

          <SpPanel title="Past months">
            <ul className="-my-[8px] flex flex-col divide-y divide-(--sp-divider)" data-testid="budget-months">
              {months.map((m) => (
                <MonthRow key={m.month} m={m} year={year} />
              ))}
            </ul>
          </SpPanel>
          <p className="px-[4px] text-[0.75rem] leading-snug text-(--sp-text-muted)">
            Each month keeps the limit it had. Months from before limits were saved use today&apos;s limit.
          </p>
        </>
      )}

      <BudgetSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        budget={b}
        categories={categories}
        onSaved={(text) => setNotice({ kind: "ok", text })}
      />

      <ConfirmSheet
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title="Remove this budget?"
        text="Your transactions stay. Only the limit goes away."
        confirm="Remove"
        destructive
        busy={busy}
        busyLabel="Removing…"
        error={removeError}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}

/** One past month: "October", "2,150.00 of 2,000.00 MAD", the difference, the status, a thin bar. */
function MonthRow({ m, year }: { m: BudgetMonth; year: string }) {
  const cur = walletCurrencyOf(m.currency);
  const diff = Number(m.spent) - Number(m.limit);
  const over = diff > 0;
  const name = budgetMonthName(m.month, year);
  const of =
    cur === "MAD"
      ? `${walletMoneyParts(m.spent, cur).main} of ${walletMoney(m.limit, cur)}`
      : `${walletMoney(m.spent, cur)} of ${walletMoney(m.limit, cur)}`;
  const words = over ? "over the limit" : diff === 0 ? "at the limit" : "under the limit";
  return (
    <li className="flex flex-col gap-[8px] py-[12px]" data-testid="budget-month">
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-medium text-(--sp-text)">{name}</p>
          <p className="text-[0.6875rem] text-(--sp-text-muted) tabular-nums">{of}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("text-[0.9375rem] font-semibold tabular-nums", over ? "text-(--sp-danger)" : "text-(--sp-income)")}>
            {walletMoneyParts(Math.abs(diff), cur).main}
          </p>
          <p className={cn("flex items-center justify-end gap-[4px] text-[0.6875rem]", STATUS_TEXT[m.status])}>
            <StatusIcon status={m.status} size={12} />
            {words} · {m.percent}%
          </p>
        </div>
      </div>
      <TriBar percent={m.percent} thin label={`${name}: ${m.percent}% used`} />
    </li>
  );
}
