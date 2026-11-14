import type { Metadata } from "next";
import { IconNoResults, IconReceipt, PageHeader } from "@/components/spine-ui";
import { filtersToQuery, hasFilters, parseFilters } from "@/lib/filters";
import { todayIn } from "@/lib/prefs";
import { getDateSettings, getPreferences } from "@/lib/prefs-server";
import { getList } from "@/lib/list-server";
import { monthLabel, monthOf } from "@/lib/transactions-types";
import { getWalletCategories } from "@/lib/wallet-server";
import { walletCurrencyOf } from "@/lib/wallet-types";
import { FilterBar } from "@/components/filters/filter-bar";
import { TxList } from "@/components/transactions/tx-list";
import { PageEmpty } from "@/components/nav/page-empty";
import { HeaderAddLink } from "@/components/nav/header-add-link";
import { WalletLoadError } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Wallet transactions" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** My private wallet transactions: month (or range), search, filters, totals. */
export default async function WalletTransactionsPage({ searchParams }: PageProps<"/wallet/transactions">) {
  const params = await searchParams;
  const [dates, prefs] = await Promise.all([getDateSettings(), getPreferences()]);
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
      <PageHeader
        title="Wallet transactions"
        subtitle="Personal · only you"
        back={{ href: "/wallet", label: "Wallet" }}
        action={<HeaderAddLink href="/wallet/transactions/new" label="Add to wallet" />}
      />

      <FilterBar
        filters={filters}
        today={today}
        categories={categories.ok ? categories.data : []}
        people={[]}
        apiPath="/wallet/transactions"
        placeholder="Description, website"
        totalItems={list?.totalItems}
        totals={list?.totals ?? undefined}
        currency={walletCurrencyOf(list?.currency ?? prefs.walletCurrency)}
      />

      {list ? (
        <TxList
          key={query}
          first={list}
          query={query}
          apiPath="/wallet/transactions"
          hrefBase="/wallet/transactions"
          empty={
            hasFilters(filters) ? (
              <PageEmpty icon={<IconNoResults />} title="Nothing matches these filters" />
            ) : (
              <PageEmpty icon={<IconReceipt />} title={`Nothing in ${monthLabel(filters.month ?? current)}`} />
            )
          }
        />
      ) : (
        <WalletLoadError what="Your transactions" />
      )}
    </div>
  );
}
