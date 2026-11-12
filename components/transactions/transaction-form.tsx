"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { parseAmountInput, type Transaction, type TxType } from "@/lib/transactions-types";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { DuplicateSheet, type DuplicateMatch } from "./duplicate-sheet";
import { AmountField, DateField, Segmented, SpButton, SpField, SpInput } from "@/components/spine-ui";
import { useDates } from "@/components/prefs/prefs-provider";
import { cn } from "@/lib/utils";
import { ProofPicker, proofFromRef, type ProofItem } from "./proof-picker";
import { SpLinkButton } from "./sp-link";

const MAX_DESCRIPTION = 200;
/** Same limit as parseAmountInput: up to 10 whole digits. */
const MAX_WHOLE = 9_999_999_999;

/**
 * Read the amount text the same way parseAmountInput does ("1 234,5" ok),
 * but also allow 0 and empty. Returns whole units and cents, or null when
 * the text is not a number.
 */
function splitAmount(raw: string): { whole: number; cents: number } | null {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  if (cleaned === "") return { whole: 0, cents: 0 };
  const m = /^(\d{0,10})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!m) return null;
  return { whole: Number(m[1] || "0"), cents: Number((m[2] ?? "").padEnd(2, "0")) };
}

/** +1 / −1 whole unit, cents kept, never below 0. "12.50" +1 → "13.50"; "" +1 → "1". */
function stepAmount(raw: string, delta: 1 | -1): string {
  const parts = splitAmount(raw);
  if (!parts || parts.whole + delta < 0) return raw;
  const whole = Math.min(MAX_WHOLE, parts.whole + delta);
  return parts.cents ? `${whole}.${String(parts.cents).padStart(2, "0")}` : String(whole);
}

/** The fields a form can start from (an edited transaction, or a copied one). */
type Draft = Pick<
  Transaction,
  "type" | "amount" | "date" | "description" | "website" | "category" | "files"
> & {
  id?: string;
};

/**
 * Add or edit a transaction (company or private wallet).
 * Company: Save stays off until amount, date, category and at least one
 * uploaded proof are there. Wallet: the proof is optional.
 * `copyFrom` prefills a NEW transaction (no proof files, date = today).
 * `occurrence` = a repeat-expense reminder being saved: its date is used and
 * its id goes in the POST ("recurringOccurrenceId"), so the reminder is done.
 */
export function TransactionForm({
  transaction,
  copyFrom,
  categories,
  today,
  scope = "company",
  cancelHref,
  occurrence,
}: {
  /** null = new transaction. */
  transaction: Draft | null;
  copyFrom?: Draft | null;
  categories: Category[];
  /** Today "YYYY-MM-DD" in the user's zone: the latest allowed date. */
  today: string;
  scope?: "company" | "wallet";
  /** Edit: a "Cancel" link next to Save (back to the transaction). */
  cancelHref?: string;
  /** New from a repeat-expense reminder: its id and the date to start with. */
  occurrence?: { id: string; date: string } | null;
}) {
  const router = useRouter();
  const ids = useId();
  const dates = useDates();
  const base = transaction ?? copyFrom ?? null;
  const wallet = scope === "wallet";
  const apiPath = wallet ? "/wallet/transactions" : "/transactions";
  const [type, setType] = useState<TxType>(base?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(base?.amount ?? "");
  const [date, setDate] = useState(transaction?.date ?? occurrence?.date ?? today);
  const [description, setDescription] = useState(base?.description ?? "");
  const [website, setWebsite] = useState(base?.website ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(base?.category.id ?? null);
  // A copy never takes the proof files (they belong to the original).
  const [proofs, setProofs] = useState<ProofItem[]>((transaction?.files ?? []).map(proofFromRef));
  const [duplicates, setDuplicates] = useState<DuplicateMatch[] | null>(null);
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ field: string; text: string } | null>(null);

  // The chosen category stays in the list even if archived since.
  const all: Category[] =
    base && !categories.some((c) => c.id === base.category.id) ? [...categories, base.category] : categories;
  // Only categories of the chosen type (expense / income). No kind = expense (older answers).
  const kindOf = (c: Category): TxType => c.kind ?? "EXPENSE";
  const pickerCategories = all.filter((c) => kindOf(c) === type || (c.id === transaction?.category.id && c.id === categoryId));

  function changeType(next: TxType) {
    setType(next);
    // A category of the other kind no longer fits.
    const chosen = all.find((c) => c.id === categoryId);
    if (chosen && kindOf(chosen) !== next) setCategoryId(null);
    if (fieldError?.field === "categoryId") setFieldError(null);
  }

  const amount = parseAmountInput(amountText);
  const amountParts = splitAmount(amountText);
  const futureDate = date > today;
  const doneProofs = proofs.filter((p) => p.status === "done" && p.ref);
  const uploading = proofs.some((p) => p.status === "uploading");
  const proofOk = wallet || doneProofs.length > 0;
  const ready = Boolean(amount && date && !futureDate && categoryId && proofOk && !uploading);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!ready || !amount || !categoryId) return;
    await save(false);
  }

  /** Save; `confirmDuplicate` = the user said "Save anyway". */
  async function save(confirmDuplicate: boolean) {
    if (!amount || !categoryId) return;
    setError(null);
    setFieldError(null);
    setPending(true);
    const body = {
      type,
      amount,
      date,
      description: description.trim(),
      // Always sent: PUT replaces everything, so an empty field removes it.
      website: website.trim() || null,
      categoryId,
      fileIds: doneProofs.map((p) => p.ref!.id),
      ...(transaction?.id ? {} : { confirmDuplicate }),
      ...(!transaction?.id && occurrence ? { recurringOccurrenceId: occurrence.id } : {}),
    };
    try {
      const saved = transaction?.id
        ? await api<{ id: string }>(`${apiPath}/${encodeURIComponent(transaction.id)}`, { method: "PUT", body })
        : await api<{ id: string }>(apiPath, { method: "POST", body });
      setDuplicates(null);
      router.replace(`${apiPath}/${encodeURIComponent(saved?.id ?? transaction!.id!)}`);
      router.refresh();
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.code === "possible_duplicate") {
        // Same type + amount + date already saved: ask first.
        setDuplicates((err.data?.matches as DuplicateMatch[] | undefined) ?? []);
      } else if (err instanceof ApiError && err.code === "future_date") setFieldError({ field: "date", text: err.message });
      else if (err instanceof ApiError && err.field === "categoryId")
        // "this is an expense category; pick …": the backend's words under the category.
        setFieldError({ field: err.field, text: fieldErrorText(err) });
      else if (err instanceof ApiError && err.field) setFieldError({ field: err.field, text: err.message });
      else setError(errorMessage(err));
    }
  }

  const showAmountError = (touched || amountText !== "") && !amount;
  const errorFor = (field: string) => (fieldError?.field === field ? fieldError.text : null);

  const amountError = showAmountError ? "Enter an amount, like 12.50 or 12,50." : errorFor("amount");
  const websiteError = fieldError?.field === "website" ? "Enter a website like example.com." : null;
  const dateError = futureDate ? "The date can't be in the future." : errorFor("date");
  const categoryError = touched && !categoryId ? "Pick a category." : errorFor("categoryId");
  const proofField = (
    <SpField label="Proof" optional={wallet}>
      <ProofPicker items={proofs} onChange={setProofs} invalid={touched && !proofOk} optional={wallet} />
    </SpField>
  );
  const saveLabel = pending
    ? "Saving…"
    : uploading
      ? "Uploading proof…"
      : transaction
        ? "Save changes"
        : type === "INCOME"
          ? "Save income"
          : "Save expense";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px]" noValidate>
      {error && (
        <p
          role="alert"
          className="rounded-[16px] bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)] px-[16px] py-[12px] text-[0.8125rem] leading-snug text-(--sp-danger)"
        >
          {error}
        </p>
      )}


      <Segmented
        label="Type"
        value={type}
        onValueChange={(v) => changeType(v as TxType)}
        items={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />

      <div className="space-y-[8px]">
        <AmountField
          id={`${ids}-amount`}
          symbol="$"
          placeholder="0.00"
          value={amountText}
          onChange={(e) => setAmountText(e.target.value)}
          onStep={(delta) => setAmountText((text) => stepAmount(text, delta))}
          canDecrement={Boolean(amountParts && amountParts.whole >= 1)}
          canIncrement={Boolean(amountParts && amountParts.whole < MAX_WHOLE)}
          aria-invalid={Boolean(amountError) || undefined}
          aria-describedby={amountError ? `${ids}-amount-error` : undefined}
          className={cn(amountError && "ring-2 ring-(--sp-danger)")}
        />
        {amountError && (
          <p id={`${ids}-amount-error`} className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">
            {amountError}
          </p>
        )}
      </div>

      <div data-testid="tx-date">
        <DateField
          label="Date"
          value={date || null}
          onChange={(day) => setDate(day ?? "")}
          max={today}
          today={today}
          format={dates.day}
          error={dateError ?? undefined}
        />
      </div>

      <SpField label="Description" htmlFor={`${ids}-description`} error={errorFor("description") ?? undefined}>
        <SpInput
          id={`${ids}-description`}
          autoComplete="off"
          placeholder="e.g. Taxi to the client"
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(errorFor("description")) || undefined}
        />
      </SpField>

      <SpField
        label="Website"
        htmlFor={`${ids}-website`}
        optional
        hint="We show the shop's logo."
        error={websiteError ?? undefined}
      >
        <SpInput
          id={`${ids}-website`}
          name="website"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. amazon.com"
          maxLength={2048}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-invalid={Boolean(websiteError) || undefined}
        />
      </SpField>

      <div className="space-y-[8px]">
        <CategoryPicker
          categories={pickerCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            if (fieldError?.field === "categoryId") setFieldError(null);
          }}
          invalid={Boolean(categoryError)}
        />
        {categoryError && (
          <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">{categoryError}</p>
        )}
      </div>

      {proofField}

      {/* Forms have no dock: the main button sits in a bar at the bottom (thumb zone). */}
      <div className="sticky bottom-0 z-10 -mx-(--sp-gutter) bg-linear-to-t from-(--sp-bg) from-70% to-transparent px-(--sp-gutter) pt-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {cancelHref ? (
          <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
            <SpLinkButton href={cancelHref} variant="secondary" size="lg">
              Cancel
            </SpLinkButton>
            <SpButton type="submit" disabled={!ready || pending}>
              {saveLabel}
            </SpButton>
          </div>
        ) : (
          <SpButton type="submit" className="w-full" disabled={!ready || pending}>
            {saveLabel}
          </SpButton>
        )}
      </div>
      <DuplicateSheet
        matches={duplicates}
        pending={pending}
        type={type}
        amount={amount}
        wallet={wallet}
        onCancel={() => setDuplicates(null)}
        onSaveAnyway={() => void save(true)}
      />
    </form>
  );
}
