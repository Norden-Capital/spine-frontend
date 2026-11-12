import { cn } from "@/lib/utils";

export type GreetingHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Big title + small gray line ("Hello Sam!" / "Let's track your spending.").
 * Reference: title Poppins 29/500, subtitle 10.5/400, 9.6pt apart.
 */
export function GreetingHeader({ title, subtitle, className }: GreetingHeaderProps) {
  return (
    <div className={className}>
      <h1 className="-my-[0.25em] text-[29px] leading-[1.5] font-medium text-(--sp-text)">{title}</h1>
      {subtitle ? (
        <p className={cn("mt-[calc(9.6px-0.25em)] -mb-[0.25em] text-[10.5px] leading-[1.5] text-(--sp-text-muted)")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
