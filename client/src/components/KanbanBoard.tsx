/**
 * KanbanBoard — reusable drag-and-drop board component
 * Uses @dnd-kit/core + @dnd-kit/sortable
 *
 * Props:
 *   columns    — ordered list of { id, label, color } defining the columns
 *   items      — flat list of cards; each must have { id, columnId, ...rest }
 *   renderCard — render function for a single card given (item, isDragging)
 *   onMove     — called when a card is dropped: (itemId, newColumnId)
 *   isLoading  — show skeleton state
 */
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export interface KanbanColumn {
  id: string;
  label: string;
  color?: string; // tailwind bg class e.g. "bg-blue-500"
  textColor?: string; // tailwind text class
}

export interface KanbanItem {
  id: number | string;
  columnId: string; // maps to KanbanColumn.id
  [key: string]: unknown;
}

interface KanbanBoardProps {
  columns: KanbanColumn[];
  items: KanbanItem[];
  renderCard: (item: KanbanItem, isDragging?: boolean) => React.ReactNode;
  onMove: (itemId: number | string, newColumnId: string) => void;
  isLoading?: boolean;
  wipLimits?: Record<string, number>; // columnId → max items
}

/* ── Sortable card wrapper ── */
function SortableCard({
  item,
  renderCard,
}: {
  item: KanbanItem;
  renderCard: (item: KanbanItem, isDragging?: boolean) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderCard(item, isDragging)}
    </div>
  );
}

/* ── Column ── */
function KanbanColumn({
  column,
  items,
  renderCard,
  wipLimit,
}: {
  column: KanbanColumn;
  items: KanbanItem[];
  renderCard: (item: KanbanItem, isDragging?: boolean) => React.ReactNode;
  wipLimit?: number;
}) {
  const isOverLimit = wipLimit !== undefined && items.length > wipLimit;

  return (
    <div className="flex flex-col min-w-[260px] max-w-[300px] flex-shrink-0 bg-muted/40 rounded-xl border border-border/60 overflow-hidden">
      {/* Column header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b border-border/60 ${column.color ?? "bg-muted/60"}`}>
        <span className={`text-sm font-semibold truncate ${column.textColor ?? "text-foreground"}`}>
          {column.label}
        </span>
        <Badge
          variant="secondary"
          className={`text-xs ml-2 flex-shrink-0 ${isOverLimit ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" : ""}`}
        >
          {items.length}{wipLimit !== undefined ? `/${wipLimit}` : ""}
        </Badge>
      </div>
      {/* Cards */}
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 p-2 min-h-[120px] flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
          {items.map((item) => (
            <SortableCard key={item.id} item={item} renderCard={renderCard} />
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20 text-xs text-muted-foreground border-2 border-dashed border-border/40 rounded-lg">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

/* ── Main Board ── */
export function KanbanBoard({
  columns,
  items,
  renderCard,
  onMove,
  isLoading,
  wipLimits,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  /* local shadow state for instant visual feedback */
  const [localItems, setLocalItems] = useState<KanbanItem[]>(items);

  /* sync when server data changes */
  useMemo(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const itemsByColumn = useMemo(() => {
    const map: Record<string, KanbanItem[]> = {};
    for (const col of columns) map[col.id] = [];
    for (const item of localItems) {
      const colId = item.columnId;
      if (map[colId]) map[colId].push(item);
      else {
        /* unknown status → put in first column */
        map[columns[0]?.id ?? ""]?.push({ ...item, columnId: columns[0]?.id ?? "" });
      }
    }
    return map;
  }, [localItems, columns]);

  function handleDragStart(event: DragStartEvent) {
    const found = localItems.find((i) => i.id === event.active.id);
    setActiveItem(found ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id as string;

    /* find which column the over target belongs to */
    const overColumn = columns.find((c) => c.id === overId);
    const overItem = localItems.find((i) => i.id === overId);
    const targetColumnId = overColumn?.id ?? overItem?.columnId;

    if (!targetColumnId) return;

    setLocalItems((prev) =>
      prev.map((item) =>
        item.id === activeId ? { ...item, columnId: targetColumnId } : item
      )
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) return;

    const overId = over.id as string;
    const overColumn = columns.find((c) => c.id === overId);
    const overItem = localItems.find((i) => i.id === overId);
    const targetColumnId = overColumn?.id ?? overItem?.columnId;

    if (!targetColumnId) return;

    const movedItem = localItems.find((i) => i.id === active.id);
    if (!movedItem || movedItem.columnId === targetColumnId) return;

    onMove(active.id, targetColumnId);
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[260px] space-y-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto pb-6">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            items={itemsByColumn[col.id] ?? []}
            renderCard={renderCard}
            wipLimit={wipLimits?.[col.id]}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-90 rotate-1 shadow-2xl">
            {renderCard(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
