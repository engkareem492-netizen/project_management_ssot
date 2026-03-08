import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, CalendarDays, Loader2 } from "lucide-react";

const DOT_COLORS = {
  task: "bg-blue-500",
  issue: "bg-red-500",
  deliverable: "bg-green-500",
  risk: "bg-orange-500",
  meeting: "bg-purple-500",
} as const;

const BADGE_COLORS = {
  task: "bg-blue-100 text-blue-700",
  issue: "bg-red-100 text-red-700",
  deliverable: "bg-green-100 text-green-700",
  risk: "bg-orange-100 text-orange-700",
  meeting: "bg-purple-100 text-purple-700",
} as const;

type EventType = keyof typeof DOT_COLORS;

interface CalEvent {
  type: EventType;
  id: string;
  title: string;
  status?: string;
  date: Date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function parseDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return null;
    return dt;
  } catch { return null; }
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const FILTER_TABS: Array<EventType | "all"> = ["all", "task", "issue", "deliverable", "risk", "meeting"];

export default function Calendar() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [filter, setFilter] = useState<EventType | "all">("all");

  const { data: tasks = [], isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: issues = [], isLoading: issuesLoading } = trpc.issues.list.useQuery({ projectId }, { enabled });
  const { data: deliverables = [], isLoading: delLoading } = trpc.deliverables.list.useQuery({ projectId }, { enabled });
  const { data: risks = [], isLoading: risksLoading } = trpc.risks.list.useQuery({ projectId }, { enabled });
  const { data: meetings = [], isLoading: meetingsLoading } = trpc.meetings.listMeetings.useQuery({ projectId }, { enabled });

  const isLoading = tasksLoading || issuesLoading || delLoading || risksLoading || meetingsLoading;

  const allEvents: CalEvent[] = useMemo(() => {
    const events: CalEvent[] = [];

    tasks.forEach((t: any) => {
      const d = parseDate(t.dueDate);
      if (d) events.push({ type: "task", id: t.taskId ?? String(t.id), title: t.description ?? t.taskId, status: t.status, date: d });
    });

    issues.forEach((i: any) => {
      const d = parseDate(i.updateDate ?? i.openDate);
      if (d) events.push({ type: "issue", id: i.issueId ?? String(i.id), title: i.description ?? i.issueId, status: i.status, date: d });
    });

    deliverables.forEach((d: any) => {
      const dt = parseDate(d.dueDate);
      if (dt) events.push({ type: "deliverable", id: d.deliverableId ?? String(d.id), title: d.title ?? d.description ?? d.deliverableId, status: d.status, date: dt });
    });

    risks.forEach((r: any) => {
      const d = parseDate(r.identifiedOn ?? r.createdAt);
      if (d) events.push({ type: "risk", id: r.riskId ?? String(r.id), title: r.title ?? r.riskId, status: r.status, date: d });
    });

    meetings.forEach((m: any) => {
      const d = parseDate(m.meetingDate);
      if (d) events.push({ type: "meeting", id: m.meetingId ?? String(m.id), title: m.title, status: m.status, date: d });
    });

    return events;
  }, [tasks, issues, deliverables, risks, meetings]);

  const filteredEvents = useMemo(() =>
    filter === "all" ? allEvents : allEvents.filter((e) => e.type === filter),
    [allEvents, filter]
  );

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: Date | null; isCurrentMonth: boolean }> = [];
    // Pad start
    for (let i = 0; i < firstDay; i++) {
      const d = new Date(year, month, -firstDay + i + 1);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Pad end to complete grid rows
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date!;
      days.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), isCurrentMonth: false });
    }
    return days;
  }, [currentMonth]);

  function eventsOnDay(date: Date): CalEvent[] {
    return filteredEvents.filter((e) => isSameDay(e.date, date));
  }

  function getDotsForDay(date: Date): EventType[] {
    const events = eventsOnDay(date);
    const types = Array.from(new Set(events.map((e) => e.type)));
    return types.slice(0, 3) as EventType[];
  }

  const selectedDayEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  function prevMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  }

  function goToday() {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  }

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view the calendar.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-gray-500" />
            Calendar
          </h1>
          <p className="text-gray-500 text-sm mt-1">Due dates for tasks, issues, deliverables, risks, and meetings</p>
        </div>
        {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
              filter === f
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f}
          </button>
        ))}
        <div className="flex-1" />
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(Object.keys(DOT_COLORS) as EventType[]).map((type) => (
            <span key={type} className="flex items-center gap-1 capitalize">
              <span className={`w-2 h-2 rounded-full ${DOT_COLORS[type]}`} />
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar */}
      <Card className="p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
          </div>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">{day}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {calendarDays.map(({ date, isCurrentMonth }, idx) => {
            if (!date) return <div key={idx} className="bg-white h-20" />;
            const dots = getDotsForDay(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDay ? isSameDay(date, selectedDay) : false;
            const hasEvents = eventsOnDay(date).length > 0;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDay(date)}
                className={`bg-white min-h-[5rem] p-1.5 cursor-pointer transition-colors hover:bg-blue-50/50 ${
                  isSelected ? "ring-2 ring-inset ring-blue-500" : ""
                } ${!isCurrentMonth ? "opacity-40" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-900" : "text-gray-400"
                  }`}>
                    {date.getDate()}
                  </span>
                  {hasEvents && (
                    <span className="text-xs text-muted-foreground">{eventsOnDay(date).length}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {dots.map((type) => (
                    <span key={type} className={`w-2 h-2 rounded-full ${DOT_COLORS[type]}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day detail panel */}
      {selectedDay && (
        <Card className="p-4">
          <h3 className="font-semibold text-base mb-3">
            {selectedDay.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
            </span>
          </h3>
          {selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No events on this day</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((e, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <Badge className={`text-xs capitalize shrink-0 ${BADGE_COLORS[e.type]}`}>{e.type}</Badge>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{e.id}</span>
                  <span className="text-sm flex-1 truncate">{e.title}</span>
                  {e.status && (
                    <Badge variant="outline" className="text-xs shrink-0">{e.status}</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
