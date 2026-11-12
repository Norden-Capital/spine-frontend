import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getWalletCategories, getWalletTx } from "@/lib/wallet-server";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { SpIconLink } from "@/components/transactions/sp-link";
import { PageHeader } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Edit wallet transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function EditWalletTxPage({ params }: PageProps<"/wallet/transactions/[id]/edit">) {
  const { id } = await params;
  const [res, categories, dates] = await Promise.all([getWalletTx(id), getWalletCategories(), getDateSettings()]);
  if (!res.ok && (res.status === 404 || res.status === 400)) notFound();
  if (!res.ok) throw new Error(`Loading wallet transaction failed (${res.status})`);
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title={res.data.type === "INCOME" ? "Edit wallet income" : "Edit wallet expense"}
        subtitle="Personal wallet · only you"
        action={<SpIconLink href={`/wallet/transactions/${encodeURIComponent(id)}`} label="Cancel and go back" icon={<X aria-hidden />} />}
      />
      <TransactionForm
        cancelHref={`/wallet/transactions/${encodeURIComponent(id)}`}
        scope="wallet"
        transaction={res.data}
        categories={categories.ok ? categories.data : []}
        today={todayIn(dates.zone)}
      />
    </div>
  );
}
