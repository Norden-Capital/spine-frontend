import Link from "next/link";
import { IconAdd } from "@/components/spine-ui";

/**
 * Round black 44 "+" link for a list page header (right of the title), in
 * the kit IconButton "ink" look. Replaces the old floating "+" at the bottom.
 * A link, so the kit IconButton (a <button>) cannot be used here.
 */
export function HeaderAddLink({ href, label, testId = "list-add" }: { href: string; label: string; testId?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      data-testid={testId}
      className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-pill) text-(--sp-pill-text) outline-none hover:brightness-125 focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 motion-reduce:active:scale-100 [&_svg]:size-[20px] [&_svg]:stroke-[1.6]"
    >
      <IconAdd aria-hidden />
    </Link>
  );
}
