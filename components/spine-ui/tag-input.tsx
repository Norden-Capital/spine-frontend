"use client";

import type { ComponentProps } from "react";
import { Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SpInput } from "./field";

export type TagInputProps = {
  /** Chosen tags. */
  tags: { id: string; name: string }[];
  onRemove?: (id: string) => void;
  /** Tags to suggest under the input (tap = add). */
  suggestions?: { id: string; name: string }[];
  onAdd?: (id: string) => void;
  /** "Create "xyz"" row when the typed text is a new tag. */
  createLabel?: string;
  onCreate?: () => void;
  /** Props for the search input (value, onChange, id…). */
  inputProps?: ComponentProps<"input">;
  className?: string;
};

/** Small removable tag chip: 32 tall, × has a 44 tap area. */
export function TagChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex h-[32px] items-center gap-[4px] rounded-full bg-(--sp-chip-active) pr-[6px] pl-[12px] text-[0.75rem] leading-none font-medium text-(--sp-chip-active-text)">
      #{name}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className="relative flex size-[22px] items-center justify-center rounded-full opacity-70 outline-none after:absolute after:-inset-[11px] after:content-[''] hover:opacity-100 focus-visible:ring-2 focus-visible:ring-(--sp-ring) [&_svg]:size-[13px] [&_svg]:stroke-[2.2]"
        >
          <X aria-hidden />
        </button>
      ) : null}
    </span>
  );
}

/**
 * Tags: chosen tags as black chips, a search input (white, 52), then
 * suggestions as light chips. Typing a new name shows "Create".
 */
export function TagInput({
  tags,
  onRemove,
  suggestions,
  onAdd,
  createLabel,
  onCreate,
  inputProps,
  className,
}: TagInputProps) {
  return (
    <div className={cn("space-y-[10px]", className)}>
      {tags.length ? (
        <ul aria-label="Chosen tags" className="flex flex-wrap gap-[8px] px-[2px]">
          {tags.map((t) => (
            <li key={t.id}>
              <TagChip name={t.name} onRemove={onRemove ? () => onRemove(t.id) : undefined} />
            </li>
          ))}
        </ul>
      ) : null}
      <SpInput icon={<Search />} placeholder="Search or create a tag" autoComplete="off" {...inputProps} />
      {suggestions?.length || createLabel ? (
        <div className="flex flex-wrap gap-[8px] px-[2px]">
          {createLabel ? (
            <button
              type="button"
              onClick={onCreate}
              className="relative inline-flex h-[32px] items-center gap-[6px] rounded-full bg-(--sp-card-front) px-[12px] text-[0.75rem] leading-none font-medium text-(--sp-card-front-text) outline-none after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-[''] focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[13px] [&_svg]:stroke-[2.2]"
            >
              <Plus aria-hidden />
              {createLabel}
            </button>
          ) : null}
          {suggestions?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onAdd?.(s.id)}
              className="relative inline-flex h-[32px] items-center rounded-full bg-(--sp-panel) px-[12px] text-[0.75rem] leading-none text-(--sp-text-2) outline-none after:absolute after:inset-x-0 after:-inset-y-[6px] after:content-[''] hover:text-(--sp-text) focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
            >
              #{s.name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
