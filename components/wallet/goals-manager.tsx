"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { formatMoney, parseAmountInput, type Currency } from "@/lib/transactions-types";
import type { Goal } from "@/lib/wallet-types";
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
import { CurrencyChoice } from "./form-bits";
import { ProgressBar } from "./progress";

/** Savings goals: target, optional deadline, contributions (they don't change the balance). */
export function GoalsManager({ goals, today }: { goals: Goal[]; today: string }) {
  const router = useRouter();
  const dates = useDates();
  const [edit, setEdit] = useState<{ goal: Goal | null } | null>(null);
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
      <Button size="lg" className="h-12 rounded-full" onClick={() => setEdit({ goal: null })}>
        <Plus aria-hidden />
        Add a goal
      </Button>
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {goals.length === 0 ? (
        <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
          No goals yet. Save for a trip, a phone, or a rainy day.
        </p>
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
                      {formatMoney(g.saved, g.currency)} of {formatMoney(g.target, g.currency)} · {g.percent}%
                      {g.deadline ? ` · by ${dates.day(g.deadline)}` : ""}
                    </p>
                  </div>
                  <ChevronDown className={cn("mt-1 size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
                </button>
                <ProgressBar percent={g.percent} label={`${g.name}: ${g.percent}% saved`} />
                {open && (
                  <div className="flex flex-col gap-3 border-t pt-3">
                    <p className="text-sm text-(--sp-text-muted)">
                      {left > 0 ? `${formatMoney(left, g.currency)} to go.` : "Goal reached!"}
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
                              <span className="font-medium tabular-nums">{formatMoney(c.amount, g.currency)}</span>
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
                              <Trash2 className="size-4" aria-hidden />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="lg" className="h-11" onClick={() => setEdit({ goal: g })}>
                        <Pencil aria-hidden />
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
                        <Trash2 aria-hidden />
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

      <Dialog open={edit !== null} onOpenChange={(open) => !open && setEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit?.goal ? "Edit goal" : "Add a goal"}</DialogTitle>
          </DialogHeader>
          {edit && (
            <GoalForm
              key={edit.goal?.id ?? "new"}
              goal={edit.goal}
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

function GoalForm({ goal, today, onDone }: { goal: Goal | null; today: string; onDone: (text: string) => void }) {
  const [name, setName] = useState(goal?.name ?? "");
  const [target, setTarget] = useState(goal?.target ?? "");
  const [currency, setCurrency] = useState<Currency>(goal?.currency ?? "USD");
  const [deadline, setDeadline] = useState(goal?.deadline ?? "");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amount = parseAmountInput(target);
  const trimmed = name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (!trimmed || !amount) return;
    setPending(true);
    const body = { name: trimmed, target: amount, currency, deadline: deadline || null };
    try {
      if (goal) await api(`/wallet/goals/${encodeURIComponent(goal.id)}`, { method: "PUT", body });
      else await api("/wallet/goals", { method: "POST", body });
      onDone(goal ? "Goal saved." : "Goal added.");
    } catch (err) {
      setPending(false);
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Field data-invalid={touched && !trimmed}>
        <FieldLabel htmlFor="goal-name">Name</FieldLabel>
        <Input id="goal-name" maxLength={60} placeholder="e.g. Summer trip" value={name} onChange={(e) => setName(e.target.value)} className="h-11" />
        {touched && !trimmed && <FieldError>Enter a name.</FieldError>}
      </Field>
      <Field data-invalid={touched && !amount}>
        <FieldLabel htmlFor="goal-target">Target</FieldLabel>
        <Input id="goal-target" inputMode="decimal" placeholder="0.00" value={target} onChange={(e) => setTarget(e.target.value)} className="h-11" />
        {touched && !amount && <FieldError>Enter an amount, like 2000.</FieldError>}
      </Field>
      <Field>
        <FieldLabel>Currency</FieldLabel>
        <CurrencyChoice value={currency} onChange={setCurrency} />
      </Field>
      <Field>
        <FieldLabel htmlFor="goal-deadline">Deadline (optional)</FieldLabel>
        <Input id="goal-deadline" type="date" min={today} value={deadline} onChange={(e) => setDeadline(e.target.value)} className="h-11" />
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : goal ? "Save" : "Add goal"}
      </Button>
    </form>
  );
}

function ContributionForm({ goal, today, onDone }: { goal: Goal; today: string; onDone: () => void }) {
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
      <div className="grid grid-cols-2 gap-2">
        <Input inputMode="decimal" aria-label={`Amount in ${goal.currency}`} placeholder={`Add ${goal.currency}`} value={amountText} onChange={(e) => setAmountText(e.target.value)} className="h-11" />
        <Input type="date" aria-label="Date" max={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
      </div>
      <Input aria-label="Note (optional)" placeholder="Note (optional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} className="h-11" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" size="lg" className="h-11" disabled={pending}>
        <Plus aria-hidden />
        {pending ? "Adding…" : "Add money"}
      </Button>
    </form>
  );
}
