/**
 * TaskCalendar — Month/Week calendar view for tasks.
 * Shows tasks on their due date with priority color coding.
 * Clicking a task fires onTaskClick(task).
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

type CalTask = {
  id: number;
  taskId: string;
  description: string;
  dueDate: string | null;
  priority: string | null;
  currentStatus: string | null;
  responsible: string | null;
};

interface TaskCalendarProps {
  tasks: CalTask[];
  onTaskClick: (task: CalTask) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
  normal: "bg-blue-400",
};

const PRIORITY_LABEL: Record<string, string> = {
  critical: "text-red-700 bg-red-50 border-red-200",
  high: "text-orange-700 bg-orange-50 border-orange-200",
  medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
  low: "text-green-700 bg-green-50 border-green-200",
  normal: "text-blue-700 bg-blue-50 border-blue-200",
};

function getDot(priority: string | null) {
  const key = (priority || "normal").toLowerCase();
  return PRIORITY_DOT[key] || "bg-gray-400";
}

function getLabelClass(priority: string | null) {
  const key = (priority || "normal").toLowerCase();
  return PRIORITY_LABEL[key] || "text-gray-700 bg-gray-50 border-gray-200";
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function TaskCalendar({ tasks, onTaskClick }: TaskCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [mode, setMode] = useState<"month" | "week">("month");

  // Build calendar grid
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Month grid: 6 rows × 7 cols
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  // Week grid
  const getWeekStart = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.getFullYear(), d.getMonth(), diff);
  };
  const weekStart = getWeekStart(viewDate.getDate() === 1 ? today : viewDate);
  const weekCells: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  function getTasksForDay(day: Date) {
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return isSameDay(due, day);
    });
  }

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function prevPeriod() {
    if (mode === "month") setViewDate(new Date(year, month - 1, 1));
    else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() - 7);
      setViewDate(d);
    }
  }
  function nextPeriod() {
    if (mode === "month") setViewDate(new Date(year, month + 1, 1));
    else {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + 7);
      setViewDate(d);
    }
  }
  function goToday() {
    setViewDate(mode === "month" ? new Date(today.getFullYear(), today.getMonth(), 1) : today);
  }

  const periodLabel = mode === "month"
    ? `${monthNames[month]} ${year}`
    : `${weekCells[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekCells[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  const activeCells = mode === "month" ? cells : weekCells;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={goToday} className="h-7 text-xs">Today</Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevPeriod}><ChevronLeft className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextPeriod}><ChevronRight className="w-4 h-4" /></Button>
        <span className="font-semibold text-sm min-w-[180px]">{periodLabel}</span>
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant={mode === "month" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMode("month")}>Month</Button>
          <Button size="sm" variant={mode === "week" ? "default" : "outline"} className="h-7 text-xs" onClick={() => setMode("week")}>Week</Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-t-lg overflow-hidden">
        {dayNames.map(d => (
          <div key={d} className="bg-muted text-center text-xs font-medium py-1.5 text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={`grid grid-cols-7 gap-px bg-border rounded-b-lg overflow-hidden ${mode === "week" ? "min-h-[320px]" : ""}`}>
        {activeCells.map((day, idx) => {
          if (!day) return <div key={idx} className="bg-muted/30 min-h-[90px]" />;
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = mode === "week" || day.getMonth() === month;
          return (
            <div
              key={idx}
              className={`bg-background p-1.5 min-h-[90px] flex flex-col gap-1 ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full self-end ${isToday ? "bg-red-600 text-white" : "text-foreground"}`}>
                {day.getDate()}
              </div>
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayTasks.slice(0, 3).map(t => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className={`w-full text-left text-xs px-1.5 py-0.5 rounded border truncate flex items-center gap-1 hover:opacity-80 transition-opacity ${getLabelClass(t.priority)}`}
                    title={t.description || t.taskId}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDot(t.priority)}`} />
                    <span className="truncate">{t.description || t.taskId}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <span className="text-xs text-muted-foreground px-1">+{dayTasks.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-1">
        <span className="font-medium">Priority:</span>
        {[["Critical","bg-red-600"],["High","bg-orange-500"],["Medium","bg-yellow-500"],["Low","bg-green-500"],["Normal","bg-blue-400"]].map(([label, cls]) => (
          <span key={label} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${cls}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
