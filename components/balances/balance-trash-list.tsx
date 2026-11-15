"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconDelete, IconOffline, IconRestore } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { formatDay, type DateSettings } from "@/lib/prefs";
import { formatMoney } from "@/lib/transactions-types";
import { frequencyLabel, type Balance } from "@/lib/balances-types";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { EmptyState, IconButton, RowGroup, SpRow } from "@/components/spine-ui";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";
import { BalanceLogo } from "./balance-parts";

/** Deleted company balances; the owner can restore them (asks first). Same look as the repeat trash. */
export function BalanceTrashList({ items, dates }: { items: Balance[] | null; dates: DateSettings }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<Balance | null>(null);
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
      await api(`/admin/balances/${encodeURIComponent(chosen.id)}/restore`, { method: "POST" });
      setNotice({ kind: "ok", text: "Restored. It is back in Balances with its settings and history." });
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
                {items.length} {items.length === 1 ? "balance" : "balances"}
              </span>
            }
          >
            <ul data-testid="balance-trash">
              {items.map((b) => {
                const by = b.deletedBy ?? null;
                return (
                  <li key={b.id}>
                    <SpRow
                      leading={<BalanceLogo b={b} />}
                      title={b.name}
                      subtitle={
                        <span className="inline-flex max-w-full items-center gap-[5px] align-middle">
                          <span className="shrink-0">
                            {frequencyLabel(b.unit, b.every)}
                            {b.deletedAt ? ` · deleted ${formatDay(b.deletedAt.slice(0, 10), dates)}` : ""}
                            {by ? " ·" : ""}
                          </span>
                          {by && (
                            <>
                              <UserAvatar seed={seedOf(by)} size={16} className="ring-0" />
                              <span className="truncate">{by.name}</span>
                            </>
                          )}
                        </span>
                      }
                      trailing={
                        <span className="flex shrink-0 items-center gap-[2px]">
                          <span className="text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
                            {formatMoney(b.guess)}
                          </span>
                          <IconButton
                            label={`Restore ${b.name}`}
                            icon={<IconRestore />}
                            variant="ghost"
                            onClick={() => {
                              setChosen(b);
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
            Restore puts it back in Balances with its settings and history. The guess goes on from its last recharge or
            fix.
          </p>
        </>
      )}
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Restore this balance?"
        text={chosen ? `"${chosen.name}" goes back to Balances and its alerts start again.` : ""}
        confirm="Restore"
        busy={pending}
        busyLabel="Restoring…"
        onConfirm={restore}
      />
    </div>
  );
}
