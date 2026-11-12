import type { Metadata } from "next";
import { getDateSettings } from "@/lib/prefs-server";
import { getTrash } from "@/lib/transactions-server";
import { TrashList } from "@/components/transactions/trash-list";

export const metadata: Metadata = { title: "Trash" };

// Blocks on the server on purpose (session data), so nothing flashes.
// Managers only: the admin layout sends employees home before render.
export const instant = false;

export default async function TrashPage() {
  const [res, dates] = await Promise.all([getTrash(), getDateSettings()]);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Trash</h1>
      <TrashList items={res.ok ? res.data : null} dates={dates} />
    </div>
  );
}
