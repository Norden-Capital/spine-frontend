import type { ComponentProps, ReactNode } from "react";
import { IconAdd } from "./icons";
import { cn } from "@/lib/utils";

export type AddPillProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  /** Icon in the white circle. Default: plus. */
  icon?: ReactNode;
};

/**
 * Black pill: white 31px circle with "+", then the label.
 * Reference ("Add Card"): 116 × 48pt, circle 31pt inset 8.5pt, text 13/500.
 * Put it in BalanceCard's `action` to get the cut-out corner.
 */
export function AddPill({ label, icon, className, type = "button", ...props }: AddPillProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-[48px] shrink-0 items-center gap-[7px] rounded-full bg-(--sp-pill) pr-[16px] pl-[8.5px] text-[13px] leading-none font-medium text-(--sp-pill-text) transition outline-none select-none",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="flex size-[31px] items-center justify-center rounded-full bg-(--sp-pill-dot) text-(--sp-pill-dot-text)">
        {icon ?? <IconAdd className="size-[18px]" />}
      </span>
      {label}
    </button>
  );
}
