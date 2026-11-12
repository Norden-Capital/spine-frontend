import { WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

export type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  className?: string;
};

/**
 * Top of the login / password pages: the Spine logo only (wallet-cards icon
 * in a 52 rounded square, like the email logo), then a big title like the
 * home greeting (29 / Medium) and a gray line.
 */
export function AuthHeader({ title, subtitle, className }: AuthHeaderProps) {
  return (
    <div className={className}>
      <span
        role="img"
        aria-label="Spine"
        className="flex size-[52px] items-center justify-center rounded-[14px] bg-(--sp-panel) text-(--sp-text)"
      >
        <WalletCards aria-hidden className="size-[24px]" strokeWidth={1.9} />
      </span>
      <h1 className="mt-[40px] text-[1.8125rem] leading-tight font-medium text-(--sp-text)">{title}</h1>
      {subtitle ? (
        <p className="mt-[8px] text-[0.75rem] leading-snug text-(--sp-text-muted)">{subtitle}</p>
      ) : null}
    </div>
  );
}

/** "or" line between the password login and Face ID. */
export function OrDivider({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-[12px] text-[0.6875rem] text-(--sp-text-faint)", className)}>
      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--sp-text)_10%,transparent)]" />
      or
      <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--sp-text)_10%,transparent)]" />
    </div>
  );
}
