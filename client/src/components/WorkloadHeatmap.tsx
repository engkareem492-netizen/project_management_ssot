import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WeekData {
  weekStart: string;
  utilization: number;
}

interface ResourceRow {
  id: number;
  name: string;
  weeklyData: WeekData[];
}

interface WorkloadHeatmapProps {
  resources: ResourceRow[];
}

function getUtilizationClass(utilization: number): string {
  if (utilization > 90) return "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400";
  if (utilization >= 70) return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-500";
  return "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-500";
}

function getNextMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekHeader(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function generateNext12Weeks(): string[] {
  const weeks: string[] = [];
  // Start from the upcoming Monday (or today if Monday)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();
  const startDate = new Date(today);
  if (day !== 1) {
    startDate.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  }
  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + i * 7);
    weeks.push(weekDate.toISOString().split("T")[0]);
  }
  return weeks;
}

export default function WorkloadHeatmap({ resources }: WorkloadHeatmapProps) {
  const weeks = generateNext12Weeks();

  if (resources.length === 0) {
    return (
      <div className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">
        No resource data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid min-w-max"
        style={{
          gridTemplateColumns: `minmax(120px, auto) repeat(12, minmax(0, 1fr))`,
        }}
      >
        {/* Header row */}
        <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-700">
          Resource
        </div>
        {weeks.map((w) => (
          <div
            key={w}
            className="px-1 py-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400 text-center border-b border-gray-200 dark:border-zinc-700 truncate"
          >
            {formatWeekHeader(w)}
          </div>
        ))}

        {/* Data rows */}
        {resources.map((resource, rowIdx) => (
          <>
            <div
              key={`name-${resource.id}`}
              className={cn(
                "px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 flex items-center",
                rowIdx % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-gray-50 dark:bg-zinc-800/50"
              )}
            >
              {resource.name}
            </div>
            {weeks.map((weekStart) => {
              const dataPoint = resource.weeklyData.find(
                (d) => d.weekStart === weekStart
              );
              const utilization = dataPoint?.utilization ?? 0;
              return (
                <Tooltip key={`${resource.id}-${weekStart}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "px-1 py-2 text-[11px] font-semibold text-center flex items-center justify-center cursor-default transition-opacity hover:opacity-80",
                        utilization > 0
                          ? getUtilizationClass(utilization)
                          : "bg-white dark:bg-zinc-900 text-gray-300 dark:text-zinc-700",
                        rowIdx % 2 === 0 ? "" : ""
                      )}
                    >
                      {utilization > 0 ? `${utilization}%` : "—"}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {resource.name} — Week of {formatWeekHeader(weekStart)}:{" "}
                      <span className="font-semibold">{utilization}% utilization</span>
                    </p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-3 py-2">
        <span className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800" />
          <span className="text-xs text-gray-600 dark:text-zinc-400">&lt;70% Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800" />
          <span className="text-xs text-gray-600 dark:text-zinc-400">70–90% High</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800" />
          <span className="text-xs text-gray-600 dark:text-zinc-400">&gt;90% Over capacity</span>
        </div>
      </div>
    </div>
  );
}
