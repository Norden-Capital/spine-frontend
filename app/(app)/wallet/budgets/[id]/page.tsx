import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/spine-ui";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getBudgetHistory, getWalletCategories } from "@/lib/wallet-server";
import { BudgetDetail } from "@/components/wallet/budget-detail";
import { WalletLoadError } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Budget" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function BudgetPage({ params }: PageProps<"/wallet/budgets/[id]">) {
  const { id } = await params;
  const [res, categories, dates] = await Promise.all([getBudgetHistory(id), getWalletCategories(), getDateSettings()]);
  if (!res.ok && (res.status === 404 || res.status === 400)) notFound();
  if (!res.ok) {
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeader back={{ href: "/wallet/budgets", label: "Back to budgets" }} title="Budget" />
        <WalletLoadError what="This budget" />
      </div>
    );
  }
  return (
    <BudgetDetail history={res.data} categories={categories.ok ? categories.data : []} today={todayIn(dates.zone)} />
  );
}
