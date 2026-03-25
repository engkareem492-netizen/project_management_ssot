import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  id: number;
  title: string;
  subtitle?: string;
  priority?: string;
  dueDate?: string;
  assignee?: string;
  badges?: { label: string; color?: string }[];
  isDragging?: boolean;
}

function priorityColor(priority?: string): string {
  switch (priority?.toLowerCase()) {
    case "high":
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isOverdue(dueDate?: string): boolean {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function KanbanCardDisplay({
  id,
  title,
  subtitle,
  priority,
  dueDate,
  assignee,
  badges,
  isDragging,
}: KanbanCardProps) {
  const overdue = isOverdue(dueDate);

  return (
    <div
      className={cn(
        "bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-3 shadow-sm",
        "hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 shadow-lg ring-2 ring-blue-400"
      )}
    >
      <div className="flex items-start gap-2">
        {/* drag handle area is the whole card; visual indicator only */}
        <GripVertical className="w-4 h-4 text-gray-300 dark:text-zinc-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate leading-tight">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}

          {/* badges row */}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {badges.map((b, i) => (
                <span
                  key={i}
                  className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                  style={
                    b.color
                      ? { backgroundColor: b.color + "20", borderColor: b.color, color: b.color }
                      : undefined
                  }
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 gap-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {priority && (
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full border font-semibold",
                    priorityColor(priority)
                  )}
                >
                  {priority}
                </span>
              )}
              {dueDate && (
                <span
                  className={cn(
                    "text-[10px]",
                    overdue ? "text-red-600 font-semibold" : "text-gray-400 dark:text-zinc-500"
                  )}
                >
                  {overdue ? "Overdue · " : ""}
                  {formatDate(dueDate)}
                </span>
              )}
            </div>
            {assignee && (
              <div
                className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                title={assignee}
              >
                {getInitials(assignee)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function KanbanCard(props: KanbanCardProps) {
  const { id } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `card-${id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCardDisplay {...props} isDragging={isDragging} />
    </div>
  );
}
