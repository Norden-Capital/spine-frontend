import type { Metadata } from "next";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getBudgets, getWalletCategories } from "@/lib/wallet-server";
import { BudgetsManager } from "@/components/wallet/budgets-manager";
import { WalletLoadError, WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Budgets" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function BudgetsPage() {
  const [budgets, categories, dates] = await Promise.all([getBudgets(), getWalletCategories(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Budgets" subtitle="Monthly limits. Tap one to see its details." />
      {budgets.ok ? (
        <BudgetsManager
          budgets={budgets.data}
          categories={categories.ok ? categories.data : []}
          today={todayIn(dates.zone)}
        />
      ) : (
        <WalletLoadError what="Budgets" />
      )}
    </div>
  );
}
