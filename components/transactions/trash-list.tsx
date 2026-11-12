"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconDelete, IconOffline, IconRestore } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { formatDay, type DateSettings } from "@/lib/prefs";
import { signedMoney, type Transaction } from "@/lib/transactions-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { EmptyState, IconButton, RowGroup, RowIcon, SpMoney, SpRow } from "@/components/spine-ui";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";

/** Deleted transactions; the owner can restore them (asks first). */
export function TrashList({ items, dates }: { items: Transaction[] | null; dates: DateSettings }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  if (items === null) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<IconOffline />}
        title="The trash could not be loaded"
        text="Please try again later."
      />
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
    <div className="flex flex-col gap-[16px]">
      {notice && <NoticeBox notice={notice} />}
      {items.length === 0 ? (
        <PageEmpty icon={<IconDelete />} title="The trash is empty" />
      ) : (
        <>
          <RowGroup
            title="Trash"
            aside={
              <span className="text-[0.625rem] leading-snug text-(--sp-text-faint)">
                {items.length} {items.length === 1 ? "transaction" : "transactions"}
              </span>
            }
          >
            <ul>
              {items.map((tx) => {
                const name = tx.description || tx.category.name;
                const income = tx.type === "INCOME";
                return (
                  <li key={tx.id}>
                    <SpRow
                      leading={
                        <RowIcon>
                          <TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />
                        </RowIcon>
                      }
                      title={name}
                      subtitle={
                        <span className="inline-flex max-w-full items-center gap-[5px] align-middle">
                          <span className="shrink-0">{formatDay(tx.date, dates)} ·</span>
                          <UserAvatar seed={seedOf(tx.createdBy)} size={16} className="ring-0" />
                          <span className="truncate">{tx.createdBy.name}</span>
                        </span>
                      }
                      trailing={
                        <span className="flex shrink-0 items-center gap-[2px]">
                          <SpMoney direction={income ? "in" : "out"} className="text-[0.8125rem] font-semibold whitespace-nowrap">
                            {signedMoney(tx.amount, income ? "in" : "out")}
                          </SpMoney>
                          <IconButton
                            label={`Restore ${name}`}
                            icon={<IconRestore />}
                            variant="ghost"
                            onClick={() => {
                              setChosen(tx);
                              setOpen(true);
                            }}
                          />
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </RowGroup>
          <p className="px-[14px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">
            Restore puts it back in the list and the totals.
          </p>
        </>
      )}
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Restore this transaction?"
        text={chosen ? `"${chosen.description || chosen.category.name}" goes back to the list and the totals.` : ""}
        confirm="Restore"
        busy={pending}
        busyLabel="Restoring…"
        onConfirm={restore}
      />
    </div>
  );
}
