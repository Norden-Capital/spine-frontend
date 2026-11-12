"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, CloudOff, Ellipsis, Pencil, Plus, RotateCcw, Tag as TagIcon } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Category, Tag } from "@/lib/catalog-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { EmptyState, IconButton, RowGroup, RowIcon, Segmented, SpButton, SpRow } from "@/components/spine-ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { COMPANY_CATALOG, CategoryDialog, TagDialog, type CatalogPaths } from "./catalog-dialogs";
import { groupByParent } from "@/lib/catalog-types";

type TabKey = "categories" | "tags";

/** Something shown as a row: a category or a tag. */
type Item = {
  id: string;
  name: string;
  archived: boolean;
  icon?: string;
  parentId?: string | null;
  logoUrl?: string | null;
};

/** Confirm before archiving / bringing back. */
type Pending = { title: string; text: string; confirm: string; destructive?: boolean; path: string; done: string };

const ITEM = "min-h-11 gap-3 px-3 text-base";

/**
 * Manager page (and my wallet's): two tabs (Categories | Tags), each with
 * a list, an "Archived" section and an Add button. Lists come from the
 * server; after a change, router.refresh() loads them again.
 */
export function CatalogAdmin({
  initialTab,
  categories,
  tags,
  icons,
  paths = COMPANY_CATALOG,
}: {
  initialTab: TabKey;
  categories: Category[] | null;
  tags: Tag[] | null;
  icons: string[];
  /** Company (default) or the private wallet. */
  paths?: CatalogPaths;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [notice, setNotice] = useState<Notice | null>(null);
  // Sheets: null = closed; { item: null } = add; { item } = edit.
  const [categoryEdit, setCategoryEdit] = useState<{ item: Category | null } | null>(null);
  const [tagEdit, setTagEdit] = useState<{ item: Tag | null } | null>(null);
  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  function switchTab(next: TabKey) {
    setTab(next);
    setNotice(null);
    // Keep the tab in the address, so a reload or "back" lands on it.
    window.history.replaceState(null, "", next === "tags" ? "?tab=tags" : window.location.pathname);
  }

  function saved(text: string) {
    setNotice({ kind: "ok", text });
    router.refresh();
  }

  function askArchive(kind: "category" | "tag", item: Item) {
    const base = kind === "category" ? `${paths.categories}/${item.id}` : `${paths.tags}/${item.id}`;
    setConfirm(
      item.archived
        ? {
            title: `Bring back "${item.name}"?`,
            text: "It shows in the pick list again.",
            confirm: "Bring back",
            path: `${base}/unarchive`,
            done: `"${item.name}" is back.`,
          }
        : {
            title: `Archive "${item.name}"?`,
            text: "It will be hidden from the pick list. Old expenses keep it.",
            confirm: "Archive",
            destructive: true,
            path: `${base}/archive`,
            done: `"${item.name}" is archived.`,
          }
    );
    setConfirmOpen(true);
  }

  async function runConfirm() {
    if (!confirm) return;
    setBusy(true);
    try {
      await api(confirm.path, { method: "POST" });
      saved(confirm.done);
    } catch (err) {
      setNotice({ kind: "error", text: errorMessage(err) });
      router.refresh();
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  }

  const isCategories = tab === "categories";

  return (
    <div className="flex flex-col gap-[16px]">
      <Segmented
        label="Categories or tags"
        value={tab}
        onValueChange={(v) => switchTab(v as TabKey)}
        items={[
          { value: "categories", label: "Categories" },
          { value: "tags", label: "Tags" },
        ]}
      />

      <SpButton
        className="w-full"
        icon={<Plus />}
        onClick={() => (isCategories ? setCategoryEdit({ item: null }) : setTagEdit({ item: null }))}
      >
        {isCategories ? "Add category" : "Add tag"}
      </SpButton>

      {notice && <NoticeBox notice={notice} />}

      {isCategories ? (
        <ItemList
          key="categories"
          items={categories}
          what="Categories"
          one="category"
          many="categories"
          empty="No categories yet. Add the first one."
          renderIcon={(item) => <TxLogo logoUrl={item.logoUrl} icon={item.icon ?? "tag"} />}
          onEdit={(item) => setCategoryEdit({ item: categories?.find((c) => c.id === item.id) ?? null })}
          onArchive={(item) => askArchive("category", item)}
        />
      ) : (
        <ItemList
          key="tags"
          items={tags}
          what="Tags"
          one="tag"
          many="tags"
          empty="No tags yet. Add the first one."
          renderIcon={() => <TagIcon aria-hidden />}
          onEdit={(item) => setTagEdit({ item: tags?.find((t) => t.id === item.id) ?? null })}
          onArchive={(item) => askArchive("tag", item)}
        />
      )}

      <CategoryDialog
        open={categoryEdit !== null}
        category={categoryEdit?.item ?? null}
        icons={icons}
        all={categories ?? []}
        paths={paths}
        onOpenChange={(open) => !open && setCategoryEdit(null)}
        onSaved={saved}
      />
      <TagDialog
        open={tagEdit !== null}
        tag={tagEdit?.item ?? null}
        paths={paths}
        onOpenChange={(open) => !open && setTagEdit(null)}
        onSaved={saved}
      />

      <ConfirmSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirm?.title ?? ""}
        text={confirm?.text ?? ""}
        confirm={confirm?.confirm ?? ""}
        destructive={confirm?.destructive}
        busy={busy}
        onConfirm={runConfirm}
      />
    </div>
  );
}

/** Active items first; archived ones in a section you open with a tap. */
function ItemList({
  items,
  what,
  one,
  many,
  empty,
  renderIcon,
  onEdit,
  onArchive,
}: {
  items: Item[] | null;
  what: string;
  one: string;
  many: string;
  empty: string;
  renderIcon: (item: Item) => React.ReactNode;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);

  if (items === null) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<CloudOff />}
        title={`${what} could not be loaded`}
        text="Please try again later."
      />
    );
  }

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  return (
    <div className="flex flex-col gap-[16px]">
      {active.length === 0 ? (
        <EmptyState framed title={empty} />
      ) : (
        <RowGroup>
          <ul>
            {/* Subcategories right under their main category (one level). */}
            {groupByParent(active).map(({ item, child }) => {
              const kids = child ? 0 : active.filter((c) => c.parentId === item.id).length;
              return (
                <li key={item.id}>
                  <Row
                    item={item}
                    child={child}
                    subtitle={kids > 0 ? `${kids} ${kids === 1 ? "subcategory" : "subcategories"}` : undefined}
                    icon={renderIcon(item)}
                    onEdit={onEdit}
                    onArchive={onArchive}
                  />
                </li>
              );
            })}
          </ul>
        </RowGroup>
      )}

      {archived.length > 0 && (
        <RowGroup>
          {/* Same look as SpRow; own <button> because it needs aria-expanded. */}
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="flex min-h-[56px] w-full items-center gap-[10.8px] rounded-2xl py-[8px] pr-[8px] pl-[14px] text-left outline-none hover:bg-(--sp-soft) focus-visible:ring-3 focus-visible:ring-(--sp-ring)"
          >
            <RowIcon>
              <Archive />
            </RowIcon>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] leading-tight font-medium text-(--sp-text-muted)">
                Archived
              </span>
              <span className="mt-[3px] block truncate text-[0.6875rem] leading-tight text-(--sp-text-muted)">
                {archived.length} {archived.length === 1 ? one : many} · {archived.map((i) => i.name).join(", ")}
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className={cn(
                "mr-[12px] size-[18px] shrink-0 stroke-[1.8] text-(--sp-text-faint) transition-transform",
                showArchived && "rotate-180"
              )}
            />
          </button>
          {showArchived && (
            <ul>
              {archived.map((item) => (
                <li key={item.id}>
                  <Row item={item} icon={renderIcon(item)} onEdit={onEdit} onArchive={onArchive} />
                </li>
              ))}
            </ul>
          )}
        </RowGroup>
      )}
    </div>
  );
}

function Row({
  item,
  icon,
  subtitle,
  child = false,
  onEdit,
  onArchive,
}: {
  item: Item;
  icon: React.ReactNode;
  subtitle?: string;
  child?: boolean;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  return (
    <SpRow
      indent={child}
      muted={item.archived}
      leading={<RowIcon>{icon}</RowIcon>}
      title={item.name}
      subtitle={subtitle}
      trailing={
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<IconButton label={`Actions for ${item.name}`} icon={<Ellipsis />} variant="ghost" />}
          />
          <DropdownMenuContent align="end" className="w-56 max-w-[calc(100vw-2rem)]">
            <DropdownMenuItem className={ITEM} onClick={() => onEdit(item)}>
              <Pencil aria-hidden />
              {item.icon !== undefined ? "Edit" : "Rename"}
            </DropdownMenuItem>
            {item.archived ? (
              <DropdownMenuItem className={ITEM} onClick={() => onArchive(item)}>
                <RotateCcw aria-hidden />
                Bring back
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className={ITEM} variant="destructive" onClick={() => onArchive(item)}>
                <Archive aria-hidden />
                Archive
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      }
    />
  );
}
