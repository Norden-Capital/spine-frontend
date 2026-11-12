import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type SectionCardProps = {
  title: string;
  /** Link top-right, e.g. { label: "View All", href: "/transactions" }. */
  action?: { label: string; href: string };
  children: ReactNode;
  className?: string;
};

/**
 * Panel with a title row (49pt) and content. Reference: radius 22,
 * title 13/500 at 14pt from the left, "View All" 10/400 gray.
 */
export function SectionCard({ title, action, children, className }: SectionCardProps) {
  return (
    <section className={cn("rounded-(--sp-radius) bg-(--sp-panel) pb-[8px]", className)}>
      <div className="flex h-[49px] items-start justify-between pt-[25px] pr-[12px] pl-[14px] leading-none">
        <h2 className="text-[13px] font-medium text-(--sp-text)">{title}</h2>
        {action ? (
          <Link
            href={action.href}
            className="relative mt-[2px] rounded-full text-[10px] text-(--sp-text-link) outline-none after:absolute after:-inset-x-3 after:-inset-y-4 after:content-[''] hover:text-(--sp-text) focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            {action.label}
          </Link>
        ) : null}
      </div>
      <div>{children}</div>
    </section>
  );
}
