import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SpPanelProps = {
  title?: string;
  /** Gray line under the title. */
  description?: string;
  /** Right of the title, e.g. a link or a count. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * White (light) / #171717 (dark) panel with inner padding 14: for forms
 * and content (proof, comments, history). Radius 22 like all panels.
 * For lists use SectionCard or RowGroup (no inner padding).
 */
export function SpPanel({ title, description, aside, children, className }: SpPanelProps) {
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) px-[14px] pt-[16px] pb-[16px]", className)}>
      {title ? (
        <div className="mb-[14px]">
          <div className="flex items-baseline justify-between gap-3 leading-[1.5] [&>*]:-my-[0.25em]">
            <h2 className="text-[0.8125rem] font-medium text-(--sp-text)">{title}</h2>
            {aside}
          </div>
          {description ? (
            <p className="mt-[6px] text-[0.6875rem] leading-snug text-(--sp-text-muted)">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
