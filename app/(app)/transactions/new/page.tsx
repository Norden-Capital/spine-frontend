import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "New transaction" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function NewTransactionPage() {
  const [categories, dates] = await Promise.all([getActiveCategories(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">New transaction</h1>
        <Link
          href="/"
          aria-label="Cancel and go back"
          className="-mr-2 flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      <TransactionForm transaction={null} categories={categories ?? []} today={todayIn(dates.zone)} />
    </div>
  );
}
