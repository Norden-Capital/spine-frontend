"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AmountField,
  BottomSheet,
  DateField,
  IconAdd,
  IconCalendarRepeat,
  Segmented,
  SpButton,
  SpField,
  SpInput,
} from "@/components/spine-ui";
import { PageEmpty } from "@/components/nav/page-empty";
import { useDates } from "@/components/prefs/prefs-provider";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { CategoryPicker } from "@/components/expenses/category-picker";
import { TxLogo } from "@/components/expenses/tx-logo";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { parseAmountInput, type TxType } from "@/lib/transactions-types";
import { duePath, type CompanyRecurring, type Occurrence } from "@/lib/recurring-types";
import type { RepeatUnit } from "@/lib/repeat-schedule";
import { cn } from "@/lib/utils";
import { FrequencyPicker } from "./frequency-picker";
import { RepeatRow } from "./repeat-row";
import { RepeatSheet, type RepeatView } from "./repeat-sheet";
import { SkipOccurrence } from "./skip-occurrence";

const MAX_DESCRIPTION = 200;
/** Same limit as parseAmountInput: up to 10 whole digits. */
const MAX_WHOLE = 9_999_999_999;

/** The category's kind (older API answers have none: expense). */
const kindOf = (c: { kind?: TxType }): TxType => c.kind ?? "EXPENSE";

/**
 * Company repeat expenses (reminders only). Everyone sees the list and may
 * add the expense from a reminder; the owner (`canManage`) also adds, edits,
 * pauses, deletes and skips.
 */
export function CompanyRecurringManager({
  items,
  due,
  categories,
  today,
  canManage,
}: {
  items: CompanyRecurring[];
  /** Reminders waiting now (GET /api/recurring/due), oldest first. */
  due: Occurrence[];
  categories: Category[];
  today: string;
  canManage: boolean;
}) {
  const router = useRouter();
  // The list on screen: server data, replaced item by item by the sheet's answers.
  const [list, setList] = useState(items);
  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setList(items);
  }
  const [edit, setEdit] = useState<{ item: CompanyRecurring | null } | null>(null);
  const [remove, setRemove] = useState<CompanyRecurring | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const sheetItem = list.find((r) => r.id === sheetId) ?? null;

  const reload = (id: string) => api<CompanyRecurring>(`/recurring/${encodeURIComponent(id)}`);

  /** 409 occurrence_exists: the reminder is already there, so skip the reminder ("Skip this time"). */
  async function skipExisting(item: CompanyRecurring, date: string): Promise<CompanyRecurring> {
    let occurrence = due.find((o) => o.recurringId === item.id && o.dueDate === date);
    if (!occurrence) {
      const fresh = await api<Occurrence[]>("/recurring/due");
      occurrence = fresh.find((o) => o.recurringId === item.id && o.dueDate === date);
    }
    if (!occurrence) {
      throw new ApiError(409, "occurrence_exists", "The reminder for this date is already there. Open it from Alerts to skip it.");
    }
    await api(`/admin/recurring/occurrences/${encodeURIComponent(occurrence.id)}/skip`, { method: "POST" });
    return reload(item.id);
  }

  function updated(next: CompanyRecurring) {
    setList((l) => l.map((r) => (r.id === next.id ? next : r)));
    // Reminders waiting (the "Add expense" buttons, Home) may change too.
    router.refresh();
  }

  async function confirmRemove() {
    if (!remove) return;
    setBusy("remove");
    setNotice(null);
    try {
      await api(`/admin/recurring/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      setNotice({ kind: "ok", text: `"${remove.description}" deleted. Saved expenses stay.` });
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
      {canManage && (
        <SpButton icon={<IconAdd />} className="w-full" onClick={() => setEdit({ item: null })} data-testid="recurring-add">
          Add a repeat expense
        </SpButton>
      )}
      {notice && <NoticeBox notice={notice} />}
      {list.length === 0 ? (
        <PageEmpty
          icon={<IconCalendarRepeat />}
          title="Nothing repeats yet"
          text={
            canManage
              ? "Add rent or a subscription once. You get a reminder on each date."
              : "The owner can add rent or subscriptions here."
          }
        />
      ) : (
        <ul className="flex flex-col gap-[12px]" data-testid="recurring-list">
          {list.map((r) => {
            const first = due.find((o) => o.recurringId === r.id) ?? null;
            return (
              <RepeatRow
                key={r.id}
                view={companyView(r, first?.dueDate)}
                today={today}
                onMore={() => {
                  setSheetId(r.id);
                  setSheetOpen(true);
                }}
              >
                {/* Everyone may add the expense from a reminder; only the owner skips. */}
                {first && (
                  <div className={canManage ? "grid grid-cols-2 gap-[8px] pr-[8px]" : "grid grid-cols-1 pr-[8px]"}>
                    <SpLinkButton href={duePath(first.id)} data-testid="recurring-add-expense">
                      Add expense
                    </SpLinkButton>
                    {canManage && <SkipOccurrence id={first.id} dueDate={first.dueDate} onDone={setNotice} />}
                  </div>
                )}
              </RepeatRow>
            );
          })}
        </ul>
      )}

      <RepeatSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={sheetItem}
        view={(r) => companyView(r, due.find((o) => o.recurringId === r.id)?.dueDate)}
        basePath="/admin/recurring"
        today={today}
        canManage={canManage}
        onUpdated={updated}
        reload={reload}
        onSkipExists={skipExisting}
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

      {canManage && (
        <>
          <BottomSheet
            open={edit !== null}
            onOpenChange={(open) => !open && setEdit(null)}
            title={edit?.item ? "Edit repeat expense" : "Add a repeat expense"}
            description="You get a reminder on each date. Nothing is added by itself."
          >
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
          </BottomSheet>

          <ConfirmSheet
            open={removeOpen}
            onOpenChange={setRemoveOpen}
            title={`Delete "${remove?.description ?? ""}"?`}
            text="Its reminders go away. Expenses already saved stay."
            confirm="Delete"
            destructive
            busy={busy === "remove"}
            busyLabel="Deleting…"
            onConfirm={() => void confirmRemove()}
          />
        </>
      )}
    </div>
  );
}

/** What the row and the sheet show for a company item. */
/**
 * The backend's nextDate is the next date WITHOUT a reminder yet, and it makes
 * reminders early. So when a reminder is waiting (from /due, or an upcoming
 * date with status DUE), that date is the real "next": the row shows its
 * badge (Today / Tomorrow / Overdue) and "Skip next" targets it (the sheet then
 * falls back to "Skip this time" on 409 occurrence_exists).
 */
function companyView(r: CompanyRecurring, waitingDueDate?: string): RepeatView {
  const upcomingDue = (r.upcoming ?? []).find((u) => u.status === "DUE")?.date;
  return {
    id: r.id,
    name: r.description || r.category.name,
    amount: r.amount,
    type: r.type,
    unit: r.unit,
    every: r.every,
    nextDate: waitingDueDate ?? upcomingDue ?? r.nextDate,
    paused: r.paused,
    pausedUntil: r.pausedUntil ?? null,
    upcoming: r.upcoming ?? [],
    logo: <TxLogo logoUrls={r.logoUrls} icon={r.category.icon} />,
  };
}

/** "12.50" +1 → "13.50"; "" +1 → "1"; never below 0. */
function stepAmount(raw: string, delta: 1 | -1): string {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  const m = /^(\d{0,10})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!m) return raw;
  const whole = Number(m[1] || "0") + delta;
  if (whole < 0) return raw;
  const cents = (m[2] ?? "").padEnd(2, "0");
  return Number(cents) ? `${Math.min(MAX_WHOLE, whole)}.${cents}` : String(Math.min(MAX_WHOLE, whole));
}

/** Add / edit form (in the bottom sheet). Full replace on edit (PUT). */
function RecurringForm({
  item,
  categories,
  today,
  onDone,
}: {
  item: CompanyRecurring | null;
  categories: Category[];
  today: string;
  onDone: (text: string) => void;
}) {
  const ids = useId();
  const dates = useDates();
  const [type, setType] = useState<TxType>(item?.type ?? "EXPENSE");
  const [amountText, setAmountText] = useState(item?.amount ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(item?.category.id ?? null);
  const [website, setWebsite] = useState(item?.website ?? "");
  const [unit, setUnit] = useState<RepeatUnit>(item?.unit ?? "MONTH");
  const [every, setEvery] = useState(item?.every ?? 1);
  const [startDate, setStartDate] = useState(item?.startDate ?? today);
  const [endDate, setEndDate] = useState(item?.endDate ?? "");
  const [touched, setTouched] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ field: string; text: string } | null>(null);

  // The saved category stays in the list even if archived since.
  const all: (Category & { kind?: TxType })[] =
    item && !categories.some((c) => c.id === item.category.id) ? [...categories, item.category] : categories;
  // Only categories of the chosen type (expense / income).
  const pickerCategories = all.filter((c) => kindOf(c) === type);

  const amount = parseAmountInput(amountText);
  const okDescription = description.trim().length > 0;
  const badEnd = Boolean(endDate) && Boolean(startDate) && endDate < startDate;
  const ready = Boolean(amount && okDescription && categoryId && startDate && !badEnd);

  function changeType(next: TxType) {
    setType(next);
    // A category of the other kind no longer fits.
    const chosen = all.find((c) => c.id === categoryId);
    if (chosen && kindOf(chosen) !== next) setCategoryId(null);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setFieldError(null);
    if (!ready || !amount || !categoryId) return;
    setPending(true);
    const body = {
      type,
      amount,
      description: description.trim(),
      categoryId,
      website: website.trim() || null,
      unit,
      every,
      startDate,
      endDate: endDate || null,
    };
    try {
      if (item) await api(`/admin/recurring/${encodeURIComponent(item.id)}`, { method: "PUT", body });
      else await api("/admin/recurring", { method: "POST", body });
      onDone(item ? "Saved." : "Added. You get a reminder on each date.");
    } catch (err) {
      setPending(false);
      if (err instanceof ApiError && err.field) {
        // "categoryId: this is an expense category; pick …" → show the backend's words under the field.
        const raw = typeof err.data?.message === "string" ? (err.data.message as string) : "";
        const text = raw.replace(/^[A-Za-z][\w.]*:\s*/, "");
        setFieldError({ field: err.field, text: text ? text.charAt(0).toUpperCase() + text.slice(1) : err.message });
      } else setError(errorMessage(err));
    }
  }

  const errorFor = (field: string) => (fieldError?.field === field ? fieldError.text : undefined);
  const amountError = touched && !amount ? "Enter an amount, like 12.50." : errorFor("amount");
  const descriptionError = touched && !okDescription ? "Enter a description." : errorFor("description");
  const categoryError = touched && !categoryId ? "Pick a category." : errorFor("categoryId");
  const endError = badEnd ? "The end date can't be before the start date." : errorFor("endDate");

  return (
    <form onSubmit={submit} className="flex flex-col gap-[16px] pt-[4px]" noValidate data-testid="recurring-form">
      {error && <NoticeBox notice={{ kind: "error", text: error }} />}

      <Segmented
        label="Type"
        surface="panel"
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
          onStep={(delta) => setAmountText((t) => stepAmount(t, delta))}
          aria-invalid={Boolean(amountError) || undefined}
          className={cn(amountError && "ring-2 ring-(--sp-danger)")}
        />
        {amountError && <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">{amountError}</p>}
      </div>

      <SpField label="Description" htmlFor={`${ids}-description`} error={descriptionError}>
        <SpInput
          id={`${ids}-description`}
          surface="panel"
          autoComplete="off"
          placeholder="e.g. Office rent"
          maxLength={MAX_DESCRIPTION}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={Boolean(descriptionError) || undefined}
        />
      </SpField>

      <div className="space-y-[8px]">
        <CategoryPicker
          categories={pickerCategories}
          value={categoryId}
          onChange={setCategoryId}
          invalid={Boolean(categoryError)}
        />
        {categoryError && <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">{categoryError}</p>}
      </div>

      <SpField
        label="Website"
        htmlFor={`${ids}-website`}
        optional
        hint="We show the shop's logo."
        error={fieldError?.field === "website" ? "Enter a website like example.com." : undefined}
      >
        <SpInput
          id={`${ids}-website`}
          surface="panel"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. aws.amazon.com"
          maxLength={2048}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-invalid={fieldError?.field === "website" || undefined}
        />
      </SpField>

      <FrequencyPicker
        unit={unit}
        every={every}
        onChange={(u, n) => {
          setUnit(u);
          setEvery(n);
          if (fieldError?.field === "unit" || fieldError?.field === "every") setFieldError(null);
        }}
        error={errorFor("unit") ?? errorFor("every")}
      />

      <div data-testid="repeat-start">
        <DateField
          label="Start date"
          surface="panel"
          value={startDate || null}
          onChange={(day) => setStartDate(day ?? "")}
          today={today}
          format={dates.day}
          hint="Past dates get no reminder. A monthly one on the 31st uses the last day in short months."
          error={errorFor("startDate")}
        />
      </div>

      <div data-testid="repeat-end">
        <DateField
          label="End date"
          surface="panel"
          optional
          value={endDate || null}
          onChange={(day) => setEndDate(day ?? "")}
          min={startDate || undefined}
          today={today}
          format={dates.day}
          error={endError}
        />
      </div>

      <div className="sticky bottom-0 -mb-[12px] bg-linear-to-t from-(--sp-sheet) from-75% to-transparent pt-[16px] pb-[12px]">
        <SpButton type="submit" className="w-full" disabled={pending} data-testid="recurring-save">
          {pending ? "Saving…" : item ? "Save" : "Add"}
        </SpButton>
      </div>
    </form>
  );
}
