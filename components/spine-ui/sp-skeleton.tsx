import { cn } from "@/lib/utils";

/** Gray loading block (text color 7%, soft pulse). */
export function SpSkeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded-full bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] motion-reduce:animate-none",
        className
      )}
    />
  );
}

/** Loading row with the ListItem grid (48 tall, 33 circle, two lines, amount). */
export function ListItemSkeleton() {
  return (
    <div aria-hidden className="flex h-[48px] items-center gap-[10.8px] pr-[9px] pl-[14px]">
      <SpSkeleton className="size-[33px] shrink-0" />
      <span className="flex-1 space-y-[6px]">
        <SpSkeleton className="h-[10px] w-[55%]" />
        <SpSkeleton className="h-[8px] w-[38%]" />
      </span>
      <SpSkeleton className="h-[10px] w-[56px]" />
    </div>
  );
}

/** Loading SectionCard: title bar + n ListItem rows. */
export function SectionSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("rounded-(--sp-radius) bg-(--sp-panel) pb-[8px]", className)}
    >
      <div className="flex h-[49px] items-start justify-between pt-[22px] pr-[12px] pl-[14px]">
        <SpSkeleton className="h-[12px] w-[110px]" />
        <SpSkeleton className="h-[9px] w-[44px]" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

/** Loading card (the balance card: 180 tall, radius 22). */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-[180px] animate-pulse rounded-(--sp-radius) bg-[color-mix(in_oklab,var(--sp-text)_7%,transparent)] motion-reduce:animate-none",
        className
      )}
    />
  );
}
