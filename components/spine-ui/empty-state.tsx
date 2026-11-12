import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  icon?: ReactNode;
  /** Big text above the title, e.g. "404". */
  code?: string;
  title: string;
  text?: string;
  /** Buttons, e.g. <SpButton>. */
  action?: ReactNode;
  /** "danger" tints the icon circle red (errors). */
  tone?: "neutral" | "accent" | "danger";
  /** Inside a white panel (in a list) or plain on the page. */
  framed?: boolean;
  className?: string;
};

/**
 * Empty, error and not-found states: round icon 64, title 15 / Medium,
 * text 12 gray (max 260 wide), action under it. Centered.
 */
export function EmptyState({ icon, code, title, text, action, tone = "neutral", framed, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-[20px] text-center",
        framed ? "rounded-(--sp-radius) bg-(--sp-panel) py-[32px]" : "py-[40px]",
        className
      )}
    >
      {code ? (
        <p className="-my-[0.25em] text-[4.5rem] leading-[1.5] font-medium tracking-tight text-(--sp-card-front)">{code}</p>
      ) : null}
      {icon ? (
        <span
          className={cn(
            "flex size-[64px] items-center justify-center rounded-full [&_svg]:size-[26px] [&_svg]:stroke-[1.6]",
            code && "mt-[12px]",
            tone === "danger"
              ? "bg-[color-mix(in_oklab,var(--sp-danger)_14%,var(--sp-panel))] text-(--sp-danger)"
              : tone === "accent"
                ? "bg-[color-mix(in_oklab,var(--sp-card-front)_14%,var(--sp-panel))] text-(--sp-card-front)"
                : framed
                  ? "bg-(--sp-soft) text-(--sp-text)"
                  : "bg-(--sp-panel) text-(--sp-text)"
          )}
        >
          {icon}
        </span>
      ) : null}
      <p className="mt-[16px] text-[0.9375rem] leading-snug font-medium text-(--sp-text)">{title}</p>
      {text ? (
        <p className="mt-[6px] max-w-[260px] text-[0.75rem] leading-snug text-(--sp-text-muted)">{text}</p>
      ) : null}
      {action ? <div className="mt-[20px] flex flex-wrap justify-center gap-[10px]">{action}</div> : null}
    </div>
  );
}
