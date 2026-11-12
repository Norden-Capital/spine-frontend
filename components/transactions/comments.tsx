"use client";

import { useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import { useDates } from "@/components/prefs/prefs-provider";
import { Button } from "@/components/ui/button";

export type Comment = { id: string; text: string; author: { id: string; name: string }; createdAt: string; canDelete: boolean };

const MAX = 500;

/**
 * Comments on a company transaction (oldest first). "Suggest" (when the
 * server has AI) asks for one sentence and puts it in the box; the user
 * edits it and decides to post it.
 */
export function Comments({ txId, initial, ai }: { txId: string; initial: Comment[] | null; ai: boolean }) {
  const dates = useDates();
  const [comments, setComments] = useState<Comment[]>(initial ?? []);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"post" | "suggest" | string | null>(null);
  const [error, setError] = useState<string | null>(initial === null ? "Comments could not be loaded." : null);
  const base = `/transactions/${encodeURIComponent(txId)}/comments`;

  async function post(e: React.FormEvent) {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
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

  async function suggest() {
    setBusy("suggest");
    setError(null);
    try {
      const { text: s } = await api<{ text: string }>("/ai/suggest-comment", { method: "POST", body: { transactionId: txId } });
      setText(s.slice(0, MAX));
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

  return (
    <div className="flex flex-col gap-3">
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1 rounded-2xl bg-muted px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.author.name}</span> · {dates.dateTime(c.createdAt)}
                </p>
                <p className="mt-0.5 text-sm break-words whitespace-pre-wrap">{c.text}</p>
              </div>
              {c.canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 shrink-0"
                  aria-label="Delete comment"
                  disabled={busy === c.id}
                  onClick={() => void remove(c)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <form onSubmit={post} className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX}
          rows={2}
          placeholder="Write a comment"
          aria-label="New comment"
          className="min-h-20 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <div className="flex items-center gap-2">
          {ai && (
            <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => void suggest()} disabled={busy !== null}>
              <Sparkles aria-hidden />
              {busy === "suggest" ? "Thinking…" : "Suggest"}
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground tabular-nums">
            {text.length}/{MAX}
          </span>
          <Button type="submit" size="lg" className="h-11" disabled={!text.trim() || busy !== null}>
            {busy === "post" ? "Posting…" : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
}
