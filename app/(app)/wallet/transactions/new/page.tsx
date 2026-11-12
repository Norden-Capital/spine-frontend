import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getWalletCategories, getWalletTx } from "@/lib/wallet-server";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "Add to wallet" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** New wallet transaction. ?copy={id}: start from that one (no files, date today). */
export default async function NewWalletTxPage({ searchParams }: PageProps<"/wallet/transactions/new">) {
  const { copy } = await searchParams;
  const [categories, dates, source] = await Promise.all([
    getWalletCategories(),
    getDateSettings(),
    typeof copy === "string" ? getWalletTx(copy) : Promise.resolve(null),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{source?.ok ? "Copy to wallet" : "Add to wallet"}</h1>
        <Link
          href="/wallet"
          aria-label="Cancel and go back"
          className="-mr-2 flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      <TransactionForm
        scope="wallet"
        transaction={null}
        copyFrom={source?.ok ? source.data : null}
        categories={categories.ok ? categories.data : []}
        today={todayIn(dates.zone)}
      />
    </div>
  );
}
