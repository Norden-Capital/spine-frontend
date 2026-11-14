import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { BalanceForm } from "@/components/balances/balance-form";

export const metadata: Metadata = { title: "New balance" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Add a balance: the owner only (members go back to the list). */
export default async function NewBalancePage() {
  const user = await requireUser("/balances/new");
  if (!isOwner(user)) redirect("/balances");
  const [categories, dates] = await Promise.all([getActiveCategories(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader back={{ href: "/balances", label: "Back to Balances" }} title="New balance" subtitle="Company" />
      <BalanceForm balance={null} categories={categories ?? []} today={todayIn(dates.zone)} />
    </div>
  );
}
