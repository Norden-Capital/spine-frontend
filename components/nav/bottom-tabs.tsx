"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/** Height of the bar without the safe area (main has pb-24 for it, see app layout). */
const BAR = "h-16";

/**
 * App tab bar at the bottom (thumb zone): Transactions | Settings (+ Admin
 * for managers). Sits above the iPhone home bar (safe-area padding).
 */
export function BottomTabs({ isManager }: { isManager: boolean }) {
  const pathname = usePathname();
  const tabs = [
    {
      href: "/",
      label: "Transactions",
      icon: ArrowLeftRight,
      active: pathname === "/" || pathname.startsWith("/transactions"),
    },
    { href: "/settings/account", label: "Settings", icon: Settings, active: pathname.startsWith("/settings") },
    ...(isManager
      ? [{ href: "/admin/users", label: "Admin", icon: Shield, active: pathname.startsWith("/admin") }]
      : []),
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div
        className={cn("mx-auto grid w-full max-w-2xl", BAR)}
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab.active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="size-5" aria-hidden />
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
