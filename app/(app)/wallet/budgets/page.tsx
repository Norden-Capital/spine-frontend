import type { Metadata } from "next";
import { getBudgets, getWalletCategories } from "@/lib/wallet-server";
import { BudgetsManager } from "@/components/wallet/budgets-manager";
import { WalletLoadError, WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Budgets" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function BudgetsPage() {
  const [budgets, categories] = await Promise.all([getBudgets(), getWalletCategories()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Budgets" subtitle="Monthly limits. You get an alert at 80% and 100%." />
      {budgets.ok ? (
        <BudgetsManager budgets={budgets.data} categories={categories.ok ? categories.data : []} />
      ) : (
        <WalletLoadError what="Budgets" />
      )}
    </div>
  );
}
