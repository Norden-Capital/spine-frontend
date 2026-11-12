// Server-only: the private wallet (module 5). Strictly the logged-in user's.
import { unstable_rethrow } from "next/navigation";
import { backendGet } from "./auth";
import type { Category, Tag } from "./catalog-types";
import type { Budget, Dashboard, Goal, Recurring, WalletStatus, WalletTx } from "./wallet-types";

export type WalletResult<T> = { ok: true; data: T } | { ok: false; status: number; code?: string };

/** GET /api/wallet{path}. 423 = locked, 409 no_pin, 404 = not mine / gone. */
export async function walletGet<T>(path: string): Promise<WalletResult<T>> {
  try {
    const res = await backendGet(`/wallet${path}`);
    if (!res.ok) {
      let code: string | undefined;
      try {
        code = ((await res.json()) as { error?: string }).error;
      } catch {}
      if (res.status >= 500) console.error(`[wallet] ${path} failed: ${res.status}`);
      return { ok: false, status: res.status, code };
    }
    return { ok: true, data: res.status === 204 ? (undefined as T) : ((await res.json()) as T) };
  } catch (err) {
    unstable_rethrow(err);
    console.error(`[wallet] ${path} failed:`, err);
    return { ok: false, status: 0 };
  }
}

/** Always allowed (no unlock needed). null = backend down. */
export async function getWalletStatus(): Promise<WalletStatus | null> {
  const r = await walletGet<WalletStatus>("/status");
  return r.ok ? r.data : null;
}

export const getDashboard = () => walletGet<Dashboard>("/dashboard");
export const getWalletTx = (id: string) => walletGet<WalletTx>(`/transactions/${encodeURIComponent(id)}`);
export const getBudgets = () => walletGet<Budget[]>("/budgets");
export const getGoals = () => walletGet<Goal[]>("/goals");
export const getRecurring = () => walletGet<Recurring[]>("/recurring");
/** Picker list (active, usage order). */
export const getWalletCategories = () => walletGet<Category[]>("/categories");
/** All of mine, archived too. */
export const getAllWalletCategories = () => walletGet<Category[]>("/categories/all");
export const getAllWalletTags = () => walletGet<Tag[]>("/tags/all");
