import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { X } from "lucide-react";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getTransaction } from "@/lib/transactions-server";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { SpIconLink } from "@/components/transactions/sp-link";
import { PageHeader } from "@/components/spine-ui";

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
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title={res.data.type === "INCOME" ? "Edit income" : "Edit expense"}
        subtitle="Company"
        action={<SpIconLink href={back} label="Cancel and go back" icon={<X aria-hidden />} />}
      />
      <TransactionForm cancelHref={back} transaction={res.data} categories={categories ?? []} today={todayIn(dates.zone)} />
    </div>
  );
}
