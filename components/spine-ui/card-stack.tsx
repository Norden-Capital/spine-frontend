import { Children, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardStackProps = {
  /**
   * The card(s) behind, e.g. <PeekCard /> (80pt tall). Pass an array for
   * one card per currency: the first is at the top, each shows 51pt.
   */
  back: ReactNode | ReactNode[];
  /** The card in front, e.g. <BalanceCard />. */
  front: ReactNode;
  className?: string;
};

/**
 * Cards stacked: 51pt of each back card shows above the next one
 * (reference: yellow card 51pt above the purple one; overlap 29).
 */
export function CardStack({ back, front, className }: CardStackProps) {
  const backs = Children.toArray(back);
  return (
    <div className={cn("relative", className)}>
      {backs.map((card, i) => (
        <div key={i} className={cn("relative", i > 0 && "-mt-[29px]")}>
          {card}
        </div>
      ))}
      <div className="relative -mt-[29px]">{front}</div>
    </div>
  );
}
