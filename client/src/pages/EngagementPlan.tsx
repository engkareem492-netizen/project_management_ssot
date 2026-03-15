import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  History,
  Users,
  ClipboardList,
  ListChecks,
  ArrowRight,
  RefreshCw,
  X,
  ChevronRight,
} from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { EmptyState } from "@/components/EmptyState";
import { formatDate } from "@/lib/dateUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type EngagementStatus =
  | "Unaware"
  | "Resistant"
  | "Neutral"
  | "Supportive"
  | "Leading";

type TaskStatus = "Pending" | "In Progress" | "Done" | "Cancelled";
type TaskPriority = "Low" | "Medium" | "High" | "Critical";

// ─── Constants ────────────────────────────────────────────────────────────────

const ENGAGEMENT_STATUSES: EngagementStatus[] = [
  "Unaware",
  "Resistant",
  "Neutral",
  "Supportive",
  "Leading",
];

const STATUS_FROM_OPTIONS = [...ENGAGEMENT_STATUSES, "Any"] as const;

const TASK_STATUSES: TaskStatus[] = ["Pending", "In Progress", "Done", "Cancelled"];
const TASK_PRIORITIES: TaskPriority[] = ["Low", "Medium", "High", "Critical"];

const GROUP_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadgeClass(status: string | null | undefined): string {
  const map: Record<string, string> = {
    Unaware: "bg-gray-100 text-gray-600",
    Resistant: "bg-red-100 text-red-700",
    Neutral: "bg-yellow-100 text-yellow-700",
    Supportive: "bg-green-100 text-green-700",
    Leading: "bg-emerald-100 text-emerald-700",
  };
  return map[status ?? ""] ?? "bg-muted text-muted-foreground";
}

function getTaskStatusBadgeClass(status: string | null | undefined): string {
  const map: Record<string, string> = {
    Pending: "bg-gray-100 text-gray-600",
    "In Progress": "bg-blue-100 text-blue-700",
    Done: "bg-green-100 text-green-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return map[status ?? ""] ?? "bg-muted text-muted-foreground";
}

function getTaskPriorityBadgeClass(priority: string | null | undefined): string {
  const map: Record<string, string> = {
    Low: "bg-gray-100 text-gray-500",
    Medium: "bg-yellow-100 text-yellow-700",
    High: "bg-orange-100 text-orange-700",
    Critical: "bg-red-100 text-red-700",
  };
  return map[priority ?? ""] ?? "bg-muted text-muted-foreground";
}

function getStrategyColor(strategy: string | null | undefined): string {
  const map: Record<string, string> = {
    "Manage Closely": "#ef4444",
    "Keep Satisfied": "#f97316",
    "Keep Informed": "#3b82f6",
    Monitor: "#9ca3af",
  };
  return map[strategy ?? ""] ?? "#9ca3af";
}

function getStrategyBadgeClass(strategy: string | null | undefined): string {
  const map: Record<string, string> = {
    "Manage Closely": "bg-red-100 text-red-700 border-red-200",
    "Keep Satisfied": "bg-orange-100 text-orange-700 border-orange-200",
    "Keep Informed": "bg-blue-100 text-blue-700 border-blue-200",
    Monitor: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return map[strategy ?? ""] ?? "bg-muted text-muted-foreground border-border";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}

// ─── Tab 1: Stakeholder Analysis ─────────────────────────────────────────────

// ─── Draggable Stakeholder Token ─────────────────────────────────────────────

function DraggableToken({
  stakeholder,
  isDragging,
  onStakeholderClick,
}: {
  stakeholder: any;
  isDragging?: boolean;
  onStakeholderClick?: (s: any) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: String(stakeholder.id),
    data: { stakeholder },
  });
  const color = getStrategyColor(stakeholder.engagementStrategy);
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, zIndex: 50 }
    : undefined;
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={{ ...style, backgroundColor: color, opacity: isDragging ? 0.4 : 1 }}
            {...listeners}
            {...attributes}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md border-2 border-white cursor-grab active:cursor-grabbing select-none transition-opacity"
            onClick={(e) => {
              // Only fire click if not dragging
              if (!transform && onStakeholderClick) {
                e.stopPropagation();
                onStakeholderClick(stakeholder);
              }
            }}
          >
            {getInitials(stakeholder.fullName)}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[180px]">
          <p className="font-semibold">{stakeholder.fullName}</p>
          {stakeholder.position && <p className="text-muted-foreground">{stakeholder.position}</p>}
          {stakeholder.role && <p className="text-muted-foreground">{stakeholder.role}</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Droppable Cell ───────────────────────────────────────────────────────────

function DroppableCell({
  power,
  interest,
  children,
  isOver,
}: {
  power: number;
  interest: number;
  children: React.ReactNode;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: `cell-${power}-${interest}` });
  // Quadrant color
  const qColor =
    power >= 3 && interest >= 3 ? "bg-red-50"
    : power >= 3 && interest < 3 ? "bg-orange-50"
    : power < 3 && interest >= 3 ? "bg-blue-50"
    : "bg-gray-50";
  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-wrap items-center justify-center gap-1 p-1 border border-dashed border-muted-foreground/20 transition-colors ${
        isOver ? "ring-2 ring-primary ring-inset bg-primary/10" : qColor
      }`}
      style={{ minHeight: 52 }}
    >
      {children}
    </div>
  );
}

// ─── Power/Interest Map ───────────────────────────────────────────────────────

function PowerInterestMap({
  stakeholders,
  onUpdate,
  onStakeholderClick,
}: {
  stakeholders: any[];
  onUpdate: (id: number, power: number, interest: number) => void;
  onStakeholderClick?: (s: any) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  // Optimistic local overrides: stakeholderId -> { power, interest }
  const [localPos, setLocalPos] = useState<Record<number, { power: number; interest: number }>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  // Merge server data with local optimistic overrides
  const resolvedStakeholders = useMemo(() => {
    return stakeholders.map((s) => ({
      ...s,
      powerLevel: localPos[s.id]?.power ?? s.powerLevel ?? 3,
      interestLevel: localPos[s.id]?.interest ?? s.interestLevel ?? 3,
    }));
  }, [stakeholders, localPos]);

  // Build cell map: `${power}-${interest}` -> stakeholders[]
  const cellMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const s of resolvedStakeholders) {
      const key = `${s.powerLevel}-${s.interestLevel}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    return map;
  }, [resolvedStakeholders]);

  const activeStakeholder = useMemo(
    () => resolvedStakeholders.find((s) => String(s.id) === activeId),
    [activeId, resolvedStakeholders]
  );

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragOver = (e: any) => {
    setOverId(e.over?.id ?? null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    setOverId(null);
    if (!e.over) return;
    const cellId = String(e.over.id);
    if (!cellId.startsWith("cell-")) return;
    const [, p, i] = cellId.split("-");
    const newPower = parseInt(p);
    const newInterest = parseInt(i);
    const stakeholderId = parseInt(String(e.active.id));
    // Optimistic update
    setLocalPos((prev) => ({ ...prev, [stakeholderId]: { power: newPower, interest: newInterest } }));
    // Persist to server
    onUpdate(stakeholderId, newPower, newInterest);
  };

  // Grid: rows = power 5 (top) → 1 (bottom), cols = interest 1 (left) → 5 (right)
  const powers = [5, 4, 3, 2, 1];
  const interests = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-3">
      {/* Axis label: Interest (top) */}
      <div className="flex items-center gap-2">
        <div className="w-8 shrink-0" />
        <div className="flex-1 flex justify-between text-xs text-muted-foreground px-1">
          <span>Low Interest →</span>
          <span>← High Interest</span>
        </div>
      </div>

      <div className="flex gap-2">
        {/* Axis label: Power (left, vertical) */}
        <div className="flex flex-col justify-between items-center w-7 shrink-0 py-1">
          <span className="text-[10px] text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none">High Power</span>
          <span className="text-[10px] text-muted-foreground [writing-mode:vertical-rl] rotate-180 leading-none">Low Power</span>
        </div>

        {/* Grid */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1">
            {/* Interest column headers */}
            <div className="grid mb-0.5" style={{ gridTemplateColumns: `repeat(5, 1fr)` }}>
              {interests.map((i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground">{i}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(5, 1fr)`, gridTemplateRows: `repeat(5, 1fr)` }}>
              {powers.map((power) =>
                interests.map((interest) => {
                  const key = `${power}-${interest}`;
                  const cellTokens = cellMap[key] ?? [];
                  const cellDropId = `cell-${power}-${interest}`;
                  return (
                    <DroppableCell
                      key={key}
                      power={power}
                      interest={interest}
                      isOver={overId === cellDropId}
                    >
                      {cellTokens.map((s) => (
                        <DraggableToken
                          key={s.id}
                          stakeholder={s}
                          isDragging={String(s.id) === activeId}
                          onStakeholderClick={onStakeholderClick}
                        />
                      ))}
                    </DroppableCell>
                  );
                })
              )}
            </div>

            {/* Power row labels on the right */}
            <div className="flex justify-between mt-1 px-0.5">
              {interests.map((i) => (
                <div key={i} className="flex-1" />
              ))}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeStakeholder ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xl border-2 border-white cursor-grabbing scale-110"
                style={{ backgroundColor: getStrategyColor(activeStakeholder.engagementStrategy) }}
              >
                {getInitials(activeStakeholder.fullName)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Power row labels */}
      <div className="flex gap-2">
        <div className="w-7 shrink-0" />
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(5, 1fr)` }}>
          {powers.map((p) => (
            <div key={p} className="text-center text-[10px] text-muted-foreground font-semibold">{p}</div>
          ))}
        </div>
      </div>

      {/* Quadrant legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {[
          { label: "Manage Closely", color: "#ef4444", hint: "High Power, High Interest" },
          { label: "Keep Satisfied", color: "#f97316", hint: "High Power, Low Interest" },
          { label: "Keep Informed", color: "#3b82f6", hint: "Low Power, High Interest" },
          { label: "Monitor", color: "#9ca3af", hint: "Low Power, Low Interest" },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground" title={item.hint}>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/60 italic">Drag a stakeholder token to change their Power &amp; Interest position</p>
    </div>
  );
}

// ─── Stakeholder Analysis Tab ─────────────────────────────────────────────────

function StakeholderAnalysisTab({
  stakeholders,
  projectId,
}: {
  stakeholders: any[];
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const [selectedStakeholder, setSelectedStakeholder] = useState<any>(null);

  // Only show true Stakeholders (not Team Members or External)
  const mapStakeholders = useMemo(
    () => stakeholders.filter((s) => s.classification === "Stakeholder"),
    [stakeholders]
  );

  const updateMut = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
    },
    onError: (e) => toast.error(`Failed to update position: ${e.message}`),
  });

  const handlePositionUpdate = useCallback(
    (id: number, power: number, interest: number) => {
      const strategy =
        power >= 3 && interest >= 3 ? "Manage Closely"
        : power >= 3 && interest < 3 ? "Keep Satisfied"
        : power < 3 && interest >= 3 ? "Keep Informed"
        : "Monitor";
      updateMut.mutate({
        id,
        data: { powerLevel: power, interestLevel: interest, engagementStrategy: strategy },
      });
    },
    [updateMut]
  );

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Drag-and-Drop Power/Interest Map */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Power / Interest Map</CardTitle>
            <p className="text-xs text-muted-foreground">Drag to reposition · Click a bubble to view details</p>
          </CardHeader>
          <CardContent>
            {mapStakeholders.length === 0 ? (
              <EmptyState icon={Users} title="No stakeholders yet" description="Add stakeholders to see the map." />
            ) : (
              <PowerInterestMap
                stakeholders={mapStakeholders}
                onUpdate={handlePositionUpdate}
                onStakeholderClick={setSelectedStakeholder}
              />
            )}
          </CardContent>
        </Card>

        {/* Engagement Matrix Table — Stakeholders only */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Matrix</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {mapStakeholders.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Users}
                  title="No stakeholders yet"
                  description="Add stakeholders to populate the matrix."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Desired</TableHead>
                      <TableHead>Strategy</TableHead>
                      <TableHead className="text-center">Power</TableHead>
                      <TableHead className="text-center">Interest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mapStakeholders.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedStakeholder(s)}
                      >
                        <TableCell className="font-medium text-sm">{s.fullName}</TableCell>
                        <TableCell>
                          <StatusBadge status={s.currentEngagementStatus} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={s.desiredEngagementStatus} />
                        </TableCell>
                        <TableCell>
                          {s.engagementStrategy ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStrategyBadgeClass(s.engagementStrategy)}`}
                            >
                              {s.engagementStrategy}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center text-sm">{s.powerLevel ?? "—"}</TableCell>
                        <TableCell className="text-center text-sm">{s.interestLevel ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stakeholder Detail Sheet */}
      <Sheet open={!!selectedStakeholder} onOpenChange={(v) => !v && setSelectedStakeholder(null)}>
        <SheetContent className="w-[400px] sm:w-[480px] overflow-y-auto p-0">
          {selectedStakeholder && (
            <>
              {/* Hero Header */}
              <div
                className="px-6 pt-8 pb-6"
                style={{ background: `linear-gradient(135deg, ${getStrategyColor(selectedStakeholder.engagementStrategy)}22 0%, ${getStrategyColor(selectedStakeholder.engagementStrategy)}08 100%)`, borderBottom: `3px solid ${getStrategyColor(selectedStakeholder.engagementStrategy)}` }}
              >
                <SheetHeader>
                  <SheetTitle asChild>
                    <div className="flex items-start gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md"
                        style={{ backgroundColor: getStrategyColor(selectedStakeholder.engagementStrategy) }}
                      >
                        {getInitials(selectedStakeholder.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-lg font-bold leading-tight text-foreground">{selectedStakeholder.fullName}</div>
                        {selectedStakeholder.position && (
                          <div className="text-sm text-muted-foreground mt-0.5">{selectedStakeholder.position}</div>
                        )}
                        {selectedStakeholder.job && (
                          <div className="text-xs text-muted-foreground">{selectedStakeholder.job}</div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedStakeholder.classification && (
                            <Badge variant="secondary" className="text-xs">{selectedStakeholder.classification}</Badge>
                          )}
                          {selectedStakeholder.engagementStrategy && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStrategyBadgeClass(selectedStakeholder.engagementStrategy)}`}>
                              {selectedStakeholder.engagementStrategy}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
              </div>

              <div className="px-6 py-5 space-y-5 text-sm">

                {/* Identity */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Identity</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Role</p>
                      <p className="font-medium">{selectedStakeholder.role || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Department</p>
                      <p className="font-medium">{selectedStakeholder.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Organisation</p>
                      <p className="font-medium">{selectedStakeholder.organisation || "—"}</p>
                    </div>
                    {selectedStakeholder.job && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Job Title</p>
                        <p className="font-medium">{selectedStakeholder.job}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t" />

                {/* Contact */}
                {(selectedStakeholder.email || selectedStakeholder.phone) && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Contact</p>
                      <div className="space-y-1.5">
                        {selectedStakeholder.email && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs w-12">Email</span>
                            <a href={`mailto:${selectedStakeholder.email}`} className="text-blue-600 hover:underline truncate">{selectedStakeholder.email}</a>
                          </div>
                        )}
                        {selectedStakeholder.phone && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-xs w-12">Phone</span>
                            <span>{selectedStakeholder.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t" />
                  </>
                )}

                {/* Engagement */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Engagement</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                      <StatusBadge status={selectedStakeholder.currentEngagementStatus} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Desired Status</p>
                      <StatusBadge status={selectedStakeholder.desiredEngagementStatus} />
                    </div>
                  </div>

                  {/* Power / Interest bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Power Level</span>
                        <span className="font-semibold">{selectedStakeholder.powerLevel ?? 0} / 5</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${((selectedStakeholder.powerLevel ?? 0) / 5) * 100}%`, backgroundColor: getStrategyColor(selectedStakeholder.engagementStrategy) }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Interest Level</span>
                        <span className="font-semibold">{selectedStakeholder.interestLevel ?? 0} / 5</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${((selectedStakeholder.interestLevel ?? 0) / 5) * 100}%`, backgroundColor: getStrategyColor(selectedStakeholder.engagementStrategy) }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t" />

                {/* Communication */}
                {(selectedStakeholder.communicationFrequency || selectedStakeholder.communicationChannel || selectedStakeholder.communicationMessage || selectedStakeholder.communicationResponsible) && (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Communication</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        {selectedStakeholder.communicationFrequency && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Frequency</p>
                            <p className="font-medium">{selectedStakeholder.communicationFrequency}</p>
                          </div>
                        )}
                        {selectedStakeholder.communicationChannel && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Channel</p>
                            <p className="font-medium">{selectedStakeholder.communicationChannel}</p>
                          </div>
                        )}
                        {selectedStakeholder.communicationResponsible && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">Responsible</p>
                            <p className="font-medium">{selectedStakeholder.communicationResponsible}</p>
                          </div>
                        )}
                        {selectedStakeholder.communicationMessage && (
                          <div className="col-span-2">
                            <p className="text-xs text-muted-foreground mb-0.5">Key Message</p>
                            <p className="text-muted-foreground italic">"{selectedStakeholder.communicationMessage}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="border-t" />
                  </>
                )}

                {/* Notes */}
                {selectedStakeholder.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed bg-muted/50 rounded-lg p-3">{selectedStakeholder.notes}</p>
                  </div>
                )}

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

// ─── History Dialog ───────────────────────────────────────────────────────────

function HistoryDialog({
  stakeholder,
  open,
  onOpenChange,
}: {
  stakeholder: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();

  const { data: history = [], isLoading } = trpc.engagement.listStatusHistory.useQuery(
    { stakeholderId: stakeholder?.id },
    { enabled: !!stakeholder?.id && open }
  );

  const deleteMut = trpc.engagement.deleteStatusHistory.useMutation({
    onSuccess: () => {
      utils.engagement.listStatusHistory.invalidate({ stakeholderId: stakeholder.id });
      toast.success("History entry deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Engagement History — {stakeholder?.fullName}
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : history.length === 0 ? (
          <EmptyState
            icon={History}
            title="No history entries"
            description="Log an assessment to start tracking engagement status changes."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assessed By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{entry.statusType}</TableCell>
                  <TableCell>
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="text-sm">{entry.assessedBy ?? "—"}</TableCell>
                  <TableCell className="text-sm">{formatDate(entry.assessmentDate)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate">
                    {entry.notes ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteMut.mutate({ id: entry.id })}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Status Dialog ───────────────────────────────────────────────────────

function EditStatusDialog({
  stakeholder,
  open,
  onOpenChange,
}: {
  stakeholder: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [currentStatus, setCurrentStatus] = useState<string>(
    stakeholder?.currentEngagementStatus ?? ""
  );
  const [desiredStatus, setDesiredStatus] = useState<string>(
    stakeholder?.desiredEngagementStatus ?? ""
  );

  // Sync when stakeholder changes
  useMemo(() => {
    setCurrentStatus(stakeholder?.currentEngagementStatus ?? "");
    setDesiredStatus(stakeholder?.desiredEngagementStatus ?? "");
  }, [stakeholder?.id, open]);

  const updateMut = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      toast.success("Engagement status updated");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!stakeholder) return;
    updateMut.mutate({
      id: stakeholder.id,
      data: {
        currentEngagementStatus: currentStatus || undefined,
        desiredEngagementStatus: desiredStatus || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Engagement Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Current Status</Label>
            <Select value={currentStatus || "__none__"} onValueChange={(v) => setCurrentStatus(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {ENGAGEMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Desired Status</Label>
            <Select value={desiredStatus || "__none__"} onValueChange={(v) => setDesiredStatus(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {ENGAGEMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMut.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Log Assessment Dialog ────────────────────────────────────────────────────

function LogAssessmentDialog({
  stakeholder,
  open,
  onOpenChange,
}: {
  stakeholder: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    statusType: "Current",
    status: "",
    assessedBy: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const addMut = trpc.engagement.addStatusHistory.useMutation({
    onSuccess: () => {
      utils.engagement.listStatusHistory.invalidate({ stakeholderId: stakeholder.id });
      toast.success("Assessment logged");
      onOpenChange(false);
      setForm({
        statusType: "Current",
        status: "",
        assessedBy: "",
        assessmentDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.status) {
      toast.error("Please select a status");
      return;
    }
    addMut.mutate({
      stakeholderId: stakeholder.id,
      statusType: form.statusType,
      status: form.status,
      assessedBy: form.assessedBy || undefined,
      assessmentDate: form.assessmentDate || undefined,
      notes: form.notes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Log Assessment — {stakeholder?.fullName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Status Type</Label>
            <Select value={form.statusType} onValueChange={(v) => setForm({ ...form, statusType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Current">Current</SelectItem>
                <SelectItem value="Desired">Desired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={form.status || "__none__"} onValueChange={(v) => setForm({ ...form, status: v === "__none__" ? "" : v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— Select —</SelectItem>
                {ENGAGEMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assessed By</Label>
            <Input
              value={form.assessedBy}
              onChange={(e) => setForm({ ...form, assessedBy: e.target.value })}
              placeholder="Name of assessor..."
            />
          </div>
          <div>
            <Label>Assessment Date</Label>
            <Input
              type="date"
              value={form.assessmentDate}
              onChange={(e) => setForm({ ...form, assessmentDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={addMut.isPending}>Log Assessment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 2: Engagement Assessment ────────────────────────────────────────────

function EngagementAssessmentTab({
  stakeholders,
  projectId,
}: {
  stakeholders: any[];
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const [historyTarget, setHistoryTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [logTarget, setLogTarget] = useState<any>(null);

  const syncMut = trpc.engagement.syncSubjects.useMutation({
    onSuccess: () => {
      utils.engagement.listGroups.invalidate({ projectId });
      utils.engagement.listSubjects.invalidate();
      toast.success("Task groups synced with stakeholder statuses");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {stakeholders.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No stakeholders"
          description="Add stakeholders to the project to begin engagement assessment."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Desired Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stakeholders.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-sm">{s.fullName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.role ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={s.currentEngagementStatus} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={s.desiredEngagementStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => setHistoryTarget(s)}
                            title="View history"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => setEditTarget(s)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Status
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={() => setLogTarget(s)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Log Assessment
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => syncMut.mutate({ projectId })}
          disabled={syncMut.isPending}
        >
          <RefreshCw className="h-4 w-4" />
          Sync Task Groups
        </Button>
      </div>

      {historyTarget && (
        <HistoryDialog
          stakeholder={historyTarget}
          open={!!historyTarget}
          onOpenChange={(v) => !v && setHistoryTarget(null)}
        />
      )}
      {editTarget && (
        <EditStatusDialog
          stakeholder={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
        />
      )}
      {logTarget && (
        <LogAssessmentDialog
          stakeholder={logTarget}
          open={!!logTarget}
          onOpenChange={(v) => !v && setLogTarget(null)}
        />
      )}
    </div>
  );
}

// ─── Task Group Form Dialog ───────────────────────────────────────────────────

function TaskGroupFormDialog({
  open,
  onOpenChange,
  projectId,
  editGroup,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: number;
  editGroup?: any;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    name: "",
    description: "",
    fromStatus: "Any",
    toStatus: "Supportive",
    color: GROUP_COLORS[4],
  });

  useMemo(() => {
    if (editGroup) {
      setForm({
        name: editGroup.name ?? "",
        description: editGroup.description ?? "",
        fromStatus: editGroup.fromStatus ?? "Any",
        toStatus: editGroup.toStatus ?? "Supportive",
        color: editGroup.color ?? GROUP_COLORS[4],
      });
    } else {
      setForm({ name: "", description: "", fromStatus: "Any", toStatus: "Supportive", color: GROUP_COLORS[4] });
    }
  }, [editGroup, open]);

  const createMut = trpc.engagement.createGroup.useMutation({
    onSuccess: () => {
      utils.engagement.listGroups.invalidate({ projectId });
      toast.success("Task group created");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.engagement.updateGroup.useMutation({
    onSuccess: () => {
      utils.engagement.listGroups.invalidate({ projectId });
      toast.success("Task group updated");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (editGroup) {
      updateMut.mutate({ id: editGroup.id, data: form });
    } else {
      createMut.mutate({ projectId, ...form });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editGroup ? "Edit Task Group" : "New Task Group"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Group name..."
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this group for?"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>From Status</Label>
              <Select value={form.fromStatus} onValueChange={(v) => setForm({ ...form, fromStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FROM_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>To Status</Label>
              <Select value={form.toStatus} onValueChange={(v) => setForm({ ...form, toStatus: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1.5">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.color === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {editGroup ? "Save Changes" : "Create Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Task Form Dialog ─────────────────────────────────────────────────────────

const PERIODIC_OPTIONS = ["One-time", "Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "Per Meeting", "As Needed"];

function TaskFormDialog({
  open,
  onOpenChange,
  taskGroupId,
  editTask,
  projectId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  taskGroupId: number;
  editTask?: any;
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    title: "",
    description: "",
    periodic: "One-time",
    sequence: 0,
  });

  useMemo(() => {
    if (editTask) {
      setForm({
        title: editTask.title ?? "",
        description: editTask.description ?? "",
        periodic: editTask.periodic ?? "One-time",
        sequence: editTask.sequence ?? 0,
      });
    } else {
      setForm({ title: "", description: "", periodic: "One-time", sequence: 0 });
    }
  }, [editTask, open]);

  const createMut = trpc.engagement.createTask.useMutation({
    onSuccess: () => {
      utils.engagement.listTasks.invalidate({ taskGroupId });
      toast.success("Action item created");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.engagement.updateTask.useMutation({
    onSuccess: () => {
      utils.engagement.listTasks.invalidate({ taskGroupId });
      toast.success("Action item updated");
      onOpenChange(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (editTask) {
      updateMut.mutate({ id: editTask.id, data: { title: form.title, description: form.description || undefined, periodic: form.periodic || undefined, sequence: form.sequence } });
    } else {
      createMut.mutate({ taskGroupId, projectId, title: form.title, description: form.description || undefined, periodic: form.periodic || undefined, sequence: form.sequence });
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editTask ? "Edit Action Item" : "Add Action Item"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Action item title..."
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the action or instruction..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Periodic</Label>
              <Select value={form.periodic} onValueChange={(v) => setForm({ ...form, periodic: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODIC_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sequence #</Label>
              <Input
                type="number"
                min={0}
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending}>
            {editTask ? "Save Changes" : "Add Action Item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 3: Engagement Plan ───────────────────────────────────────────────────

function TaskGroupPanel({
  group,
  stakeholders,
  projectId,
}: {
  group: any;
  stakeholders: any[];
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);

  const { data: tasks = [] } = trpc.engagement.listTasks.useQuery({ taskGroupId: group.id });
  const { data: subjects = [] } = trpc.engagement.listSubjects.useQuery({ taskGroupId: group.id });

  const deleteTaskMut = trpc.engagement.deleteTask.useMutation({
    onSuccess: () => {
      utils.engagement.listTasks.invalidate({ taskGroupId: group.id });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const addSubjectMut = trpc.engagement.addSubject.useMutation({
    onSuccess: () => {
      utils.engagement.listSubjects.invalidate({ taskGroupId: group.id });
      toast.success("Subject added");
    },
    onError: (e) => toast.error(e.message),
  });

  const removeSubjectMut = trpc.engagement.removeSubject.useMutation({
    onSuccess: () => {
      utils.engagement.listSubjects.invalidate({ taskGroupId: group.id });
      toast.success("Subject removed");
    },
    onError: (e) => toast.error(e.message),
  });

  const subjectIds = new Set(subjects.map((s: any) => s.stakeholderId ?? s.id));
  const availableToAdd = stakeholders.filter((s) => !subjectIds.has(s.id));

  return (
    <div className="space-y-4">
      {/* Tasks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between py-3">
          <CardTitle className="text-sm font-semibold">Action Items</CardTitle>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setEditTask(null);
              setTaskDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {tasks.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={ListChecks}
                title="No action items yet"
                description="Add instructional or action items to this engagement group."
                actionLabel="Add Item"
                onAction={() => {
                  setEditTask(null);
                  setTaskDialogOpen(true);
                }}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Periodic</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks
                    .slice()
                    .sort((a: any, b: any) => (a.sequence ?? 0) - (b.sequence ?? 0))
                    .map((task: any) => (
                    <TableRow key={task.id}>
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">{task.sequence ?? 0}</TableCell>
                      <TableCell className="font-medium text-sm">{task.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{task.description ?? "—"}</TableCell>
                      <TableCell>
                        {task.periodic ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            {task.periodic}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditTask(task);
                              setTaskDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => deleteTaskMut.mutate({ id: task.id })}
                            disabled={deleteTaskMut.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 items-center">
            {subjects.length === 0 && (
              <span className="text-sm text-muted-foreground">No subjects assigned.</span>
            )}
            {subjects.map((s: any) => (
              <Badge
                key={s.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {s.fullName ?? s.stakeholderName ?? "Unknown"}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-1 cursor-pointer hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); removeSubjectMut.mutate({ taskGroupId: group.id, stakeholderId: s.stakeholderId ?? s.id }); }}
                  onKeyDown={(e) => e.key === 'Enter' && removeSubjectMut.mutate({ taskGroupId: group.id, stakeholderId: s.stakeholderId ?? s.id })}
                >
                  <X className="h-3 w-3" />
                </span>
              </Badge>
            ))}

            {availableToAdd.length > 0 && (
              <Select
                value=""
                onValueChange={(stakeholderIdStr) => {
                  const stakeholderId = parseInt(stakeholderIdStr, 10);
                  addSubjectMut.mutate({ taskGroupId: group.id, stakeholderId });
                }}
              >
                <SelectTrigger className="h-7 w-auto gap-1 text-xs border-dashed">
                  <Plus className="h-3 w-3" />
                  <span>Add Subject</span>
                </SelectTrigger>
                <SelectContent>
                  {availableToAdd.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      <TaskFormDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        taskGroupId={group.id}
        editTask={editTask}
        projectId={projectId}
      />
    </div>
  );
}

function EngagementPlanTab({
  stakeholders,
  projectId,
}: {
  stakeholders: any[];
  projectId: number;
}) {
  const utils = trpc.useUtils();
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  const { data: groups = [] } = trpc.engagement.listGroups.useQuery({ projectId });

  const deleteGroupMut = trpc.engagement.deleteGroup.useMutation({
    onSuccess: (_, vars) => {
      utils.engagement.listGroups.invalidate({ projectId });
      if (selectedGroupId === vars.id) setSelectedGroupId(null);
      toast.success("Task group deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const selectedGroup = groups.find((g: any) => g.id === selectedGroupId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Group List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Task Groups</h3>
          <Button
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setEditGroup(null);
              setGroupDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Group
          </Button>
        </div>

        {groups.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="No task groups"
            description="Create a group to organize engagement activities."
            actionLabel="New Group"
            onAction={() => {
              setEditGroup(null);
              setGroupDialogOpen(true);
            }}
          />
        ) : (
          <div className="space-y-2">
            {groups.map((group: any) => {
              const isSelected = selectedGroupId === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  className={`w-full text-left rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border bg-card"
                  }`}
                  onClick={() => setSelectedGroupId(isSelected ? null : group.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span
                        className="mt-0.5 w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: group.color ?? "#9ca3af" }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <span>{group.fromStatus ?? "Any"}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span>{group.toStatus ?? "—"}</span>
                        </div>
                        {group.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {group.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {group.taskCount ?? 0} task{(group.taskCount ?? 0) !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditGroup(group);
                          setGroupDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteGroupMut.mutate({ id: group.id });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight
                        className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90" : ""}`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Tasks for Selected Group */}
      <div className="lg:col-span-2">
        {!selectedGroup ? (
          <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-lg">
            <div className="text-center text-muted-foreground">
              <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Select a task group to view its tasks</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: selectedGroup.color ?? "#9ca3af" }}
              />
              <h3 className="text-sm font-semibold">{selectedGroup.name}</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ArrowRight className="h-3 w-3" />
                {selectedGroup.fromStatus ?? "Any"} → {selectedGroup.toStatus ?? "—"}
              </span>
            </div>
            <TaskGroupPanel
              group={selectedGroup}
              stakeholders={stakeholders}
              projectId={projectId}
            />
          </div>
        )}
      </div>

      <TaskGroupFormDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        projectId={projectId}
        editGroup={editGroup}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EngagementPlan() {
  const { currentProjectId } = useProject();

  const { data: stakeholders = [], isLoading } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Only true Stakeholders (not Team Members or External) for engagement tabs
  const engagementStakeholders = stakeholders.filter(
    (s) => s.classification === "Stakeholder"
  );

  if (!currentProjectId) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Users}
          title="No project selected"
          description="Please select a project to view the engagement plan."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Engagement Plan</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Analyze stakeholder engagement, track status history, and manage engagement activities.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading stakeholders...</div>
      ) : (
        <Tabs defaultValue="analysis">
          <TabsList className="mb-6">
            <TabsTrigger value="analysis" className="gap-2">
              <Users className="h-4 w-4" />
              Stakeholder Analysis
            </TabsTrigger>
            <TabsTrigger value="assessment" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Engagement Assessment
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Engagement Plan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <StakeholderAnalysisTab stakeholders={stakeholders} projectId={currentProjectId} />
          </TabsContent>

          <TabsContent value="assessment">
            <EngagementAssessmentTab
              stakeholders={engagementStakeholders}
              projectId={currentProjectId}
            />
          </TabsContent>

          <TabsContent value="plan">
            <EngagementPlanTab
              stakeholders={engagementStakeholders}
              projectId={currentProjectId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
