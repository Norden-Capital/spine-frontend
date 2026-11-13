"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconDelete } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { walletChanged } from "@/lib/wallet-actions";
import { BottomSheet, SpButton } from "@/components/spine-ui";

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
    } catch (err) {
      setPending(false);
      setOpen(false);
      setError(errorMessage(err));
      return;
    }
    // Deleted. Next keeps this page alive (hidden): close the sheet now, so
    // going Back never shows a stuck "Deleting…".
    setPending(false);
    setOpen(false);
    // Leave this page and make every wallet page fresh (list, dashboard, totals).
    const to = `/wallet/transactions?month=${encodeURIComponent(month)}`;
    try {
      await walletChanged(to);
    } catch {
      // The server step failed (network): still leave and reload the data.
      router.replace(to);
      router.refresh();
    }
  }

  return (
    <>
      <SpButton size="md" variant="danger" icon={<IconDelete />} onClick={() => setOpen(true)}>
        Delete
      </SpButton>
      {error && (
        <p role="alert" className="order-last col-span-full px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
      <BottomSheet
        open={open}
        onOpenChange={(next) => !next && !pending && setOpen(false)}
        title="Delete for good?"
        description="It is removed from your wallet with its files. This can't be undone."
        footer={
          <div className="grid grid-cols-2 gap-[8px]">
            <SpButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SpButton>
            <SpButton variant="danger" onClick={confirm} disabled={pending}>
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
