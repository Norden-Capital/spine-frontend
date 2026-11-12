import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { X } from "lucide-react";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getTransaction } from "@/lib/transactions-server";
import { TransactionForm } from "@/components/transactions/transaction-form";

export const metadata: Metadata = { title: "Edit transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]/edit">) {
  const { id } = await params;
  const [res, categories, dates] = await Promise.all([getTransaction(id), getActiveCategories(), getDateSettings()]);
  if (!res.ok && res.status === 401) redirect(`/login?next=${encodeURIComponent(`/transactions/${id}/edit`)}`);
  if (!res.ok && (res.status === 404 || res.status === 400 || res.status === 403)) notFound();
  if (!res.ok) throw new Error(`Loading transaction failed (${res.status})`);
  const back = `/transactions/${encodeURIComponent(id)}`;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Edit transaction</h1>
        <Link
          href={back}
          aria-label="Cancel and go back"
          className="-mr-2 flex size-11 items-center justify-center rounded-full outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <X className="size-5" aria-hidden />
        </Link>
      </div>
      <TransactionForm transaction={res.data} categories={categories ?? []} today={todayIn(dates.zone)} />
    </div>
  );
}
