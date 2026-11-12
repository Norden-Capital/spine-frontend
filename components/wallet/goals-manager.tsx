"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BottomSheet,
  DateField,
  IconAdd,
  IconChevronDown,
  IconDelete,
  IconEdit,
  IconGoal,
  SpButton,
  SpField,
  SpInput,
} from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { formatMoney, parseAmountInput } from "@/lib/transactions-types";
import type { Goal } from "@/lib/wallet-types";
import { nextDay } from "@/lib/repeat-schedule";
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./progress";

/** Savings goals: target, optional deadline, contributions (they don't change the balance). */
export function GoalsManager({ goals, today }: { goals: Goal[]; today: string }) {
  const router = useRouter();
  const dates = useDates();
  // The sheet keeps the last goal while it slides away (no title flash).
  const [edit, setEdit] = useState<{ goal: Goal | null; open: boolean }>({ goal: null, open: false });
  const [openId, setOpenId] = useState<string | null>(goals[0]?.id ?? null);
  const [remove, setRemove] = useState<Goal | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function confirmRemove() {
    if (!remove) return;
    setBusy(true);
    try {
      await api(`/wallet/goals/${encodeURIComponent(remove.id)}`, { method: "DELETE" });
      setNotice({ kind: "ok", text: `"${remove.name}" removed.` });
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
      <Button size="lg" className="h-12 rounded-full" onClick={() => setEdit({ goal: null, open: true })} data-testid="goal-add">
        <IconAdd aria-hidden />
        Add a goal
      </Button>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {goals.length === 0 ? (
        <PageEmpty icon={<IconGoal />} title="No goals yet" text="Save for a trip, a phone, or a rainy day." />
      ) : (
        <ul className="flex flex-col gap-3">
          {goals.map((g) => {
            const open = openId === g.id;
            const left = Number(g.target) - Number(g.saved);
            return (
              <li key={g.id} className="flex flex-col gap-3 rounded-(--sp-radius) bg-(--sp-panel) p-4">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : g.id)}
                  className="flex min-h-11 items-start gap-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-(--sp-text)">{g.name}</p>
                    <p className="text-xs text-(--sp-text-faint) tabular-nums">
                      {formatMoney(g.saved)} of {formatMoney(g.target)} · {g.percent}%
                      {g.deadline ? ` · by ${dates.day(g.deadline)}` : ""}
                    </p>
                  </div>
                  <IconChevronDown className={cn("mt-1 size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
                </button>
                <ProgressBar percent={g.percent} label={`${g.name}: ${g.percent}% saved`} />
                {open && (
                  <div className="flex flex-col gap-3 border-t pt-3">
                    <p className="text-sm text-(--sp-text-muted)">
                      {left > 0 ? `${formatMoney(left)} to go.` : "Goal reached!"}
                    </p>
                    <ContributionForm
                      goal={g}
                      today={today}
                      onDone={() => {
                        setNotice({ kind: "ok", text: "Money added to the goal." });
                        router.refresh();
                      }}
                    />
                    {g.contributions.length > 0 && (
                      <ul className="flex flex-col divide-y rounded-xl border">
                        {g.contributions.map((c) => (
                          <li key={c.id} className="flex min-h-12 items-center gap-2 py-1 pr-1 pl-3 text-sm">
                            <span className="min-w-0 flex-1">
                              <span className="font-medium tabular-nums">{formatMoney(c.amount)}</span>
                              <span className="text-muted-foreground"> · {dates.day(c.date)}</span>
                              {c.note && <span className="block truncate text-xs text-muted-foreground">{c.note}</span>}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-11"
                              aria-label="Remove this contribution"
                              onClick={async () => {
                                try {
                                  await api(`/wallet/goals/${encodeURIComponent(g.id)}/contributions/${encodeURIComponent(c.id)}`, {
                                    method: "DELETE",
                                  });
                                  router.refresh();
                                } catch (err) {
                                  setNotice({ kind: "error", text: errorMessage(err) });
                                }
                              }}
                            >
                              <IconDelete className="size-4" aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="lg" className="h-11" onClick={() => setEdit({ goal: g, open: true })}>
                        <IconEdit aria-hidden />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 text-destructive"
                        onClick={() => {
                          setRemove(g);
                          setRemoveOpen(true);
                        }}
                      >
                        <IconDelete aria-hidden />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
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

      <AlertDialog open={removeOpen} onOpenChange={(next) => !next && !busy && setRemoveOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove &quot;{remove?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>The goal and its contributions are deleted. Your wallet balance does not change.</AlertDialogDescription>
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
export function GoalSheet({ open, onOpenChange, goal = null, today, onSaved }: GoalSheetProps) {
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
        <SpButton type="submit" form={formId} className="w-full" disabled={pending} data-testid="goal-save">
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
      if (goal) await api(`/wallet/goals/${encodeURIComponent(goal.id)}`, { method: "PUT", body });
      else await api("/wallet/goals", { method: "POST", body });
      onPending(false);
      onDone(goal ? "Goal saved." : "Goal added.");
    } catch (err) {
      onPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <form id={id} onSubmit={submit} className="flex flex-col gap-[14px] pt-[4px]" noValidate data-testid="goal-form">
      {error && (
        <p role="alert" className="px-[4px] text-[0.8125rem] text-(--sp-danger)">
          {error}
        </p>
      )}
      <SpField label="Name" htmlFor="goal-name" error={touched && !trimmed ? "Enter a name." : undefined}>
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
      <SpField label="Target" htmlFor="goal-target" error={touched && !amount ? "Enter an amount, like 2000." : undefined}>
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

function ContributionForm({ goal, today, onDone }: { goal: Goal; today: string; onDone: () => void }) {
  const dates = useDates();
  const [amountText, setAmountText] = useState("");
  const [date, setDate] = useState(today);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmountInput(amountText);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount) {
      setError("Enter an amount.");
      return;
    }
    setPending(true);
    try {
      await api(`/wallet/goals/${encodeURIComponent(goal.id)}/contributions`, {
        method: "POST",
        body: { amount, date, note: note.trim() || null },
      });
      setAmountText("");
      setNote("");
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2" noValidate>
      <div className="grid grid-cols-2 items-start gap-2">
        <SpField label="Amount" htmlFor={`money-${goal.id}`}>
          <SpInput
            id={`money-${goal.id}`}
            surface="panel"
            inputMode="decimal"
            placeholder="0.00"
            value={amountText}
            icon={<span className="text-[0.9375rem] font-medium">$</span>}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </SpField>
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
      </div>
      <Input aria-label="Note (optional)" placeholder="Note (optional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        <IconAdd aria-hidden />
        {pending ? "Adding…" : "Add money"}
      </Button>
    </form>
  );
}
