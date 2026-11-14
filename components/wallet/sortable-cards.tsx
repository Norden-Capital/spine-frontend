"use client";

// Drag and drop for a list of wallet cards (budgets): a grip on the title row of each card.
// Long-press (phone) or drag (mouse) the grip, or focus it and use Space + arrows.

import { useId, useState, type ReactNode, type Ref } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGrip } from "@/components/catalog/catalog-dnd";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * The shown order: right after a drag, the new order (until the page data catches up),
 * then the order from the server again.
 */
export function useCardOrder<T extends { id: string }>(
  items: T[],
  path: string,
  onError: (text: string) => void,
  onSaved: () => Promise<void> | void,
) {
  const [order, setOrder] = useState<{ from: T[]; ids: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const shown =
    order && order.from === items
      ? order.ids
          .map((id) => items.find((i) => i.id === id))
          .filter((i): i is T => Boolean(i))
      : items;

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const ids = shown.map((i) => i.id);
    const next = arrayMove(
      ids,
      ids.indexOf(String(active.id)),
      ids.indexOf(String(over.id)),
    );
    setOrder({ from: items, ids: next });
    setSaving(true);
    try {
      await api(path, { method: "PUT", body: { ids: next } });
    } catch (err) {
      setOrder(null);
      setSaving(false);
      onError(errorMessage(err));
      return;
    }
    setSaving(false);
    await onSaved();
  }

  return { shown, saving, onDragEnd };
}

export function SortableCardList({
  ids,
  onDragEnd,
  children,
}: {
  ids: string[];
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    // Long-press: a normal swipe on the grip still scrolls the page.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-[12px]">{children}</ul>
      </SortableContext>
    </DndContext>
  );
}

/** One card (an <li>); `children` gets the grip button to put on the title row. */
export function SortableCard({
  id,
  name,
  busy,
  className,
  testId,
  children,
}: {
  id: string;
  name: string;
  /** An order is saving: grips are off until it ends. */
  busy: boolean;
  className?: string;
  testId?: string;
  children: (grip: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: busy,
  });
  return (
    <li
      ref={setNodeRef}
      data-testid={testId}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: transition ?? undefined,
      }}
      className={cn(
        "relative",
        className,
        isDragging && "z-10 shadow-[0_12px_32px_rgb(0_0_0/0.22)]",
      )}
    >
      {children(
        <button
          type="button"
          ref={setActivatorNodeRef as Ref<HTMLButtonElement>}
          {...attributes}
          {...listeners}
          aria-label={`Move ${name}`}
          data-testid="card-grip"
          className={cn(
            "-ml-[8px] flex h-[44px] w-[32px] shrink-0 cursor-grab touch-manipulation items-center justify-center rounded-xl text-(--sp-text-faint) outline-none select-none [-webkit-touch-callout:none] hover:text-(--sp-text-muted) focus-visible:ring-3 focus-visible:ring-(--sp-ring) [&_svg]:size-[20px]",
            isDragging && "cursor-grabbing text-(--sp-text-muted)",
            busy && "cursor-progress opacity-50",
          )}
        >
          <IconGrip />
        </button>,
      )}
    </li>
  );
}
