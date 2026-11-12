import type { Metadata } from "next";
import { X } from "lucide-react";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getTransaction } from "@/lib/transactions-server";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { SpIconLink } from "@/components/transactions/sp-link";
import { PageHeader } from "@/components/spine-ui";

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
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title={source?.ok ? "Copy transaction" : "New transaction"}
        subtitle="Company"
        action={<SpIconLink href={"/transactions"} label="Cancel and go back" icon={<X aria-hidden />} />}
      />
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
