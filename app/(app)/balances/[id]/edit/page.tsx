import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { EmptyState, IconError, IconNoResults, PageHeader } from "@/components/spine-ui";
import { requireUser } from "@/lib/auth";
import { isOwner } from "@/lib/roles";
import { getActiveCategories } from "@/lib/catalog-server";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getBalance } from "@/lib/balances-server";
import { balancePath } from "@/lib/balances-types";
import { BalanceForm } from "@/components/balances/balance-form";
import { PLAIN_STATE_ICON } from "@/components/nav/state-icon";

export const metadata: Metadata = { title: "Edit balance" };

// Blocks on the server on purpose (session data), so nothing flashes.
export const instant = false;

/** Edit a balance: the owner only (members see the balance page). */
export default async function EditBalancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`${balancePath(id)}/edit`);
  if (!isOwner(user)) redirect(balancePath(id));
  const [res, categories, dates] = await Promise.all([getBalance(id), getActiveCategories(), getDateSettings()]);
  const back = { href: res.ok ? balancePath(id) : "/balances", label: res.ok ? "Back to the balance" : "Back to Balances" };
  if (!res.ok) {
    const missing = res.status === 404;
    return (
      <div className="flex flex-col gap-[16px]">
        <PageHeader back={back} title="Edit balance" />
        <EmptyState
          className={PLAIN_STATE_ICON}
          tone={missing ? "accent" : "danger"}
          icon={missing ? <IconNoResults /> : <IconError />}
          title={missing ? "Balance not found" : "Could not load"}
          text={missing ? "This balance no longer exists." : "Please try again later."}
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader back={back} title="Edit balance" subtitle="Company" />
      <BalanceForm balance={res.data.balance} categories={categories ?? []} today={todayIn(dates.zone)} />
    </div>
  );
}
