import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getWalletCategories, getWalletTx } from "@/lib/wallet-server";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "Edit wallet transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function EditWalletTxPage({ params }: PageProps<"/wallet/transactions/[id]/edit">) {
  const { id } = await params;
  const [res, categories, dates] = await Promise.all([getWalletTx(id), getWalletCategories(), getDateSettings()]);
  if (!res.ok && (res.status === 404 || res.status === 400)) notFound();
  if (!res.ok) throw new Error(`Loading wallet transaction failed (${res.status})`);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit</h1>
        <Link
          href={`/wallet/transactions/${encodeURIComponent(id)}`}
          aria-label="Cancel and go back"
          className="-mr-2 flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      <TransactionForm
        scope="wallet"
        transaction={res.data}
        categories={categories.ok ? categories.data : []}
        today={todayIn(dates.zone)}
      />
    </div>
  );
}
