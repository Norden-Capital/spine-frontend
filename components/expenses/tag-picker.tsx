"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { ApiError, api, apiWithStatus, errorMessage } from "@/lib/api";
import type { Tag } from "@/lib/catalog-types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const MAX_NAME = 60;

/**
 * Pick any number of tags. Chosen tags show as chips (tap to remove).
 * Typing searches active tags (GET /api/tags?q=). If no tag has exactly that
 * name, "Create '<text>'" makes it (POST /api/tags: 200 = it already
 * existed, 201 = new). An archived name (409 tag_archived) shows a message.
 *
 * Inside a <form>, pass `name` to send the chosen ids as hidden inputs.
 */
export function TagPicker({
  value,
  onChange,
  name,
  id,
  basePath = "/tags",
  allowCreate = true,
}: {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  name?: string;
  /** id for the search input (so a <label htmlFor> can point to it). */
  id?: string;
  /** "/tags" (company) or "/wallet/tags" (private wallet). */
  basePath?: string;
  /** false in filters: only pick existing tags. */
  allowCreate?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? `tags-${autoId}`;
  const listId = `${inputId}-list`;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Tag[]>([]);
  /** The search text the results belong to (null = none yet). */
  const [resultsFor, setResultsFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  /** Names the backend said are archived: don't offer "Create" for them again. */
  const [archivedNames, setArchivedNames] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim();

  // Search while the list is open; wait 250 ms after the last key.
  useEffect(() => {
    if (!open) return;
    let stale = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const found = await api<Tag[]>(`${basePath}?q=${encodeURIComponent(q)}`);
        if (!stale) {
          setResults(found);
          setResultsFor(q);
        }
      } catch (err) {
        if (!stale) setMessage(errorMessage(err));
      } finally {
        if (!stale) setLoading(false);
      }
    }, 250);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [q, open, basePath]);

  const chosen = new Set(value.map((t) => t.id));
  const options = results.filter((t) => !chosen.has(t.id) && !t.archived);
  const exact = [...results, ...value].some((t) => t.name.toLowerCase() === q.toLowerCase());
  // Offer "Create" only once the results match what is typed.
  const searching = loading || resultsFor !== q;
  const isArchived = archivedNames.includes(q.toLowerCase());
  const canCreate = allowCreate && q.length > 0 && q.length <= MAX_NAME && !exact && !searching && !isArchived;

  function add(tag: Tag) {
    if (!chosen.has(tag.id)) onChange([...value, tag]);
    setQuery("");
    setMessage(null);
    inputRef.current?.focus();
  }

  function remove(tag: Tag) {
    onChange(value.filter((t) => t.id !== tag.id));
    setMessage(null);
  }

  async function create() {
    setCreating(true);
    setMessage(null);
    try {
      const { data } = await apiWithStatus<Tag>(basePath, { method: "POST", body: { name: q } });
      add(data);
    } catch (err) {
      if (err instanceof ApiError && err.code === "tag_archived") {
        setArchivedNames((names) => [...names, q.toLowerCase()]);
        setMessage(`"${q}" is an archived tag. A manager can bring it back.`);
      } else {
        setMessage(errorMessage(err));
      }
    } finally {
      setCreating(false);
    }
  }

  // Keep focus in the input when an option is tapped (so the list stays).
  const keepFocus = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Chosen tags">
          {value.map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Remove tag ${tag.name}`}
                className="flex h-11 max-w-full items-center gap-1.5 rounded-full border bg-muted px-3 text-sm outline-none hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="truncate">{tag.name}</span>
                <X className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={inputId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search or create a tag"
          maxLength={MAX_NAME}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setMessage(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              // Enter picks the first option, or creates; never submits the form.
              e.preventDefault();
              if (options[0] && options[0].name.toLowerCase() === q.toLowerCase()) add(options[0]);
              else if (canCreate) void create();
              else if (options[0]) add(options[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          className="h-11 pl-9"
        />
      </div>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label="Tags"
          className="max-h-64 overflow-y-auto rounded-lg border bg-popover text-popover-foreground"
        >
          {canCreate && (
            <button
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={keepFocus}
              onClick={() => void create()}
              disabled={creating}
              className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium outline-none hover:bg-muted focus-visible:bg-muted disabled:opacity-50"
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{creating ? "Creating…" : `Create "${q}"`}</span>
            </button>
          )}
          {options.map((tag) => (
            <button
              key={tag.id}
              type="button"
              role="option"
              aria-selected={false}
              onMouseDown={keepFocus}
              onClick={() => add(tag)}
              className={cn(
                "flex min-h-11 w-full items-center px-3 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted",
                canCreate || "first:rounded-t-lg"
              )}
            >
              <span className="min-w-0 truncate">{tag.name}</span>
            </button>
          ))}
          {!canCreate && options.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {searching
                ? "Searching…"
                : isArchived
                  ? "This tag is archived."
                  : q
                    ? "Already chosen."
                    : "No tags yet. Type to create one."}
            </p>
          )}
        </div>
      )}

      {name && value.map((tag) => <input key={tag.id} type="hidden" name={name} value={tag.id} />)}
    </div>
  );
}
