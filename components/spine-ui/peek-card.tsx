import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpineLogo } from "./spine-logo";

const TONE = {
  /** Yellow, like the reference back card. */
  sun: "bg-(--sp-card-back) text-(--sp-card-back-text)",
  /** Black (light) / dark gray (dark): a 3rd card in a stack. */
  ink: "bg-(--sp-card-ink) text-(--sp-card-ink-text)",
  /** Panel color: a 4th card. */
  soft: "bg-(--sp-panel) text-(--sp-text)",
} as const;

export type PeekCardProps = Omit<ComponentProps<"button">, "children"> & {
  /** Text top-right, e.g. "Personal wallet" or "USD · $1,240.00". */
  label: ReactNode;
  /** Small icon after the label, e.g. a lock. */
  trailing?: ReactNode;
  /** Card color. Default "sun" (the reference). */
  tone?: keyof typeof TONE;
};

/**
 * Back card of the stack (yellow in the reference). 80pt tall; inside
 * CardStack only the top 51pt shows. Logo left, label right, centered at 27pt.
 * It is a button (e.g. open the personal wallet).
 */
export function PeekCard({ label, trailing, tone = "sun", className, type = "button", ...props }: PeekCardProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative block h-[80px] w-full rounded-(--sp-radius) text-left leading-none outline-none",
        TONE[tone],
        "focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
        className
      )}
      {...props}
    >
      <SpineLogo className="absolute top-[17px] left-[16px]" />
      <span className="absolute top-[20px] right-[18px] flex items-center gap-[5px] text-[13px] [&_svg]:size-[12px] [&_svg]:stroke-2">
        {label}
        {trailing}
      </span>
    </button>
  );
}
