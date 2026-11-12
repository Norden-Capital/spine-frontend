"use client";

import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { CommentThread } from "@/components/spine-ui";

export type Comment = { id: string; text: string; author: { id: string; name: string }; createdAt: string; canDelete: boolean };

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
      {/* Kit CommentThread: avatar, name, time, text; "Delete" on comments
          you may delete; pill input + round send button. */}
      <CommentThread
        comments={comments.map((c) => ({
          id: c.id,
          author: c.author.name,
          time: dates.dateTime(c.createdAt),
          text: c.text,
          mine: c.canDelete && busy !== c.id,
        }))}
        onDelete={(id) => {
          const c = comments.find((x) => x.id === id);
          if (c && busy === null) void remove(c);
        }}
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
