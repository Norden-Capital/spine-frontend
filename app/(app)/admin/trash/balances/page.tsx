import type { Metadata } from "next";
import { getDateSettings } from "@/lib/prefs-server";
import { getBalanceTrash } from "@/lib/balances-server";
import { BalanceTrashList } from "@/components/balances/balance-trash-list";
import { TrashTabs } from "@/components/nav/trash-tabs";

export const metadata: Metadata = { title: "Trash · Balances" };

// Blocks on the server on purpose (session data), so nothing flashes.
// The owner only: for members the admin layout shows "Page not found" before render.
export const instant = false;

export default async function BalanceTrashPage() {
  const [res, dates] = await Promise.all([getBalanceTrash(), getDateSettings()]);
  return (
    <>
      <TrashTabs value="balances" />
      <BalanceTrashList items={res.ok ? res.data : null} dates={dates} />
    </>
  );
}
