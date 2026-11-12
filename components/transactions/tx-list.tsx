"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { signedMoney, type Totals, type Transaction } from "@/lib/transactions-types";
import type { WalletTx } from "@/lib/wallet-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { useDates } from "@/components/prefs/prefs-provider";
import { ListItem, SpButton } from "@/components/spine-ui";

type Row = Pick<Transaction | WalletTx, "id" | "type" | "amount" | "date" | "description" | "logoUrls" | "category" | "createdAt">;

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
}: {
  first: ListPage;
  query: string;
  apiPath: string;
  hrefBase: string;
  empty: React.ReactNode;
}) {
  const dates = useDates();
  const [items, setItems] = useState(first.items);
  const [page, setPage] = useState(first.page ?? 0);
  const [hasNext, setHasNext] = useState(Boolean(first.hasNext));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New data from the server (router.refresh, a save or delete elsewhere, a page kept
  // alive by Activity and shown again): start over from it. Without this the rows
  // stay the old ones (useState keeps its first value), e.g. a deleted item.
  const [shown, setShown] = useState(first);
  if (shown !== first) {
    setShown(first);
    setItems(first.items);
    setPage(first.page ?? 0);
    setHasNext(Boolean(first.hasNext));
    setError(null);
  }

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
      {items.length === 0 ? (
        empty
      ) : (
        <>
          {[...byDay].map(([day, rows]) => (
            <section key={day} aria-label={dates.day(day)} className="rounded-(--sp-radius) bg-(--sp-panel) pt-2 pb-2">
              <h2 className="px-[14px] pt-[8px] pb-[4px] text-[0.6875rem] leading-snug font-medium text-(--sp-text-faint)">{dates.day(day)}</h2>
              {rows.map((tx) => {
                const income = tx.type === "INCOME";
                return (
                  <ListItem
                    key={tx.id}
                    href={`${hrefBase}/${encodeURIComponent(tx.id)}`}
                    icon={<TxLogo logoUrls={tx.logoUrls} icon={tx.category.icon} />}
                    title={tx.description || tx.category.name}
                    meta={tx.category.name}
                    amount={signedMoney(tx.amount, income ? "in" : "out")}
                    tone={income ? "income" : "expense"}
                  />
                );
              })}
            </section>
          ))}
          {error && (
            <p role="alert" className="text-center text-[0.8125rem] leading-snug text-(--sp-danger)">
              {error}
            </p>
          )}
          {hasNext && (
            <SpButton variant="secondary" className="w-full" onClick={more} disabled={loading}>
              {loading ? "Loading…" : "Load more"}
            </SpButton>
          )}
        </>
      )}
    </div>
  );
}

