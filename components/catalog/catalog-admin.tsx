"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { IconAdd, IconArchive, IconCategories, IconChevronDown, IconEdit, IconMore, IconOffline, IconRestore } from "@/components/spine-ui";
import { api, errorMessage } from "@/lib/api";
import { groupByParent, type Category, type CategoryKind } from "@/lib/catalog-types";
import { TxLogo } from "@/components/expenses/tx-logo";
import { ConfirmSheet } from "@/components/admin/confirm-sheet";
import { NoticeBox, type Notice } from "@/components/admin/notice";
import { EmptyState, IconButton, RowGroup, RowIcon, Segmented, SpButton, SpRow } from "@/components/spine-ui";
import { ActionMenu, ActionMenuItem } from "@/components/nav/action-menu";
import { cn } from "@/lib/utils";
import { PageEmpty } from "@/components/nav/page-empty";
import { COMPANY_CATALOG, CategoryDialog, type CatalogPaths } from "./catalog-dialogs";
import { SortableCategoryList, applyMove, moveErrorText } from "./catalog-dnd";

/** Something shown as a row: a category. */
type Item = {
  id: string;
  name: string;
  archived: boolean;
  icon?: string;
  parentId?: string | null;
  logoUrl?: string | null;
};

// CategoryKind and kindFromParam live in lib/catalog-types.ts (the server pages need them).
export type { CategoryKind } from "@/lib/catalog-types";

/** A category's kind (older answers have none: expense). */
export const kindOf = (c: { kind?: CategoryKind }): CategoryKind => c.kind ?? "EXPENSE";

/** Confirm before archiving / bringing back. */
type Pending = { title: string; text: string; confirm: string; destructive?: boolean; path: string; done: string };

/**
 * Manager page (and my wallet's): the categories list, an "Archived"
 * section and an Add button. The list comes from the server; after a
 * change, router.refresh() loads it again. Drag and drop (active rows
 * only) saves right away: the list changes at once, then the server's
 * answer replaces it (or the old list comes back on an error).
 */
export function CatalogAdmin({
  categories,
  icons,
  paths = COMPANY_CATALOG,
  kind = "EXPENSE",
}: {
  categories: Category[] | null;
  icons: string[];
  /** Company (default) or the private wallet. */
  paths?: CatalogPaths;
  /** The tab shown (from ?kind=income; default expense). */
  kind?: CategoryKind;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [notice, setNotice] = useState<Notice | null>(null);
  // Sheet: null = closed; { item: null } = add; { item } = edit.
  const [categoryEdit, setCategoryEdit] = useState<{ item: Category | null } | null>(null);
  const [confirm, setConfirm] = useState<Pending | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState(false);
  // Local copy for quick (optimistic) moves; a new server list replaces it.
  const [list, setList] = useState(categories);
  const [source, setSource] = useState(categories);
  if (categories !== source) {
    setSource(categories);
    setList(categories);
  }

  // Only this tab's kind is shown; moves still count every category (positions).
  const shown = list ? list.filter((c) => kindOf(c) === kind) : null;

  function changeKind(next: string) {
    setNotice(null);
    router.replace(next === "INCOME" ? `${pathname}?kind=income` : pathname, { scroll: false });
  }

  async function move(id: string, parentId: string | null, position: number) {
    if (!list) return;
    const before = list;
    setNotice(null);
    // Never under a main category of the other kind (the backend says no too).
    const self = list.find((c) => c.id === id);
    const parent = parentId ? list.find((c) => c.id === parentId) : null;
    if (self && parent && kindOf(parent) !== kindOf(self)) {
      setNotice({ kind: "error", text: "A subcategory must be the same kind (expense or income) as its main category." });
      return;
    }
    setList(applyMove(before, id, parentId, position));
    setMoving(true);
    try {
      const fresh = await api<Category[]>(`${paths.categories}/${id}/move`, {
        method: "PATCH",
        body: { parentId, position },
      });
      setList(fresh);
    } catch (err) {
      setList(before);
      setNotice({ kind: "error", text: moveErrorText(err) });
    } finally {
      setMoving(false);
    }
  }

  function saved(text: string) {
    setNotice({ kind: "ok", text });
    router.refresh();
  }

  function askArchive(item: Item) {
    const base = `${paths.categories}/${item.id}`;
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

  return (
    <div className="flex flex-col gap-[16px]">
      <div data-testid="category-kind-switch">
        <Segmented
          label="Category kind"
          value={kind}
          onValueChange={changeKind}
          items={[
            { value: "EXPENSE", label: "Expense" },
            { value: "INCOME", label: "Income" },
          ]}
        />
      </div>

      <SpButton className="w-full" icon={<IconAdd />} onClick={() => setCategoryEdit({ item: null })}>
        {kind === "INCOME" ? "Add income category" : "Add expense category"}
      </SpButton>

      {notice && <NoticeBox notice={notice} />}

      <ItemList
        key={kind}
        items={shown}
        all={list ?? []}
        what="Categories"
        one="category"
        many="categories"
        empty={kind === "INCOME" ? "No income categories yet. Add the first one." : "No expense categories yet. Add the first one."}
        renderIcon={(item) => <TxLogo logoUrl={item.logoUrl} icon={item.icon ?? "tag"} />}
        onEdit={(item) => setCategoryEdit({ item: list?.find((c) => c.id === item.id) ?? null })}
        onArchive={askArchive}
        moving={moving}
        onMove={move}
        onBlocked={(text) => setNotice({ kind: "error", text })}
      />

      <CategoryDialog
        open={categoryEdit !== null}
        category={categoryEdit?.item ?? null}
        icons={icons}
        all={list ?? []}
        defaultKind={kind}
        paths={paths}
        onOpenChange={(open) => !open && setCategoryEdit(null)}
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
  all,
  what,
  one,
  many,
  empty,
  renderIcon,
  onEdit,
  onArchive,
  moving,
  onMove,
  onBlocked,
}: {
  items: Category[] | null;
  /** Every category, both kinds (drag and drop positions count them all). */
  all: Category[];
  what: string;
  one: string;
  many: string;
  empty: string;
  renderIcon: (item: Item) => React.ReactNode;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
  moving: boolean;
  onMove: (id: string, parentId: string | null, position: number) => void;
  onBlocked: (text: string) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);

  if (items === null) {
    return (
      <EmptyState
        framed
        tone="danger"
        icon={<IconOffline />}
        title={`${what} could not be loaded`}
        text="Please try again later."
      />
    );
  }

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  return (
    <div className="flex flex-col gap-[16px]">
      {items.length === 0 ? (
        // Nothing at all: the empty message fills the page (shared rule).
        <PageEmpty icon={<IconCategories />} title={empty.split(". ")[0]} text={empty.split(". ").slice(1).join(". ") || undefined} />
      ) : active.length === 0 ? (
        <EmptyState framed title={empty} />
      ) : (
        <RowGroup>
          {/* Subcategories right under their main category (one level). Drag the grip to move. */}
          <SortableCategoryList
            active={active}
            all={all}
            icon={renderIcon}
            actions={(item) => <Actions item={item} onEdit={onEdit} onArchive={onArchive} />}
            busy={moving}
            onMove={onMove}
            onBlocked={onBlocked}
          />
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
              <IconArchive />
            </RowIcon>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8125rem] leading-normal font-medium text-(--sp-text-muted)">
                Archived
              </span>
              <span className="mt-[3px] block truncate text-[0.6875rem] leading-normal text-(--sp-text-muted)">
                {archived.length} {archived.length === 1 ? one : many} · {archived.map((i) => i.name).join(", ")}
              </span>
            </span>
            <IconChevronDown
              aria-hidden
              className={cn(
                "mr-[12px] size-[18px] shrink-0 text-(--sp-text-faint) transition-transform",
                showArchived && "rotate-180"
              )}
            />
          </button>
          {showArchived && (
            <ul>
              {/* A subcategory sits under its main category when both are archived. */}
              {groupByParent(archived).map(({ item, child }) => (
                <li key={item.id}>
                  <Row item={item} child={child} icon={renderIcon(item)} onEdit={onEdit} onArchive={onArchive} />
                </li>
              ))}
            </ul>
          )}
        </RowGroup>
      )}
    </div>
  );
}

/** Archived row (not draggable). */
function Row({
  item,
  child,
  icon,
  onEdit,
  onArchive,
}: {
  item: Item;
  /** Shown under its main category: moved right like in the active list. */
  child?: boolean;
  icon: React.ReactNode;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  return (
    <SpRow
      muted={item.archived}
      // 14 (the kit's left space) + INDENT, the same step as the active list.
      className={child ? "pl-[58px]" : undefined}
      leading={<RowIcon>{icon}</RowIcon>}
      title={item.name}
      trailing={<Actions item={item} onEdit={onEdit} onArchive={onArchive} />}
    />
  );
}

/** The "…" menu of a row: Edit, Archive / Bring back. */
function Actions({
  item,
  onEdit,
  onArchive,
}: {
  item: Item;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  return (
    <ActionMenu trigger={<IconButton label={`Actions for ${item.name}`} icon={<IconMore />} variant="ghost" />}>
      <ActionMenuItem icon={<IconEdit aria-hidden />} onClick={() => onEdit(item)}>
        Edit
      </ActionMenuItem>
      {item.archived ? (
        <ActionMenuItem icon={<IconRestore aria-hidden />} onClick={() => onArchive(item)}>
          Bring back
        </ActionMenuItem>
      ) : (
        <ActionMenuItem danger icon={<IconArchive aria-hidden />} onClick={() => onArchive(item)}>
          Archive
        </ActionMenuItem>
      )}
    </ActionMenu>
  );
}
