import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ProfileHeroProps = {
  name: string;
  email: string;
  /** e.g. "Admin". */
  role: string;
  /** e.g. "Member since Sep 2026". */
  since?: string;
  /** Right of "since", e.g. a status "Active". */
  status?: string;
  /** Bottom-right, e.g. an AddPill-like link ("Edit details"). */
  action?: ReactNode;
  className?: string;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

/**
 * Profile card at the top of Settings, in the home-card style: purple,
 * radius 22, a yellow strip behind it (51 visible, like the wallet card).
 * Big avatar (64, white with purple initials), name 20 / Medium, email,
 * role pill, "member since".
 */
export function ProfileHero({ name, email, role, since, status, action, className }: ProfileHeroProps) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="h-[64px] rounded-(--sp-radius) bg-(--sp-card-back)" />
      <section className="relative -mt-[42px] rounded-(--sp-radius) bg-(--sp-card-front) px-[17px] pt-[18px] pb-[18px] text-(--sp-card-front-text)">
        <div className="flex items-start justify-between gap-3">
          <span
            aria-hidden
            className="flex size-[64px] items-center justify-center rounded-full bg-white text-[1.375rem] leading-none font-semibold text-(--sp-card-front)"
          >
            {initials(name)}
          </span>
          <span className="inline-flex h-[26px] items-center rounded-full bg-white/20 px-[11px] text-[0.6875rem] leading-none font-medium">
            {role}
          </span>
        </div>
        <p className="mt-[16px] truncate text-[1.25rem] leading-tight font-medium">{name}</p>
        <p className="mt-[3px] truncate text-[0.75rem] leading-tight text-(--sp-card-front-muted)">{email}</p>
        {since || status || action ? (
          <div className="mt-[16px] flex items-center justify-between gap-3">
            <p className="flex items-center gap-[8px] text-[0.6875rem] leading-none text-(--sp-card-front-muted)">
              {status ? (
                <span className="flex items-center gap-[5px] text-(--sp-card-front-text)">
                  <span className="size-[7px] rounded-full bg-[#7CF29A]" />
                  {status}
                </span>
              ) : null}
              {status && since ? <span aria-hidden>·</span> : null}
              {since}
            </p>
            {action}
          </div>
        ) : null}
      </section>
    </div>
  );
}
