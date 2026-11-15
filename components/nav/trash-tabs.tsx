import { Segmented } from "@/components/spine-ui";

const TABS = [
  { value: "expenses", label: "Expenses", href: "/admin/trash" },
  { value: "repeats", label: "Repeat expenses", href: "/admin/trash/recurring" },
  { value: "balances", label: "Balances", href: "/admin/trash/balances" },
];

/** Admin > Trash: expenses, repeat expenses or balances (the owner only, like the whole Admin area). */
export function TrashTabs({ value }: { value: "expenses" | "repeats" | "balances" }) {
  return <Segmented label="Trash" size="sm" value={value} items={TABS} />;
}
