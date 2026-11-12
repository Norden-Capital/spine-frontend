import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "danger";

const TONE: Record<AlertTone, string> = {
  info: "text-(--sp-info) bg-[color-mix(in_oklab,var(--sp-info)_14%,var(--sp-panel))]",
  success: "text-(--sp-success) bg-[color-mix(in_oklab,var(--sp-success)_14%,var(--sp-panel))]",
  warning: "text-(--sp-warning) bg-[color-mix(in_oklab,var(--sp-warning)_16%,var(--sp-panel))]",
  danger: "text-(--sp-danger) bg-[color-mix(in_oklab,var(--sp-danger)_14%,var(--sp-panel))]",
};

export type AlertRowProps = {
  icon: ReactNode;
  tone?: AlertTone;
  title: string;
  /** One or two short lines. */
  message?: string;
  /** Right side, e.g. "2h" or "12 Nov". */
  time?: string;
  /** Shows a small accent dot under the time. */
  unread?: boolean;
  href?: string;
  className?: string;
};

/**
 * Notification / alert row. Same grid as ListItem (33pt icon circle at 14,
 * text at 57.8, title 12 / Medium, message 10 gray) so both mix in one
 * SectionCard. The icon circle is tinted by tone.
 */
export function AlertRow({ icon, tone = "info", title, message, time, unread, href, className }: AlertRowProps) {
  const body = (
    <>
      <span
        className={cn(
          "mt-[7.5px] flex size-[33px] shrink-0 items-center justify-center rounded-full [&_svg]:size-[15px] [&_svg]:stroke-[1.8]",
          TONE[tone]
        )}
      >
        {icon}
      </span>
      <span className="mt-[10.5px] ml-[10.8px] min-w-0 flex-1">
        <span className="block truncate text-[12px] font-medium text-(--sp-text)">{title}</span>
        {message ? (
          <span className="mt-[3.9px] line-clamp-2 text-[10px] leading-[1.35] text-(--sp-text-faint)">{message}</span>
        ) : null}
      </span>
      {time || unread ? (
        <span className="mt-[12px] ml-3 flex shrink-0 flex-col items-end gap-[6px]">
          {time ? <span className="text-[10px] text-(--sp-text-faint)">{time}</span> : null}
          {unread ? <span aria-label="Unread" role="img" className="size-[7px] rounded-full bg-(--sp-card-front)" /> : null}
        </span>
      ) : null}
    </>
  );

  const base = "flex min-h-[48px] items-start pr-[12px] pb-[7.5px] pl-[14px] leading-none";

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          base,
          "rounded-2xl outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
          className
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={cn(base, className)}>{body}</div>;
}
