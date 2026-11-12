import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { filtersToQuery, hasFilters, parseFilters } from "@/lib/filters";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getList } from "@/lib/list-server";
import { addMonths, monthLabel, monthOf } from "@/lib/transactions-types";
import { getWalletCategories } from "@/lib/wallet-server";
import { FilterBar } from "@/components/filters/filter-bar";
import { TxList } from "@/components/transactions/tx-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Wallet transactions" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** My private wallet transactions: month (or range), search, filters, totals. */
export default async function WalletTransactionsPage({ searchParams }: PageProps<"/wallet/transactions">) {
  const params = await searchParams;
  const dates = await getDateSettings();
  const current = monthOf(todayIn(dates.zone));
  const filters = parseFilters(params);
  delete filters.createdBy; // not used on the wallet
  const range = Boolean(filters.from || filters.to);
  if (!range) filters.month = filters.month && filters.month <= current ? filters.month : current;
  const tagLabels = typeof params.tagLabels === "string" ? params.tagLabels.split(",") : [];
  const query = filtersToQuery(filters);
  const [list, categories] = await Promise.all([getList("/wallet/transactions", query), getWalletCategories()]);

  const keep = (m: string) => {
    const q = new URLSearchParams(filtersToQuery({ ...filters, month: m === current ? undefined : m }));
    if (tagLabels.length) q.set("tagLabels", tagLabels.join(","));
    return `/wallet/transactions${q.size ? `?${q}` : ""}`;
  };
  const arrow =
    "flex size-11 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/wallet" className="-ml-2 flex h-11 w-fit items-center gap-1 rounded-md px-2 text-sm text-(--sp-text-muted)">
        <ChevronLeft className="size-4" aria-hidden />
        Wallet
      </Link>
      {range ? (
        <h1 className="text-[22px] font-medium text-(--sp-text)">Wallet transactions</h1>
      ) : (
        <div className="flex items-center justify-between">
          <Link href={keep(addMonths(filters.month!, -1))} aria-label="Previous month" className={arrow}>
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
          <h1 className="text-[22px] font-medium text-(--sp-text)">{monthLabel(filters.month!)}</h1>
          {addMonths(filters.month!, 1) <= current ? (
            <Link href={keep(addMonths(filters.month!, 1))} aria-label="Next month" className={arrow}>
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          ) : (
            <span className={cn(arrow, "pointer-events-none opacity-30")} aria-hidden>
              <ChevronRight className="size-5" />
            </span>
          )}
        </div>
      )}

      <FilterBar
        filters={filters}
        tagLabels={tagLabels}
        categories={categories.ok ? categories.data : []}
        people={[]}
        tagsPath="/wallet/tags"
      />

      {list ? (
        <TxList
          key={query}
          first={list}
          query={query}
          apiPath="/wallet/transactions"
          hrefBase="/wallet/transactions"
          empty={
            <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
              {hasFilters(filters) ? "Nothing matches these filters." : `Nothing in ${monthLabel(filters.month ?? current)}.`}
            </p>
          }
        />
      ) : (
        <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
          Your transactions could not be loaded. Please try again later.
        </p>
      )}

      <Link
        href="/wallet/transactions/new"
        aria-label="Add to wallet"
        className="fixed right-[max(1rem,calc(env(safe-area-inset-right)+1rem))] bottom-[calc(var(--sp-dock-h)+var(--sp-dock-gap)+1rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-(--sp-pill) text-(--sp-pill-text) shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
      >
        <Plus className="size-7" aria-hidden />
      </Link>
    </div>
  );
}
