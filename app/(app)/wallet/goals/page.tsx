import type { Metadata } from "next";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getDashboard, getGoals } from "@/lib/wallet-server";
import { GoalsManager } from "@/components/wallet/goals-manager";
import { WalletLoadError, WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Goals" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

export default async function GoalsPage() {
  // The dashboard gives the AVAILABLE balance (shown in "Add money").
  const [goals, dates, dashboard] = await Promise.all([getGoals(), getDateSettings(), getDashboard()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Goals" subtitle="Money you put aside. It leaves your balance until you take it out." />
      {goals.ok ? (
        <GoalsManager
          goals={goals.data}
          today={todayIn(dates.zone)}
          available={dashboard.ok ? (dashboard.data.balance ?? null) : null}
          availableCurrency={dashboard.ok ? dashboard.data.currency : null}
          usdRate={dashboard.ok ? dashboard.data.usdRate : null}
        />
      ) : (
        <WalletLoadError what="Goals" />
      )}
    </div>
  );
}
