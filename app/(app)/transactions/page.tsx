import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react";
import { backendGet, requireUser } from "@/lib/auth";
import { canSeeUsers, displayName, type AdminUser } from "@/lib/auth-types";
import { getActiveCategories } from "@/lib/catalog-server";
import { filtersToQuery, hasFilters, parseFilters } from "@/lib/filters";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getList } from "@/lib/list-server";
import { addMonths, monthLabel, monthOf } from "@/lib/transactions-types";
import { FilterBar, type PersonOption } from "@/components/filters/filter-bar";
import { TxList } from "@/components/transactions/tx-list";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Expenses" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** Company transactions: month (or date range), search, filters, totals. */
export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const params = await searchParams;
  const [user, dates] = await Promise.all([requireUser("/transactions"), getDateSettings()]);
  const current = monthOf(todayIn(dates.zone));
  const filters = parseFilters(params);
  const range = Boolean(filters.from || filters.to);
  if (!range) filters.month = filters.month ?? current;
  if (filters.month && filters.month > current) redirect("/transactions");
  const tagLabels = typeof params.tagLabels === "string" ? params.tagLabels.split(",") : [];
  const query = filtersToQuery(filters);

  const [list, categories, people] = await Promise.all([
    getList("/transactions", query),
    getActiveCategories(),
    peopleFor(user),
  ]);

  const keep = (m: string) => {
    const q = new URLSearchParams(filtersToQuery({ ...filters, month: m === current ? undefined : m }));
    if (tagLabels.length) q.set("tagLabels", tagLabels.join(","));
    return `/transactions${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {!range && <MonthSwitcher month={filters.month!} current={current} href={keep} />}
      {range && <h1 className="text-[22px] font-medium text-(--sp-text)">Expenses</h1>}

      <FilterBar
        filters={filters}
        tagLabels={tagLabels}
        categories={categories ?? []}
        people={people}
        tagsPath="/tags"
        autoFocusSearch={params.search === "1"}
      />

      {list ? (
        <TxList
          key={query}
          first={list}
          query={query}
          apiPath="/transactions"
          hrefBase="/transactions"
          empty={
            hasFilters(filters) ? (
              <p className="rounded-(--sp-radius) bg-(--sp-panel) px-4 py-8 text-center text-sm text-(--sp-text-muted)">
                Nothing matches these filters.
              </p>
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
        <Plus className="size-7" aria-hidden />
      </Link>
    </div>
  );
}

/** "Added by" choices: managers see everyone they can see; others only "Me". */
async function peopleFor(user: { id: string; role: string; email: string; firstName: string | null; lastName: string | null }): Promise<PersonOption[]> {
  const me: PersonOption = { id: user.id, name: "Me" };
  if (!canSeeUsers(user.role as "OWNER" | "ADMIN" | "EMPLOYEE")) return [me];
  try {
    const res = await backendGet("/admin/users");
    if (!res.ok) return [me];
    const users = (await res.json()) as AdminUser[];
    return [me, ...users.filter((u) => u.status !== "INVITED").map((u) => ({ id: u.id, name: displayName(u) }))];
  } catch {
    return [me];
  }
}

function MonthSwitcher({ month, current, href }: { month: string; current: string; href: (m: string) => string }) {
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const arrow =
    "flex size-11 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)";
  return (
    <div className="flex items-center justify-between">
      <Link href={href(prev)} aria-label="Previous month" className={arrow}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <h1 className="text-[22px] font-medium text-(--sp-text)">{monthLabel(month)}</h1>
      {next <= current ? (
        <Link href={href(next)} aria-label="Next month" className={arrow}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className={cn(arrow, "pointer-events-none opacity-30")} aria-hidden>
          <ChevronRight className="size-5" />
        </span>
      )}
    </div>
  );
}

function Empty({ month }: { month?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-(--sp-radius) bg-(--sp-panel) px-4 py-10 text-center">
      <Receipt className="size-10 text-(--sp-text-faint)" aria-hidden />
      <div>
        <p className="font-medium text-(--sp-text)">No transactions{month ? ` in ${monthLabel(month)}` : ""}</p>
        <p className="mt-1 text-sm text-(--sp-text-muted)">Add an expense or an income with its proof.</p>
      </div>
      <Link
        href="/transactions/new"
        className="inline-flex h-11 items-center gap-2 rounded-full bg-(--sp-pill) px-5 text-sm font-medium text-(--sp-pill-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
      >
        <Plus className="size-4" aria-hidden />
        Add your first transaction
      </Link>
    </div>
  );
}
