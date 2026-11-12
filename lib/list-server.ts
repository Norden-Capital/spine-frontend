// Server-only: one page of a transaction list (company or wallet).
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import type { ListPage } from "@/components/transactions/tx-list";

/** GET {path}?{query}; null if it failed (the page shows an error box). */
export async function getList(path: "/transactions" | "/wallet/transactions", query: string): Promise<ListPage | null> {
  try {
    const res = await backendGet(`${path}${query ? `?${query}` : ""}`);
    if (!res.ok) {
      if (res.status >= 500) console.error(`[list] ${path} failed: ${res.status}`);
      return null;
    }
    return (await res.json()) as ListPage;
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[list] ${path} failed:`, err);
    return null;
  }
}
