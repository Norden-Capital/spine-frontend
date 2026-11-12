"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Category, Tag } from "@/lib/catalog-types";
import {
  CURRENCIES,
  parseAmountInput,
  type Currency,
  type Transaction,
  type TxType,
} from "@/lib/transactions-types";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { TagPicker } from "@/components/expenses/tag-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProofPicker, proofFromRef, type ProofItem } from "./proof-picker";

const MAX_DESCRIPTION = 200;

/**
 * Add or edit a transaction. Save stays off until the amount, date,
 * category and at least one uploaded proof are there.
 */
export function TransactionForm({
  transaction,
  categories,
  today,
}: {
  /** null = new transaction. */
  transaction: Transaction | null;
  categories: Category[];
  /** Today "YYYY-MM-DD" in the user's zone: the latest allowed date. */
  today: string;
}) {
  const router = useRouter();
  const ids = useId();
  const [type, setType] = useState<TxType>(transaction?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(transaction?.amount ?? "");
  const [currency, setCurrency] = useState<Currency>(transaction?.currency ?? "USD");
  const [date, setDate] = useState(transaction?.date ?? today);
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(transaction?.category.id ?? null);
  const [tags, setTags] = useState<Tag[]>((transaction?.tags ?? []).map((t) => ({ ...t, archived: false })));
  const [proofs, setProofs] = useState<ProofItem[]>((transaction?.files ?? []).map(proofFromRef));
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ field: string; text: string } | null>(null);

  // The chosen category stays in the list even if archived since.
  const pickerCategories =
    transaction && !categories.some((c) => c.id === transaction.category.id)
      ? [...categories, transaction.category]
      : categories;

  const amount = parseAmountInput(amountText);
  const futureDate = date > today;
  const doneProofs = proofs.filter((p) => p.status === "done" && p.ref);
  const uploading = proofs.some((p) => p.status === "uploading");
  const ready = Boolean(amount && date && !futureDate && categoryId && doneProofs.length > 0 && !uploading);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError(null);
    setFieldError(null);
    if (!ready || !amount || !categoryId) return;
    setPending(true);
    const body = {
      type,
      amount,
      currency,
      date,
      description: description.trim(),
      categoryId,
      tagIds: tags.map((t) => t.id),
      fileIds: doneProofs.map((p) => p.ref!.id),
    };
    try {
      const saved = transaction
        ? await api<Transaction>(`/transactions/${encodeURIComponent(transaction.id)}`, { method: "PUT", body })
        : await api<Transaction>("/transactions", { method: "POST", body });
      router.replace(`/transactions/${encodeURIComponent(saved?.id ?? transaction!.id)}`);
      router.refresh();
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.code === "future_date") setFieldError({ field: "date", text: err.message });
      else if (err instanceof ApiError && err.field) setFieldError({ field: err.field, text: err.message });
      else setError(errorMessage(err));
    }
  }

  const showAmountError = (touched || amountText !== "") && !amount;
  const errorFor = (field: string) => (fieldError?.field === field ? fieldError.text : null);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Segmented
        label="Type"
        value={type}
        onChange={setType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      <FieldGroup>
        <Field data-invalid={showAmountError || Boolean(errorFor("amount"))}>
          <FieldLabel htmlFor={`${ids}-amount`}>Amount</FieldLabel>
          <div className="flex items-stretch gap-2">
            <Input
              id={`${ids}-amount`}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              aria-invalid={showAmountError}
              className="h-14 min-w-0 flex-1 text-3xl font-semibold tabular-nums md:text-3xl"
            />
            <Segmented
              label="Currency"
              value={currency}
              onChange={setCurrency}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              className="w-32 shrink-0"
              tall
            />
          </div>
          {showAmountError ? (
            <FieldError>Enter an amount, like 12.50 or 12,50.</FieldError>
          ) : (
            errorFor("amount") && <FieldError>{errorFor("amount")}</FieldError>
          )}
        </Field>

        <Field data-invalid={futureDate || Boolean(errorFor("date"))}>
          <FieldLabel htmlFor={`${ids}-date`}>Date</FieldLabel>
          <Input
            id={`${ids}-date`}
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-invalid={futureDate}
            className="h-11"
          />
          {futureDate ? (
            <FieldError>The date can&apos;t be in the future.</FieldError>
          ) : (
            errorFor("date") && <FieldError>{errorFor("date")}</FieldError>
          )}
        </Field>

        <Field data-invalid={Boolean(errorFor("description"))}>
          <FieldLabel htmlFor={`${ids}-description`}>Description</FieldLabel>
          <Input
            id={`${ids}-description`}
            autoComplete="off"
            placeholder="e.g. Taxi to the client"
            maxLength={MAX_DESCRIPTION}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-11"
          />
          {errorFor("description") && <FieldError>{errorFor("description")}</FieldError>}
        </Field>

        <Field data-invalid={touched && !categoryId}>
          <FieldLabel id={`${ids}-category`}>Category</FieldLabel>
          <CategoryPicker
            categories={pickerCategories}
            value={categoryId}
            onChange={setCategoryId}
            invalid={touched && !categoryId}
            labelledBy={`${ids}-category`}
          />
          {touched && !categoryId && <FieldError>Pick a category.</FieldError>}
        </Field>

        <Field>
          <FieldLabel htmlFor={`${ids}-tags`}>Tags</FieldLabel>
          <TagPicker id={`${ids}-tags`} value={tags} onChange={setTags} />
        </Field>

        <Field data-invalid={touched && doneProofs.length === 0}>
          <FieldLabel>Proof</FieldLabel>
          <ProofPicker items={proofs} onChange={setProofs} invalid={touched && doneProofs.length === 0} />
        </Field>
      </FieldGroup>

      {/* Save stays in reach of the thumb, above the tab bar. */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={!ready || pending}>
          {pending
            ? "Saving…"
            : uploading
              ? "Uploading proof…"
              : transaction
                ? "Save changes"
                : type === "INCOME"
                  ? "Save income"
                  : "Save expense"}
        </Button>
      </div>
    </form>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  tall,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
  tall?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-1 rounded-xl bg-muted p-1", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex items-center justify-center rounded-lg px-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tall ? "h-12" : "h-11",
              on ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
