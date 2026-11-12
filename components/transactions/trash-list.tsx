"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { formatDay, type DateSettings } from "@/lib/prefs";
import type { Transaction } from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Amount } from "@/components/transactions/amount";
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

/** Deleted transactions; a manager can restore them (asks first). */
export function TrashList({ items, dates }: { items: Transaction[] | null; dates: DateSettings }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  if (items === null) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        The trash could not be loaded. Please try again later.
      </p>
    );
  }

  async function restore() {
    if (!chosen) return;
    setPending(true);
    try {
      await api(`/admin/transactions/${encodeURIComponent(chosen.id)}/restore`, { method: "POST" });
      setNotice({ kind: "ok", text: "Restored. It is back in the list and the totals." });
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
    } finally {
      setPending(false);
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">The trash is empty.</p>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((tx) => (
            <li key={tx.id} className="flex min-h-14 items-center gap-3 py-2 pr-1 pl-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <CategoryIcon name={tx.category.icon} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">{tx.description || tx.category.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatDay(tx.date, dates)} · {tx.createdBy.name}
                </span>
              </span>
              <Amount type={tx.type} amount={tx.amount} currency={tx.currency} className="text-sm" />
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0"
                aria-label={`Restore ${tx.description || tx.category.name}`}
                onClick={() => {
                  setChosen(tx);
                  setOpen(true);
                }}
              >
                <RotateCcw className="size-5" aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={open} onOpenChange={(next) => !next && !pending && setOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              {chosen ? `"${chosen.description || chosen.category.name}" goes back to the list and the totals.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button size="lg" className="h-11" onClick={restore} disabled={pending}>
              {pending ? "Restoring…" : "Restore"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
