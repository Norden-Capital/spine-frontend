import type { Metadata } from "next";
import { getDateSettings } from "@/lib/prefs-server";
import { getTrash } from "@/lib/transactions-server";
import { TrashList } from "@/components/transactions/trash-list";
import { TrashTabs } from "@/components/nav/trash-tabs";

export const metadata: Metadata = { title: "Trash" };

// Blocks on the server on purpose (session data), so nothing flashes.
// The owner only: for members the admin layout shows "Page not found" before render.
export const instant = false;

export default async function TrashPage() {
  const [res, dates] = await Promise.all([getTrash(), getDateSettings()]);
  return (
    <>
      <TrashTabs value="expenses" />
      <TrashList items={res.ok ? res.data : null} dates={dates} />
    </>
  );
}
