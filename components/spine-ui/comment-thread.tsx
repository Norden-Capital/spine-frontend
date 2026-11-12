import type { ComponentProps } from "react";
import { IconSend } from "./icons";
import { SP_INPUT_CLASS } from "./field";
import { cn } from "@/lib/utils";

export type CommentItem = {
  id: string;
  author: string;
  /** e.g. "2h" or "12 Nov, 14:20". */
  time: string;
  text: string;
  /** The user's own comment: shows "Delete". */
  mine?: boolean;
};

export type CommentThreadProps = {
  comments: CommentItem[];
  onDelete?: (id: string) => void;
  /** Props for the "Write a comment" input. Leave out to hide the composer. */
  composer?: ComponentProps<"input"> & { onSend?: () => void };
  emptyText?: string;
  className?: string;
};

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
}

/**
 * Comments on a transaction: 33 avatar, name 12 / Medium, time 10, text
 * 13. Composer at the bottom: soft pill input + black round send (44).
 */
export function CommentThread({ comments, onDelete, composer, emptyText = "No comments yet.", className }: CommentThreadProps) {
  const { onSend, className: inputClass, ...inputProps } = composer ?? {};
  return (
    <div className={cn("space-y-[14px]", className)}>
      {comments.length ? (
        <ul className="space-y-[14px]">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-[10px]">
              <span
                aria-hidden
                className="flex size-[33px] shrink-0 items-center justify-center rounded-full bg-(--sp-avatar) text-[0.6875rem] leading-[1.5] font-medium text-(--sp-avatar-text)"
              >
                {initials(c.author)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-[8px] leading-[1.5] [&>*]:-my-[0.25em]">
                  <span className="truncate text-[0.75rem] font-medium text-(--sp-text)">{c.author}</span>
                  <span className="shrink-0 text-[0.625rem] text-(--sp-text-faint)">{c.time}</span>
                  {c.mine && onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="relative ml-auto shrink-0 text-[0.625rem] text-(--sp-text-faint) outline-none after:absolute after:-inset-[14px] after:content-[''] hover:text-(--sp-danger) focus-visible:text-(--sp-danger)"
                    >
                      Delete
                    </button>
                  ) : null}
                </p>
                <p className="mt-[5px] text-[0.8125rem] leading-snug break-words whitespace-pre-wrap text-(--sp-text-2)">
                  {c.text}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[0.75rem] text-(--sp-text-muted)">{emptyText}</p>
      )}
      {composer ? (
        <div className="flex items-center gap-[8px]">
          <input
            type="text"
            placeholder="Write a comment"
            aria-label="New comment"
            className={cn(
              SP_INPUT_CLASS,
              "h-[44px] min-w-0 flex-1 px-[16px]",
              inputClass
            )}
            {...inputProps}
          />
          <button
            type="button"
            aria-label="Send comment"
            onClick={onSend}
            className="flex size-[44px] shrink-0 items-center justify-center rounded-full bg-(--sp-chip-active) text-(--sp-chip-active-text) outline-none focus-visible:ring-3 focus-visible:ring-(--sp-ring) active:scale-95 [&_svg]:size-[18px] [&_svg]:stroke-2"
          >
            <IconSend />
          </button>
        </div>
      ) : null}
    </div>
  );
}
