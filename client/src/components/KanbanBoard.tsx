import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import KanbanCard, { KanbanCardDisplay } from "./KanbanCard";
import { cn } from "@/lib/utils";

interface KanbanColumnDef {
  id: string;
  label: string;
  color?: string;
}

interface KanbanItem {
  id: number;
  columnId: string;
  title: string;
  subtitle?: string;
  priority?: string;
  dueDate?: string;
  assignee?: string;
  badges?: { label: string; color?: string }[];
}

interface KanbanBoardProps {
  columns: KanbanColumnDef[];
  items: KanbanItem[];
  onItemMove: (itemId: number, newColumnId: string) => void;
  isLoading?: boolean;
}

function DroppableColumn({
  column,
  items,
  isOver,
}: {
  column: KanbanColumnDef;
  items: KanbanItem[];
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `col-${column.id}` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-xl border min-w-[260px] max-w-[300px] flex-shrink-0 transition-colors",
        isOver
          ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
          : "border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900"
      )}
      style={{ minHeight: 200 }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          {column.color && (
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: column.color }}
            />
          )}
          <span className="text-sm font-semibold text-gray-700 dark:text-zinc-200">
            {column.label}
          </span>
        </div>
        <span className="text-xs bg-gray-200 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-full px-2 py-0.5 font-medium">
          {items.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-2 flex-1">
        <SortableContext
          items={items.map((i) => `card-${i.id}`)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <KanbanCard key={item.id} {...item} />
          ))}
        </SortableContext>
        {items.length === 0 && (
          <div
            className={cn(
              "flex-1 rounded-lg border-2 border-dashed flex items-center justify-center text-xs text-gray-400 dark:text-zinc-600 p-4",
              isOver ? "border-blue-300" : "border-gray-200 dark:border-zinc-700"
            )}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({
  columns,
  items,
  onItemMove,
  isLoading,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const cardIdStr = event.active.id as string;
    // id format: "card-{itemId}"
    const itemId = parseInt(cardIdStr.replace("card-", ""), 10);
    const found = items.find((i) => i.id === itemId);
    setActiveItem(found ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverColumnId(null);
      return;
    }
    const overId = over.id as string;
    if (overId.startsWith("col-")) {
      setOverColumnId(overId.replace("col-", ""));
    } else if (overId.startsWith("card-")) {
      // dragging over a card — find which column that card belongs to
      const targetItemId = parseInt(overId.replace("card-", ""), 10);
      const targetItem = items.find((i) => i.id === targetItemId);
      if (targetItem) setOverColumnId(targetItem.columnId);
    } else {
      setOverColumnId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveItem(null);
    setOverColumnId(null);

    if (!over || !activeItem) return;

    const overId = over.id as string;
    let targetColumnId: string | null = null;

    if (overId.startsWith("col-")) {
      targetColumnId = overId.replace("col-", "");
    } else if (overId.startsWith("card-")) {
      const targetItemId = parseInt(overId.replace("card-", ""), 10);
      const targetItem = items.find((i) => i.id === targetItemId);
      if (targetItem) targetColumnId = targetItem.columnId;
    }

    if (targetColumnId && targetColumnId !== activeItem.columnId) {
      onItemMove(activeItem.id, targetColumnId);
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="min-w-[260px] h-48 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse"
          />
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
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1">
        {columns.map((col) => {
          const colItems = items.filter((i) => i.columnId === col.id);
          return (
            <DroppableColumn
              key={col.id}
              column={col}
              items={colItems}
              isOver={overColumnId === col.id}
            />
          );
        })}
      </div>

      <DragOverlay>
        {activeItem ? (
          <KanbanCardDisplay {...activeItem} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
