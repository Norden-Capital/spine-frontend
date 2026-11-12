import type { Metadata } from "next";
import { getCategoryIcons } from "@/lib/catalog-server";
import { getAllWalletCategories } from "@/lib/wallet-server";
import { CatalogAdmin } from "@/components/catalog/catalog-admin";
import { kindFromParam } from "@/lib/catalog-types";
import { WALLET_CATALOG } from "@/components/catalog/catalog-dialogs";
import { WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Wallet categories" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

/** My private categories (same screen as the company one). */
export default async function WalletCategoriesPage({ searchParams }: PageProps<"/wallet/categories">) {
  const [params, categories, icons] = await Promise.all([searchParams, getAllWalletCategories(), getCategoryIcons()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Categories" subtitle="Only for your wallet." />
      <CatalogAdmin
        categories={categories.ok ? categories.data : null}
        icons={icons}
        paths={WALLET_CATALOG}
        kind={kindFromParam(params.kind)}
      />
    </div>
  );
}
