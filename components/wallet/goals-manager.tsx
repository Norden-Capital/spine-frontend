"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useId, useState, type ReactNode, type Ref } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGrip } from "@/components/catalog/catalog-dnd";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  DateField,
  IconAdd,
  IconChevronDown,
  IconDelete,
  IconEdit,
  IconGoal,
  IconButton,
  IconMinus,
  IconRestore,
  IconWarning,
  SpButton,
  SpField,
  SpInput,
  SpMoney,
} from "@/components/spine-ui";
import { api, ApiError, errorMessage } from "@/lib/api";
import { formatMoney, parseAmountInput } from "@/lib/transactions-types";
import type { Contribution, Goal } from "@/lib/wallet-types";
import { walletChanged } from "@/lib/wallet-actions";
import { nextDay } from "@/lib/repeat-schedule";
import { useDates } from "@/components/prefs/prefs-provider";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox } from "@/components/admin/notice";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress";

/** "$1,234.00", or "−$20.00" below 0. */
function plainMoney(amount: string | number): string {
  return formatMoney(amount, Number(amount) < 0 ? "-" : undefined);
}

/**
 * Savings goals: target, optional deadline, money moves. Money added to a goal
 * leaves the wallet balance; taking it out (or removing a move) gives it back.
 */
export function GoalsManager({
  goals,
  today,
  available,
}: {
  goals: Goal[];
  today: string;
  /** The wallet's AVAILABLE balance (dashboard `balance`); null = not known. */
  available: string | null;
}) {
  const router = useRouter();
  const dates = useDates();
  // The sheet keeps the last goal while it slides away (no title flash).
  const [edit, setEdit] = useState<{ goal: Goal | null; open: boolean }>({
    goal: null,
    open: false,
  });
  const [openId, setOpenId] = useState<string | null>(goals[0]?.id ?? null);
  const [remove, setRemove] = useState<Goal | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  // Add money / take money out (kept while the sheet slides away).
  const [move, setMove] = useState<{
    goal: Goal | null;
    kind: MoveKind;
    open: boolean;
  }>({
    goal: null,
    kind: "add",
    open: false,
  });
  // A money move to undo (kept while the sheet slides away).
  const [money, setMoney] = useState<{ goal: Goal; item: Contribution } | null>(
    null,
  );
  const [moneyOpen, setMoneyOpen] = useState(false);
  const [moneyBusy, setMoneyBusy] = useState(false);
  const [moneyError, setMoneyError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);
  // The order shown right after a drag, until the page data catches up.
  const [order, setOrder] = useState<{ from: Goal[]; ids: string[] } | null>(
    null,
  );
  const [sorting, setSorting] = useState(false);
  const dndId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Long-press: a normal swipe on the grip still scrolls the page.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const shown =
    order && order.from === goals
      ? order.ids
          .map((id) => goals.find((g) => g.id === id))
          .filter((g): g is Goal => Boolean(g))
      : goals;

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = shown.map((g) => g.id);
    const next = arrayMove(
      ids,
      ids.indexOf(String(active.id)),
      ids.indexOf(String(over.id)),
    );
    setOrder({ from: goals, ids: next });
    setNotice(null);
    setSorting(true);
    try {
      await api("/wallet/goals/order", { method: "PUT", body: { ids: next } });
    } catch (err) {
      setOrder(null);
      setNotice({ kind: "error", text: errorMessage(err) });
      setSorting(false);
      return;
    }
    setSorting(false);
    await refreshWallet();
  }

  /** Make the goals page, the wallet Balance card and the Savings card fresh. */
  async function refreshWallet() {
    try {
      await walletChanged("/wallet/goals");
    } catch {
      // The server step failed (network): still reload this page's data.
      router.refresh();
    }
  }

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    setRemoveError(null);
    try {
      await api(`/wallet/goals/${encodeURIComponent(remove.id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      setBusy(false);
      setRemoveError(errorMessage(err));
      router.refresh();
      return;
    }
    setBusy(false);
    setRemoveOpen(false);
    setNotice({ kind: "ok", text: `"${remove.name}" removed.` });
    await refreshWallet();
  }

  async function confirmRemoveMoney() {
    if (!money) return;
    setMoneyBusy(true);
    setMoneyError(null);
    try {
      await api(
        `/wallet/goals/${encodeURIComponent(money.goal.id)}/contributions/${encodeURIComponent(money.item.id)}`,
        { method: "DELETE" },
      );
    } catch (err) {
      setMoneyBusy(false);
      setMoneyError(
        err instanceof ApiError && err.code === "not_enough_saved"
          ? "Some of this money was already taken out. Undo that first."
          : errorMessage(err),
      );
      return;
    }
    setMoneyBusy(false);
    setMoneyOpen(false);
    setNotice({
      kind: "ok",
      text:
        money.item.type === "TAKE_OUT"
          ? "Undone. The money is in the goal again."
          : "Removed. The money is back in your balance.",
    });
    await refreshWallet();
  }

  const undoTakeOut = money?.item.type === "TAKE_OUT";

  return (
    <div className="flex flex-col gap-[12px]">
      <SpButton
        className="w-full"
        icon={<IconAdd aria-hidden />}
        onClick={() => setEdit({ goal: null, open: true })}
        data-testid="goal-add"
      >
        Add a goal
      </SpButton>
      {notice && <NoticeBox notice={notice} />}
      {goals.length === 0 ? (
        <PageEmpty
          icon={<IconGoal />}
          title="No goals yet"
          text="Save for a trip, a phone, or a rainy day."
        />
      ) : (
        <DndContext
          id={dndId}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={shown.map((g) => g.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="flex flex-col gap-[12px]">
              {shown.map((g) => {
                const open = openId === g.id;
                const left = Number(g.target) - Number(g.saved);
                const hasMoney = Number(g.saved) > 0;
                return (
                  <SortableGoal
                    key={g.id}
                    id={g.id}
                    name={g.name}
                    busy={sorting}
                  >
                    {(grip) => (
                      <>
                        <div className="flex min-h-[52px] items-center gap-[2px]">
                          {grip}
                          <button
                            type="button"
                            aria-expanded={open}
                            onClick={() => setOpenId(open ? null : g.id)}
                            className="-mr-[6px] flex min-h-[52px] min-w-0 flex-1 items-center gap-[10.8px] rounded-2xl px-[6px] py-[4px] text-left transition outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring) motion-reduce:transition-none"
                          >
                            <span className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--sp-card-front)_14%,var(--sp-panel))] text-(--sp-card-front) [&_svg]:size-[15px]">
                              <IconGoal aria-hidden />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.9375rem] leading-normal font-medium text-(--sp-text)">
                                {g.name}
                              </span>
                              <span className="mt-[2px] block text-[0.6875rem] leading-snug text-(--sp-text-muted) tabular-nums">
                                {formatMoney(g.saved)} of{" "}
                                {formatMoney(g.target)} · {g.percent}%
                                {g.deadline
                                  ? ` · by ${dates.day(g.deadline)}`
                                  : ""}
                              </span>
                            </span>
                            <IconChevronDown
                              className={cn(
                                "size-[18px] shrink-0 text-(--sp-text-faint) transition-transform motion-reduce:transition-none",
                                open && "rotate-180",
                              )}
                              aria-hidden
                            />
                          </button>
                        </div>
                        <ProgressBar
                          percent={g.percent}
                          label={`${g.name}: ${g.percent}% saved`}
                        />
                        {open && (
                          <div className="flex flex-col gap-[14px] border-t border-(--sp-soft) pt-[14px]">
                            <p className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted)">
                              {left > 0
                                ? `${formatMoney(left)} to go.`
                                : "Goal reached!"}
                            </p>
                            <div className="flex flex-col gap-[8px]">
                              <SpButton
                                className="w-full"
                                icon={<IconAdd aria-hidden />}
                                onClick={() =>
                                  setMove({ goal: g, kind: "add", open: true })
                                }
                                data-testid="goal-money-add"
                              >
                                Add money
                              </SpButton>
                              <SpButton
                                className="w-full"
                                variant="secondary"
                                size="md"
                                icon={<IconMinus aria-hidden />}
                                disabled={!hasMoney}
                                onClick={() =>
                                  setMove({ goal: g, kind: "out", open: true })
                                }
                                data-testid="goal-money-out"
                              >
                                Take money out
                              </SpButton>
                            </div>
                            {g.contributions.length > 0 && (
                              <ul
                                className="flex flex-col rounded-[16px] bg-(--sp-soft) p-[4px]"
                                data-testid="goal-moves"
                              >
                                {g.contributions.map((c) => {
                                  const out = c.type === "TAKE_OUT";
                                  return (
                                    <li
                                      key={c.id}
                                      data-testid="goal-move"
                                      data-kind={out ? "out" : "in"}
                                      className="flex min-h-[52px] items-center gap-[8px] py-[4px] pr-[4px] pl-[12px]"
                                    >
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[0.8125rem] leading-normal">
                                          <SpMoney
                                            direction={out ? "out" : "in"}
                                            className="font-medium"
                                          >
                                            {formatMoney(
                                              c.amount,
                                              out ? "-" : "+",
                                            )}
                                          </SpMoney>
                                          <span className="text-(--sp-text)">
                                            {out
                                              ? " back to balance"
                                              : " to goal"}
                                          </span>
                                          <span className="text-(--sp-text-muted)">
                                            {" "}
                                            · {dates.day(c.date)}
                                          </span>
                                        </span>
                                        {c.note && (
                                          <span className="block truncate text-[0.6875rem] leading-normal text-(--sp-text-muted)">
                                            {c.note}
                                          </span>
                                        )}
                                      </span>
                                      <IconButton
                                        variant="ghost"
                                        label={
                                          out
                                            ? "Undo this take out"
                                            : "Remove this money"
                                        }
                                        icon={
                                          out ? (
                                            <IconRestore aria-hidden />
                                          ) : (
                                            <IconDelete aria-hidden />
                                          )
                                        }
                                        data-testid="goal-move-undo"
                                        onClick={() => {
                                          setMoney({ goal: g, item: c });
                                          setMoneyError(null);
                                          setMoneyOpen(true);
                                        }}
                                      />
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            <div className="grid grid-cols-2 gap-[8px]">
                              <SpButton
                                variant="secondary"
                                size="md"
                                icon={<IconEdit aria-hidden />}
                                onClick={() => setEdit({ goal: g, open: true })}
                              >
                                Edit
                              </SpButton>
                              <SpButton
                                variant="danger"
                                size="md"
                                icon={<IconDelete aria-hidden />}
                                onClick={() => {
                                  setRemove(g);
                                  setRemoveError(null);
                                  setRemoveOpen(true);
                                }}
                              >
                                Remove
                              </SpButton>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SortableGoal>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <GoalSheet
        open={edit.open}
        onOpenChange={(open) => setEdit((e) => ({ ...e, open }))}
        goal={edit.goal}
        today={today}
        onSaved={(text) => {
          setNotice({ kind: "ok", text });
        }}
      />

      <MoveSheet
        open={move.open}
        onOpenChange={(open) => setMove((m) => ({ ...m, open }))}
        goal={move.goal}
        kind={move.kind}
        today={today}
        available={available}
        onDone={async (text) => {
          setNotice({ kind: "ok", text });
          await refreshWallet();
        }}
      />

      <ConfirmSheet
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={`Remove "${remove?.name ?? ""}"?`}
        text={
          remove && Number(remove.saved) > 0
            ? `The goal and its money moves are deleted. Its ${formatMoney(remove.saved)} goes back to your balance.`
            : "The goal is deleted."
        }
        confirm="Remove"
        destructive
        busy={busy}
        busyLabel="Removing…"
        error={removeError}
        onConfirm={() => void confirmRemove()}
      />

      <ConfirmSheet
        open={moneyOpen}
        onOpenChange={setMoneyOpen}
        title={undoTakeOut ? "Undo this?" : "Remove this money?"}
        text={
          money
            ? undoTakeOut
              ? `${formatMoney(money.item.amount)} from ${dates.day(money.item.date)} goes back into "${money.goal.name}" and leaves your balance.`
              : `${formatMoney(money.item.amount)} from ${dates.day(money.item.date)} leaves "${money.goal.name}" and goes back to your balance.`
            : ""
        }
        confirm={undoTakeOut ? "Undo" : "Remove"}
        destructive
        busy={moneyBusy}
        busyLabel={undoTakeOut ? "Undoing…" : "Removing…"}
        error={moneyError}
        onConfirm={() => void confirmRemoveMoney()}
      />
    </div>
  );
}

export type GoalSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = a new goal ("Set a goal"). */
  goal?: Goal | null;
  /** My today, "YYYY-MM-DD" (todayIn(zone)). */
  today: string;
  /** After a save (the page is refreshed already). */
  onSaved?: (text: string) => void;
};

/**
 * Add / edit a savings goal in a bottom sheet: name, target, deadline
 * (optional). Used on the Goals page and on the wallet dashboard ("Set a goal").
 */
export function GoalSheet({
  open,
  onOpenChange,
  goal = null,
  today,
  onSaved,
}: GoalSheetProps) {
  const router = useRouter();
  const formId = `goal-form-${goal?.id ?? "new"}`;
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
      title={goal ? "Edit goal" : "Set a goal"}
      description="Save for something. Add money to it when you can."
      footer={
        <SpButton
          type="submit"
          form={formId}
          className="w-full"
          disabled={pending}
          data-testid="goal-save"
        >
          {pending ? "Saving…" : goal ? "Save" : "Create goal"}
        </SpButton>
      }
    >
      {round > 0 && (
        <GoalForm
          key={`${goal?.id ?? "new"}-${round}`}
          id={formId}
          goal={goal}
          today={today}
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

function GoalForm({
  id,
  goal,
  today,
  onPending,
  onDone,
}: {
  id: string;
  goal: Goal | null;
  today: string;
  onPending: (pending: boolean) => void;
  onDone: (text: string) => void;
}) {
  const dates = useDates();
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target ?? "");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = parseAmountInput(target);
  const trimmed = name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!trimmed || !amount) return;
    onPending(true);
    const body = { name: trimmed, target: amount, deadline: deadline || null };
    try {
      if (goal)
        await api(`/wallet/goals/${encodeURIComponent(goal.id)}`, {
          method: "PUT",
          body,
        });
      else await api("/wallet/goals", { method: "POST", body });
      onPending(false);
      onDone(goal ? "Goal saved." : "Goal added.");
    } catch (err) {
      onPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <form
      id={id}
      onSubmit={submit}
      className="flex flex-col gap-[14px] pt-[4px]"
      noValidate
      data-testid="goal-form"
    >
      {error && (
        <p
          role="alert"
          className="px-[4px] text-[0.8125rem] text-(--sp-danger)"
        >
          {error}
        </p>
      )}
      <SpField
        label="Name"
        htmlFor="goal-name"
        error={touched && !trimmed ? "Enter a name." : undefined}
      >
        <SpInput
          id="goal-name"
          surface="panel"
          maxLength={60}
          placeholder="e.g. Summer trip"
          value={name}
          aria-invalid={touched && !trimmed}
          onChange={(e) => setName(e.target.value)}
        />
      </SpField>
      <SpField
        label="Target"
        htmlFor="goal-target"
        error={touched && !amount ? "Enter an amount, like 2000." : undefined}
      >
        <SpInput
          id="goal-target"
          surface="panel"
          inputMode="decimal"
          placeholder="0.00"
          value={target}
          aria-invalid={touched && !amount}
          icon={<span className="text-[0.9375rem] font-medium">$</span>}
          onChange={(e) => setTarget(e.target.value)}
        />
      </SpField>
      <div data-testid="goal-deadline">
        <DateField
          label="Deadline"
          surface="panel"
          optional
          value={deadline || null}
          onChange={(day) => setDeadline(day ?? "")}
          min={nextDay(today)}
          today={today}
          format={dates.day}
          placeholder="No deadline"
        />
      </div>
    </form>
  );
}

type MoveKind = "add" | "out";

/**
 * Add money to a goal (it leaves the balance) or take money out (back to the
 * balance), in a bottom sheet: amount, date (not in the future), note.
 */
function MoveSheet({
  open,
  onOpenChange,
  goal,
  kind,
  today,
  available,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: Goal | null;
  kind: MoveKind;
  today: string;
  available: string | null;
  onDone: (text: string) => Promise<void>;
}) {
  const formId = `goal-move-form-${goal?.id ?? "none"}`;
  const [pending, setPending] = useState(false);
  // Each opening starts a fresh form (new key); it stays mounted while the sheet slides away.
  const [round, setRound] = useState(0);
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setRound((r) => r + 1);
  }
  const out = kind === "out";
  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
      className="sp-space-wallet"
      title={out ? "Take money out" : "Add money"}
      description={goal ? goal.name : undefined}
      footer={
        <SpButton
          type="submit"
          form={formId}
          className="w-full"
          disabled={pending}
          icon={out ? <IconMinus aria-hidden /> : <IconAdd aria-hidden />}
          data-testid={out ? "goal-out-save" : "goal-add-money-save"}
        >
          {pending
            ? out
              ? "Taking out…"
              : "Adding…"
            : out
              ? "Take money out"
              : "Add money"}
        </SpButton>
      }
    >
      {round > 0 && goal && (
        <MoveForm
          key={`${goal.id}-${kind}-${round}`}
          id={formId}
          goal={goal}
          kind={kind}
          today={today}
          available={available}
          onPending={setPending}
          onDone={async (text) => {
            onOpenChange(false);
            await onDone(text);
          }}
        />
      )}
    </BottomSheet>
  );
}

function MoveForm({
  id,
  goal,
  kind,
  today,
  available,
  onPending,
  onDone,
}: {
  id: string;
  goal: Goal;
  kind: MoveKind;
  today: string;
  available: string | null;
  onPending: (pending: boolean) => void;
  onDone: (text: string) => Promise<void>;
}) {
  const dates = useDates();
  const out = kind === "out";
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const amount = parseAmountInput(amountText);
  const value = amount ? Number(amount) : 0;
  const saved = Number(goal.saved) || 0;
  const tooMuch = out && value > saved;
  const overBalance = !out && available !== null && value > Number(available);
  const amountError = !touched
    ? undefined
    : !amount
      ? "Enter an amount, like 50."
      : tooMuch
        ? `This goal holds only ${formatMoney(saved)}.`
        : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!amount || tooMuch) return;
    onPending(true);
    try {
      await api(
        `/wallet/goals/${encodeURIComponent(goal.id)}/${out ? "take-out" : "contributions"}`,
        {
          method: "POST",
          body: { amount, date, note: note.trim() || null },
        },
      );
    } catch (err) {
      onPending(false);
      if (err instanceof ApiError && err.code === "not_enough_saved") {
        // The backend says how much is in the goal: "This goal holds only $200.00".
        const said =
          typeof err.data?.message === "string" ? err.data.message.trim() : "";
        setError(said ? (said.endsWith(".") ? said : `${said}.`) : err.message);
      } else {
        setError(errorMessage(err));
      }
      return;
    }
    onPending(false);
    await onDone(
      out
        ? "Money taken out. It is back in your balance."
        : "Money added to the goal.",
    );
  }

  return (
    <form
      id={id}
      onSubmit={submit}
      className="flex flex-col gap-[14px] pt-[4px]"
      noValidate
      data-testid={out ? "goal-out-form" : "goal-add-money-form"}
    >
      {error && (
        <p
          role="alert"
          className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-danger)"
        >
          {error}
        </p>
      )}
      {(out || available !== null) && (
        <p
          className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text-muted) tabular-nums"
          data-testid="goal-move-have"
        >
          {out ? "In this goal: " : "Available: "}
          <span className="font-medium text-(--sp-text)">
            {out ? formatMoney(saved) : plainMoney(available ?? 0)}
          </span>
        </p>
      )}
      <SpField label="Amount" htmlFor={`${id}-amount`} error={amountError}>
        <SpInput
          id={`${id}-amount`}
          surface="panel"
          inputMode="decimal"
          placeholder="0.00"
          autoComplete="off"
          value={amountText}
          aria-invalid={Boolean(amountError)}
          icon={<span className="text-[0.9375rem] font-medium">$</span>}
          onChange={(e) => setAmountText(e.target.value)}
          data-testid="goal-move-amount"
        />
      </SpField>
      <p
        className="px-[4px] text-[0.8125rem] leading-snug text-(--sp-text) tabular-nums"
        aria-live="polite"
        data-testid="goal-move-text"
      >
        {out
          ? `Moves ${formatMoney(value)} from this goal back to your balance.`
          : `Moves ${formatMoney(value)} from your balance to this goal.`}
      </p>
      {overBalance && (
        <p
          className="flex items-start gap-[8px] px-[4px] text-[0.8125rem] leading-snug text-(--sp-text)"
          data-testid="goal-move-over"
        >
          <IconWarning
            aria-hidden
            className="mt-[1px] size-[16px] shrink-0 text-(--sp-warning)"
          />
          This is more than your balance.
        </p>
      )}
      <div data-testid="goal-money-date">
        <DateField
          label="Date"
          surface="panel"
          value={date}
          onChange={(day) => setDate(day ?? today)}
          max={today}
          today={today}
          format={dates.day}
        />
      </div>
      <SpField label="Note" optional htmlFor={`${id}-note`}>
        <SpInput
          id={`${id}-note`}
          surface="panel"
          placeholder={
            out ? "e.g. Paid for the trip" : "e.g. Part of my salary"
          }
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          data-testid="goal-move-note"
        />
      </SpField>
    </form>
  );
}

/**
 * One goal card that can be dragged by its grip (left of the title row).
 * Long-press (phone) or drag (mouse) the grip, or focus it and use Space + arrows.
 */
function SortableGoal({
  id,
  name,
  busy,
  children,
}: {
  id: string;
  name: string;
  /** An order is saving: grips are off until it ends. */
  busy: boolean;
  children: (grip: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: busy,
  });
  return (
    <li
      ref={setNodeRef}
      data-testid="goal-item"
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition ?? undefined,
      }}
      className={cn(
        "relative flex flex-col gap-[14px] rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[10px] pb-[16px]",
        isDragging && "z-10 shadow-[0_12px_32px_rgb(0_0_0/0.22)]",
      )}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef as Ref<HTMLButtonElement>}
          {...attributes}
          {...listeners}
          aria-label={`Move ${name}`}
          data-testid="goal-grip"
          className={cn(
            "-ml-[8px] flex h-[44px] w-[32px] shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-xl text-(--sp-text-faint) outline-none select-none [-webkit-touch-callout:none] hover:text-(--sp-text-muted) focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[20px]",
            isDragging && "cursor-grabbing text-(--sp-text-muted)",
            busy && "cursor-progress opacity-50",
          )}
        >
          <IconGrip />
        </button>,
      )}
    </li>
  );
}
