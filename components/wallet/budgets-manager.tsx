"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { formatMoney, parseAmountInput, type Currency } from "@/lib/transactions-types";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CategorySelect, CurrencyChoice } from "./form-bits";
import { ProgressBar, statusText } from "./progress";

/** Monthly budgets: a total per currency, or per category. Bars turn amber at 80 %, red at 100 %. */
export function BudgetsManager({ budgets, categories }: { budgets: Budget[]; categories: Category[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<{ budget: Budget | null } | null>(null);
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
      <Button size="lg" className="h-12 rounded-full" onClick={() => setEdit({ budget: null })}>
        <Plus aria-hidden />
        Add a budget
      </Button>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {budgets.length === 0 ? (
        <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
          No budgets yet. A budget is a monthly limit for a currency or a category.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {budgets.map((b) => {
            const name = b.category ? b.category.name : `All ${b.currency} spending`;
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
                      {formatMoney(b.spent, b.currency)} of {formatMoney(b.limit, b.currency)} ·{" "}
                      {left >= 0 ? `${formatMoney(left, b.currency)} left` : `${formatMoney(-left, b.currency)} over`}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="size-11" aria-label={`Edit ${name}`} onClick={() => setEdit({ budget: b })}>
                    <Pencil className="size-4" aria-hidden />
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
                    <Trash2 className="size-4" aria-hidden />
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

      <Dialog open={edit !== null} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.budget ? "Edit budget" : "Add a budget"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <BudgetForm
              key={edit.budget?.id ?? "new"}
              budget={edit.budget}
              categories={categories}
              onDone={(text) => {
                setEdit(null);
                setNotice({ kind: "ok", text });
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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

function BudgetForm({
  budget,
  categories,
  onDone,
}: {
  budget: Budget | null;
  categories: Category[];
  onDone: (text: string) => void;
}) {
  const [currency, setCurrency] = useState<Currency>(budget?.currency ?? "USD");
  const [limit, setLimit] = useState(budget?.limit ?? "");
  const [categoryId, setCategoryId] = useState(budget?.category?.id ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmountInput(limit);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!amount) return;
    setPending(true);
    const body = { currency, limit: amount, categoryId: categoryId || null };
    try {
      if (budget) await api(`/wallet/budgets/${encodeURIComponent(budget.id)}`, { method: "PUT", body });
      else await api("/wallet/budgets", { method: "POST", body });
      onDone(budget ? "Budget saved." : "Budget added.");
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError ? err.message : errorMessage(err));
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Field>
        <FieldLabel>Currency</FieldLabel>
        <CurrencyChoice value={currency} onChange={setCurrency} />
      </Field>
      <Field data-invalid={touched && !amount}>
        <FieldLabel htmlFor="budget-limit">Monthly limit</FieldLabel>
        <Input id="budget-limit" inputMode="decimal" placeholder="0.00" value={limit} onChange={(e) => setLimit(e.target.value)} className="h-11" />
        {touched && !amount && <FieldError>Enter an amount, like 500.</FieldError>}
      </Field>
      <Field>
        <FieldLabel htmlFor="budget-category">Category</FieldLabel>
        <CategorySelect id="budget-category" categories={categories} value={categoryId} onChange={setCategoryId} emptyLabel="All spending (total)" />
        <p className="text-xs text-muted-foreground">A main category also counts its subcategories.</p>
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : budget ? "Save" : "Add budget"}
      </Button>
    </form>
  );
}
