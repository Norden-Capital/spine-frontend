// Categories (module 3). Shared by server and client code.

export type Category = {
  id: string;
  name: string;
  /** Lucide icon name from GET /api/categories/icons, e.g. "plane". */
  icon: string;
  archived: boolean;
  /** Expense or income category (a subcategory has its main's kind). */
  kind?: "EXPENSE" | "INCOME";
  /** Parent category id; null = top level (one level only). */
  parentId?: string | null;
  /**
   * 0-based place among its siblings (same parent), set by drag and drop.
   * Always sent by the backend; optional only because some screens build
   * small Category objects by hand.
   */
  position?: number;
  /** Its website as a bare domain ("claude.ai"), or null. */
  website?: string | null;
  /** Its logo: "/api/logos/…", or null = show the icon. */
  logoUrl?: string | null;
  /** How often it was used in the last 90 days (picker order). */
  usageCount?: number;
};

/**
 * Keep the backend order, but put each child right after its parent.
 * Children whose parent is missing stay top level. Never sorts by name:
 * pickers get usage order, the manage page gets its saved order
 * (each main by position, then its subcategories by position).
 */
export function groupByParent<T extends { id: string; parentId?: string | null }>(
  list: T[]
): { item: T; child: boolean }[] {
  const ids = new Set(list.map((c) => c.id));
  const out: { item: T; child: boolean }[] = [];
  for (const c of list) {
    if (c.parentId && ids.has(c.parentId)) continue;
    out.push({ item: c, child: false });
    for (const k of list) if (k.parentId === c.id) out.push({ item: k, child: true });
  }
  return out;
}

/**
 * Manage-page order, same as the backend: each main (by position, then
 * name) followed by its subcategories (by position, then name).
 * Subcategories whose parent is missing go last. Used for the quick
 * (optimistic) list after a drop; the server answer replaces it.
 */
export function manageOrder<T extends { id: string; name: string; parentId?: string | null; position?: number }>(
  list: T[]
): T[] {
  const order = (a: T, b: T) =>
    (a.position ?? 0) - (b.position ?? 0) ||
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const ids = new Set(list.map((c) => c.id));
  const mains = list.filter((c) => !c.parentId).sort(order);
  const orphans = list.filter((c) => c.parentId && !ids.has(c.parentId)).sort(order);
  const out: T[] = [];
  for (const main of mains) {
    out.push(main, ...list.filter((c) => c.parentId === main.id).sort(order));
  }
  return [...out, ...orphans];
}

/** Expense or income category. */
export type CategoryKind = "EXPENSE" | "INCOME";

/** "?kind=income" → INCOME; anything else → EXPENSE (the default tab). */
export function kindFromParam(value: string | string[] | undefined): CategoryKind {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.toLowerCase() === "income" ? "INCOME" : "EXPENSE";
}
