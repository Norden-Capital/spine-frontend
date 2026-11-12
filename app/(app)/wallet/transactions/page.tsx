import type { Metadata } from "next";
import Link from "next/link";
import { IconAdd, IconNoResults, IconReceipt, PageHeader } from "@/components/spine-ui";
import { filtersToQuery, hasFilters, parseFilters } from "@/lib/filters";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getList } from "@/lib/list-server";
import { monthLabel, monthOf } from "@/lib/transactions-types";
import { getWalletCategories } from "@/lib/wallet-server";
import { FilterBar } from "@/components/filters/filter-bar";
import { TxList } from "@/components/transactions/tx-list";
import { PageEmpty } from "@/components/nav/page-empty";

export const metadata: Metadata = { title: "Wallet transactions" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** My private wallet transactions: month (or range), search, filters, totals. */
export default async function WalletTransactionsPage({ searchParams }: PageProps<"/wallet/transactions">) {
  const params = await searchParams;
  const dates = await getDateSettings();
  const today = todayIn(dates.zone);
  const current = monthOf(today);
  const filters = parseFilters(params);
  delete filters.createdBy; // not used on the wallet
  const range = Boolean(filters.from || filters.to);
  if (!range) filters.month = filters.month && filters.month <= current ? filters.month : current;
  const query = filtersToQuery(filters);
  const [list, categories] = await Promise.all([getList("/wallet/transactions", query), getWalletCategories()]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Wallet transactions" subtitle="Personal · only you" back={{ href: "/wallet", label: "Wallet" }} />

      <FilterBar
        filters={filters}
        today={today}
        categories={categories.ok ? categories.data : []}
        people={[]}
        apiPath="/wallet/transactions"
        placeholder="Description, website"
        totalItems={list?.totalItems}
        net={list?.totals?.net}
      />

      {list ? (
        <TxList
          key={query}
          first={list}
          query={query}
          apiPath="/wallet/transactions"
          hrefBase="/wallet/transactions"
          showTotals={false}
          empty={
            hasFilters(filters) ? (
              <PageEmpty icon={<IconNoResults />} title="Nothing matches these filters" />
            ) : (
              <PageEmpty icon={<IconReceipt />} title={`Nothing in ${monthLabel(filters.month ?? current)}`} />
            )
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
        <IconAdd className="size-7" aria-hidden />
      </Link>
    </div>
  );
}
