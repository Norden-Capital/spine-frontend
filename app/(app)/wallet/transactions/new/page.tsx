import type { Metadata } from "next";
import { IconClose } from "@/components/spine-ui";
import { todayIn } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { getWalletCategories, getWalletTx } from "@/lib/wallet-server";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { SpIconLink } from "@/components/transactions/sp-link";
import { PageHeader } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Add to wallet" };

// Blocks on the server on purpose (session/URL data), so nothing flashes.
export const instant = false;

/** New wallet transaction. ?copy={id}: start from that one (no files, date today). */
export default async function NewWalletTxPage({ searchParams }: PageProps<"/wallet/transactions/new">) {
  const { copy } = await searchParams;
  const [categories, dates, source] = await Promise.all([
    getWalletCategories(),
    getDateSettings(),
    typeof copy === "string" ? getWalletTx(copy) : Promise.resolve(null),
  ]);
  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        title={source?.ok ? "Copy to wallet" : "Add to wallet"}
        subtitle="Personal wallet · only you"
        action={<SpIconLink href={"/wallet"} label="Cancel and go back" icon={<IconClose aria-hidden />} />}
      />
      <TransactionForm
        scope="wallet"
        transaction={null}
        copyFrom={source?.ok ? source.data : null}
        categories={categories.ok ? categories.data : []}
        today={todayIn(dates.zone)}
      />
    </div>
  );
}
