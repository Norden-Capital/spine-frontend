"use client";

import type { ReactNode } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

export type BottomSheetProps = {
  /** Controlled open state (leave out for uncontrolled with `trigger`). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Element that opens the sheet, e.g. <SpButton>Filter</SpButton>. */
  trigger?: React.ReactElement;
  title: string;
  description?: string;
  children: ReactNode;
  /** Fixed bottom area, e.g. the main SpButton (full width). */
  footer?: ReactNode;
  /** Where to render (default: <body>). Set it to keep a .light/.dark wrapper. */
  container?: HTMLElement | null;
  className?: string;
};

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Bottom sheet (Base UI Drawer): panel color, top radius 22, handle
 * 36 × 5, title 16 / Medium, 18 side padding like the page. Swipe down
 * or tap outside to close. Stays above the iPhone home bar.
 */
export function BottomSheet({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  container,
  className,
}: BottomSheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange ? (o) => onOpenChange(o) : undefined}>
      {trigger ? <Drawer.Trigger render={trigger} /> : null}
      <Drawer.Portal container={container ?? undefined}>
        <Drawer.Backdrop
          className={cn(
            "fixed inset-0 z-40 min-h-dvh bg-(--sp-backdrop) opacity-[calc(1-var(--drawer-swipe-progress))] transition-opacity duration-[400ms]",
            EASE,
            "data-ending-style:opacity-0 data-starting-style:opacity-0 data-swiping:duration-0 motion-reduce:transition-none"
          )}
        />
        <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
          <Drawer.Popup
            className={cn(
              "sp flex max-h-[85dvh] w-full max-w-[430px] flex-col rounded-t-(--sp-radius) bg-(--sp-sheet) text-(--sp-text) outline-none",
              "[transform:translateY(var(--drawer-swipe-movement-y))] transition-transform duration-[400ms]",
              EASE,
              "data-ending-style:[transform:translateY(100%)] data-starting-style:[transform:translateY(100%)] data-swiping:select-none motion-reduce:transition-none",
              className
            )}
          >
            <div aria-hidden className="mx-auto mt-[8px] h-[5px] w-[36px] shrink-0 rounded-full bg-(--sp-sheet-handle)" />
            <div className="shrink-0 px-(--sp-gutter) pt-[16px] pb-[12px] leading-none">
              <Drawer.Title className="text-[16px] font-medium">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="mt-[8px] text-[11px] leading-[1.4] text-(--sp-text-muted)">
                  {description}
                </Drawer.Description>
              ) : null}
            </div>
            <Drawer.Content className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-(--sp-gutter) pb-[12px]">
              {children}
            </Drawer.Content>
            {footer ? (
              <div className="shrink-0 px-(--sp-gutter) pt-[8px] pb-[calc(env(safe-area-inset-bottom)+16px)]">
                {footer}
              </div>
            ) : (
              <div aria-hidden className="h-[calc(env(safe-area-inset-bottom)+8px)] shrink-0" />
            )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/** Close button for inside a BottomSheet: wraps any element, e.g. <SpButton>. */
export function BottomSheetClose({ children }: { children: React.ReactElement }) {
  return <Drawer.Close render={children} />;
}
