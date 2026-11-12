"use client";

import { usePathname } from "next/navigation";
import { ArrowLeftRight, House, Settings, Shield, Wallet } from "lucide-react";
import { FloatingDock, type DockItem } from "@/components/spine-ui";

/**
 * The floating dock (Design kit): Home · Transactions · Wallet · Settings,
 * plus Admin for managers. The active item shows its label.
 */
export function AppDock({ isManager }: { isManager: boolean }) {
  const pathname = usePathname();
  const items: DockItem[] = [
    { href: "/", label: "Home", icon: <House />, activeIcon: <House fill="currentColor" />, active: pathname === "/" },
    {
      href: "/transactions",
      label: "Expenses",
      icon: <ArrowLeftRight />,
      active: pathname.startsWith("/transactions"),
    },
    { href: "/wallet", label: "Wallet", icon: <Wallet />, active: pathname.startsWith("/wallet") },
    { href: "/settings/account", label: "Settings", icon: <Settings />, active: pathname.startsWith("/settings") },
    ...(isManager
      ? [{ href: "/admin/users", label: "Admin", icon: <Shield />, active: pathname.startsWith("/admin") }]
      : []),
  ];
  return <FloatingDock items={items} />;
}
