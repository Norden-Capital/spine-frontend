// Server-only: load transactions from the backend with the session cookie.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import type { HistoryEntry, MonthData, Transaction } from "./transactions-types";

type Result<T> = { ok: true; data: T } | { ok: false; status: number };

async function getJson<T>(path: string): Promise<Result<T>> {
  try {
    const res = await backendGet(path);
    if (!res.ok) {
      if (res.status >= 500) console.error(`[transactions] ${path} failed: ${res.status}`);
      return { ok: false, status: res.status };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    // Let Next.js internal signals (dynamic rendering, redirect) through.
    unstable_rethrow(err);
    console.error(`[transactions] ${path} failed:`, err);
    return { ok: false, status: 0 };
  }
}

export const getMonth = (month: string) => getJson<MonthData>(`/transactions?month=${month}`);
export const getTransaction = (id: string) => getJson<Transaction>(`/transactions/${encodeURIComponent(id)}`);
export const getHistory = (id: string) =>
  getJson<HistoryEntry[]>(`/transactions/${encodeURIComponent(id)}/history`);
export const getTrash = () => getJson<Transaction[]>("/admin/transactions/trash");
