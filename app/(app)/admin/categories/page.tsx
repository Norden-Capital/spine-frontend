import type { Metadata } from "next";
import { getAllCategories, getAllTags, getCategoryIcons } from "@/lib/catalog-server";
import { CatalogAdmin } from "@/components/catalog/catalog-admin";

export const metadata: Metadata = { title: "Categories & tags" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
// Managers only: the admin layout sends employees home before render.
export const instant = false;

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const { tab } = await searchParams;
  const [categories, tags, icons] = await Promise.all([getAllCategories(), getAllTags(), getCategoryIcons()]);

  return (
    <CatalogAdmin
      initialTab={tab === "tags" ? "tags" : "categories"}
      categories={categories}
      tags={tags}
      icons={icons}
    />
  );
}
