import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WidgetCard } from "./WidgetCard";

export interface Widget {
  id: string;
  type: string;
  title: string;
  size: "sm" | "md" | "lg";
  config?: Record<string, any>;
}

interface WidgetGridProps {
  widgets: Widget[];
  onReorder: (widgets: Widget[]) => void;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  renderWidget: (widget: Widget) => React.ReactNode;
  editMode?: boolean;
}

const SIZE_CLASSES: Record<Widget["size"], string> = {
  sm: "col-span-1",
  md: "col-span-1 md:col-span-2",
  lg: "col-span-1 md:col-span-2 lg:col-span-3",
};

interface SortableWidgetProps {
  widget: Widget;
  editMode: boolean;
  onRemove: (id: string) => void;
  onConfigure: (id: string) => void;
  renderWidget: (widget: Widget) => React.ReactNode;
}

function SortableWidget({ widget, editMode, onRemove, onConfigure, renderWidget }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${SIZE_CLASSES[widget.size]} min-h-[200px]`}
    >
      <WidgetCard
        title={widget.title}
        onRemove={editMode ? () => onRemove(widget.id) : undefined}
        onConfigure={editMode ? () => onConfigure(widget.id) : undefined}
        dragHandleProps={editMode ? { ...attributes, ...listeners } : {}}
        className="h-full"
      >
        {renderWidget(widget)}
      </WidgetCard>
    </div>
  );
}

export function WidgetGrid({
  widgets,
  onReorder,
  onRemove,
  onConfigure,
  renderWidget,
  editMode = false,
}: WidgetGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      onReorder(arrayMove(widgets, oldIndex, newIndex));
    }
    setActiveId(null);
  }

  const activeWidget = widgets.find((w) => w.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => (
            <SortableWidget
              key={widget.id}
              widget={widget}
              editMode={editMode}
              onRemove={onRemove}
              onConfigure={onConfigure}
              renderWidget={renderWidget}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeWidget ? (
          <div className={`${SIZE_CLASSES[activeWidget.size]} min-h-[200px] opacity-80`}>
            <WidgetCard title={activeWidget.title} className="h-full">
              {renderWidget(activeWidget)}
            </WidgetCard>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
