"use client";

import { useState } from "react";
import { api, apiWithStatus, ApiError, errorMessage } from "@/lib/api";
import type { Category, Tag } from "@/lib/catalog-types";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/expenses/category-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
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

export const COMPANY_CATALOG: CatalogPaths = { categories: "/admin/categories", tags: "/admin/tags", createTag: "/tags" };
export const WALLET_CATALOG: CatalogPaths = { categories: "/wallet/categories", tags: "/wallet/tags", createTag: "/wallet/tags" };

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90svh] flex-col gap-4">
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "Add category"}</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
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
    if (missingName || missingIcon) return;
    setPending(true);
    try {
      if (category) {
        // parentId: null = top level, "<id>" = under it.
        await api(`${path}/${category.id}`, {
          method: "PATCH",
          body: { name: trimmed, icon, ...(hasChildren ? {} : { parentId: parentId || null }) },
        });
        onDone(`"${trimmed}" is saved.`);
      } else {
        await api(path, { method: "POST", body: { name: trimmed, icon, parentId: parentId || null } });
        onDone(`"${trimmed}" is added.`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "name_taken") setNameError(err.message);
      else setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-col gap-4" noValidate>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FieldGroup className="min-h-0">
        <Field data-invalid={Boolean(nameError) || (touched && missingName)}>
          <FieldLabel htmlFor="category-name">Name</FieldLabel>
          <Input
            id="category-name"
            placeholder="e.g. Travel"
            maxLength={MAX_NAME}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(nameError) || (touched && missingName)}
            className="h-11"
          />
          {nameError ? (
            <FieldError>{nameError}</FieldError>
          ) : (
            touched && missingName && <FieldError>Enter a name.</FieldError>
          )}
        </Field>
        <Field>
          <FieldLabel htmlFor="category-parent">Main category</FieldLabel>
          <NativeSelect
            id="category-parent"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            disabled={hasChildren}
            className="h-11 w-full"
          >
            <NativeSelectOption value="">None (this is a main category)</NativeSelectOption>
            {parents.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                {c.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {hasChildren && (
            <p className="text-xs text-muted-foreground">It has subcategories, so it stays a main category.</p>
          )}
        </Field>
        <Field data-invalid={touched && missingIcon} className="min-h-0">
          <FieldLabel id="category-icon-label">Icon</FieldLabel>
          {/* Scrolls inside the dialog on a small phone. */}
          <div
            role="radiogroup"
            aria-labelledby="category-icon-label"
            className="grid max-h-[40svh] grid-cols-5 gap-1.5 overflow-y-auto rounded-lg border p-1.5"
          >
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
                    "flex aspect-square min-h-11 items-center justify-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    on ? "bg-foreground text-background" : "hover:bg-muted"
                  )}
                >
                  <CategoryIcon name={name} className="size-6" />
                </button>
              );
            })}
          </div>
          {touched && missingIcon && <FieldError>Pick an icon.</FieldError>}
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" className="h-11 w-full shrink-0" disabled={pending}>
        {pending ? "Saving…" : category ? "Save" : "Add category"}
      </Button>
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tag ? "Rename tag" : "Add tag"}</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
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
        await api(`${paths.tags}/${tag.id}`, { method: "PATCH", body: { name: trimmed } });
        onDone(`Tag renamed to "${trimmed}".`);
      } else {
        // 200 = a tag with this name already exists (nothing new made).
        const { status, data } = await apiWithStatus<Tag>(paths.createTag, { method: "POST", body: { name: trimmed } });
        onDone(status === 201 ? `Tag "${data.name}" is added.` : `Tag "${data.name}" already exists.`);
      }
    } catch (err) {
      setNameError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <Field data-invalid={Boolean(nameError) || (touched && missing)}>
        <FieldLabel htmlFor="tag-name">Name</FieldLabel>
        <Input
          id="tag-name"
          placeholder="e.g. Client visit"
          maxLength={MAX_NAME}
          autoComplete="off"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={Boolean(nameError) || (touched && missing)}
          className="h-11"
        />
        {nameError ? <FieldError>{nameError}</FieldError> : touched && missing && <FieldError>Enter a name.</FieldError>}
      </Field>
      <Button type="submit" size="lg" className="h-11 w-full" disabled={pending}>
        {pending ? "Saving…" : tag ? "Save" : "Add tag"}
      </Button>
    </form>
  );
}

