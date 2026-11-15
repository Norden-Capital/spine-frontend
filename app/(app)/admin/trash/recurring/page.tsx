import type { Metadata } from "next";
import { getDateSettings } from "@/lib/prefs-server";
import { getRecurringTrash } from "@/lib/recurring-server";
import { RecurringTrashList } from "@/components/recurring/recurring-trash-list";
import { TrashTabs } from "@/components/nav/trash-tabs";

export const metadata: Metadata = { title: "Trash · Repeat expenses" };

// Blocks on the server on purpose (session data), so nothing flashes.
// The owner only: for members the admin layout shows "Page not found" before render.
export const instant = false;

export default async function RecurringTrashPage() {
  const [res, dates] = await Promise.all([getRecurringTrash(), getDateSettings()]);
  return (
    <>
      <TrashTabs value="repeats" />
      <RecurringTrashList items={res.ok ? res.data : null} dates={dates} />
    </>
  );
}
