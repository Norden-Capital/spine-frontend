// Categories and tags (module 3). Shared by server and client code.

export type Category = {
  id: string;
  name: string;
  /** Lucide icon name from GET /api/categories/icons, e.g. "plane". */
  icon: string;
  archived: boolean;
  /** Parent category id; null = top level (one level only). */
  parentId?: string | null;
  /** Its website as a bare domain ("claude.ai"), or null. */
  website?: string | null;
  /** Its logo: "/api/logos/…", or null = show the icon. */
  logoUrl?: string | null;
  /** How often it was used in the last 90 days (picker order). */
  usageCount?: number;
};

export type Tag = {
  id: string;
  name: string;
  archived: boolean;
  createdAt?: string;
  usageCount?: number;
};

/**
 * Picker order: keep the backend order (usage, then name), but put each
 * child right after its parent. Children whose parent is missing stay top level.
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

/** Sort by name, the way people read a list. */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}
