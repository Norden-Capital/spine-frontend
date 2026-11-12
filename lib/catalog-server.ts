// Server-only: load categories and tags from the backend (with the
// browser's session cookie). null = could not load.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import { byName, type Category, type Tag } from "./catalog-types";

async function getList<T>(path: string): Promise<T[] | null> {
  try {
    const res = await backendGet(path);
    if (!res.ok) {
      console.error(`[catalog] ${path} failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as T[];
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[catalog] ${path} failed:`, err);
    return null;
  }
}

// Categories keep the backend's order ("Other" is always last).

/** Active categories, for pickers (any logged-in user). */
export async function getActiveCategories(): Promise<Category[] | null> {
  return getList<Category>("/categories");
}

/** All categories, archived too (managers only). */
export async function getAllCategories(): Promise<Category[] | null> {
  return getList<Category>("/admin/categories");
}

/** All tags, archived too (managers only). */
export async function getAllTags(): Promise<Tag[] | null> {
  return (await getList<Tag>("/admin/tags"))?.sort(byName) ?? null;
}

/** Icon names a category may use (falls back to an empty list). */
export async function getCategoryIcons(): Promise<string[]> {
  return (await getList<string>("/categories/icons")) ?? [];
}
