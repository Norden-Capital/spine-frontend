"use client";

import type { ReactElement, ReactNode } from "react";
import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

/*
 * Small "…" menu (Edit / Archive / Rename / Remove) in the kit look. The kit
 * has no menu part yet (kit gap), so this styles Base UI Menu with kit tokens:
 * panel color, radius 16, rows 44 tall, text 13 / Medium in rem.
 */

export function ActionMenu({
  trigger,
  children,
  align = "end",
}: {
  /** The button that opens the menu, e.g. <IconButton variant="ghost" …/>. */
  trigger: ReactElement;
  children: ReactNode;
  align?: "start" | "center" | "end";
}) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger} />
      <Menu.Portal>
        <Menu.Positioner className="isolate z-50 outline-none" align={align} side="bottom" sideOffset={6}>
          <Menu.Popup
            className={cn(
              "min-w-[200px] max-w-[calc(100vw-2rem)] origin-(--transform-origin) rounded-[16px] bg-(--sp-sheet) p-[4px] text-(--sp-text) outline-none",
              "shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35)] ring-1 ring-[color-mix(in_oklab,var(--sp-text)_8%,transparent)]",
              "transition-[opacity,transform] duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none"
            )}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function ActionMenuItem({
  icon,
  danger,
  onClick,
  children,
}: {
  icon?: ReactNode;
  /** Red text (archive, remove). */
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Menu.Item
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] cursor-default items-center gap-[12px] rounded-[12px] px-[12px] py-[8px] text-[0.8125rem] leading-snug font-medium outline-none select-none",
        "[&_svg]:size-[18px] [&_svg]:shrink-0",
        danger
          ? "text-(--sp-danger) data-highlighted:bg-[color-mix(in_oklab,var(--sp-danger)_10%,transparent)]"
          : "text-(--sp-text) data-highlighted:bg-(--sp-soft)"
      )}
    >
      {icon}
      {children}
    </Menu.Item>
  );
}
