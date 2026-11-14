// Server-only: company balances from the backend, with the session cookie.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import type { BalanceDetail, BalanceList } from "./balances-types";

export type BalanceResult<T> = { ok: true; data: T } | { ok: false; status: number };

async function getJson<T>(path: string): Promise<BalanceResult<T>> {
  try {
    const res = await backendGet(path);
    if (!res.ok) {
      if (res.status >= 500) console.error(`[balances] ${path} failed: ${res.status}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[balances] ${path} failed:`, err);
    return { ok: false, status: 0 };
  }
}

/** All balances, most urgent first, with the monthly total (owner and members). */
export const getBalances = () => getJson<BalanceList>("/balances");
/** One balance with its history. 404 = not found. */
export const getBalance = (id: string) => getJson<BalanceDetail>(`/balances/${encodeURIComponent(id)}`);
