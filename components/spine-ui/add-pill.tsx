import type { ComponentProps, ReactNode } from "react";
import { IconAdd } from "./icons";
import { cn } from "@/lib/utils";
import { GlassRims } from "./glass";

export type AddPillProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  /** Icon in the white circle. Default: plus. */
  icon?: ReactNode;
  /** Glass button (with BalanceCard glass): frosted dark tint + blur + light rims, AA label. */
  glass?: boolean;
};

/**
 * Black pill: white 31px circle with "+", then the label.
 * Reference ("Add Card"): 116 × 48pt, circle 31pt inset 8.5pt, text 13/500.
 * Put it in BalanceCard's `action` to get the cut-out corner.
 */
export function AddPill({ label, icon, glass, className, type = "button", ...props }: AddPillProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex h-[48px] shrink-0 items-center gap-[7px] rounded-full pr-[16px] pl-[8.5px] text-[13px] leading-[1.5] font-medium transition outline-none select-none motion-reduce:transition-none motion-reduce:active:scale-100",
        glass ? "sp-glass-pill text-(--sp-glass-pill-text)" : "bg-(--sp-pill) text-(--sp-pill-text)",
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {glass ? <GlassRims radius="9999px" /> : null}
      <span
        className={cn(
          "relative flex size-[31px] items-center justify-center rounded-full",
          glass ? "bg-(--sp-glass-pill-dot) text-(--sp-glass-pill-dot-text)" : "bg-(--sp-pill-dot) text-(--sp-pill-dot-text)"
        )}
      >
        {icon ?? <IconAdd className="size-[18px]" />}
      </span>
      <span className="relative">{label}</span>
    </button>
  );
}
