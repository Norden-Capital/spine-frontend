import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Copy, Pencil, Repeat } from "lucide-react";
import { formatDateTime, formatDay } from "@/lib/prefs";
import { getDateSettings } from "@/lib/prefs-server";
import { formatMoney, monthOf } from "@/lib/transactions-types";
import { getWalletTx } from "@/lib/wallet-server";
import { TxLogo } from "@/components/expenses/tx-logo";
import { WebsiteLink } from "@/components/transactions/website-link";
import { ProofGallery } from "@/components/transactions/proof-gallery";
import { DeleteWalletTx } from "@/components/wallet/delete-wallet-tx";
import { SpLinkButton } from "@/components/transactions/sp-link";
import { InfoList, PageHeader, SpPanel, Timeline, TxHero } from "@/components/spine-ui";

export const metadata: Metadata = { title: "Wallet transaction" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

export default async function WalletTxPage({ params }: PageProps<"/wallet/transactions/[id]">) {
  const { id } = await params;
  const [res, dates] = await Promise.all([getWalletTx(id), getDateSettings()]);
  if (!res.ok && (res.status === 404 || res.status === 400)) notFound();
  if (!res.ok) throw new Error(`Loading wallet transaction failed (${res.status})`);
  const tx = res.data;

  const month = monthOf(tx.date);
  const kind = tx.type === "INCOME" ? "Income" : "Expense";

  return (
    <div className="flex flex-col gap-[16px]">
      <PageHeader
        back={{ href: `/wallet/transactions?month=${month}`, label: "Back to wallet transactions" }}
        title={`Wallet ${kind.toLowerCase()}`}
        subtitle="Only you can see this"
      />

      <TxHero
        tone="wallet"
        icon={<TxLogo logoUrl={tx.logoUrl} icon={tx.category.icon} />}
        tag="Personal wallet"
        title={tx.description || tx.category.name}
        meta={`${tx.category.name} · ${formatDay(tx.date, dates)}`}
        amount={formatMoney(tx.amount, tx.currency, tx.type === "INCOME" ? "+" : "-")}
        kind={`${kind} · ${tx.currency}`}
      />

      <div className="grid grid-cols-3 gap-[8px]">
        <SpLinkButton href={`/wallet/transactions/${encodeURIComponent(tx.id)}/edit`} icon={<Pencil aria-hidden />}>
          Edit
        </SpLinkButton>
        <SpLinkButton
          href={`/wallet/transactions/new?copy=${encodeURIComponent(tx.id)}`}
          variant="secondary"
          icon={<Copy aria-hidden />}
        >
          Copy
        </SpLinkButton>
        <DeleteWalletTx id={tx.id} month={month} />
      </div>

      <InfoList
        rows={[
          { label: "Category", value: tx.category.name + (tx.category.archived ? " (archived)" : "") },
          { label: "Tags", value: tx.tags.length ? tx.tags.map((t) => `#${t.name}`).join("  ") : "—" },
          ...(tx.website ? [{ label: "Website", value: <WebsiteLink domain={tx.website} /> }] : []),
          { label: "Added", value: formatDateTime(tx.createdAt, dates) },
          ...(tx.updatedAt ? [{ label: "Edited", value: formatDateTime(tx.updatedAt, dates) }] : []),
          ...(tx.recurringId
            ? [
                {
                  label: "Repeats",
                  value: (
                    <Link
                      href="/wallet/recurring"
                      className="inline-flex min-h-[44px] items-center gap-[6px] underline underline-offset-2 [&_svg]:size-[14px]"
                    >
                      <Repeat aria-hidden />
                      See recurring
                    </Link>
                  ),
                },
              ]
            : []),
        ]}
      />

      {tx.files.length > 0 && (
        <SpPanel title="Proof" description="Optional for wallet items.">
          <ProofGallery files={tx.files} />
        </SpPanel>
      )}

      <SpPanel title="History">
        <Timeline
          entries={[
            ...(tx.updatedAt ? [{ id: "edited", title: "Edited", meta: formatDateTime(tx.updatedAt, dates) }] : []),
            {
              id: "added",
              title: tx.recurringId ? "Added by a recurring item" : "Added",
              meta: formatDateTime(tx.createdAt, dates),
            },
          ].map((e, i) => ({ ...e, current: i === 0 }))}
        />
      </SpPanel>
    </div>
  );
}
