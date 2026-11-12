import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconAdd, IconCalendarRepeat, IconNoResults, IconReceipt, PageHeader } from "@/components/spine-ui";
import { backendGet, requireUser } from "@/lib/auth";
import { displayName, type AdminUser, type CurrentUser } from "@/lib/auth-types";
import { isOwner } from "@/lib/roles";
import { getActiveCategories } from "@/lib/catalog-server";
import { filtersToQuery, hasFilters, parseFilters } from "@/lib/filters";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getList } from "@/lib/list-server";
import { monthLabel, monthOf } from "@/lib/transactions-types";
import { FilterBar, type PersonOption } from "@/components/filters/filter-bar";
import { TxList } from "@/components/transactions/tx-list";
import { PageEmpty } from "@/components/nav/page-empty";

export const metadata: Metadata = { title: "Expenses" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** Company transactions: month (or date range), search, filters, totals. */
export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams;
  const [user, dates] = await Promise.all([requireUser("/transactions"), getDateSettings()]);
  const today = todayIn(dates.zone);
  const current = monthOf(today);
  const filters = parseFilters(params);
  // "Created by" is the owner's filter only (the backend says 403 to members).
  if (!isOwner(user) && filters.createdBy) {
    // Keep the address clean too: the same page without ?createdBy=.
    const clean = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (k === "createdBy" || v === undefined) continue;
      for (const one of Array.isArray(v) ? v : [v]) clean.append(k, one);
    }
    redirect(`/transactions${clean.size ? `?${clean}` : ""}`);
  }
  const range = Boolean(filters.from || filters.to);
  if (!range) filters.month = filters.month ?? current;
  if (filters.month && filters.month > current) redirect("/transactions");
  const query = filtersToQuery(filters);

  const [list, categories, people] = await Promise.all([
    getList("/transactions", query),
    getActiveCategories(),
    peopleFor(user),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Expenses"
        subtitle="Company"
        action={
          // Repeat expenses (/recurring): round 44 link, same look as the kit's back button.
          <Link
            href="/recurring"
            aria-label="Repeat expenses"
            title="Repeat expenses"
            data-testid="repeat-expenses-link"
            className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 [&_svg]:size-[20px] [&_svg]:stroke-[1.6]"
          >
            <IconCalendarRepeat aria-hidden />
          </Link>
        }
      />

      <FilterBar
        filters={filters}
        today={today}
        categories={categories ?? []}
        people={people}
        apiPath="/transactions"
        placeholder="Description, comment, website"
        totalItems={list?.totalItems}
        net={list?.totals?.net}
        autoFocusSearch={params.search === "1"}
      />

      {list ? (
        <TxList
          key={query}
          first={list}
          query={query}
          apiPath="/transactions"
          hrefBase="/transactions"
          showTotals={false}
          empty={
            hasFilters(filters) ? (
              <PageEmpty icon={<IconNoResults />} title="Nothing matches these filters" />
            ) : (
              <Empty month={filters.month} />
            )
          }
        />
      ) : (
        <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
          Transactions could not be loaded. Please try again later.
        </p>
      )}

      <Link
        href="/transactions/new"
        aria-label="Add transaction"
        className="fixed right-[max(1rem,calc(env(safe-area-inset-right)+1rem))] bottom-[calc(var(--sp-dock-h)+var(--sp-dock-gap)+1rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-(--sp-pill) text-(--sp-pill-text) shadow-lg outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
      >
        <IconAdd className="size-7" aria-hidden />
      </Link>
    </div>
  );
}

/** "Created by" choices: the owner only (Me + every member); members get none (field hidden). */
async function peopleFor(user: CurrentUser): Promise<PersonOption[]> {
  if (!isOwner(user)) return [];
  const me: PersonOption = { id: user.id, name: "Me" };
  try {
    const res = await backendGet("/admin/users");
    if (!res.ok) return [me];
    const users = (await res.json()) as AdminUser[];
    return [me, ...users.filter((u) => u.status !== "INVITED").map((u) => ({ id: u.id, name: displayName(u) }))];
  } catch {
    return [me];
  }
}

/** No transactions this month (no filters): fills the page down to the dock. */
function Empty({ month }: { month?: string }) {
  return (
    <PageEmpty
      icon={<IconReceipt />}
      title={`No transactions${month ? ` in ${monthLabel(month)}` : ""}`}
      text="Add an expense or an income with its proof."
      action={
        <Link
          href="/transactions/new"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-(--sp-pill) px-5 text-sm font-medium text-(--sp-pill-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
        >
          <IconAdd className="size-4" aria-hidden />
          Add your first transaction
        </Link>
      }
    />
  );
}
