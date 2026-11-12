"use client";

import { useState } from "react";

import { api, ApiError, errorMessage } from "@/lib/api";
import type { Category } from "@/lib/catalog-types";
import { CATEGORY_ICONS, CategoryIcon } from "@/components/expenses/category-icon";
import { NoticeBox } from "@/components/admin/notice";
import { BottomSheet, Segmented, SpButton, SpField, SpInput, SpSelect } from "@/components/spine-ui";
import { cn } from "@/lib/utils";

const MAX_NAME = 60;

/** Where a catalog lives: the company (the owner) or my private wallet. */
export type CatalogPaths = {
  /** e.g. "/admin/categories" or "/wallet/categories" (POST, PATCH {id}, {id}/archive). */
  categories: string;
};

export const COMPANY_CATALOG: CatalogPaths = {
  categories: "/admin/categories",
};
export const WALLET_CATALOG: CatalogPaths = {
  categories: "/wallet/categories",
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

type Kind = "EXPENSE" | "INCOME";
const kindOf = (c: { kind?: Kind }): Kind => c.kind ?? "EXPENSE";

/** Add (category = null) or edit a category: kind (main only), name, main category, website, icon. */
export function CategoryDialog({
  open,
  category,
  icons,
  all,
  defaultKind = "EXPENSE",
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
  /** Kind of a new category: the tab the page shows. */
  defaultKind?: Kind;
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
          defaultKind={defaultKind}
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
  defaultKind,
  path,
  onDone,
}: {
  category: Category | null;
  icons: string[];
  all: Category[];
  defaultKind: Kind;
  path: string;
  onDone: (text: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [parentId, setParentId] = useState<string>(category?.parentId ?? "");
  // Main categories choose expense / income; a subcategory has its main's kind.
  const [kind, setKind] = useState<Kind>(category ? kindOf(category) : defaultKind);
  const [kindError, setKindError] = useState<string | null>(null);
  // One level only: a category with subcategories can't go under another,
  // and only top-level, active categories (not itself) of the same kind can be a parent.
  const hasChildren = Boolean(category && all.some((c) => c.parentId === category.id));
  const parents = all.filter((c) => !c.parentId && !c.archived && c.id !== category?.id && kindOf(c) === kind);
  const isSub = Boolean(parentId);
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
    setKindError(null);
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
            // Kind: main categories only (its subcategories follow).
            ...(isSub || kind === kindOf(category) ? {} : { kind }),
            // Left out = keep; null = remove; text = set.
            ...(site === (category.website ?? "") ? {} : { website: site || null }),
          },
        });
        onDone(`"${trimmed}" is saved.`);
      } else {
        await api(path, {
          method: "POST",
          // A subcategory takes its main's kind: leave kind out.
          body: { name: trimmed, icon, parentId: parentId || null, website: site || null, ...(isSub ? {} : { kind }) },
        });
        onDone(`"${trimmed}" is added.`);
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === "name_taken") setNameError(err.message);
      else if (err instanceof ApiError && err.field === "website") setWebsiteError("Enter a website like example.com.");
      else if (err instanceof ApiError && (err.field === "kind" || err.field === "parentId"))
        setKindError("A subcategory always has the kind of its main category (expense or income).");
      else setError(errorMessage(err));
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-[16px] pt-[4px]" noValidate>
      {error && <NoticeBox notice={{ kind: "error", text: error }} />}
      {isSub ? null : (
        <SpField
          label="Kind"
          hint={category && hasChildren ? "Its subcategories change with it." : undefined}
          error={kindError ?? undefined}
        >
          <div data-testid="category-kind-choice">
            <Segmented
              label="Kind"
              surface="panel"
              value={kind}
              onValueChange={(v) => {
                setKind(v as Kind);
                setKindError(null);
              }}
              items={[
                { value: "EXPENSE", label: "Expense" },
                { value: "INCOME", label: "Income" },
              ]}
            />
          </div>
        </SpField>
      )}
      {isSub && kindError && <NoticeBox notice={{ kind: "error", text: kindError }} />}
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
        optional
        hint={hasChildren ? "It has subcategories, so it stays a main category." : undefined}
      >
        <SpSelect
          id="category-parent"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          disabled={hasChildren}
        >
          <option value="">None (this is a main category)</option>
          {parents.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </SpSelect>
      </SpField>
      <SpField
        label="Website"
        htmlFor="category-website"
        optional
        hint="Its logo shows on expenses in this category that have no website."
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
