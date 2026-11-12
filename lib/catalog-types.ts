// Categories and tags (module 3). Shared by server and client code.

export type Category = {
  id: string;
  name: string;
  /** Lucide icon name from GET /api/categories/icons, e.g. "plane". */
  icon: string;
  archived: boolean;
};

export type Tag = {
  id: string;
  name: string;
  archived: boolean;
  createdAt?: string;
};

/** Sort by name, the way people read a list. */
export function byName<T extends { name: string }>(a: T, b: T): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
}
