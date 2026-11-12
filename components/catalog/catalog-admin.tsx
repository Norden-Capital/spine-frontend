"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChevronDown, MoreHorizontal, Pencil, Plus, RotateCcw, Tag as TagIcon } from "lucide-react";
import { api, errorMessage } from "@/lib/api";
import type { Category, Tag } from "@/lib/catalog-types";
import { CategoryIcon } from "@/components/expenses/category-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CategoryDialog, TagDialog } from "./catalog-dialogs";

type TabKey = "categories" | "tags";
type Notice = { kind: "ok" | "error"; text: string };

/** Something shown as a row: a category or a tag. */
type Item = { id: string; name: string; archived: boolean; icon?: string };

/** Confirm before archiving / bringing back. */
type Pending = { title: string; text: string; confirm: string; destructive?: boolean; path: string; done: string };

const ITEM = "min-h-11 gap-3 px-3 text-base";

/**
 * Manager page: two tabs (Categories | Tags), each with a list, an
 * "Archived" section and an Add button. Lists come from the server;
 * after a change, router.refresh() loads them again.
 */
export function CatalogAdmin({
  initialTab,
  categories,
  tags,
  icons,
}: {
  initialTab: TabKey;
  categories: Category[] | null;
  tags: Tag[] | null;
  icons: string[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [notice, setNotice] = useState<Notice | null>(null);
  // Dialogs: null = closed; { item: null } = add; { item } = edit.
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
    const base = kind === "category" ? `/admin/categories/${item.id}` : `/admin/tags/${item.id}`;
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
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label="Categories or tags" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(["categories", "tags"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => switchTab(key)}
            className={cn(
              "flex h-11 items-center justify-center rounded-lg text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {key === "categories" ? "Categories" : "Tags"}
          </button>
        ))}
      </div>

      <Button
        size="lg"
        className="h-11 w-full"
        onClick={() => (isCategories ? setCategoryEdit({ item: null }) : setTagEdit({ item: null }))}
      >
        <Plus aria-hidden />
        {isCategories ? "Add category" : "Add tag"}
      </Button>

      {notice && (
        <Alert variant={notice.kind === "error" ? "destructive" : "default"}>
          <AlertDescription>{notice.text}</AlertDescription>
        </Alert>
      )}

      {isCategories ? (
        <ItemList
          key="categories"
          items={categories}
          what="Categories"
          empty="No categories yet. Add the first one."
          renderIcon={(item) => <CategoryIcon name={item.icon ?? "tag"} />}
          onEdit={(item) => setCategoryEdit({ item: categories?.find((c) => c.id === item.id) ?? null })}
          onArchive={(item) => askArchive("category", item)}
        />
      ) : (
        <ItemList
          key="tags"
          items={tags}
          what="Tags"
          empty="No tags yet. Add the first one."
          renderIcon={() => <TagIcon className="size-5 shrink-0" aria-hidden />}
          onEdit={(item) => setTagEdit({ item: tags?.find((t) => t.id === item.id) ?? null })}
          onArchive={(item) => askArchive("tag", item)}
        />
      )}

      <CategoryDialog
        open={categoryEdit !== null}
        category={categoryEdit?.item ?? null}
        icons={icons}
        onOpenChange={(open) => !open && setCategoryEdit(null)}
        onSaved={saved}
      />
      <TagDialog
        open={tagEdit !== null}
        tag={tagEdit?.item ?? null}
        onOpenChange={(open) => !open && setTagEdit(null)}
        onSaved={saved}
      />

      <AlertDialog open={confirmOpen} onOpenChange={(next) => !next && !busy && setConfirmOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words">{confirm?.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirm?.text}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-11" disabled={busy}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant={confirm?.destructive ? "destructive" : "default"}
              size="lg"
              className="h-11"
              onClick={runConfirm}
              disabled={busy}
            >
              {busy ? "Please wait…" : confirm?.confirm}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Active items first; archived ones in a section you open with a tap. */
function ItemList({
  items,
  what,
  empty,
  renderIcon,
  onEdit,
  onArchive,
}: {
  items: Item[] | null;
  what: string;
  empty: string;
  renderIcon: (item: Item) => React.ReactNode;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  const [showArchived, setShowArchived] = useState(false);

  if (items === null) {
    return (
      <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        {what} could not be loaded. Please try again later.
      </p>
    );
  }

  const active = items.filter((i) => !i.archived);
  const archived = items.filter((i) => i.archived);

  return (
    <div className="flex flex-col gap-4">
      {active.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
          {active.map((item) => (
            <Row key={item.id} item={item} icon={renderIcon(item)} onEdit={onEdit} onArchive={onArchive} />
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-expanded={showArchived}
            onClick={() => setShowArchived((v) => !v)}
            className="flex h-11 items-center justify-between rounded-lg px-1 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Archived ({archived.length})
            <ChevronDown className={cn("size-4 transition-transform", showArchived && "rotate-180")} aria-hidden />
          </button>
          {showArchived && (
            <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-muted/30">
              {archived.map((item) => (
                <Row key={item.id} item={item} icon={renderIcon(item)} onEdit={onEdit} onArchive={onArchive} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Row({
  item,
  icon,
  onEdit,
  onArchive,
}: {
  item: Item;
  icon: React.ReactNode;
  onEdit: (item: Item) => void;
  onArchive: (item: Item) => void;
}) {
  return (
    <li className={cn("flex min-h-14 items-center gap-3 pr-1 pl-4", item.archived && "text-muted-foreground")}>
      {icon}
      <span className="min-w-0 flex-1 truncate">{item.name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" className="size-11 shrink-0" />}
          aria-label={`Actions for ${item.name}`}
        >
          <MoreHorizontal className="size-5" aria-hidden />
        </DropdownMenuTrigger>
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
    </li>
  );
}
