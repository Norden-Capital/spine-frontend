"use client";

// Drag and drop for the categories manage page (company and wallet).
// One flat sortable list: move a row up/down to reorder; move it to the
// right (under a main category) to make it a subcategory, to the left to
// make it a main category again. One level only.

import { useCallback, useId, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createPortal } from "react-dom";
import { IconError, RowIcon, SpRow } from "@/components/spine-ui";
import { ApiError, errorMessage } from "@/lib/api";
import { groupByParent, manageOrder, type Category } from "@/lib/catalog-types";
import { cn } from "@/lib/utils";

/** How far (px) you move a row sideways (mouse / touch) to change its level. */
const STEP = 28;

/**
 * How far (px) a subcategory row sits to the right: one grip width, so the
 * sub's grip starts where its main category's icon starts (a tree look).
 * One arrow key moves the lifted row by this much, so it lands right on
 * the new level.
 */
const INDENT = 44;

/** 6-dot grip in the kit's two-tone style (the kit has no grip icon). */
export function IconGrip({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("shrink-0", className)}
      style={{ width: 24, height: 24 }}
      data-sp-icon="Grip"
    >
      <circle cx="9" cy="6" r="1.7" />
      <circle cx="9" cy="12" r="1.7" />
      <circle cx="9" cy="18" r="1.7" />
      <circle opacity={0.4} cx="15" cy="6" r="1.7" />
      <circle opacity={0.4} cx="15" cy="12" r="1.7" />
      <circle opacity={0.4} cx="15" cy="18" r="1.7" />
    </svg>
  );
}

/** One row of the flat list as shown on screen. */
type Flat = {
  item: Category;
  depth: 0 | 1;
  /** Shown parent (null for a main row). */
  parentId: string | null;
  /** Active subcategories shown under it. */
  kids: number;
  /** Any subcategory, archived too (then it must stay a main category). */
  hasSubs: boolean;
};

/** Where the dragged row would land. */
type Projection = {
  depth: 0 | 1;
  parentId: string | null;
  parentName: string | null;
  /** A main category with subcategories can't go under another one. */
  blocked: boolean;
  /** New siblings, in order, the dragged one included. */
  siblings: Flat[];
  place: number;
};

function flatten(active: Category[], all: Category[]): Flat[] {
  return groupByParent(active).map(({ item, child }) => ({
    item,
    depth: child ? 1 : 0,
    parentId: child ? (item.parentId ?? null) : null,
    kids: child ? 0 : active.filter((c) => c.parentId === item.id).length,
    hasSubs: all.some((c) => c.parentId === item.id),
  }));
}

function project(items: Flat[], activeId: string, overId: string, steps: number): Projection | null {
  const from = items.findIndex((f) => f.item.id === activeId);
  const to = items.findIndex((f) => f.item.id === overId);
  if (from < 0 || to < 0) return null;
  const active = items[from];
  const moved = arrayMove(items, from, to);
  const prev = moved[to - 1];
  const next = moved[to + 1];
  // Right after a main or a sub: may be a sub. Right before a sub: must be a sub.
  const max = prev ? 1 : 0;
  const min = next ? next.depth : 0;
  let depth: 0 | 1 = Math.min(Math.max(active.depth + steps, min), max) >= 1 ? 1 : 0;
  let parent: Flat | null = null;
  if (depth === 1) {
    for (let i = to - 1; i >= 0 && !parent; i--) if (moved[i].depth === 0) parent = moved[i];
    // A "main" row whose real parent is archived can't take children.
    if (!parent || parent.item.parentId) {
      parent = null;
      depth = 0;
    }
  }
  let blocked = false;
  if (depth === 1 && active.hasSubs) {
    blocked = true;
    depth = 0;
    parent = null;
  }
  const parentId = parent?.item.id ?? null;
  const placed: Flat = { ...active, depth, parentId };
  const order = moved.map((f) => (f.item.id === activeId ? placed : f));
  const siblings = order.filter((f) => f.depth === depth && (depth === 0 || f.parentId === parentId));
  return {
    depth,
    parentId,
    parentName: parent?.item.name ?? null,
    blocked,
    siblings,
    place: siblings.findIndex((f) => f.item.id === activeId) + 1,
  };
}

/**
 * The body for PATCH …/{id}/move. position = index among the NEW siblings
 * (archived ones too, as the backend counts them). null = nothing changed.
 */
function toMove(all: Category[], p: Projection, id: string): { parentId: string | null; position: number } | null {
  const full = all.filter((c) => (c.parentId ?? null) === p.parentId && c.id !== id);
  const k = p.siblings.findIndex((f) => f.item.id === id);
  let position = -1;
  // Right before the next shown sibling, else right after the one before.
  for (let j = k + 1; j < p.siblings.length && position < 0; j++) {
    position = full.findIndex((c) => c.id === p.siblings[j].item.id);
  }
  for (let j = k - 1; j >= 0 && position < 0; j--) {
    const i = full.findIndex((c) => c.id === p.siblings[j].item.id);
    if (i >= 0) position = i + 1;
  }
  if (position < 0) position = 0;
  const oldParent = all.find((c) => c.id === id)?.parentId ?? null;
  if (oldParent === p.parentId) {
    const now = all.filter((c) => (c.parentId ?? null) === oldParent).findIndex((c) => c.id === id);
    if (now === position) return null;
  }
  return { parentId: p.parentId, position };
}

/** The list right after a move, the way the backend will order it (for the quick update). */
export function applyMove(all: Category[], id: string, parentId: string | null, position: number): Category[] {
  const self = all.find((c) => c.id === id);
  if (!self) return all;
  const oldParent = self.parentId ?? null;
  const pos = new Map<string, number>();
  const group = all.filter((c) => (c.parentId ?? null) === parentId && c.id !== id).map((c) => c.id);
  group.splice(Math.min(position, group.length), 0, id);
  group.forEach((g, i) => pos.set(g, i));
  if (oldParent !== parentId) {
    all.filter((c) => (c.parentId ?? null) === oldParent && c.id !== id).forEach((c, i) => pos.set(c.id, i));
  }
  return manageOrder(
    all.map((c) => {
      const p = pos.get(c.id);
      if (c.id === id) return { ...c, parentId, position: p ?? 0 };
      return p === undefined ? c : { ...c, position: p };
    })
  );
}

/** Simple text for a failed move (the backend's 400 texts are technical). */
export function moveErrorText(err: unknown): string {
  if (err instanceof ApiError && err.code === "validation_error") {
    const raw = typeof err.data?.message === "string" ? err.data.message : "";
    if (/kind of its main|income category|expense category/i.test(raw))
      return "A subcategory must be the same kind (expense or income) as its main category.";
    if (/has subcategories/i.test(raw)) return "It has subcategories, so it can't go under another category.";
    if (/already a subcategory/i.test(raw)) return "A subcategory can't have its own subcategories.";
    if (/own parent/i.test(raw)) return "A category can't go under itself.";
    if (/archived/i.test(raw)) return "That main category is archived.";
    if (/position/i.test(raw)) return "This place is not valid. Please try again.";
    return "This move is not allowed.";
  }
  return errorMessage(err);
}

const REDUCED = "(prefers-reduced-motion: reduce)";

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(REDUCED);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(REDUCED).matches,
    () => false
  );
}

const noSubscribe = () => () => {};

/** false on the server and the first paint, true after (for the portal). */
function useMounted(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false
  );
}

function hintFor(p: Projection | null, active: Flat | undefined): string {
  if (!p || !active) return "";
  if (p.blocked) return "Not allowed: it has subcategories";
  if (p.depth === 1) return `Make subcategory of ${p.parentName}`;
  return active.depth === 1 ? "Make main category" : "Drop here";
}

function sayWhere(p: Projection | null, name: string): string {
  if (!p) return "";
  if (p.blocked) return `Not allowed. ${name} has subcategories, so it stays a main category.`;
  const place = `place ${p.place} of ${p.siblings.length}`;
  return p.depth === 1 ? `${name}: subcategory of ${p.parentName}, ${place}.` : `${name}: main category, ${place}.`;
}

const SR_HELP =
  "To move a category, press Space. Arrow up and down move it. " +
  "Arrow right makes it a subcategory, arrow left makes it a main category. " +
  "Press Space again to drop it, or Escape to cancel.";

/**
 * Active categories with a grip on the left of each row. Long-press (touch)
 * or drag (mouse) the grip, or focus it and use the keyboard.
 */
export function SortableCategoryList({
  active,
  all,
  icon,
  actions,
  busy,
  onMove,
  onBlocked,
}: {
  /** Active categories, manage-page order. */
  active: Category[];
  /** Every category (archived too): positions count all siblings. */
  all: Category[];
  icon: (item: Category) => ReactNode;
  actions: (item: Category) => ReactNode;
  /** A move is saving: grips are off until it ends. */
  busy: boolean;
  onMove: (id: string, parentId: string | null, position: number, name: string) => void;
  onBlocked: (text: string) => void;
}) {
  const dndId = useId();
  const reduced = useReducedMotion();
  const mounted = useMounted();
  const flat = useMemo(() => flatten(active, all), [active, all]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [steps, setSteps] = useState(0);
  // Read by the keyboard handler (not during render).
  const dxRef = useRef(0);
  const depthRef = useRef<0 | 1>(0);

  const dragged = activeId ? flat.find((f) => f.item.id === activeId) : undefined;
  // While a main category moves, its subcategories go with it (hidden).
  const items = dragged && dragged.depth === 0 ? flat.filter((f) => f.parentId !== activeId) : flat;
  const proj = activeId && overId ? project(items, activeId, overId, steps) : null;
  const hint = hintFor(proj, dragged);

  const coordinateGetter: KeyboardCoordinateGetter = useCallback((event, args) => {
    if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
      event.preventDefault();
      // Only one step each way makes sense (main <-> sub).
      const min = depthRef.current === 1 ? -INDENT : 0;
      const max = depthRef.current === 0 ? INDENT : 0;
      const want = dxRef.current + (event.code === "ArrowRight" ? INDENT : -INDENT);
      const dx = Math.min(Math.max(want, min), max);
      return { x: args.currentCoordinates.x + dx - dxRef.current, y: args.currentCoordinates.y };
    }
    const next = sortableKeyboardCoordinates(event, args);
    // Keep the sideways offset when moving up or down.
    return next ? { x: next.x + dxRef.current, y: next.y } : next;
  }, []);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Long-press: a normal swipe on the grip still scrolls the page.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter })
  );

  const nameOf = (id: string | number) => all.find((c) => c.id === String(id))?.name ?? "Category";
  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${nameOf(a.id)}.`,
    onDragOver: () => undefined,
    onDragMove: () => undefined,
    onDragEnd: ({ active: a, over }) => (over ? `Dropped ${nameOf(a.id)}.` : `${nameOf(a.id)} is back in its place.`),
    onDragCancel: ({ active: a }) => `Moving stopped. ${nameOf(a.id)} is back in its place.`,
  };

  function reset() {
    setActiveId(null);
    setOverId(null);
    setSteps(0);
    dxRef.current = 0;
  }

  function onDragStart({ active: a }: DragStartEvent) {
    const id = String(a.id);
    depthRef.current = flat.find((f) => f.item.id === id)?.depth ?? 0;
    dxRef.current = 0;
    setActiveId(id);
    setOverId(id);
    setSteps(0);
  }

  function onDragMove({ delta }: DragMoveEvent) {
    dxRef.current = delta.x;
    setSteps(Math.round(delta.x / STEP));
  }

  function onDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null);
  }

  function onDragEnd({ active: a, over, delta }: DragEndEvent) {
    const id = String(a.id);
    const p = over ? project(items, id, String(over.id), Math.round(delta.x / STEP)) : null;
    reset();
    if (!p) return;
    const name = nameOf(id);
    if (p.blocked) {
      onBlocked(`"${name}" has subcategories, so it can't go under another category.`);
      return;
    }
    const move = toMove(all, p, id);
    if (move) onMove(id, move.parentId, move.position, name);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{ announcements, screenReaderInstructions: { draggable: SR_HELP } }}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      <SortableContext items={items.map((f) => f.item.id)} strategy={verticalListSortingStrategy}>
        <ul data-category-list>
          {items.map((f) => (
            <SortableRow
              key={f.item.id}
              flat={f}
              icon={icon(f.item)}
              actions={actions(f.item)}
              busy={busy}
              reduced={reduced}
              target={Boolean(proj && !proj.blocked && proj.depth === 1 && proj.parentId === f.item.id)}
              ghost={
                f.item.id === activeId ? (
                  <Ghost depth={proj?.depth ?? f.depth} blocked={Boolean(proj?.blocked)} text={hint} />
                ) : null
              }
            />
          ))}
        </ul>
      </SortableContext>
      {/* Screen readers: where the row would land now. */}
      <p aria-live="polite" className="sr-only">
        {dragged ? sayWhere(proj, dragged.item.name) : ""}
      </p>
      {/* In <body>, so no parent transform or overflow can clip the lifted row. */}
      {mounted &&
        createPortal(
          <DragOverlay dropAnimation={reduced ? null : { duration: 180, easing: "cubic-bezier(.2,.8,.2,1)" }}>
            {dragged ? (
              <div
                className={cn(
                  "scale-[1.02] cursor-grabbing rounded-2xl bg-(--sp-panel) shadow-[0_12px_32px_rgb(0_0_0/0.22)]",
                  proj?.blocked && "cursor-not-allowed ring-2 ring-(--sp-danger)"
                )}
                // A subcategory keeps its indent, so it lifts from where it was.
                style={dragged.depth === 1 ? { marginLeft: INDENT } : undefined}
              >
                <RowView
                  item={dragged.item}
                  child={false}
                  icon={icon(dragged.item)}
                  subtitle={hint || kidsText(dragged.kids)}
                  grip={<GripLook />}
                  trailing={
                    proj?.blocked ? (
                      <IconError aria-label="Not allowed" className="mr-[12px] size-[20px] text-(--sp-danger)" />
                    ) : undefined
                  }
                />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}

function kidsText(kids: number): string | undefined {
  return kids > 0 ? `${kids} ${kids === 1 ? "subcategory" : "subcategories"}` : undefined;
}

function SortableRow({
  flat,
  icon,
  actions,
  busy,
  reduced,
  target,
  ghost,
}: {
  flat: Flat;
  icon: ReactNode;
  actions: ReactNode;
  busy: boolean;
  reduced: boolean;
  /** The main category the dragged row would go under. */
  target: boolean;
  /** Shown in place of the row while it is dragged. */
  ghost: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: flat.item.id,
    disabled: busy,
    transition: reduced ? null : { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" },
  });
  return (
    <li
      ref={setNodeRef}
      data-category-row={flat.item.id}
      className="relative"
      style={{ transform: CSS.Translate.toString(transform), transition: transition ?? undefined }}
    >
      {/* The row stays in the DOM while dragged so the grip keeps keyboard focus. */}
      <div className={cn(isDragging && "opacity-0")}>
        <RowView
          item={flat.item}
          child={flat.depth === 1}
          icon={icon}
          subtitle={kidsText(flat.kids)}
          trailing={actions}
          className={cn(
            target &&
              "bg-[color-mix(in_oklab,var(--sp-card-front)_12%,transparent)] ring-2 ring-(--sp-ring) ring-inset"
          )}
          grip={
            <button
              type="button"
              ref={setActivatorNodeRef as Ref<HTMLButtonElement>}
              {...attributes}
              {...listeners}
              aria-label={`Move ${flat.item.name}`}
              data-drag-handle={flat.item.id}
              data-category-name={flat.item.name}
              className={cn(
                "flex size-[44px] shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-xl text-(--sp-text-faint) outline-none select-none [-webkit-touch-callout:none] hover:text-(--sp-text-muted) focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[20px]",
                busy && "cursor-progress opacity-50"
              )}
            >
              <IconGrip />
            </button>
          }
        />
      </div>
      {isDragging ? ghost : null}
    </li>
  );
}

/** The empty place where the dragged row will land, with the hint. */
function Ghost({ depth, blocked, text }: { depth: 0 | 1; blocked: boolean; text: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-y-[2px] right-[2px] flex items-center rounded-2xl border-2 border-dashed px-[14px] text-[0.75rem] leading-tight font-medium",
        // 2 + INDENT: the same place as a subcategory row.
        depth === 1 ? "left-[46px]" : "left-[2px]",
        blocked
          ? "border-(--sp-danger) bg-[color-mix(in_oklab,var(--sp-danger)_10%,var(--sp-panel))] text-(--sp-danger)"
          : "border-(--sp-ring) bg-(--sp-soft) text-(--sp-text-muted)",
        "motion-safe:transition-[left] motion-safe:duration-150"
      )}
    >
      <span className="truncate">{text}</span>
    </div>
  );
}

/** Grip look for the lifted copy (not a button). */
function GripLook() {
  return (
    <span className="flex size-[44px] shrink-0 items-center justify-center text-(--sp-text-muted) [&_svg]:size-[20px]">
      <IconGrip />
    </span>
  );
}

function RowView({
  item,
  child,
  icon,
  subtitle,
  trailing,
  grip,
  className,
}: {
  item: Category;
  child: boolean;
  icon: ReactNode;
  subtitle?: string;
  trailing?: ReactNode;
  grip: ReactNode;
  className?: string;
}) {
  return (
    <SpRow
      // A subcategory moves right by INDENT (grip included): 2 + 44 = 46.
      className={cn(child ? "pl-[46px]" : "pl-[2px]", className)}
      leading={
        <span className="flex shrink-0 items-center">
          {grip}
          <RowIcon>{icon}</RowIcon>
        </span>
      }
      title={item.name}
      subtitle={subtitle}
      trailing={trailing}
    />
  );
}
