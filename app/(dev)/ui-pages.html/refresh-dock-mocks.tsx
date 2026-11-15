"use client";

// Refresh button — DESIGN MOCKS ONLY (dev). A second small dock on the RIGHT of the main
// dock; the main dock is not changed. A tap reloads the page.

import type { ReactNode } from "react";
import { FloatingDock, IconRestore, IconAdmin, IconExpenses, IconHome, IconSettings, IconWallet, type DockItem } from "@/components/spine-ui";

function items(owner: boolean): DockItem[] {
  return [
    { href: "/", label: "Home", icon: <IconHome />, active: true },
    { href: "/transactions", label: "Expenses", icon: <IconExpenses /> },
    { href: "/wallet", label: "Wallet", icon: <IconWallet /> },
    { href: "/settings", label: "Settings", icon: <IconSettings /> },
    ...(owner ? [{ href: "/admin/users", label: "Admin", icon: <IconAdmin /> }] : []),
  ];
}

/** The new small dock: same black, same height and shadow as the main dock, one round button. */
function RefreshDock() {
  return (
    <div className="pointer-events-auto flex h-(--sp-dock-h) items-center rounded-full bg-(--sp-dock) p-[5px] shadow-(--sp-dock-shadow)">
      <button
        type="button"
        aria-label="Refresh the page"
        className="flex size-[44px] items-center justify-center px-[3px]"
      >
        <span className="flex size-[38px] items-center justify-center rounded-full bg-(--sp-dock-item) text-(--sp-dock-item-text) [&_svg]:size-[18px]">
          {/* Same icon as the "Try again" button on the error page. */}
          <IconRestore aria-hidden />
        </span>
      </button>
    </div>
  );
}

function Phone({ owner, width, children }: { owner: boolean; width: number; children?: ReactNode }) {
  return (
    <div className="relative mx-auto min-h-[812px] bg-(--sp-bg)" style={{ width }}>
      <div className="px-[16px] pt-[24px] text-[1.75rem] font-medium">Home</div>
      <p className="px-[16px] text-[0.8125rem] text-(--sp-text-muted)">
        {owner ? "Owner (5 tabs)" : "Member (4 tabs)"} · {width}px wide phone
      </p>
      {children}
      <div className="absolute inset-x-0 bottom-[24px] flex items-center justify-center gap-[8px] px-[8px]">
        <FloatingDock items={items(owner)} position="static" />
        <RefreshDock />
      </div>
    </div>
  );
}

export const REFRESH_DOCK_MOCKS: Record<string, () => ReactNode> = {
  "refresh-1-owner-390": () => <Phone owner width={390} />,
  "refresh-2-member-390": () => <Phone owner={false} width={390} />,
  "refresh-3-owner-375": () => <Phone owner width={375} />,
};
