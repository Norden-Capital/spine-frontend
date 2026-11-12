import type { Metadata } from "next";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getRecurring, getWalletCategories } from "@/lib/wallet-server";
import { RecurringManager } from "@/components/wallet/recurring-manager";
import { WalletLoadError, WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Recurring" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function RecurringPage() {
  const [items, categories, dates] = await Promise.all([getRecurring(), getWalletCategories(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Recurring" subtitle="Added for you on each date. You get an alert the day before." />
      {items.ok ? (
        <RecurringManager items={items.data} categories={categories.ok ? categories.data : []} today={todayIn(dates.zone)} />
      ) : (
        <WalletLoadError what="Recurring items" />
      )}
    </div>
  );
}
