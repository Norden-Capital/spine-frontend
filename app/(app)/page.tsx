import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Receipt } from "lucide-react";
import { formatDay, todayIn, type DateSettings } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getMonth } from "@/lib/transactions-server";
import {
  addMonths,
  CURRENCIES,
  formatMoney,
  formatNet,
  isMonth,
  monthLabel,
  monthOf,
  type Transaction,
} from "@/lib/transactions-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Amount } from "@/components/transactions/amount";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** Home = Transactions of one month. ?month=YYYY-MM (default: this month). */
export default async function TransactionsPage({ searchParams }: PageProps<"/">) {
  const { month: raw } = await searchParams;
  const dates = await getDateSettings();
  const current = monthOf(todayIn(dates.zone));
  const month = isMonth(raw) ? raw : current;
  if (month > current) redirect("/");

  return (
    <div className="flex flex-col gap-4">
      <MonthSwitcher month={month} current={current} />
      {/* New skeleton for each month while its data streams in. */}
      <Suspense key={month} fallback={<MonthSkeleton />}>
        <MonthView month={month} dates={dates} />
      </Suspense>
      <Link
        href="/transactions/new"
        aria-label="Add transaction"
        className="fixed right-[max(1rem,calc(env(safe-area-inset-right)+1rem))] bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="size-7" aria-hidden />
      </Link>
    </div>
  );
}

function MonthSwitcher({ month, current }: { month: string; current: string }) {
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  const href = (m: string) => (m === current ? "/" : `/?month=${m}`);
  const arrow = "flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50";
  return (
    <div className="flex items-center justify-between">
      <Link href={href(prev)} aria-label="Previous month" className={arrow}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <h1 className="text-lg font-semibold">{monthLabel(month)}</h1>
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

async function MonthView({ month, dates }: { month: string; dates: DateSettings }) {
  const res = await getMonth(month);
  if (!res.ok) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        Transactions could not be loaded. Please try again later.
      </p>
    );
  }
  const { items, totals } = res.data;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed px-4 py-10 text-center">
        <Receipt className="size-10 text-muted-foreground" aria-hidden />
        <div>
          <p className="font-medium">No transactions in {monthLabel(month)}</p>
          <p className="mt-1 text-sm text-muted-foreground">Add an expense or an income with its proof.</p>
        </div>
        <Link href="/transactions/new" className={buttonVariants({ size: "lg", className: "h-11" })}>
          <Plus aria-hidden />
          Add your first transaction
        </Link>
      </div>
    );
  }

  // Newest day first; inside a day, the backend order.
  const byDay = new Map<string, Transaction[]>();
  for (const tx of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    byDay.set(tx.date, [...(byDay.get(tx.date) ?? []), tx]);
  }

  return (
    <>
      <Totals totals={totals} />
      <div className="flex flex-col gap-4">
        {[...byDay].map(([day, txs]) => (
          <section key={day} aria-label={formatDay(day, dates)}>
            <h2 className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">{formatDay(day, dates)}</h2>
            <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
              {txs.map((tx) => (
                <li key={tx.id}>
                  <TxRow tx={tx} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}

function Totals({ totals }: { totals: Record<string, { in: string; out: string; net: string } | undefined> }) {
  const lines = CURRENCIES.flatMap((c) => {
    const t = totals[c];
    return t && (Number(t.in) !== 0 || Number(t.out) !== 0) ? [{ currency: c, ...t }] : [];
  });
  if (lines.length === 0) return null;
  // One row per currency: "in · out" on the left (small), the net on the right.
  return (
    <div className="flex flex-col divide-y rounded-xl border bg-card px-4">
      {lines.map((t) => (
        <div key={t.currency} className="flex items-center justify-between gap-3 py-2.5 tabular-nums">
          <p className="flex min-w-0 flex-wrap gap-x-1.5 text-sm">
            <span className="text-emerald-700 dark:text-emerald-400">{formatMoney(t.in, t.currency)} in</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="text-red-700/90 dark:text-red-400/90">{formatMoney(t.out, t.currency)} out</span>
          </p>
          <p className="shrink-0 text-right text-lg font-semibold">{formatNet(t.net, t.currency)}</p>
        </div>
      ))}
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  return (
    <Link
      href={`/transactions/${encodeURIComponent(tx.id)}`}
      className="flex min-h-14 items-center gap-3 px-3 py-2.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <CategoryIcon name={tx.category.icon} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{tx.description || tx.category.name}</span>
        {tx.tags.length > 0 ? (
          <span className="truncate text-xs text-muted-foreground">{tx.tags.map((t) => t.name).join(" · ")}</span>
        ) : (
          <span className="truncate text-xs text-muted-foreground">{tx.category.name}</span>
        )}
      </span>
      <Amount type={tx.type} amount={tx.amount} currency={tx.currency} />
    </Link>
  );
}

function MonthSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy aria-label="Loading transactions">
      <Skeleton className="h-16 w-full rounded-xl" />
      {[0, 1].map((g) => (
        <div key={g} className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <div className="flex flex-col divide-y rounded-xl border">
            {[0, 1, 2].map((r) => (
              <div key={r} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
