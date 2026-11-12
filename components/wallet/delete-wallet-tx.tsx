"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
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

/** Wallet delete is final (no trash): ask first and say so. */
export function DeleteWalletTx({ id, month }: { id: string; month: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api(`/wallet/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.replace(`/wallet/transactions?month=${month}`);
      router.refresh();
    } catch (err) {
      setPending(false);
      setOpen(false);
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <Button variant="outline" size="lg" className="h-11 text-destructive" onClick={() => setOpen(true)}>
        <Trash2 aria-hidden />
        Delete
      </Button>
      {error && <p className="col-span-2 text-sm text-destructive">{error}</p>}
      <AlertDialog open={open} onOpenChange={(next) => !next && !pending && setOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete for good?</AlertDialogTitle>
            <AlertDialogDescription>
              It is removed from your wallet with its files. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={pending}>
              Cancel
            </AlertDialogCancel>
            <Button variant="destructive" size="lg" className="h-11" onClick={confirm} disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
