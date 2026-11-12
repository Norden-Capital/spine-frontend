"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BottomSheet, DateField, IconAdd, IconCalendarRepeat, SpButton, SpField, SpInput } from "@/components/spine-ui";
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
  // The sheet keeps the last item while it slides away (no title flash).
  const [edit, setEdit] = useState<{ item: Recurring | null; open: boolean }>({ item: null, open: false });
  const [editPending, setEditPending] = useState(false);
  // Each opening starts a fresh form (new key).
  const [editRound, setEditRound] = useState(0);
  const [remove, setRemove] = useState<Recurring | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
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
    setRemoveError(null);
    try {
      await api(`/wallet/recurring/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      setNotice({ kind: "ok", text: `"${remove.name}" removed. Transactions it made stay.` });
      setRemoveOpen(false);
    } catch (err) {
      setRemoveError(errorMessage(err));
    } finally {
      setBusy(null);
      router.refresh();
    }
  }

  function openEdit(item: Recurring | null) {
    setEditPending(false);
    setEditRound((r) => r + 1);
    setEdit({ item, open: true });
  }

  return (
    <div className="flex flex-col gap-[16px]">
      <SpButton icon={<IconAdd />} className="w-full" onClick={() => openEdit(null)} data-testid="wallet-recurring-add">
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
          openEdit(sheetItem);
        }}
        onDelete={() => {
          setSheetOpen(false);
          setRemove(sheetItem);
          setRemoveError(null);
          setRemoveOpen(true);
        }}
      />

      <BottomSheet
        open={edit.open}
        onOpenChange={(open) => {
          if (!open && editPending) return;
          setEdit((e) => ({ ...e, open }));
        }}
        className="sp-space-wallet"
        title={edit.item ? "Edit recurring item" : "Add a recurring item"}
        description="It is added to your wallet on each date."
        footer={
          <SpButton
            type="submit"
            form="wallet-recurring-form"
            className="w-full"
            disabled={editPending}
            data-testid="wallet-recurring-save"
          >
            {editPending ? "Saving…" : edit.item ? "Save" : "Add"}
          </SpButton>
        }
      >
        {editRound > 0 && (
          <RecurringForm
            key={`${edit.item?.id ?? "new"}-${editRound}`}
            id="wallet-recurring-form"
            item={edit.item}
            categories={categories}
            today={today}
            onPending={setEditPending}
            onDone={(text) => {
              setEditPending(false);
              setEdit((e) => ({ ...e, open: false }));
              setNotice({ kind: "ok", text });
              router.refresh();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmSheet
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove "${remove?.name ?? ""}"?`}
        text="Nothing new is added. Transactions it already made stay."
        confirm="Remove"
        destructive
        busy={busy === "remove"}
        busyLabel="Removing…"
        error={removeError}
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
  };
}

function RecurringForm({
  id,
  item,
  categories,
  today,
  onPending,
  onDone,
}: {
  id: string;
  item: Recurring | null;
  categories: Category[];
  today: string;
  onPending: (pending: boolean) => void;
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
    onPending(true);
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
      onPending(false);
      if (err instanceof ApiError && err.field === "categoryId") setCategoryError(fieldErrorText(err));
      else if (err instanceof ApiError && (err.field === "unit" || err.field === "every")) setFrequencyError(fieldErrorText(err));
      else setError(errorMessage(err));
    }
  }

  return (
    <form id={id} onSubmit={submit} className="flex flex-col gap-[14px] pt-[4px]" noValidate data-testid="wallet-recurring-form">
      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
      <SpField label="Name" htmlFor="rec-name" error={touched && !okName ? "Enter a name." : undefined}>
        <SpInput
          id="rec-name"
          surface="panel"
          maxLength={60}
          placeholder="e.g. Rent"
          value={name}
          aria-invalid={touched && !okName}
          onChange={(e) => setName(e.target.value)}
        />
      </SpField>
      <Segmented
        label="Type"
        value={type}
        onChange={changeType}
        options={[
          { value: "EXPENSE", label: "Expense" },
          { value: "INCOME", label: "Income" },
        ]}
      />
      <SpField label="Amount" htmlFor="rec-amount" error={touched && !amount ? "Enter an amount." : undefined}>
        <SpInput
          id="rec-amount"
          surface="panel"
          inputMode="decimal"
          placeholder="0.00"
          value={amountText}
          aria-invalid={touched && !amount}
          icon={<span className="text-[0.9375rem] font-medium">$</span>}
          onChange={(e) => setAmountText(e.target.value)}
        />
      </SpField>
      {/* The select is white like the sheet: give it the soft fill used by the other inputs here. */}
      <SpField
        label="Category"
        htmlFor="rec-category"
        error={touched && !categoryId ? "Choose a category." : (categoryError ?? undefined)}
      >
        <CategorySelect
          id="rec-category"
          categories={typeCategories}
          value={categoryId}
          onChange={(id) => {
            setCategoryId(id);
            setCategoryError(null);
          }}
        />
      </SpField>
      <SpField
        label="Description"
        htmlFor="rec-description"
        error={touched && !okDescription ? "Enter a description." : undefined}
      >
        <SpInput
          id="rec-description"
          surface="panel"
          maxLength={200}
          placeholder="e.g. Apartment rent"
          value={description}
          aria-invalid={touched && !okDescription}
          onChange={(e) => setDescription(e.target.value)}
        />
      </SpField>
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
    </form>
  );
}
