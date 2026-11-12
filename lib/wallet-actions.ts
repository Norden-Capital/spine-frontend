"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

/**
 * After a wallet change (the browser already called the API): mark every wallet
 * page stale, then go to `to` with fresh data in the same round trip. A Server
 * Function's revalidatePath also clears the browser's copy of earlier pages
 * (the router cache and back/forward pages), so the dashboard and lists never
 * show a deleted item again.
 */
export async function walletChanged(to: string): Promise<void> {
  // Only our own wallet pages (no open redirect).
  const safe = /^\/wallet(?:[/?]|$)/.test(to) && !to.startsWith("//") ? to : "/wallet";
  revalidatePath("/(app)/wallet", "layout");
  redirect(safe, RedirectType.replace);
}
