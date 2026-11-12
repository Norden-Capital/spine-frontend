import { cn } from "@/lib/utils";

export type PinDotsProps = {
  /** How many digits the PIN has. */
  length?: number;
  /** How many digits are typed. */
  filled: number;
  /** Wrong PIN: dots turn red and shake. Change `errorKey` to shake again. */
  error?: boolean;
  /** Any value that changes on each new error (restarts the shake). */
  errorKey?: string | number;
  className?: string;
};

/** Row of PIN dots: 14px, 20 apart. Empty = ring, filled = solid. */
export function PinDots({ length = 4, filled, error, errorKey, className }: PinDotsProps) {
  return (
    <div
      key={error ? `e-${errorKey ?? ""}` : "ok"}
      role="img"
      aria-label={error ? "Wrong PIN" : `${filled} of ${length} digits`}
      className={cn("flex items-center justify-center gap-[20px]", error && "sp-shake", className)}
    >
      {Array.from({ length }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "size-[14px] rounded-full transition-colors duration-150",
            error
              ? "bg-(--sp-danger)"
              : i < filled
                ? "bg-(--sp-text)"
                : "ring-[1.5px] ring-(--sp-text-faint) ring-inset"
          )}
        />
      ))}
    </div>
  );
}
