"use client";

import { IconCamera, IconCloseGlyph, IconFile } from "./icons";
import { cn } from "@/lib/utils";

export type ProofFile = {
  id: string;
  name: string;
  /** e.g. "122 KB". */
  size?: string;
  /** Image URL for photos; leave out for PDFs. */
  url?: string;
};

export type ProofTilesProps = {
  files: ProofFile[];
  /** Tile tap (open the file). */
  onOpen?: (id: string) => void;
  /** Shows a × on each tile. */
  onRemove?: (id: string) => void;
  /** Shows the "Add" tile first (camera / files). */
  onAdd?: () => void;
  addLabel?: string;
  /** "panel" = soft tiles inside a white panel (default); "page" = white tiles on the gray page. */
  surface?: "panel" | "page";
  className?: string;
};

/**
 * Proof files (receipts): square tiles, 3 per row, radius 16. Photos show
 * the picture, PDFs a file icon. Name + size under each tile.
 */
export function ProofTiles({
  files,
  onOpen,
  onRemove,
  onAdd,
  addLabel = "Add proof",
  surface = "panel",
  className,
}: ProofTilesProps) {
  const tileBg = surface === "page" ? "bg-(--sp-panel)" : "bg-(--sp-soft)";
  return (
    <ul aria-label="Proof files" className={cn("grid grid-cols-3 gap-[10px]", className)}>
      {onAdd ? (
        <li>
          <button
            type="button"
            onClick={onAdd}
            className={cn(
              "flex aspect-square w-full flex-col items-center justify-center gap-[8px] rounded-[16px] text-(--sp-text) outline-none hover:brightness-95 focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
              tileBg
            )}
          >
            <span className="flex size-[40px] items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) [&_svg]:size-[18px] [&_svg]:stroke-[1.8]">
              <IconCamera />
            </span>
            <span className="-my-[0.25em] text-[0.6875rem] leading-[1.5] font-medium">{addLabel}</span>
          </button>
        </li>
      ) : null}
      {files.map((f) => (
        <li key={f.id} className="relative flex min-w-0 flex-col">
          <button
            type="button"
            onClick={() => onOpen?.(f.id)}
            aria-label={`Open ${f.name}`}
            className={cn(
              "block aspect-square w-full overflow-hidden rounded-[16px] outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring)",
              tileBg
            )}
          >
            {f.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={f.url} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-[6px] text-(--sp-text-muted) [&_svg]:size-[26px] [&_svg]:stroke-[1.5]">
                <IconFile />
                <span className="-my-[0.25em] text-[0.625rem] leading-[1.5] font-semibold tracking-wide">PDF</span>
              </span>
            )}
          </button>
          {onRemove ? (
            <button
              type="button"
              aria-label={`Remove ${f.name}`}
              onClick={() => onRemove(f.id)}
              className="absolute top-[6px] right-[6px] flex size-[26px] items-center justify-center rounded-full bg-black/60 text-white outline-none after:absolute after:-inset-[9px] after:content-[''] focus-visible:ring-2 focus-visible:ring-white [&_svg]:size-[14px] [&_svg]:stroke-[2.2]"
            >
              <IconCloseGlyph />
            </button>
          ) : null}
          <p className="mt-[calc(6px-0.125em)] -mb-[0.125em] truncate px-[2px] text-[0.6875rem] leading-[1.5] text-(--sp-text)">{f.name}</p>
          {f.size ? <p className="-my-[0.125em] px-[2px] text-[0.625rem] leading-[1.5] text-(--sp-text-faint)">{f.size}</p> : null}
        </li>
      ))}
    </ul>
  );
}
