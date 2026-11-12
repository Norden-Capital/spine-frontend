// A user's drawn face (black & white) in a soft round circle. Works in
// server and client components. Decorative by default (the name is next
// to it); pass `label` when the face stands alone.
import { avatarDataUri } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export type UserAvatarProps = {
  /** The seed to draw (see seedOf in lib/avatar). */
  seed: string;
  /** Size in px. 33 = list rows, 44 = top bar, 64 = profile. */
  size?: number;
  /** Text for screen readers. Leave out when the name is shown next to it. */
  label?: string;
  className?: string;
};

export function UserAvatar({ seed, size = 33, label, className }: UserAvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full bg-[#f3f3f5] ring-1 ring-black/5 select-none",
        className
      )}
      style={{ width: size, height: size }}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/* Small local SVG (data URI): a plain <img> is enough. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatarDataUri(seed)} alt="" width={size} height={size} className="size-full" draggable={false} />
    </span>
  );
}
