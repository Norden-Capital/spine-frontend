"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { formatMoney, parseAmountInput, type Currency, type TxType } from "@/lib/transactions-types";
import { FREQUENCY_LABEL, type Frequency, type Recurring } from "@/lib/wallet-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { useDates } from "@/components/prefs/prefs-provider";
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
import { cn } from "@/lib/utils";
import { CategorySelect, CurrencyChoice, Segmented } from "./form-bits";

/** Repeating wallet items (rent, salary…): the server adds them on their next date. */
export function RecurringManager({
  items,
  categories,
  today,
}: {
  items: Recurring[];
  categories: Category[];
  today: string;
}) {
  const router = useRouter();
  const dates = useDates();
  const [edit, setEdit] = useState<{ item: Recurring | null } | null>(null);
  const [remove, setRemove] = useState<Recurring | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function toggle(r: Recurring) {
    setBusy(r.id);
    try {
      await api(`/wallet/recurring/${encodeURIComponent(r.id)}/${r.active ? "pause" : "resume"}`, { method: "POST" });
      setNotice({ kind: "ok", text: r.active ? `"${r.name}" is paused.` : `"${r.name}" is running again.` });
      router.refresh();
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function confirmRemove() {
    if (!remove) return;
    setBusy("remove");
    try {
      await api(`/wallet/recurring/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      setNotice({ kind: "ok", text: `"${remove.name}" removed. Transactions it made stay.` });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(null);
      setRemoveOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Button size="lg" className="h-12 rounded-full" onClick={() => setEdit({ item: null })}>
        <Plus aria-hidden />
        Add a recurring item
      </Button>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {items.length === 0 ? (
        <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
          Nothing repeats yet. Add rent, a subscription or your salary once, and it is added for you.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li key={r.id} className={cn("flex flex-col gap-3 rounded-(--sp-radius) bg-(--sp-panel) p-4", !r.active && "opacity-70")}>
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--sp-soft)">
                  <CategoryIcon name={r.category.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-(--sp-text)">{r.name}</p>
                  <p className="text-xs text-(--sp-text-faint)">
                    {FREQUENCY_LABEL[r.frequency]} ·{" "}
                    {r.active ? `next ${dates.day(r.nextDate)}` : "paused"}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-sm font-semibold tabular-nums",
                    r.type === "INCOME" ? "text-(--sp-income)" : "text-(--sp-text)"
                  )}
                >
                  {formatMoney(r.amount, r.currency, r.type === "INCOME" ? "+" : "-")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="lg" className="h-11" onClick={() => void toggle(r)} disabled={busy === r.id}>
                  {r.active ? <Pause aria-hidden /> : <Play aria-hidden />}
                  {r.active ? "Pause" : "Resume"}
                </Button>
                <Button variant="outline" size="lg" className="h-11" onClick={() => setEdit({ item: r })}>
                  <Pencil aria-hidden />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 text-destructive"
                  onClick={() => {
                    setRemove(r);
                    setRemoveOpen(true);
                  }}
                >
                  <Trash2 aria-hidden />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={edit !== null} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent className="flex max-h-[90svh] flex-col">
          <DialogHeader>
            <DialogTitle>{edit?.item ? "Edit recurring item" : "Add a recurring item"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <RecurringForm
              key={edit.item?.id ?? "new"}
              item={edit.item}
              categories={categories}
              today={today}
              onDone={(text) => {
                setEdit(null);
                setNotice({ kind: "ok", text });
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeOpen} onOpenChange={(next) => !next && busy !== "remove" && setRemoveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &quot;{remove?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Nothing new is added. Transactions it already made stay.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={busy === "remove"}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" size="lg" className="h-11" onClick={confirmRemove} disabled={busy === "remove"}>
              {busy === "remove" ? "Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RecurringForm({
  item,
  categories,
  today,
  onDone,
}: {
  item: Recurring | null;
  categories: Category[];
  today: string;
  onDone: (text: string) => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<TxType>(item?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(item?.amount ?? "");
  const [currency, setCurrency] = useState<Currency>(item?.currency ?? "USD");
  const [categoryId, setCategoryId] = useState(item?.category.id ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [frequency, setFrequency] = useState<Frequency>(item?.frequency ?? "MONTHLY");
  const [startDate, setStartDate] = useState(item?.startDate ?? today);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmountInput(amountText);
  const okName = name.trim().length > 0;
  const okDescription = description.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!okName || !amount || !categoryId || !okDescription || !startDate) return;
    setPending(true);
    const body = {
      name: name.trim(),
      type,
      amount,
      currency,
      categoryId,
      description: description.trim(),
      frequency,
      startDate,
    };
    try {
      if (item) await api(`/wallet/recurring/${encodeURIComponent(item.id)}`, { method: "PUT", body });
      else await api("/wallet/recurring", { method: "POST", body });
      onDone(item ? "Saved." : startDate <= today ? "Added. Today's one is already in your wallet." : "Added.");
    } catch (err) {
      setPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={submit} className="flex min-h-0 flex-col gap-4 overflow-y-auto" noValidate>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Field data-invalid={touched && !okName}>
        <FieldLabel htmlFor="rec-name">Name</FieldLabel>
        <Input id="rec-name" maxLength={60} placeholder="e.g. Rent" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        {touched && !okName && <FieldError>Enter a name.</FieldError>}
      </Field>
      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />
      <Field data-invalid={touched && !amount}>
        <FieldLabel htmlFor="rec-amount">Amount</FieldLabel>
        <Input id="rec-amount" inputMode="decimal" placeholder="0.00" value={amountText} onChange={(e) => setAmountText(e.target.value)} className="h-11" />
        {touched && !amount && <FieldError>Enter an amount.</FieldError>}
      </Field>
      <CurrencyChoice value={currency} onChange={setCurrency} />
      <Field data-invalid={touched && !categoryId}>
        <FieldLabel htmlFor="rec-category">Category</FieldLabel>
        <CategorySelect id="rec-category" categories={categories} value={categoryId} onChange={setCategoryId} />
        {touched && !categoryId && <FieldError>Choose a category.</FieldError>}
      </Field>
      <Field data-invalid={touched && !okDescription}>
        <FieldLabel htmlFor="rec-description">Description</FieldLabel>
        <Input id="rec-description" maxLength={200} placeholder="e.g. Apartment rent" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
        {touched && !okDescription && <FieldError>Enter a description.</FieldError>}
      </Field>
      <Field>
        <FieldLabel>How often</FieldLabel>
        <Segmented
          label="How often"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: "WEEKLY", label: "Weekly" },
            { value: "MONTHLY", label: "Monthly" },
            { value: "YEARLY", label: "Yearly" },
          ]}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="rec-start">First date</FieldLabel>
        <Input id="rec-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11" />
        <p className="text-xs text-muted-foreground">
          If it is today, the first one is added right away. A monthly one on the 31st uses the last day in short months.
        </p>
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full shrink-0" disabled={pending}>
        {pending ? "Saving…" : item ? "Save" : "Add"}
      </Button>
    </form>
  );
}
