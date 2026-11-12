"use client";

import { usePathname } from "next/navigation";
import { PageHeader, Segmented } from "@/components/spine-ui";

const TABS = [
  { value: "/admin/users", label: "Users" },
  { value: "/admin/categories", label: "Categories" },
  { value: "/admin/trash", label: "Trash" },
];

/**
 * "Admin" title + page tabs (Segmented links) at the top of the owner
 * pages. Hidden on one user's page: it has its own header with a back button.
 */
export function AdminTabs() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin/users/")) return null;
  const active = TABS.find((t) => pathname === t.value || pathname.startsWith(`${t.value}/`))?.value ?? "";
  return (
    <>
      <PageHeader title="Admin" />
      <Segmented label="Admin" value={active} items={TABS.map((t) => ({ ...t, href: t.value }))} />
    </>
  );
}
