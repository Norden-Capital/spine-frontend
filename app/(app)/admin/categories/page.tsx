import type { Metadata } from "next";
import { getAllCategories, getCategoryIcons } from "@/lib/catalog-server";
import { CatalogAdmin } from "@/components/catalog/catalog-admin";
import { kindFromParam } from "@/lib/catalog-types";

export const metadata: Metadata = { title: "Categories" };

// Blocks on the server on purpose (session + URL data), so nothing flashes.
// The owner only: for members the admin layout shows "Page not found" before render.
export const instant = false;

export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const [params, categories, icons] = await Promise.all([searchParams, getAllCategories(), getCategoryIcons()]);

  return <CatalogAdmin categories={categories} icons={icons} kind={kindFromParam(params.kind)} />;
}
