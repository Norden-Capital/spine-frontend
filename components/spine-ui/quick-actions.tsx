import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type QuickActionProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  icon: ReactNode;
};

/** Round soft icon (48pt) + label (12/400) 11pt under it. The whole column is the tap area. */
export function QuickAction({ label, icon, className, type = "button", ...props }: QuickActionProps) {
  return (
    <button
      type={type}
      className={cn(
        "group flex min-w-0 flex-col items-center rounded-2xl pt-[19.5px] pb-[20px] leading-none outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-(--sp-ring)",
        className
      )}
      {...props}
    >
      <span className="flex size-[48px] items-center justify-center rounded-full bg-(--sp-soft) text-(--sp-text) transition group-hover:bg-(--sp-soft-hover) group-active:scale-95 [&_svg]:size-[18px] [&_svg]:stroke-[1.9]">
        {icon}
      </span>
      <span className="mt-[11.2px] w-full truncate text-center text-[12px] text-(--sp-text-2)">{label}</span>
    </button>
  );
}

export type QuickActionsProps = {
  /** QuickAction items (the reference has 4). */
  children: ReactNode;
  className?: string;
};

/** Panel 112pt tall, radius 22, items in equal columns (reference). */
export function QuickActions({ children, className }: QuickActionsProps) {
  return (
    <nav
      aria-label="Quick actions"
      className={cn(
        "grid h-[112px] auto-cols-fr grid-flow-col rounded-(--sp-radius) bg-(--sp-panel) px-[2px]",
        className
      )}
    >
      {children}
    </nav>
  );
}
