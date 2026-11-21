"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BottomSheet,
  IconAdd,
  IconChevronRight,
  IconSavings,
  SpButton,
  SpField,
  SpInput,
} from "@/components/spine-ui";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { parseAmountInput } from "@/lib/transactions-types";
import {
  budgetMonthOf,
  convertMoney,
  walletCurrencyOf,
  walletMoney,
  walletMoneyParts,
  type Budget,
  type WalletCurrency,
} from "@/lib/wallet-types";
import { todayIn } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { usePrefs } from "@/components/prefs/prefs-provider";
import {
  CurrencyInputIcon,
  CurrencySwitch,
  currencyInputClass,
  useWalletDefaults,
} from "./currency-switch";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { NoticeBox } from "@/components/admin/notice";
import { CategorySelect } from "./form-bits";
import { STATUS_TEXT, STATUS_WORDS, StatusIcon, TriBar } from "./tri-bar";
import { SortableCard, SortableCardList, useCardOrder } from "./sortable-cards";

/**
 * Monthly budgets: the purple month card (all budgets together), then one card per
 * budget (drag to reorder). A tap on a card opens its page (edit, delete, past months).
 * Bars: 3 parts, On track (0–80 %) · Near limit (80–100 %) · Over (100 %+).
 */
export function BudgetsManager({
  budgets,
  categories,
  today: todayProp,
}: {
  budgets: Budget[];
  categories: Category[];
  /** My today ("YYYY-MM-DD", my time zone). Missing = worked out here from my zone. */
  today?: string;
}) {
  const router = useRouter();
  const { zone } = usePrefs();
  const today = todayProp ?? todayIn(zone);
  const [addOpen, setAddOpen] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  const { shown, saving, onDragEnd } = useCardOrder(
    budgets,
    "/wallet/budgets/order",
    (text) => setNotice({ kind: "error", text }),
    () => router.refresh(),
  );
  const month = budgetMonthOf(today);

  return (
    <div className="flex flex-col gap-[12px]">
      {budgets.length > 0 && <BudgetsMonthCard budgets={budgets} month={month} />}
      <SpButton
        className="w-full"
        icon={<IconAdd aria-hidden />}
        onClick={() => setAddOpen(true)}
        data-testid="budget-add"
      >
        Add a budget
      </SpButton>
      {notice && <NoticeBox notice={notice} />}
      {budgets.length === 0 ? (
        <PageEmpty
          icon={<IconSavings />}
          title="No budgets yet"
          text="A budget is a monthly limit for all your spending or for one category."
        />
      ) : (
        <SortableCardList
          ids={shown.map((b) => b.id)}
          onDragEnd={(e) => void onDragEnd(e)}
        >
          {shown.map((b) => (
            <BudgetCard key={b.id} b={b} busy={saving} daysLeft={month.daysLeft} />
          ))}
        </SortableCardList>
      )}

      <BudgetSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        budget={null}
        categories={categories}
        onSaved={(text) => setNotice({ kind: "ok", text })}
      />
    </div>
  );
}

/** "All spending" or the category name. */
export function budgetName(b: Budget): string {
  return b.category ? b.category.name : "All spending";
}

/** "2,000.00 MAD a month" / "$200.00 a month". */
export function perMonthText(b: Budget): string {
  return `${walletMoney(b.limit, b.currency)} a month`;
}

/** One budget: whole card opens its page; the grip still drags (it sits above the link). */
function BudgetCard({ b, busy, daysLeft }: { b: Budget; busy: boolean; daysLeft: number }) {
  const name = budgetName(b);
  const left = Number(b.limit) - Number(b.spent);
  const over = left < 0;
  const amount = walletMoneyParts(Math.abs(left), b.currency);
  const spent = walletMoneyParts(b.spent, b.currency).main;
  const days = `${daysLeft} ${daysLeft === 1 ? "day" : "days"}`;
  return (
    <SortableCard
      id={b.id}
      name={name}
      busy={busy}
      testId="budget-item"
      className="flex flex-col gap-[12px] rounded-(--sp-radius) bg-(--sp-panel) pt-[10px] pr-[8px] pb-[16px] pl-[14px]"
    >
      {(grip) => (
        <>
          <Link
            href={`/wallet/budgets/${encodeURIComponent(b.id)}`}
            aria-label={`${name}: ${STATUS_WORDS[b.status].toLowerCase()}, ${b.percent}% used`}
            data-testid="budget-open"
            className="absolute inset-0 rounded-(--sp-radius) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          />
          <div className="pointer-events-none relative flex items-center gap-[10.8px]">
            <span className="pointer-events-auto relative z-10 flex">{grip}</span>
            <span className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) [&_svg]:size-[17px]">
              <CategoryIcon name={b.category?.icon ?? "banknote"} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] leading-normal font-medium text-(--sp-text)">{name}</p>
              <p className="text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">{perMonthText(b)}</p>
            </div>
            <span className="flex size-[36px] items-center justify-center text-(--sp-text-faint) [&_svg]:size-[18px]">
              <IconChevronRight aria-hidden />
            </span>
          </div>

          <div aria-hidden className="pointer-events-none flex items-end justify-between gap-[8px] pr-[6px]">
            <p className="tabular-nums">
              <span className={cn("text-[1.5rem] leading-none font-semibold", over ? "text-(--sp-danger)" : "text-(--sp-text)")}>
                {amount.main}
              </span>
              <span className={cn("ml-[6px] text-[0.8125rem]", over ? "font-medium text-(--sp-danger)" : "text-(--sp-text-muted)")}>
                {amount.unit ? `${amount.unit} ` : ""}
                {over ? "over" : "left"}
              </span>
            </p>
            <p className={cn("flex items-center gap-[5px] text-right text-[0.8125rem] font-medium", STATUS_TEXT[b.status])}>
              <StatusIcon status={b.status} />
              {STATUS_WORDS[b.status]} · {b.percent}%
            </p>
          </div>
          <div className="pointer-events-none pr-[6px]">
            <TriBar percent={b.percent} label={`${name}: ${b.percent}% used`} />
          </div>
          <p aria-hidden className="pointer-events-none pr-[6px] text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">
            {spent} spent ·{" "}
            {over || left === 0
              ? `${days} to go`
              : `about ${walletMoney(left / daysLeft, b.currency)} a day for ${days}`}
          </p>
        </>
      )}
    </SortableCard>
  );
}

/**
 * The purple card: this month, days left, everything spent in my budgets against the sum
 * of their limits (in my default currency: budgets in the other currency are converted with
 * my own rate, like the wallet totals), and how many budgets are on track / near / over.
 */
function BudgetsMonthCard({ budgets, month }: { budgets: Budget[]; month: ReturnType<typeof budgetMonthOf> }) {
  const { currency, usdRate } = useWalletDefaults();
  const inDefault = (amount: string, b: Budget) =>
    convertMoney(Number(amount) || 0, walletCurrencyOf(b.currency), currency, usdRate);
  const spent = budgets.reduce((sum, b) => sum + inDefault(b.spent, b), 0);
  const limit = budgets.reduce((sum, b) => sum + inDefault(b.limit, b), 0);
  const percent = limit > 0 ? Math.floor((spent / limit) * 100) : 0;
  const count = (s: Budget["status"]) => budgets.filter((b) => b.status === s).length;
  const big = walletMoneyParts(spent, currency);
  return (
    <section
      data-testid="budgets-month"
      className="flex flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-card-front) p-[18px] text-(--sp-card-front-text)"
    >
      <div className="flex items-center justify-between text-[0.8125rem]">
        <span className="font-medium">{month.name}</span>
        <span className="text-(--sp-card-front-muted)">
          {month.daysLeft} {month.daysLeft === 1 ? "day" : "days"} left
        </span>
      </div>
      <div>
        <p className="text-[0.75rem] text-(--sp-card-front-muted)">Spent in your budgets</p>
        <p className="mt-[2px] text-[2rem] leading-tight font-semibold tabular-nums [overflow-wrap:anywhere]">
          {big.main}{" "}
          <span className="text-[1rem] font-medium text-(--sp-card-front-muted)">of {walletMoney(limit, currency)}</span>
        </p>
      </div>
      <TriBar percent={percent} onCard label={`All budgets: ${percent}% used`} />
      <div className="grid grid-cols-3 gap-[8px] border-t border-white/20 pt-[12px] text-[0.75rem]">
        {(
          [
            ["OK", "On track"],
            ["WARNING", "Near limit"],
            ["EXCEEDED", "Over"],
          ] as const
        ).map(([s, label]) => (
          <div key={s} className="min-w-0">
            <p className="flex items-center gap-[4px] text-(--sp-card-front-muted)">
              <StatusIcon status={s} size={12} />
              <span className="truncate">{label}</span>
            </p>
            <p className="text-[1rem] font-semibold tabular-nums">{count(s)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export type BudgetSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = a new budget ("Set a budget"). */
  budget?: Budget | null;
  /** Wallet categories (expense ones are offered). */
  categories: Category[];
  /** After a save (the page is refreshed already). */
  onSaved?: (text: string) => void;
};

/**
 * Add / edit a monthly budget in a bottom sheet: category (optional, empty =
 * all spending) and monthly limit. Used on the Budgets page and on the wallet
 * dashboard ("Set a budget").
 */
export function BudgetSheet({
  open,
  onOpenChange,
  budget = null,
  categories,
  onSaved,
}: BudgetSheetProps) {
  const router = useRouter();
  const formId = `budget-form-${budget?.id ?? "new"}`;
  const [pending, setPending] = useState(false);
  // Each opening starts a fresh form (new key); it stays mounted while the sheet slides away.
  const [round, setRound] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setRound((r) => r + 1);
  }
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      className="sp-space-wallet"
      title={budget ? "Edit budget" : "Set a budget"}
      description="A monthly limit for all spending or one category. You see how much is left."
      footer={
        <SpButton
          type="submit"
          form={formId}
          className="w-full"
          disabled={pending}
          data-testid="budget-save"
        >
          {pending ? "Saving…" : budget ? "Save" : "Create budget"}
        </SpButton>
      }
    >
      {round > 0 && (
        <BudgetForm
          key={`${budget?.id ?? "new"}-${round}`}
          id={formId}
          budget={budget}
          categories={categories}
          onPending={setPending}
          onDone={(text) => {
            onOpenChange(false);
            router.refresh();
            onSaved?.(text);
          }}
        />
      )}
    </BottomSheet>
  );
}

function BudgetForm({
  id,
  budget,
  categories,
  onPending,
  onDone,
}: {
  id: string;
  budget: Budget | null;
  categories: Category[];
  onPending: (pending: boolean) => void;
  onDone: (text: string) => void;
}) {
  const walletDefaults = useWalletDefaults();
  // Its own currency (edit), else my default.
  const [currency, setCurrency] = useState<WalletCurrency>(
    budget?.currency
      ? walletCurrencyOf(budget.currency)
      : walletDefaults.currency,
  );
  const [limit, setLimit] = useState(budget?.limit ?? "");
  const [categoryId, setCategoryId] = useState(budget?.category?.id ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const amount = parseAmountInput(limit);
  // Budgets are for spending: expense categories only (the saved one stays, even if archived).
  const expenseCategories = categories.filter(
    (c) => (c.kind ?? "EXPENSE") === "EXPENSE" || c.id === budget?.category?.id,
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setCategoryError(null);
    if (!amount) return;
    onPending(true);
    const body = { limit: amount, categoryId: categoryId || null, currency };
    try {
      if (budget)
        await api(`/wallet/budgets/${encodeURIComponent(budget.id)}`, {
          method: "PUT",
          body,
        });
      else await api("/wallet/budgets", { method: "POST", body });
      onPending(false);
      onDone(budget ? "Budget saved." : "Budget added.");
    } catch (err) {
      onPending(false);
      if (err instanceof ApiError && err.field === "categoryId")
        setCategoryError(fieldErrorText(err));
      else setError(err instanceof ApiError ? err.message : errorMessage(err));
    }
  }

  return (
    <form
      id={id}
      onSubmit={submit}
      className="flex flex-col gap-[14px] pt-[4px]"
      noValidate
      data-testid="budget-form"
    >
      {error && (
        <p
          role="alert"
          className="px-[4px] text-[0.8125rem] text-(--sp-danger)"
        >
          {error}
        </p>
      )}
      {/* The select is white like the sheet: give it the soft fill used by the other inputs here. */}
      <SpField
        label="Category"
        htmlFor="budget-category"
        optional
        error={categoryError ?? undefined}
        hint="A main category also counts its subcategories."
      >
        <CategorySelect
          id="budget-category"
          categories={expenseCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setCategoryError(null);
          }}
          emptyLabel="All spending (total)"
        />
      </SpField>
      <SpField label="Currency">
        <CurrencySwitch
          surface="panel"
          value={currency}
          onChange={setCurrency}
        />
      </SpField>
      <SpField
        label="Monthly limit"
        htmlFor="budget-limit"
        error={touched && !amount ? "Enter an amount, like 500." : undefined}
      >
        <SpInput
          id="budget-limit"
          surface="panel"
          inputMode="decimal"
          placeholder="0.00"
          value={limit}
          aria-invalid={touched && !amount}
          icon={<CurrencyInputIcon currency={currency} />}
          className={currencyInputClass(currency)}
          onChange={(e) => setLimit(e.target.value)}
        />
      </SpField>
    </form>
  );
}
