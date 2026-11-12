import type { Metadata } from "next";
import { getCategoryIcons } from "@/lib/catalog-server";
import { getAllWalletCategories, getAllWalletTags } from "@/lib/wallet-server";
import { CatalogAdmin } from "@/components/catalog/catalog-admin";
import { WALLET_CATALOG } from "@/components/catalog/catalog-dialogs";
import { WalletPageHead } from "@/components/wallet/wallet-page-head";

export const metadata: Metadata = { title: "Wallet categories" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
export const instant = false;

/** My private categories and tags (same screen as the company one). */
export default async function WalletCategoriesPage({ searchParams }: PageProps<"/wallet/categories">) {
  const { tab } = await searchParams;
  const [categories, tags, icons] = await Promise.all([getAllWalletCategories(), getAllWalletTags(), getCategoryIcons()]);
  return (
    <div className="flex flex-col gap-4">
      <WalletPageHead title="Categories & tags" subtitle="Only for your wallet." />
      <CatalogAdmin
        initialTab={tab === "tags" ? "tags" : "categories"}
        categories={categories.ok ? categories.data : null}
        tags={tags.ok ? tags.data : null}
        icons={icons}
        paths={WALLET_CATALOG}
      />
    </div>
  );
}
