"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  DateField,
  FilterChip,
  IconDelete,
  Segmented,
  SpButton,
  SpField,
  SpInput,
  SpPanel,
  SpSelect,
  SpTextarea,
  CATEGORY_ICON_MAP,
} from "@/components/spine-ui";
import { api, ApiError, errorMessage, fieldErrorText } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { groupByParent } from "@/lib/catalog-types";
import { useDates } from "@/components/prefs/prefs-provider";
import {
  aboutDay,
  balanceAdminPath,
  balancePath,
  defaultNextCut,
  UNIT_LIMITS,
  FREQUENCY_PRESETS,
  guessEmptyDate,
  inWords,
  monthlyCost,
  type Balance,
  type BalanceUnit,
  type BalanceInput,
} from "@/lib/balances-types";
import { daysBetween } from "@/lib/repeat-schedule";
import { formatMoney } from "@/lib/transactions-types";
import { SpLinkButton } from "@/components/transactions/sp-link";

const MONEY_ICON = <span className="text-[1rem] font-medium text-(--sp-text-muted)">$</span>;
const GlobeIcon = CATEGORY_ICON_MAP.globe;

/** "12", "12.5", "1 234,50" → "12.50"; 0 allowed when `zero`; null = not a number. */
function money(raw: string, zero = false): string | null {
  const cleaned = raw.trim().replace(/[\s ']/g, "").replace(",", ".");
  if (!/^\d{1,10}(\.\d{0,2})?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (!(n > 0) && !(zero && n === 0)) return null;
  return n.toFixed(2);
}

/** Custom: "A month" (N times a month), Days, Weeks; Months / Years only for a balance saved that way. */
function kindItems(kind: BalanceUnit) {
  const items = [
    { value: "TIMES_A_MONTH", label: "A month" },
    { value: "DAY", label: "Days" },
    { value: "WEEK", label: "Weeks" },
  ];
  if (kind === "MONTH") items.push({ value: "MONTH", label: "Months" });
  if (kind === "YEAR") items.push({ value: "YEAR", label: "Years" });
  return items;
}

const UNIT_WORD: Record<BalanceUnit, [string, string]> = {
  TIMES_A_MONTH: ["time a month", "times a month"],
  DAY: ["day", "days"],
  WEEK: ["week", "weeks"],
  MONTH: ["month", "months"],
  YEAR: ["year", "years"],
};

type Props = {
  /** null = a new balance. */
  balance: Balance | null;
  /** Active categories (expense ones are offered). */
  categories: Category[];
  today: string;
};

/**
 * Next keeps visited pages alive (hidden). After a save the form starts over
 * on the next visit (new key once the page is hidden), like the transaction form.
 */
export function BalanceForm(props: Props) {
  const [round, setRound] = useState(0);
  const savedRef = useRef(false);
  useLayoutEffect(
    () => () => {
      if (savedRef.current) {
        savedRef.current = false;
        setRound((n) => n + 1);
      }
    },
    []
  );
  return (
    <BalanceFormBody
      key={`${round}|${props.balance?.id ?? "new"}`}
      {...props}
      onSaved={() => {
        savedRef.current = true;
      }}
    />
  );
}

function BalanceFormBody({ balance, categories, today, onSaved }: Props & { onSaved: () => void }) {
  const router = useRouter();
  const dates = useDates();
  const fmt = { today, dateFormat: dates.settings.dateFormat };
  const edit = balance !== null;

  const [name, setName] = useState(balance?.name ?? "");
  const [website, setWebsite] = useState(balance?.website ?? "");
  const [categoryId, setCategoryId] = useState(balance?.category.id ?? "");
  const [start, setStart] = useState("");
  const [cut, setCut] = useState(balance ? Number(balance.cut).toFixed(2) : "");
  const [kind, setKind] = useState<BalanceUnit>(balance?.unit ?? "MONTH");
  const [count, setCount] = useState(balance?.every ?? 1);
  const [countText, setCountText] = useState(String(balance?.every ?? 1));
  const [custom, setCustom] = useState(
    () => !!balance && !FREQUENCY_PRESETS.some((p) => p.unit === balance.unit && p.every === balance.every)
  );
  const [nextCut, setNextCut] = useState<string | null>(balance?.nextCut ?? defaultNextCut(today, "MONTH", 1));
  const [nextTouched, setNextTouched] = useState(edit);
  const [lowLimit, setLowLimit] = useState(balance?.lowLimit ? Number(balance.lowLimit).toFixed(2) : "");
  const [warnDays, setWarnDays] = useState(String(balance?.warnDays ?? 7));
  const [note, setNote] = useState(balance?.note ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expense categories, "Main › Sub", subcategories under their main.
  const options = useMemo(() => {
    const list = categories.filter((c) => !c.archived && (c.kind ?? "EXPENSE") === "EXPENSE");
    const byId = new Map(list.map((c) => [c.id, c]));
    const opts = groupByParent(list).map(({ item, child }) => ({
      value: item.id,
      label: child && item.parentId ? `${byId.get(item.parentId)?.name ?? ""} › ${item.name}` : item.name,
    }));
    // Edit: keep the saved category even if it is archived now.
    if (balance && !opts.some((o) => o.value === balance.category.id)) {
      opts.unshift({ value: balance.category.id, label: balance.category.name });
    }
    return opts;
  }, [categories, balance]);

  const cutValue = money(cut);
  const startValue = edit ? Number(balance.guess).toFixed(2) : money(start, true);
  const lowValue = lowLimit.trim() ? money(lowLimit) : null;
  const lowBad = lowLimit.trim() !== "" && lowValue === null;
  const warn = Number(warnDays);
  const warnBad = !/^\d{1,3}$/.test(warnDays) || warn < 0 || warn > 365;
  const limits = UNIT_LIMITS[kind];
  const ready =
    name.trim() !== "" && !!categoryId && !!cutValue && startValue !== null && !!nextCut && !lowBad && !warnBad && count >= limits.min;

  function setFrequency(k: BalanceUnit, n: number) {
    setKind(k);
    setCount(n);
    // A new balance: "Next cut" follows the choice until the user picks a day.
    if (!nextTouched) setNextCut(defaultNextCut(today, k, n));
  }

  function pickPreset(k: BalanceUnit, n: number) {
    setCustom(false);
    setCountText(String(n));
    setFrequency(k, n);
  }

  function changeCount(raw: string, k = kind) {
    const digits = raw.replace(/\D/g, "").slice(0, 3);
    setCountText(digits);
    if (!digits) return;
    const lim = UNIT_LIMITS[k];
    const n = Math.min(lim.max, Math.max(lim.min, Number(digits)));
    if (Number(digits) > lim.max) setCountText(String(n));
    setFrequency(k, n);
  }

  // Live preview of the guess.
  const preview = (() => {
    if (!cutValue) return null;
    const month = monthlyCost(Number(cutValue), kind, count);
    const empty = startValue !== null && nextCut ? guessEmptyDate(Number(startValue), Number(cutValue), nextCut, kind, count, today) : null;
    let line = "";
    if (empty) {
      const days = daysBetween(today, empty);
      line = Number(startValue) <= 0 ? "Empty now" : days <= 0 ? "Runs out today" : `Runs out in ${inWords(days)}, ${aboutDay(empty, fmt)}`;
    }
    return { month, line };
  })();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || pending) return;
    setPending(true);
    setError(null);
    const body: BalanceInput = {
      name: name.trim(),
      website: website.trim() || null,
      categoryId,
      ...(edit ? {} : { startAmount: startValue! }),
      cut: cutValue!,
      unit: kind,
      every: count,
      nextCut: nextCut!,
      lowLimit: lowValue,
      warnDays: warn,
      note: note.trim() || null,
    };
    try {
      const saved = await api<{ balance?: { id: string } }>(edit ? balanceAdminPath(balance.id) : balanceAdminPath(), {
        method: edit ? "PUT" : "POST",
        body,
      });
      onSaved();
      setPending(false);
      router.replace(balancePath(saved?.balance?.id ?? balance!.id));
      router.refresh();
    } catch (err) {
      setPending(false);
      setError(err instanceof ApiError && err.status === 400 ? fieldErrorText(err) : errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px]" noValidate data-testid="balance-form">
      <SpPanel title="The account">
        <div className="space-y-[16px]">
          <SpField label="Name" htmlFor="b-name">
            <SpInput
              id="b-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g. OpenAI API"
              autoComplete="off"
            />
          </SpField>
          <SpField label="Website" optional htmlFor="b-site" hint="We show the site's logo, like on expenses.">
            <SpInput
              id="b-site"
              icon={<GlobeIcon aria-hidden />}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              inputMode="url"
              autoCapitalize="none"
              autoComplete="off"
              placeholder="e.g. openai.com"
              maxLength={255}
            />
          </SpField>
          <SpField label="Category" htmlFor="b-cat" hint="Recharges are saved as expenses in this category.">
            <SpSelect
              id="b-cat"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="Choose a category"
              options={options}
            />
          </SpField>
        </div>
      </SpPanel>

      <SpPanel title="The money">
        <div className="space-y-[16px]">
          {edit ? (
            <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.75rem] leading-snug text-(--sp-text-2)">
              Guessed now: <span className="font-semibold text-(--sp-text)">{formatMoney(balance.guess)}</span>. To
              change it, use “Fix the real balance” on the balance page.
            </p>
          ) : (
            <SpField
              label="Balance now"
              htmlFor="b-bal"
              hint="What the account shows today."
              error={start.trim() !== "" && startValue === null ? "Please type an amount, like 84.00." : undefined}
            >
              <SpInput
                id="b-bal"
                icon={MONEY_ICON}
                value={start}
                onChange={(e) => setStart(e.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className="tabular-nums"
              />
            </SpField>
          )}
          <SpField
            label="Each cut"
            htmlFor="b-cut"
            hint="How much the account takes each time."
            error={cut.trim() !== "" && !cutValue ? "Please type an amount above 0." : undefined}
          >
            <SpInput
              id="b-cut"
              icon={MONEY_ICON}
              value={cut}
              onChange={(e) => setCut(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="tabular-nums"
            />
          </SpField>

          {/* How often: chips + Custom…, like the repeat expenses. */}
          <div className="space-y-[8px]" role="group" aria-labelledby="b-often-label">
            <p id="b-often-label" className="px-[4px] text-[0.8125rem] leading-snug font-medium text-(--sp-text)">
              How often
            </p>
            <div className="chip-row">
              {FREQUENCY_PRESETS.map((p) => (
                <FilterChip
                  key={p.label}
                  type="button"
                  surface="panel"
                  label={p.label}
                  active={!custom && kind === p.unit && count === p.every}
                  onClick={() => pickPreset(p.unit, p.every)}
                />
              ))}
              <FilterChip
                type="button"
                surface="panel"
                label="Custom…"
                active={custom}
                onClick={() => {
                  setCustom(true);
                  // "Once a month" opens as "1 time a month" (same cost), so the 3 kinds show.
                  if (kind === "MONTH" && count === 1) setFrequency("TIMES_A_MONTH", 1);
                }}
              />
            </div>
            {custom && (
              <div className="space-y-[10px] rounded-[16px] bg-(--sp-soft) p-[10px]">
                <Segmented
                  label="Kind"
                  surface="page"
                  value={kind}
                  onValueChange={(v) => {
                    const k = v as BalanceUnit;
                    const lim = UNIT_LIMITS[k];
                    const n = Math.min(lim.max, Math.max(lim.min, count));
                    setCountText(String(n));
                    setFrequency(k, n);
                  }}
                  items={kindItems(kind)}
                />
                <div className="flex items-center gap-[10px]">
                  {kind === "TIMES_A_MONTH" ? null : (
                    <span className="text-[0.8125rem] font-medium text-(--sp-text)">Every</span>
                  )}
                  <SpInput
                    aria-label="How many"
                    value={countText}
                    onChange={(e) => changeCount(e.target.value)}
                    onBlur={() => setCountText(String(count))}
                    inputMode="numeric"
                    className="w-[84px] shrink-0 bg-(--sp-panel) px-[14px] text-center tabular-nums"
                  />
                  <span className="text-[0.8125rem] text-(--sp-text-muted)">
                    {UNIT_WORD[kind][count === 1 ? 0 : 1]}
                  </span>
                </div>
                <p className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
                  {kind === "TIMES_A_MONTH"
                    ? `${count} ${count === 1 ? "cut" : "cuts"} a month, about every ${Math.max(1, Math.round(30.44 / count))} days.`
                    : `From ${limits.min} to ${limits.max} ${UNIT_WORD[kind][1]}.`}
                </p>
              </div>
            )}
          </div>

          <DateField
            label="Next cut"
            value={nextCut}
            onChange={(d) => {
              setNextTouched(true);
              setNextCut(d);
            }}
            hint="Spine counts the cuts from this day."
            today={today}
            surface="panel"
          />
        </div>
      </SpPanel>

      <SpPanel title="Alerts">
        <div className="space-y-[16px]">
          <SpField
            label="Low limit"
            optional
            htmlFor="b-limit"
            hint="Alert when the guessed balance goes below it."
            error={lowBad ? "Please type an amount above 0, or leave it empty." : undefined}
          >
            <SpInput
              id="b-limit"
              icon={MONEY_ICON}
              value={lowLimit}
              onChange={(e) => setLowLimit(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="tabular-nums"
            />
          </SpField>
          <SpField label="Warn me before it runs out" htmlFor="b-days" error={warnBad ? "From 0 to 365 days." : undefined}>
            <div className="flex items-center gap-[10px]">
              <SpInput
                id="b-days"
                value={warnDays}
                onChange={(e) => setWarnDays(e.target.value.replace(/\D/g, "").slice(0, 3))}
                inputMode="numeric"
                className="w-[84px] shrink-0 px-[14px] text-center tabular-nums"
              />
              <span className="text-[0.8125rem] text-(--sp-text-muted)">days before</span>
            </div>
          </SpField>
          <p className="rounded-[16px] bg-(--sp-soft) px-[14px] py-[12px] text-[0.75rem] leading-snug text-(--sp-text-2)">
            {lowValue ? "3 alerts" : "2 alerts"}, all on: {lowValue ? "below the limit, " : ""}
            {warnBad ? "" : `${warn} ${warn === 1 ? "day" : "days"} before empty, `}and when it reaches $0. Everyone in the
            company sees them.
          </p>
        </div>
      </SpPanel>

      <SpPanel title="Note" description="Optional.">
        <SpTextarea aria-label="Note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </SpPanel>

      {/* Live preview of the guess: white text only on the purple card. */}
      <div
        className="rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] py-[16px] text-(--sp-card-front-text)"
        aria-live="polite"
        data-testid="balance-preview"
      >
        <p className="text-[0.75rem] leading-snug">With these numbers</p>
        <p className="mt-[6px] text-[1.25rem] leading-snug font-semibold tabular-nums">
          {preview ? `${formatMoney(preview.month)} a month` : "—"}
        </p>
        <p className="mt-[2px] text-[0.75rem] leading-snug">
          {preview?.line || "Type the cut and how often to see when it runs out."}
        </p>
      </div>

      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}

      {edit && <DeleteBalance id={balance.id} name={balance.name} onDeleted={onSaved} />}

      <div className="sticky bottom-0 z-10 -mx-(--sp-gutter) bg-linear-to-t from-(--sp-bg) from-70% to-transparent px-(--sp-gutter) pt-[20px] pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <div className="grid grid-cols-[1fr_2fr] gap-[8px]">
          <SpLinkButton href={edit ? balancePath(balance.id) : "/balances"} variant="secondary" size="lg">
            Cancel
          </SpLinkButton>
          <SpButton type="submit" disabled={!ready || pending} data-testid="balance-save">
            {pending ? "Saving…" : edit ? "Save" : "Add balance"}
          </SpButton>
        </div>
      </div>
    </form>
  );
}

function DeleteBalance({ id, name, onDeleted }: { id: string; name: string; onDeleted: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api(balanceAdminPath(id), { method: "DELETE" });
      onDeleted();
      // The page stays alive (hidden): close the sheet now, so Back never shows "Deleting…".
      setPending(false);
      setOpen(false);
      router.replace("/balances");
      router.refresh();
    } catch (err) {
      setPending(false);
      setOpen(false);
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <SpButton
        type="button"
        variant="danger"
        className="w-full"
        icon={<IconDelete aria-hidden />}
        onClick={() => setOpen(true)}
        data-testid="balance-delete"
      >
        Delete balance
      </SpButton>
      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
      <BottomSheet
        open={open}
        onOpenChange={(next) => !next && !pending && setOpen(false)}
        title={`Delete ${name}?`}
        description="The balance and its alerts go away. The expenses from its recharges stay in Transactions."
        footer={
          <div className="grid grid-cols-2 gap-[8px]">
            <SpButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SpButton>
            <SpButton variant="danger" onClick={confirm} disabled={pending} data-testid="balance-delete-confirm">
              {pending ? "Deleting…" : "Delete"}
            </SpButton>
          </div>
        }
      >
        {null}
      </BottomSheet>
    </>
  );
}

