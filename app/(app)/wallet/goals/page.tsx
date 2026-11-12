import type { Metadata } from "next";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getGoals } from "@/lib/wallet-server";
import { GoalsManager } from "@/components/wallet/goals-manager";
import { WalletLoadError, WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Goals" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function GoalsPage() {
  const [goals, dates] = await Promise.all([getGoals(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Goals" subtitle="Money you put aside. It does not change your balance." />
      {goals.ok ? <GoalsManager goals={goals.data} today={todayIn(dates.zone)} /> : <WalletLoadError what="Goals" />}
    </div>
  );
}
