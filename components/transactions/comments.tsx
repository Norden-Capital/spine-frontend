"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { CommentThread } from "@/components/spine-ui";
import { UserAvatar } from "@/components/nav/user-avatar";
import { seedOf } from "@/lib/avatar";
import type { PersonRef } from "@/lib/transactions-types";

export type Comment = { id: string; text: string; author: PersonRef; createdAt: string; canDelete: boolean };

const MAX = 500;

/** Comments on a company transaction (oldest first). */
export function Comments({ txId, initial }: { txId: string; initial: Comment[] | null }) {
  const dates = useDates();
  const [comments, setComments] = useState<Comment[]>(initial ?? []);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"post" | string | null>(null);
  const [error, setError] = useState<string | null>(initial === null ? "Comments could not be loaded." : null);
  const base = `/transactions/${encodeURIComponent(txId)}/comments`;

  async function post() {
    const value = text.trim();
    if (!value || busy !== null) return;
    setBusy("post");
    setError(null);
    try {
      const c = await api<Comment>(base, { method: "POST", body: { text: value } });
      setComments((list) => [...list, c]);
      setText("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove(c: Comment) {
    setBusy(c.id);
    setError(null);
    try {
      await api(`${base}/${encodeURIComponent(c.id)}`, { method: "DELETE" });
      setComments((list) => list.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  const posting = busy === "post";
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="space-y-[14px]">
        {/* The kit CommentThread draws initials and has no picture slot, so the
            list is drawn here in the same style (33 face, name 12 / Medium,
            time 10, text 13, "Delete"). The kit thread still draws the composer. */}
        {comments.length ? (
          <ul className="space-y-[14px]">
            {comments.map((c) => {
              const mine = c.canDelete && busy !== c.id;
              return (
                <li key={c.id} className="flex gap-[10px]">
                  <UserAvatar seed={seedOf(c.author)} size={33} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-baseline gap-[8px] leading-none">
                      <span className="truncate text-[0.75rem] font-medium text-(--sp-text)">{c.author.name}</span>
                      <span className="shrink-0 text-[0.625rem] text-(--sp-text-faint)">{dates.dateTime(c.createdAt)}</span>
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (busy === null) void remove(c);
                          }}
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
              );
            })}
          </ul>
        ) : (
          <p className="text-[0.75rem] text-(--sp-text-muted)">No comments yet.</p>
        )}
        {/* Kit CommentThread with no comments: only its pill input + round send
            button (its own empty text is hidden). */}
        <CommentThread
          comments={[]}
          className="[&>p:first-child]:hidden"
          composer={{
            value: text,
            onChange: (e) => setText(e.target.value),
            maxLength: MAX,
            disabled: posting,
            placeholder: posting ? "Posting…" : "Write a comment",
            enterKeyHint: "send",
            onKeyDown: (e) => {
              if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void post();
              }
            },
            onSend: () => void post(),
          }}
        />
      </div>
      {text.length > MAX - 100 && (
        <p className="px-[4px] text-right text-[0.625rem] text-(--sp-text-faint) tabular-nums">
          {text.length}/{MAX}
        </p>
      )}
      {error && (
        <p role="alert" className="px-[4px] text-[0.6875rem] leading-snug text-(--sp-danger)">
          {error}
        </p>
      )}
    </div>
  );
}
