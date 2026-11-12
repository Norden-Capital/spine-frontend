import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getTransaction } from "@/lib/transactions-server";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "New transaction" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** ?copy={id}: start from that transaction (no proof, date today). ?scan=1: camera first. */
export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const { copy, scan } = await searchParams;
  const [categories, dates, source] = await Promise.all([
    getActiveCategories(),
    getDateSettings(),
    typeof copy === "string" ? getTransaction(copy) : Promise.resolve(null),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{source?.ok ? "Copy transaction" : "New transaction"}</h1>
        <Link
          href="/transactions"
          aria-label="Cancel and go back"
          className="-mr-2 flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      <TransactionForm
        transaction={null}
        copyFrom={source?.ok ? source.data : null}
        categories={categories ?? []}
        today={todayIn(dates.zone)}
        proofFirst={scan === "1"}
      />
    </div>
  );
}
