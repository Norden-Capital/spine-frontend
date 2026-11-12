import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export type AvatarProps = ComponentProps<"span"> & {
  /** Full name: used for the initials and the alt text. */
  name: string;
  /** Photo URL. Without it, the initials show. */
  src?: string | null;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

/** Round user picture, 44px (reference: 44pt), or initials. */
export function Avatar({ name, src, className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex size-[44px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-(--sp-avatar) text-[14px] leading-[1.5] font-medium text-(--sp-avatar-text) select-none",
        className
      )}
      {...props}
    >
      {src ? (
        // Small user photo: a plain <img> is enough (fixed size, no layout shift).
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <span aria-label={name} role="img">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
