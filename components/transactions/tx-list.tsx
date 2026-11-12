"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { formatMoney, formatNet, type Totals, type Transaction } from "@/lib/transactions-types";
import type { WalletTx } from "@/lib/wallet-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { useDates } from "@/components/prefs/prefs-provider";
import { ListItem } from "@/components/spine-ui";
import { Button } from "@/components/ui/button";

type Row = Pick<Transaction | WalletTx, "id" | "type" | "amount" | "date" | "description" | "logoUrl" | "category" | "createdAt">;

export type ListPage<T extends Row = Row> = {
  items: T[];
  totals: Totals;
  page?: number;
  hasNext?: boolean;
  totalItems?: number;
};

/**
 * Totals (they follow the filters) + rows grouped by day (kit list style)
 * + "Load more". `query` = the filter query string; `apiPath` = "/transactions"
 * or "/wallet/transactions"; `hrefBase` = where a row links to.
 */
export function TxList({
  first,
  query,
  apiPath,
  hrefBase,
  empty,
  showTotals = true,
}: {
  first: ListPage;
  query: string;
  apiPath: string;
  hrefBase: string;
  empty: React.ReactNode;
  /** false = no totals panel (the period bar above shows the total). */
  showTotals?: boolean;
}) {
  const dates = useDates();
  const [items, setItems] = useState(first.items);
  const [page, setPage] = useState(first.page ?? 0);
  const [hasNext, setHasNext] = useState(Boolean(first.hasNext));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function more() {
    setLoading(true);
    setError(null);
    try {
      const next = await api<ListPage>(`${apiPath}?${query}${query ? "&" : ""}page=${page + 1}`);
      const seen = new Set(items.map((i) => i.id));
      setItems([...items, ...next.items.filter((i) => !seen.has(i.id))]);
      setPage(next.page ?? page + 1);
      setHasNext(Boolean(next.hasNext));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const byDay = new Map<string, Row[]>();
  for (const tx of items) byDay.set(tx.date, [...(byDay.get(tx.date) ?? []), tx]);

  return (
    <div className="flex flex-col gap-4">
      {showTotals && <TotalsPanel totals={first.totals} count={first.totalItems} />}
      {items.length === 0 ? (
        empty
      ) : (
        <>
          {[...byDay].map(([day, rows]) => (
            <section key={day} aria-label={dates.day(day)} className="rounded-(--sp-radius) bg-(--sp-panel) pt-2 pb-2">
              <h2 className="px-[14px] pt-2 pb-1 text-[11px] font-medium text-(--sp-text-faint)">{dates.day(day)}</h2>
              {rows.map((tx) => {
                const income = tx.type === "INCOME";
                return (
                  <ListItem
                    key={tx.id}
                    href={`${hrefBase}/${encodeURIComponent(tx.id)}`}
                    icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
                    title={tx.description || tx.category.name}
                    meta={tx.category.name}
                    amount={formatMoney(tx.amount, income ? "+" : "-")}
                    tone={income ? "income" : "expense"}
                  />
                );
              })}
            </section>
          ))}
          {error && <p className="text-center text-sm text-destructive">{error}</p>}
          {hasNext && (
            <Button variant="outline" size="lg" className="h-12 rounded-full" onClick={more} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/** "in · out" left, net right (USD). Hidden when nothing came in or went out. */
export function TotalsPanel({ totals, count }: { totals?: Totals | null; count?: number }) {
  const t = totals;
  if (!t || (Number(t.in) === 0 && Number(t.out) === 0)) return null;
  return (
    <div className="flex flex-col rounded-(--sp-radius) bg-(--sp-panel) px-[14px] py-1">
      <div className="flex items-center justify-between gap-3 py-2.5 tabular-nums">
        <p className="flex min-w-0 flex-wrap gap-x-1.5 text-[12px]">
          <span className="text-(--sp-income)">{formatMoney(t.in)} in</span>
          <span className="text-(--sp-text-faint)" aria-hidden>
            ·
          </span>
          <span className="text-(--sp-text-muted)">{formatMoney(t.out)} out</span>
        </p>
        <p className="shrink-0 text-right text-[17px] font-semibold text-(--sp-text)">{formatNet(t.net)}</p>
      </div>
      {count !== undefined && (
        <p className="pb-2 text-[11px] text-(--sp-text-faint)">
          {count} transaction{count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
