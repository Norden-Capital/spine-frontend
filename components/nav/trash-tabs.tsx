import { Segmented } from "@/components/spine-ui";

const TABS = [
  { value: "expenses", label: "Expenses", href: "/admin/trash" },
  { value: "repeats", label: "Repeat expenses", href: "/admin/trash/recurring" },
];

/** Admin > Trash: expenses or repeat expenses (the owner only, like the whole Admin area). */
export function TrashTabs({ value }: { value: "expenses" | "repeats" }) {
  return <Segmented label="Trash" size="sm" value={value} items={TABS} />;
}
