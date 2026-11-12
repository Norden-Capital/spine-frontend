"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet, IconAdd, IconDelete, IconEdit, IconSavings, SpButton, SpField, SpInput } from "@/components/spine-ui";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { formatMoney, parseAmountInput } from "@/lib/transactions-types";
import type { Budget } from "@/lib/wallet-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CategorySelect } from "./form-bits";
import { ProgressBar, statusText } from "./progress";

/** Monthly budgets: a total, or per expense category. Bars turn amber at 80 %, red at 100 %. */
export function BudgetsManager({ budgets, categories }: { budgets: Budget[]; categories: Category[] }) {
  const router = useRouter();
  // The sheet keeps the last budget while it slides away (no title flash).
  const [edit, setEdit] = useState<{ budget: Budget | null; open: boolean }>({ budget: null, open: false });
  const [remove, setRemove] = useState<Budget | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api(`/wallet/budgets/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      setNotice({ kind: "ok", text: "Budget removed." });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
      setRemoveOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button size="lg" className="h-12 rounded-full" onClick={() => setEdit({ budget: null, open: true })} data-testid="budget-add">
        <IconAdd aria-hidden />
        Add a budget
      </Button>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {budgets.length === 0 ? (
        <PageEmpty
          icon={<IconSavings />}
          title="No budgets yet"
          text="A budget is a monthly limit for all your spending or for one category."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => {
            const name = b.category ? b.category.name : "All spending";
            const left = Number(b.limit) - Number(b.spent);
            return (
              <li key={b.id} className="flex flex-col gap-3 rounded-(--sp-radius) bg-(--sp-panel) p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--sp-soft)">
                    <CategoryIcon name={b.category?.icon ?? "banknote"} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-(--sp-text)">{name}</p>
                    <p className="text-xs text-(--sp-text-faint) tabular-nums">
                      {formatMoney(b.spent)} of {formatMoney(b.limit)} ·{" "}
                      {left >= 0 ? `${formatMoney(left)} left` : `${formatMoney(-left)} over`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-11" aria-label={`Edit ${name}`} onClick={() => setEdit({ budget: b, open: true })}>
                    <IconEdit className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label={`Remove ${name}`}
                    onClick={() => {
                      setRemove(b);
                      setRemoveOpen(true);
                    }}
                  >
                    <IconDelete className="size-4" aria-hidden />
                  </Button>
                </div>
                <ProgressBar percent={b.percent} status={b.status} label={`${name}: ${statusText(b.status, b.percent)}`} />
                <p
                  className={
                    b.status === "EXCEEDED"
                      ? "text-xs font-medium text-red-700 dark:text-red-400"
                      : b.status === "WARNING"
                        ? "text-xs font-medium text-amber-700 dark:text-amber-400"
                        : "text-xs text-(--sp-text-faint)"
                  }
                >
                  {statusText(b.status, b.percent)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      <BudgetSheet
        open={edit.open}
        onOpenChange={(open) => setEdit((e) => ({ ...e, open }))}
        budget={edit.budget}
        categories={categories}
        onSaved={(text) => setNotice({ kind: "ok", text })}
      />

      <AlertDialog open={removeOpen} onOpenChange={(next) => !next && !busy && setRemoveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this budget?</AlertDialogTitle>
            <AlertDialogDescription>Your transactions stay. Only the limit goes away.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" size="lg" className="h-11" onClick={confirmRemove} disabled={busy}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
export function BudgetSheet({ open, onOpenChange, budget = null, categories, onSaved }: BudgetSheetProps) {
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
        <SpButton type="submit" form={formId} className="w-full" disabled={pending} data-testid="budget-save">
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
  const [limit, setLimit] = useState(budget?.limit ?? "");
  const [categoryId, setCategoryId] = useState(budget?.category?.id ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const amount = parseAmountInput(limit);
  // Budgets are for spending: expense categories only (the saved one stays, even if archived).
  const expenseCategories = categories.filter((c) => (c.kind ?? "EXPENSE") === "EXPENSE" || c.id === budget?.category?.id);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setCategoryError(null);
    if (!amount) return;
    onPending(true);
    const body = { limit: amount, categoryId: categoryId || null };
    try {
      if (budget) await api(`/wallet/budgets/${encodeURIComponent(budget.id)}`, { method: "PUT", body });
      else await api("/wallet/budgets", { method: "POST", body });
      onPending(false);
      onDone(budget ? "Budget saved." : "Budget added.");
    } catch (err) {
      onPending(false);
      if (err instanceof ApiError && err.field === "categoryId") setCategoryError(fieldErrorText(err));
      else setError(err instanceof ApiError ? err.message : errorMessage(err));
    }
  }

  return (
    <form id={id} onSubmit={submit} className="flex flex-col gap-[14px] pt-[4px]" noValidate data-testid="budget-form">
      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] text-(--sp-danger)">
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
        className="[&_select]:bg-(--sp-soft)"
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
      <SpField label="Monthly limit" htmlFor="budget-limit" error={touched && !amount ? "Enter an amount, like 500." : undefined}>
        <SpInput
          id="budget-limit"
          surface="panel"
          inputMode="decimal"
          placeholder="0.00"
          value={limit}
          aria-invalid={touched && !amount}
          icon={<span className="text-[0.9375rem] font-medium">$</span>}
          onChange={(e) => setLimit(e.target.value)}
        />
      </SpField>
    </form>
  );
}
