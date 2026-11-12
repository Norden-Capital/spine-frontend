import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconTile, type IconTileTone } from "./icon-tile";

export type DeviceCardProps = {
  icon: ReactNode;
  tone?: IconTileTone;
  /** Name the user gave it, e.g. "iPhone 15". */
  name: string;
  /** e.g. "2 Nov 2026". */
  added: string;
  /** e.g. "Today". */
  lastUsed: string;
  /** Marks the device you are using now. */
  current?: boolean;
  /** Right side, e.g. an IconButton "…" (rename / remove). */
  action?: ReactNode;
  className?: string;
};

/**
 * A Face ID / fingerprint device as a card: icon tile 44, name 14 /
 * Medium, "This device" pill, then two small facts (added, last used).
 */
export function DeviceCard({ icon, tone = "ink", name, added, lastUsed, current, action, className }: DeviceCardProps) {
  return (
    <div className={cn("rounded-[18px] bg-(--sp-soft) px-[14px] pt-[14px] pb-[14px]", className)}>
      <div className="flex items-start gap-[12px]">
        <IconTile tone={tone} size={44}>
          {icon}
        </IconTile>
        <div className="min-w-0 flex-1 pt-[3px]">
          <p className="flex items-center gap-[8px] leading-none">
            <span className="truncate text-[0.875rem] font-medium text-(--sp-text)">{name}</span>
            {current ? (
              <span className="inline-flex h-[20px] shrink-0 items-center rounded-full bg-(--sp-card-front) px-[8px] text-[0.5625rem] font-medium text-(--sp-card-front-text)">
                This device
              </span>
            ) : null}
          </p>
          <p className="mt-[5px] text-[0.6875rem] leading-none text-(--sp-text-muted)">Face ID / fingerprint</p>
        </div>
        {action ? <div className="-mt-[6px] -mr-[6px] shrink-0">{action}</div> : null}
      </div>
      <dl className="mt-[14px] grid grid-cols-2 gap-[8px]">
        {[
          ["Added", added],
          ["Last used", lastUsed],
        ].map(([k, v]) => (
          <div key={k} className="rounded-[12px] bg-(--sp-panel) px-[10px] py-[9px] leading-none">
            <dt className="text-[0.5625rem] text-(--sp-text-faint)">{k}</dt>
            <dd className="mt-[4px] truncate text-[0.75rem] font-medium text-(--sp-text)">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
