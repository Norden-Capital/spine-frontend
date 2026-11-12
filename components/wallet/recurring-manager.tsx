"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DateField, IconAdd, IconCalendarRepeat, SpButton } from "@/components/spine-ui";
import { useDates } from "@/components/prefs/prefs-provider";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import type { RepeatUnit } from "@/lib/repeat-schedule";
import { parseAmountInput, type TxType } from "@/lib/transactions-types";
import type { Recurring } from "@/lib/wallet-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { FrequencyPicker } from "@/components/recurring/frequency-picker";
import { RepeatRow } from "@/components/recurring/repeat-row";
import { RepeatSheet, type RepeatView } from "@/components/recurring/repeat-sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { CategorySelect, Segmented } from "./form-bits";

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
  // The list on screen: server data, replaced item by item by the sheet's answers.
  const [list, setList] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setList(items);
  }
  const [edit, setEdit] = useState<{ item: Recurring | null } | null>(null);
  const [remove, setRemove] = useState<Recurring | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const sheetItem = list.find((r) => r.id === sheetId) ?? null;

  async function reload(id: string): Promise<Recurring> {
    const all = await api<Recurring[]>("/wallet/recurring");
    const found = all.find((r) => r.id === id);
    if (!found) throw new ApiError(404, "recurring_not_found", "This recurring item no longer exists.");
    return found;
  }

  function updated(next: Recurring) {
    setList((l) => l.map((r) => (r.id === next.id ? next : r)));
    // The wallet dashboard ("Due soon") reads the same items.
    router.refresh();
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
    <div className="flex flex-col gap-[16px]">
      <SpButton icon={<IconAdd />} className="w-full" onClick={() => setEdit({ item: null })} data-testid="wallet-recurring-add">
        Add a recurring item
      </SpButton>
      {notice && <NoticeBox notice={notice} />}
      {list.length === 0 ? (
        <PageEmpty
          icon={<IconCalendarRepeat />}
          title="Nothing repeats yet"
          text="Add rent, a subscription or your salary once, and it is added for you."
        />
      ) : (
        <ul className="flex flex-col gap-[12px]" data-testid="wallet-recurring-list">
          {list.map((r) => (
            <RepeatRow
              key={r.id}
              view={walletView(r)}
              today={today}
              onMore={() => {
                setSheetId(r.id);
                setSheetOpen(true);
              }}
            />
          ))}
        </ul>
      )}

      <RepeatSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={sheetItem}
        view={walletView}
        basePath="/wallet/recurring"
        today={today}
        canManage
        onUpdated={updated}
        reload={reload}
        onEdit={() => {
          setSheetOpen(false);
          setEdit({ item: sheetItem });
        }}
        onDelete={() => {
          setSheetOpen(false);
          setRemove(sheetItem);
          setRemoveOpen(true);
        }}
      />

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

      <ConfirmSheet
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove "${remove?.name ?? ""}"?`}
        text="Nothing new is added. Transactions it already made stay."
        confirm="Remove"
        destructive
        busy={busy === "remove"}
        busyLabel="Removing…"
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
}

/** What the row and the sheet show for a wallet item. */
function walletView(r: Recurring): RepeatView {
  return {
    id: r.id,
    name: r.name,
    amount: r.amount,
    type: r.type,
    unit: r.unit,
    every: r.every,
    nextDate: r.nextDate,
    paused: !r.active,
    pausedUntil: r.pausedUntil ?? null,
    upcoming: r.upcoming ?? [],
    logo: <CategoryIcon name={r.category.icon} />,
    minusForExpense: true,
  };
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
  const dates = useDates();
  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<TxType>(item?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(item?.amount ?? "");
  const [categoryId, setCategoryId] = useState(item?.category.id ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [unit, setUnit] = useState<RepeatUnit>(item?.unit ?? "MONTH");
  const [every, setEvery] = useState(item?.every ?? 1);
  const [frequencyError, setFrequencyError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(item?.startDate ?? today);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmountInput(amountText);
  const okName = name.trim().length > 0;
  // Only categories of the chosen type (no kind = expense). The saved one stays while it is chosen.
  const kindOf = (c: Category): TxType => c.kind ?? "EXPENSE";
  const typeCategories = categories.filter(
    (c) => kindOf(c) === type || (c.id === item?.category.id && c.id === categoryId)
  );

  function changeType(next: TxType) {
    setType(next);
    setCategoryError(null);
    // A category of the other kind no longer fits.
    const chosen = categories.find((c) => c.id === categoryId);
    if (chosen && kindOf(chosen) !== next) setCategoryId("");
  }
  const okDescription = description.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setCategoryError(null);
    setFrequencyError(null);
    if (!okName || !amount || !categoryId || !okDescription || !startDate) return;
    setPending(true);
    const body = {
      name: name.trim(),
      type,
      amount,
      categoryId,
      description: description.trim(),
      unit,
      every,
      startDate,
    };
    try {
      if (item) await api(`/wallet/recurring/${encodeURIComponent(item.id)}`, { method: "PUT", body });
      else await api("/wallet/recurring", { method: "POST", body });
      onDone(item ? "Saved." : startDate <= today ? "Added. Today's one is already in your wallet." : "Added.");
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.field === "categoryId") setCategoryError(fieldErrorText(err));
      else if (err instanceof ApiError && (err.field === "unit" || err.field === "every")) setFrequencyError(fieldErrorText(err));
      else setError(errorMessage(err));
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
        onChange={changeType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />
      <Field data-invalid={touched && !amount}>
        <FieldLabel htmlFor="rec-amount">Amount ($)</FieldLabel>
        <Input id="rec-amount" inputMode="decimal" placeholder="$0.00" value={amountText} onChange={(e) => setAmountText(e.target.value)} className="h-11" />
        {touched && !amount && <FieldError>Enter an amount.</FieldError>}
      </Field>
      <Field data-invalid={(touched && !categoryId) || Boolean(categoryError)}>
        <FieldLabel htmlFor="rec-category">Category</FieldLabel>
        <CategorySelect
          id="rec-category"
          categories={typeCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setCategoryError(null);
          }}
        />
        {touched && !categoryId ? (
          <FieldError>Choose a category.</FieldError>
        ) : (
          categoryError && <FieldError>{categoryError}</FieldError>
        )}
      </Field>
      <Field data-invalid={touched && !okDescription}>
        <FieldLabel htmlFor="rec-description">Description</FieldLabel>
        <Input id="rec-description" maxLength={200} placeholder="e.g. Apartment rent" value={description} onChange={(e) => setDescription(e.target.value)} className="h-11" />
        {touched && !okDescription && <FieldError>Enter a description.</FieldError>}
      </Field>
      <FrequencyPicker
        unit={unit}
        every={every}
        onChange={(u, n) => {
          setUnit(u);
          setEvery(n);
          setFrequencyError(null);
        }}
        error={frequencyError ?? undefined}
      />
      <div data-testid="repeat-start">
        <DateField
          label="First date"
          surface="panel"
          value={startDate || null}
          onChange={(day) => setStartDate(day ?? "")}
          today={today}
          format={dates.day}
          hint="If it is today, the first one is added right away. On the 31st, short months use their last day."
        />
      </div>
      <Button type="submit" size="lg" className="h-11 w-full shrink-0" disabled={pending}>
        {pending ? "Saving…" : item ? "Save" : "Add"}
      </Button>
    </form>
  );
}
