"use client";

import { PageEmpty } from "@/components/nav/page-empty";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconDelete, IconOffline, IconRestore } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { formatDay, type DateSettings } from "@/lib/prefs";
import { repeatLabel } from "@/lib/repeat-schedule";
import { signedMoney } from "@/lib/transactions-types";
import type { TrashedRecurring } from "@/lib/recurring-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { EmptyState, IconButton, RowGroup, RowIcon, SpMoney, SpRow } from "@/components/spine-ui";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";

/** Deleted company repeat expenses; the owner can restore them (asks first). Same look as the expense trash. */
export function RecurringTrashList({ items, dates }: { items: TrashedRecurring[] | null; dates: DateSettings }) {
  const router = useRouter();
  const [chosen, setChosen] = useState<TrashedRecurring | null>(null);
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
      await api(`/admin/recurring/${encodeURIComponent(chosen.id)}/restore`, { method: "POST" });
      setNotice({ kind: "ok", text: "Restored. It is back in Repeat expenses with all its settings." });
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
                {items.length} {items.length === 1 ? "repeat expense" : "repeat expenses"}
              </span>
            }
          >
            <ul data-testid="recurring-trash">
              {items.map((r) => {
                const name = r.description || r.category.name;
                const income = r.type === "INCOME";
                const by = r.deletedBy ?? r.createdBy;
                return (
                  <li key={r.id}>
                    <SpRow
                      leading={
                        <RowIcon>
                          <TxLogo logoUrls={r.logoUrls} icon={r.category.icon} />
                        </RowIcon>
                      }
                      title={name}
                      subtitle={
                        <span className="inline-flex max-w-full items-center gap-[5px] align-middle">
                          <span className="shrink-0">
                            {repeatLabel(r.unit, r.every)} · deleted {formatDay(r.deletedAt.slice(0, 10), dates)} ·
                          </span>
                          <UserAvatar seed={seedOf(by)} size={16} className="ring-0" />
                          <span className="truncate">{by.name}</span>
                        </span>
                      }
                      trailing={
                        <span className="flex shrink-0 items-center gap-[2px]">
                          <SpMoney direction={income ? "in" : "out"} className="text-[0.8125rem] font-semibold whitespace-nowrap">
                            {signedMoney(r.amount, income ? "in" : "out")}
                          </SpMoney>
                          <IconButton
                            label={`Restore ${name}`}
                            icon={<IconRestore />}
                            variant="ghost"
                            onClick={() => {
                              setChosen(r);
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
            Restore puts it back in Repeat expenses with all its settings. Dates missed while in the trash get no reminder.
          </p>
        </>
      )}
      <ConfirmSheet
        open={open}
        onOpenChange={setOpen}
        title="Restore this repeat expense?"
        text={chosen ? `"${chosen.description || chosen.category.name}" goes back to Repeat expenses.` : ""}
        confirm="Restore"
        busy={pending}
        busyLabel="Restoring…"
        onConfirm={restore}
      />
    </div>
  );
}
