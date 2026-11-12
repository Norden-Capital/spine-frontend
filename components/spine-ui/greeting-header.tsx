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
      <h1 className="text-[29px] leading-none font-medium text-(--sp-text)">{title}</h1>
      {subtitle ? (
        <p className={cn("mt-[9.6px] text-[10.5px] leading-none text-(--sp-text-muted)")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
