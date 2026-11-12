"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { BottomSheet, SpButton } from "@/components/spine-ui";

/** "Delete" = move to trash (a manager can restore it). Asks first. */
export function DeleteTransaction({ id, month }: { id: string; month: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await api(`/transactions/${encodeURIComponent(id)}`, { method: "DELETE" });
      router.replace(`/transactions?month=${month}`);
      router.refresh();
    } catch (err) {
      setPending(false);
      setOpen(false);
      setError(errorMessage(err));
    }
  }

  return (
    <>
      <SpButton size="md" variant="danger" icon={<Trash2 />} onClick={() => setOpen(true)}>
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
        title="Move to trash?"
        description="It leaves the list and the totals. A manager can bring it back from the trash."
        footer={
          <div className="grid grid-cols-2 gap-[8px]">
            <SpButton variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </SpButton>
            <SpButton variant="danger" onClick={confirm} disabled={pending}>
              {pending ? "Moving…" : "Move to trash"}
            </SpButton>
          </div>
        }
      >
        {null}
      </BottomSheet>
    </>
  );
}
