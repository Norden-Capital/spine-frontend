"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ApiError, api, apiWithStatus, errorMessage } from "@/lib/api";
import type { Tag } from "@/lib/catalog-types";
import { TagInput } from "@/components/spine-ui";

const MAX_NAME = 60;
/** Suggestions shown as chips under the input. */
const MAX_SUGGESTIONS = 12;

/**
 * Pick any number of tags (kit TagInput). Chosen tags show as black chips (× removes).
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
  surface,
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
  /** "panel" inside a white sheet (soft input); default is the page look. */
  surface?: "page" | "panel";
}) {
  const autoId = useId();
  const inputId = id ?? `tags-${autoId}`;
  const statusId = `${inputId}-status`;
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

  const shown = open ? options.slice(0, MAX_SUGGESTIONS) : [];
  const status = !open
    ? null
    : !canCreate && options.length === 0
      ? searching
        ? "Searching…"
        : isArchived
          ? "This tag is archived."
          : q
            ? "Already chosen."
            : allowCreate
              ? "No tags yet. Type to create one."
              : "No tags yet."
      : searching && options.length === 0
        ? "Searching…"
        : null;

  return (
    <div className="flex flex-col gap-[8px]">
      {/* Kit TagInput: chosen tags = black chips, search input, suggestions =
          light chips. The suggestions stay after the input loses focus, so a
          tap on a chip always lands. */}
      <TagInput
        tags={value}
        onRemove={(tagId) => {
          const tag = value.find((t) => t.id === tagId);
          if (tag) remove(tag);
        }}
        suggestions={shown}
        onAdd={(tagId) => {
          const tag = options.find((t) => t.id === tagId);
          if (tag) add(tag);
        }}
        createLabel={open && canCreate ? (creating ? "Creating…" : `Create "${q}"`) : undefined}
        onCreate={() => {
          if (!creating) void create();
        }}
        inputProps={{
          // TagInput passes these on to SpInput, which also takes `surface`.
          ...(surface ? ({ surface } as Record<string, string>) : {}),
          ref: inputRef,
          id: inputId,
          "aria-describedby": status || message ? statusId : undefined,
          placeholder: allowCreate ? "Search or create a tag" : "Search tags",
          maxLength: MAX_NAME,
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setMessage(null);
            setOpen(true);
          },
          onFocus: () => setOpen(true),
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              // Enter picks the first option, or creates; never submits the form.
              e.preventDefault();
              if (options[0] && options[0].name.toLowerCase() === q.toLowerCase()) add(options[0]);
              else if (canCreate) void create();
              else if (options[0]) add(options[0]);
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          },
        }}
      />

      <div id={statusId} aria-live="polite" className="px-[4px]">
        {message ? (
          <p role="alert" className="text-[0.6875rem] leading-snug text-(--sp-danger)">
            {message}
          </p>
        ) : status ? (
          <p className="text-[0.6875rem] leading-snug text-(--sp-text-muted)">{status}</p>
        ) : null}
      </div>

      {name && value.map((tag) => <input key={tag.id} type="hidden" name={name} value={tag.id} />)}
    </div>
  );
}
