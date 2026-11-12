import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SpineLogo } from "./spine-logo";

export type BalanceCardProps = {
  /** Small text top-right, e.g. "Company". */
  tag?: ReactNode;
  /** Label over the big amount, e.g. "This month". */
  amountLabel: string;
  /** Already formatted, e.g. "$3,922.40". */
  amount: string;
  /** Small block right of the amount, e.g. "Expenses" / "24". */
  detail?: { label: string; value: string };
  /** Bottom-left block, e.g. "Name" / "Sam Tremblay". */
  footer?: { label: string; value: string };
  /** Sits in the cut-out bottom-right corner, e.g. <AddPill />. */
  action?: ReactNode;
  className?: string;
};

// Inverse corner: paints the page color outside a 16px circle, so the card
// gets a round convex corner next to the cut-out.
const INVERSE_CORNER =
  "pointer-events-none absolute size-[16px] bg-[radial-gradient(circle_at_0_0,transparent_15.5px,var(--sp-bg)_16px)]";

/**
 * Front card of the stack. All sizes measured from the reference (pt):
 * 180 tall, full width (339 at 375), radius 22, text at fixed positions.
 * The bottom-right corner is cut out around `action` (6pt gap, radius 16),
 * like the reference "Add Card" notch. Needs a plain --sp-bg behind it.
 */
export function BalanceCard({ tag, amountLabel, amount, detail, footer, action, className }: BalanceCardProps) {
  return (
    <section
      className={cn(
        "relative h-[180px] rounded-(--sp-radius) bg-(--sp-card-front) leading-none text-(--sp-card-front-text)",
        className
      )}
    >
      <SpineLogo className="absolute top-[17px] left-[16px]" />
      {tag ? <span className="absolute top-[21px] right-[18px] text-[13px]">{tag}</span> : null}

      <p className="absolute top-[60px] left-[17px] text-[12px] text-(--sp-card-front-muted)">{amountLabel}</p>
      <p className="absolute top-[77px] left-[16px] max-w-[calc(100%-120px)] truncate text-[34px] font-medium tabular-nums">
        {amount}
      </p>

      {detail ? (
        <div className="absolute top-[76px] right-[18px] text-right">
          <p className="text-[10px] text-(--sp-card-front-muted)">{detail.label}</p>
          <p className="mt-[3.5px] text-[14.5px] tabular-nums">{detail.value}</p>
        </div>
      ) : null}

      {footer ? (
        <div className={cn("absolute top-[132px] left-[17px]", action ? "right-[150px]" : "right-[18px]")}>
          <p className="text-[12px] text-(--sp-card-front-muted)">{footer.label}</p>
          <p className="mt-[5px] truncate text-[14.5px]">{footer.value}</p>
        </div>
      ) : null}

      {action ? (
        <div className="absolute right-0 bottom-0 rounded-tl-[16px] bg-(--sp-bg) pt-[6px] pl-[6px]">
          <span aria-hidden className={cn(INVERSE_CORNER, "right-0 bottom-full")} />
          <span aria-hidden className={cn(INVERSE_CORNER, "right-full bottom-0")} />
          {action}
        </div>
      ) : null}
    </section>
  );
}
