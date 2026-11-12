"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { api, apiWithStatus, ApiError, errorMessage } from "@/lib/api";
import type { Category, Tag } from "@/lib/catalog-types";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/expenses/category-icon";
import { NoticeBox } from "@/components/admin/notice";
import { BottomSheet, SpButton, SpField, SpInput } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

const MAX_NAME = 60;

/** Where a catalog lives: the company (managers) or my private wallet. */
export type CatalogPaths = {
  /** e.g. "/admin/categories" or "/wallet/categories" (POST, PATCH {id}, {id}/archive). */
  categories: string;
  /** e.g. "/admin/tags" or "/wallet/tags" (PATCH {id}, {id}/archive). */
  tags: string;
  /** e.g. "/tags" or "/wallet/tags" (POST: 201 new, 200 existing). */
  createTag: string;
};

export const COMPANY_CATALOG: CatalogPaths = {
  categories: "/admin/categories",
  tags: "/admin/tags",
  createTag: "/tags",
};
export const WALLET_CATALOG: CatalogPaths = {
  categories: "/wallet/categories",
  tags: "/wallet/tags",
  createTag: "/wallet/tags",
};

/** Main button at the bottom of a sheet form: stays in view while the form scrolls. */
function SubmitBar({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return (
    <div className="sticky bottom-0 -mb-[12px] bg-linear-to-t from-(--sp-sheet) from-75% to-transparent pt-[16px] pb-[12px]">
      <SpButton type="submit" className="w-full" disabled={disabled}>
        {children}
      </SpButton>
    </div>
  );
}

/** Add (category = null) or edit a category: name + icon grid. */
export function CategoryDialog({
  open,
  category,
  icons,
  all,
  paths,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  category: Category | null;
  /** Allowed icon names from the backend; falls back to the frontend list. */
  icons: string[];
  /** Every category (to choose a main category for a subcategory). */
  all: Category[];
  paths: CatalogPaths;
  onOpenChange: (open: boolean) => void;
  onSaved: (text: string) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={category ? "Edit category" : "Add category"}>
      {/* New key per open: the form starts fresh each time. */}
      {open && (
        <CategoryForm
          key={category?.id ?? "new"}
          category={category}
          icons={icons.length > 0 ? icons : Object.keys(CATEGORY_ICONS)}
          all={all}
          path={paths.categories}
          onDone={(text) => {
            onOpenChange(false);
            onSaved(text);
          }}
        />
      )}
    </BottomSheet>
  );
}

function CategoryForm({
  category,
  icons,
  all,
  path,
  onDone,
}: {
  category: Category | null;
  icons: string[];
  all: Category[];
  path: string;
  onDone: (text: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState<string>(category?.parentId ?? "");
  // One level only: a category with subcategories can't go under another,
  // and only top-level, active categories (not itself) can be a parent.
  const hasChildren = Boolean(category && all.some((c) => c.parentId === category.id));
  const parents = all.filter((c) => !c.parentId && !c.archived && c.id !== category?.id);
  const [icon, setIcon] = useState<string | null>(category?.icon ?? null);
  const [website, setWebsite] = useState(category?.website ?? "");
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const trimmed = name.trim();
  const missingName = trimmed.length === 0;
  const missingIcon = icon === null;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setError(null);
    setNameError(null);
    setWebsiteError(null);
    if (missingName || missingIcon) return;
    const site = website.trim();
    setPending(true);
    try {
      if (category) {
        // parentId: null = top level, "<id>" = under it.
        await api(`${path}/${category.id}`, {
          method: "PATCH",
          body: {
            name: trimmed,
            icon,
            ...(hasChildren ? {} : { parentId: parentId || null }),
            // Left out = keep; null = remove; text = set.
            ...(site === (category.website ?? "") ? {} : { website: site || null }),
          },
        });
        onDone(`"${trimmed}" is saved.`);
      } else {
        await api(path, {
          method: "POST",
          body: { name: trimmed, icon, parentId: parentId || null, website: site || null },
        });
        onDone(`"${trimmed}" is added.`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "name_taken") setNameError(err.message);
      else if (err instanceof ApiError && err.field === "website") setWebsiteError("Enter a website like example.com.");
      else setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px] pt-[4px]" noValidate>
      {error && <NoticeBox notice={{ kind: "error", text: error }} />}
      <SpField
        label="Name"
        htmlFor="category-name"
        error={nameError ?? (touched && missingName ? "Enter a name." : undefined)}
      >
        <SpInput
          id="category-name"
          surface="panel"
          placeholder="e.g. Travel"
          maxLength={MAX_NAME}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(nameError) || (touched && missingName)}
        />
      </SpField>
      <SpField
        label="Main category"
        htmlFor="category-parent"
        hint={hasChildren ? "It has subcategories, so it stays a main category." : undefined}
      >
        <div className="relative">
          <select
            id="category-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={hasChildren}
            className="h-[52px] w-full appearance-none rounded-[16px] bg-(--sp-soft) pr-[44px] pl-[16px] text-(--sp-text) outline-none focus-visible:ring-2 focus-visible:ring-(--sp-card-front) disabled:text-(--sp-text-muted) disabled:opacity-70"
          >
            <option value="">None (this is a main category)</option>
            {parents.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-[16px] size-[18px] -translate-y-1/2 stroke-[1.8] text-(--sp-text-faint)"
          />
        </div>
      </SpField>
      <SpField
        label="Website"
        htmlFor="category-website"
        hint="Optional. Its logo shows on expenses in this category that have no website."
        error={websiteError ?? undefined}
      >
        <SpInput
          id="category-website"
          name="website"
          surface="panel"
          type="text"
          inputMode="url"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="e.g. amazon.com"
          maxLength={2048}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          aria-invalid={Boolean(websiteError) || undefined}
        />
      </SpField>
      <SpField label="Icon" error={touched && missingIcon ? "Pick an icon." : undefined}>
        <div role="radiogroup" aria-label="Icon" className="grid grid-cols-5 gap-[6px]">
          {icons.map((name) => {
            const on = icon === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={name.replaceAll("-", " ")}
                onClick={() => setIcon(name)}
                className={cn(
                  "flex aspect-square min-h-[44px] items-center justify-center rounded-full outline-none transition focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[20px] [&_svg]:stroke-[1.7]",
                  on
                    ? "bg-(--sp-chip-active) text-(--sp-chip-active-text)"
                    : "bg-(--sp-soft) text-(--sp-text) hover:bg-(--sp-soft-hover)",
                )}
              >
                <CategoryIcon name={name} />
              </button>
            );
          })}
        </div>
      </SpField>
      <SubmitBar disabled={pending}>{pending ? "Saving…" : category ? "Save" : "Add category"}</SubmitBar>
    </form>
  );
}

/** Add (tag = null) or rename a tag. */
export function TagDialog({
  open,
  tag,
  paths,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  tag: Tag | null;
  paths: CatalogPaths;
  onOpenChange: (open: boolean) => void;
  onSaved: (text: string) => void;
}) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={tag ? "Rename tag" : "Add tag"}>
      {open && (
        <TagForm
          key={tag?.id ?? "new"}
          tag={tag}
          paths={paths}
          onDone={(text) => {
            onOpenChange(false);
            onSaved(text);
          }}
        />
      )}
    </BottomSheet>
  );
}

function TagForm({ tag, paths, onDone }: { tag: Tag | null; paths: CatalogPaths; onDone: (text: string) => void }) {
  const [name, setName] = useState(tag?.name ?? "");
  const [touched, setTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const trimmed = name.trim();
  const missing = trimmed.length === 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    setNameError(null);
    if (missing) return;
    setPending(true);
    try {
      if (tag) {
        await api(`${paths.tags}/${tag.id}`, {
          method: "PATCH",
          body: { name: trimmed },
        });
        onDone(`Tag renamed to "${trimmed}".`);
      } else {
        // 200 = a tag with this name already exists (nothing new made).
        const { status, data } = await apiWithStatus<Tag>(paths.createTag, {
          method: "POST",
          body: { name: trimmed },
        });
        onDone(status === 201 ? `Tag "${data.name}" is added.` : `Tag "${data.name}" already exists.`);
      }
    } catch (err) {
      setNameError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px] pt-[4px]" noValidate>
      <SpField label="Name" htmlFor="tag-name" error={nameError ?? (touched && missing ? "Enter a name." : undefined)}>
        <SpInput
          id="tag-name"
          surface="panel"
          placeholder="e.g. Client visit"
          maxLength={MAX_NAME}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(nameError) || (touched && missing)}
        />
      </SpField>
      <SubmitBar disabled={pending}>{pending ? "Saving…" : tag ? "Save" : "Add tag"}</SubmitBar>
    </form>
  );
}
