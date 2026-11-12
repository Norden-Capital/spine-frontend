import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type PageHeaderProps = {
  title: string;
  /** Small gray line under the title. */
  subtitle?: string;
  /** Round back button left of the title. */
  back?: { href: string; label: string };
  /** Right side, e.g. an IconButton (close, more). */
  action?: ReactNode;
  className?: string;
};

/**
 * Title of an inner page, under the TopBar. Back = 44 round button (like
 * the top bar). Title 22 / Medium, subtitle 11 gray. Text in rem, so the
 * text-size preference applies.
 */
export function PageHeader({ title, subtitle, back, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex min-h-[44px] items-center gap-[12px]", className)}>
      {back ? (
        <Link
          href={back.href}
          aria-label={back.label}
          className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-icon-btn) text-(--sp-icon-btn-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 [&_svg]:size-[20px] [&_svg]:stroke-[1.8]"
        >
          <ChevronLeft aria-hidden />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[1.375rem] leading-tight font-medium text-(--sp-text)">{title}</h1>
        {subtitle ? (
          <p className="mt-[3px] truncate text-[0.6875rem] leading-tight text-(--sp-text-muted)">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
