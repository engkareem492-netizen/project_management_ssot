import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Plus,
  Ticket,
  Settings,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  MessageSquare,
  Trash2,
  Edit,
  ShieldCheck,
  Timer,
  Zap,
  Save,
} from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
type Priority = typeof PRIORITIES[number];

const PRIORITY_COLORS: Record<Priority, string> = {
  Critical: "bg-red-100 text-red-700 border-red-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  Low: "bg-gray-100 text-gray-700 border-gray-200",
};

const PRIORITY_RING: Record<Priority, string> = {
  Critical: "border-l-4 border-l-red-500",
  High: "border-l-4 border-l-orange-400",
  Medium: "border-l-4 border-l-blue-400",
  Low: "border-l-4 border-l-gray-300",
};

const PRIORITY_DOT: Record<Priority, string> = {
  Critical: "bg-red-500",
  High: "bg-orange-400",
  Medium: "bg-blue-400",
  Low: "bg-gray-400",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Waiting: "bg-purple-100 text-purple-700 border-purple-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
};

// Default SLA targets shown before a project configures its own (matches backend defaults)
const DEFAULT_SLA: Record<Priority, { responseTimeHours: number; resolutionTimeHours: number }> = {
  Critical: { responseTimeHours: 1, resolutionTimeHours: 4 },
  High:     { responseTimeHours: 4, resolutionTimeHours: 24 },
  Medium:   { responseTimeHours: 8, resolutionTimeHours: 72 },
  Low:      { responseTimeHours: 24, resolutionTimeHours: 168 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHours(h: number): string {
  if (h < 1) return `${Math.round(h * 60)}m`;
  if (h < 24) return `${h.toFixed(h % 1 === 0 ? 0 : 1)}h`;
  const days = h / 24;
  return `${days.toFixed(days % 1 === 0 ? 0 : 1)}d`;
}

function getSlaRemaining(createdAt: Date, hours: number, doneAt?: Date | null): {
  remainingHours: number;
  pct: number;     // 0-100, how much of the budget has been consumed
  breached: boolean;
} {
  const now = doneAt ? new Date(doneAt) : new Date();
  const elapsedMs = now.getTime() - new Date(createdAt).getTime();
  const budgetMs = hours * 3600_000;
  const remainingMs = budgetMs - elapsedMs;
  return {
    remainingHours: Math.max(0, +(remainingMs / 3600_000).toFixed(2)),
    pct: Math.min(100, +(elapsedMs / budgetMs * 100).toFixed(1)),
    breached: elapsedMs > budgetMs,
  };
}

function SlaBar({ label, hours, createdAt, doneAt, isDone }: {
  label: string;
  hours: number;
  createdAt: Date;
  doneAt?: Date | null;
  isDone: boolean;
}) {
  const { remainingHours, pct, breached } = getSlaRemaining(createdAt, hours, doneAt);
  const color = isDone
    ? (breached ? "bg-red-400" : "bg-green-400")
    : (breached ? "bg-red-500" : pct > 75 ? "bg-orange-400" : "bg-green-500");
  const textColor = breached ? "text-red-600" : isDone ? "text-green-600" : pct > 75 ? "text-orange-600" : "text-green-600";

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-gray-500">{label}</span>
        <span className={`font-semibold ${textColor}`}>
          {breached
            ? `Overdue${doneAt ? "" : ""}`
            : isDone ? "Met ✓"
            : `${formatHours(remainingHours)} left`}
        </span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const emptyTicketForm = {
  ticketTypeId: "",
  title: "",
  description: "",
  priority: "Medium" as Priority,
  assigneeName: "",
  reporterName: "",
};

export default function SlaTickets() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const [ticketOpen, setTicketOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<any>(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [deleteTicketId, setDeleteTicketId] = useState<number | null>(null);
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

  // Ticket type CRUD (simplified — category only)
  const [typeOpen, setTypeOpen] = useState(false);
  const [editType, setEditType] = useState<any>(null);
  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");

  // SLA policy editing state: { [priority]: { response, resolution } }
  const [policyDraft, setPolicyDraft] = useState<Record<string, { responseTimeHours: string; resolutionTimeHours: string }>>({});

  // Data
  const { data: tickets = [], refetch: refetchTickets } = trpc.tickets.list.useQuery({ projectId }, { enabled });
  const { data: ticketTypes = [], refetch: refetchTypes } = trpc.ticketTypes.list.useQuery({ projectId }, { enabled });
  const { data: slaPoliciesData = [], refetch: refetchPolicies } = trpc.slaPolicy.list.useQuery({ projectId }, { enabled });
  const { data: summary } = trpc.tickets.slaSummary.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });

  // When policies load, initialise the draft
  useEffect(() => {
    if (!slaPoliciesData.length) return;
    const draft: Record<string, { responseTimeHours: string; resolutionTimeHours: string }> = {};
    slaPoliciesData.forEach((p: any) => {
      draft[p.priority] = {
        responseTimeHours: String(p.responseTimeHours),
        resolutionTimeHours: String(p.resolutionTimeHours),
      };
    });
    setPolicyDraft(draft);
  }, [JSON.stringify(slaPoliciesData)]);

  function getPolicyForPriority(priority: Priority) {
    const saved = slaPoliciesData.find((p: any) => p.priority === priority);
    return saved ?? DEFAULT_SLA[priority];
  }

  // Ticket mutations
  const createTicket = trpc.tickets.create.useMutation({
    onSuccess: () => { toast.success("Ticket created"); refetchTickets(); setTicketOpen(false); setTicketForm(emptyTicketForm); },
    onError: (e) => toast.error(e.message),
  });
  const updateTicket = trpc.tickets.update.useMutation({
    onSuccess: () => { toast.success("Ticket updated"); refetchTickets(); setEditTicket(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteTicket = trpc.tickets.delete.useMutation({
    onSuccess: () => { toast.success("Ticket deleted"); refetchTickets(); setDeleteTicketId(null); },
    onError: (e) => toast.error(e.message),
  });
  const respondMut = trpc.tickets.respond.useMutation({
    onSuccess: () => { toast.success("Ticket marked as responded"); refetchTickets(); },
    onError: (e) => toast.error(e.message),
  });
  const resolveMut = trpc.tickets.resolve.useMutation({
    onSuccess: () => { toast.success("Ticket resolved"); refetchTickets(); },
    onError: (e) => toast.error(e.message),
  });

  // Ticket type mutations
  const createType = trpc.ticketTypes.create.useMutation({
    onSuccess: () => { toast.success("Ticket type created"); refetchTypes(); setTypeOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateType = trpc.ticketTypes.update.useMutation({
    onSuccess: () => { toast.success("Ticket type updated"); refetchTypes(); setEditType(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteType = trpc.ticketTypes.delete.useMutation({
    onSuccess: () => { toast.success("Ticket type deleted"); refetchTypes(); setDeleteTypeId(null); },
    onError: (e) => toast.error(e.message),
  });

  // SLA policy mutation
  const upsertPolicy = trpc.slaPolicy.upsert.useMutation({
    onSuccess: () => { toast.success("SLA policy saved"); refetchPolicies(); },
    onError: (e) => toast.error(e.message),
  });

  function openEditTicket(t: any) {
    setEditTicket(t);
    setTicketForm({
      ticketTypeId: String(t.ticketTypeId),
      title: t.title,
      description: t.description ?? "",
      priority: t.priority,
      assigneeName: t.assigneeName ?? "",
      reporterName: t.reporterName ?? "",
    });
  }

  function openEditType(t: any) {
    setEditType(t);
    setTypeName(t.name);
    setTypeDesc(t.description ?? "");
  }

  function submitTicket() {
    const typeId = parseInt(ticketForm.ticketTypeId);
    if (!typeId || !ticketForm.title.trim()) return;
    if (editTicket) {
      updateTicket.mutate({
        id: editTicket.id,
        data: {
          ticketTypeId: typeId,
          title: ticketForm.title,
          description: ticketForm.description || undefined,
          priority: ticketForm.priority,
          assigneeName: ticketForm.assigneeName || null,
        },
      });
    } else {
      createTicket.mutate({
        projectId,
        ticketTypeId: typeId,
        title: ticketForm.title,
        description: ticketForm.description || undefined,
        priority: ticketForm.priority,
        assigneeName: ticketForm.assigneeName || undefined,
        reporterName: ticketForm.reporterName || undefined,
      });
    }
  }

  function submitType() {
    if (!typeName.trim()) return;
    // Keep required DB columns — SLA hours are no longer meaningful on the type
    const payload = { name: typeName, description: typeDesc || undefined, responseTimeHours: 0, resolutionTimeHours: 0 };
    if (editType) {
      updateType.mutate({ id: editType.id, data: { name: typeName, description: typeDesc || undefined } });
    } else {
      createType.mutate({ projectId, ...payload });
    }
  }

  function savePrioritySla(priority: Priority) {
    const draft = policyDraft[priority];
    if (!draft) return;
    upsertPolicy.mutate({
      projectId,
      priority,
      responseTimeHours: parseInt(draft.responseTimeHours) || 0,
      resolutionTimeHours: parseInt(draft.resolutionTimeHours) || 0,
    });
  }

  const openTickets = (tickets as any[]).filter(t => t.status === "Open" || t.status === "In Progress" || t.status === "Waiting");
  const resolvedTickets = (tickets as any[]).filter(t => t.status === "Resolved" || t.status === "Closed");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            SLA Tickets
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">SLA timers are driven by ticket priority</p>
        </div>
        <Button onClick={() => { setEditTicket(null); setTicketForm(emptyTicketForm); setTicketOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />New Ticket
        </Button>
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Open</p>
              <p className="text-2xl font-bold text-yellow-600">{summary.open}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{summary.resolved}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Response Breached</p>
              <p className="text-2xl font-bold text-red-600">{summary.responseBreached}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">Resolution Breached</p>
              <p className="text-2xl font-bold text-red-600">{summary.resolutionBreached}</p>
            </CardContent>
          </Card>
          <Card className="border border-gray-200">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 mb-1">SLA Compliance</p>
              <p className="text-2xl font-bold text-blue-600">{summary.complianceRate}%</p>
              <Progress value={summary.complianceRate} className="h-1 mt-1" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            <Clock className="w-3.5 h-3.5 mr-1.5" />Open ({openTickets.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />Resolved ({resolvedTickets.length})
          </TabsTrigger>
          <TabsTrigger value="sla">
            <Zap className="w-3.5 h-3.5 mr-1.5" />SLA Policy
          </TabsTrigger>
          <TabsTrigger value="types">
            <Settings className="w-3.5 h-3.5 mr-1.5" />Ticket Types
          </TabsTrigger>
        </TabsList>

        {/* Open Tickets */}
        <TabsContent value="open" className="space-y-3 mt-4">
          {openTickets.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No open tickets</p>
            </div>
          )}
          {openTickets.map((t: any) => (
            <TicketCard
              key={t.id}
              ticket={t}
              ticketTypes={ticketTypes as any[]}
              slaPolicy={getPolicyForPriority(t.priority)}
              onEdit={() => openEditTicket(t)}
              onDelete={() => setDeleteTicketId(t.id)}
              onRespond={() => respondMut.mutate({ id: t.id })}
              onResolve={() => resolveMut.mutate({ id: t.id })}
              onStatusChange={(status) => updateTicket.mutate({ id: t.id, data: { status: status as any } })}
            />
          ))}
        </TabsContent>

        {/* Resolved Tickets */}
        <TabsContent value="resolved" className="space-y-3 mt-4">
          {resolvedTickets.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No resolved tickets yet</p>
            </div>
          )}
          {resolvedTickets.map((t: any) => (
            <TicketCard
              key={t.id}
              ticket={t}
              ticketTypes={ticketTypes as any[]}
              slaPolicy={getPolicyForPriority(t.priority)}
              onEdit={() => openEditTicket(t)}
              onDelete={() => setDeleteTicketId(t.id)}
              onRespond={() => respondMut.mutate({ id: t.id })}
              onResolve={() => resolveMut.mutate({ id: t.id })}
              onStatusChange={(status) => updateTicket.mutate({ id: t.id, data: { status: status as any } })}
            />
          ))}
        </TabsContent>

        {/* SLA Policy — JIRA style, per priority */}
        <TabsContent value="sla" className="mt-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                Priority SLA Configuration
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Set how quickly tickets of each priority must receive a first response and be resolved — regardless of ticket type.
              </p>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[180px_1fr_1fr_80px] gap-4 px-5 py-2.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Priority</span>
              <span>First Response</span>
              <span>Resolution</span>
              <span></span>
            </div>

            {PRIORITIES.map((priority) => {
              const draft = policyDraft[priority] ?? {
                responseTimeHours: String(DEFAULT_SLA[priority].responseTimeHours),
                resolutionTimeHours: String(DEFAULT_SLA[priority].resolutionTimeHours),
              };
              const isSaving = upsertPolicy.isPending;
              return (
                <div
                  key={priority}
                  className={`grid grid-cols-[180px_1fr_1fr_80px] gap-4 items-center px-5 py-4 border-b border-gray-100 last:border-b-0 ${PRIORITY_RING[priority]} bg-white`}
                >
                  {/* Priority label */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[priority]}`} />
                    <span className="font-semibold text-sm text-gray-800">{priority}</span>
                  </div>

                  {/* First Response */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8 text-sm"
                      value={draft.responseTimeHours}
                      onChange={(e) => setPolicyDraft(d => ({ ...d, [priority]: { ...draft, responseTimeHours: e.target.value } }))}
                    />
                    <span className="text-xs text-gray-400">hours</span>
                    <span className="text-xs text-gray-300">({formatHours(Number(draft.responseTimeHours) || 0)})</span>
                  </div>

                  {/* Resolution */}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      className="w-20 h-8 text-sm"
                      value={draft.resolutionTimeHours}
                      onChange={(e) => setPolicyDraft(d => ({ ...d, [priority]: { ...draft, resolutionTimeHours: e.target.value } }))}
                    />
                    <span className="text-xs text-gray-400">hours</span>
                    <span className="text-xs text-gray-300">({formatHours(Number(draft.resolutionTimeHours) || 0)})</span>
                  </div>

                  {/* Save */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => savePrioritySla(priority)}
                    disabled={isSaving}
                  >
                    <Save className="w-3 h-3 mr-1" />Save
                  </Button>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* Ticket Types (category labels) */}
        <TabsContent value="types" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">
              Ticket types are category labels (e.g. Bug, Incident, Feature). SLA timers are set in the <strong>SLA Policy</strong> tab.
            </p>
            <Button size="sm" onClick={() => { setEditType(null); setTypeName(""); setTypeDesc(""); setTypeOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />Add Type
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(ticketTypes as any[]).map((tt: any) => (
              <Card key={tt.id} className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{tt.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditType(tt)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteTypeId(tt.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {tt.description && <p className="text-xs text-gray-500 mt-1">{tt.description}</p>}
                </CardHeader>
              </Card>
            ))}
            {ticketTypes.length === 0 && (
              <div className="col-span-3 text-center py-12 text-gray-400">
                <Settings className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No ticket types yet. Add one to start creating tickets.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Ticket Dialog */}
      <Dialog
        open={ticketOpen || !!editTicket}
        onOpenChange={(o) => { if (!o) { setTicketOpen(false); setEditTicket(null); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editTicket ? "Edit Ticket" : "New Ticket"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Priority *</Label>
              <Select
                value={ticketForm.priority}
                onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v as Priority })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => {
                    const pol = getPolicyForPriority(p);
                    return (
                      <SelectItem key={p} value={p}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full inline-block ${PRIORITY_DOT[p]}`} />
                          {p}
                          <span className="text-xs text-gray-400">
                            — Response {formatHours(pol.responseTimeHours)} / Resolution {formatHours(pol.resolutionTimeHours)}
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ticket Type *</Label>
              <Select value={ticketForm.ticketTypeId} onValueChange={(v) => setTicketForm({ ...ticketForm, ticketTypeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  {(ticketTypes as any[]).map((tt: any) => (
                    <SelectItem key={tt.id} value={String(tt.id)}>{tt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={ticketForm.title}
                onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                placeholder="Brief description of the issue"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                placeholder="Detailed description..."
                rows={3}
              />
            </div>
            <div>
              <Label>Assignee</Label>
              <StakeholderSelect
                stakeholders={stakeholders as any[]}
                value={ticketForm.assigneeName}
                onValueChange={(v) => setTicketForm({ ...ticketForm, assigneeName: v })}
                projectId={projectId}
                placeholder="Assign to..."
              />
            </div>
            {!editTicket && (
              <div>
                <Label>Reporter</Label>
                <StakeholderSelect
                  stakeholders={stakeholders as any[]}
                  value={ticketForm.reporterName}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, reporterName: v })}
                  projectId={projectId}
                  placeholder="Who reported this?"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTicketOpen(false); setEditTicket(null); }}>Cancel</Button>
            <Button
              disabled={!ticketForm.ticketTypeId || !ticketForm.title.trim() || createTicket.isPending || updateTicket.isPending}
              onClick={submitTicket}
            >
              {editTicket ? "Save Changes" : "Create Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Ticket Type Dialog */}
      <Dialog
        open={typeOpen || !!editType}
        onOpenChange={(o) => { if (!o) { setTypeOpen(false); setEditType(null); } }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editType ? "Edit Ticket Type" : "New Ticket Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="e.g. Bug, Feature Request, Incident" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={typeDesc} onChange={(e) => setTypeDesc(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTypeOpen(false); setEditType(null); }}>Cancel</Button>
            <Button disabled={!typeName.trim() || createType.isPending || updateType.isPending} onClick={submitType}>
              {editType ? "Save Changes" : "Create Type"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Confirm */}
      <AlertDialog open={!!deleteTicketId} onOpenChange={(o) => { if (!o) setDeleteTicketId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTicketId && deleteTicket.mutate({ id: deleteTicketId })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Type Confirm */}
      <AlertDialog open={!!deleteTypeId} onOpenChange={(o) => { if (!o) setDeleteTypeId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ticket Type</AlertDialogTitle>
            <AlertDialogDescription>Existing tickets of this type will not be deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTypeId && deleteType.mutate({ id: deleteTypeId })}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Ticket Card ──────────────────────────────────────────────────────────────
function TicketCard({
  ticket,
  ticketTypes,
  slaPolicy,
  onEdit,
  onDelete,
  onRespond,
  onResolve,
  onStatusChange,
}: {
  ticket: any;
  ticketTypes: any[];
  slaPolicy: { responseTimeHours: number; resolutionTimeHours: number };
  onEdit: () => void;
  onDelete: () => void;
  onRespond: () => void;
  onResolve: () => void;
  onStatusChange: (s: string) => void;
}) {
  const type = ticketTypes.find(t => t.id === ticket.ticketTypeId);
  const isOpen = ticket.status !== "Resolved" && ticket.status !== "Closed";
  const priority: Priority = ticket.priority;

  return (
    <div className={`bg-white border rounded-xl p-4 space-y-3 ${ticket.slaResolutionBreached ? "border-red-300" : "border-gray-200"} ${PRIORITY_RING[priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {(ticket.slaResponseBreached || ticket.slaResolutionBreached) && (
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{ticket.idCode}</span>
              {type && <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{type.name}</span>}
            </div>
            <p className="font-medium text-gray-900 truncate mt-0.5">{ticket.title}</p>
            {ticket.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Edit className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Badge className={`text-xs border ${PRIORITY_COLORS[priority] ?? ""}`} variant="outline">
          {priority}
        </Badge>
        <Badge className={`text-xs border ${STATUS_COLORS[ticket.status] ?? ""}`} variant="outline">
          {ticket.status}
        </Badge>
      </div>

      {/* SLA timers */}
      <div className="space-y-2 pt-1 border-t border-gray-50">
        <SlaBar
          label="First Response"
          hours={slaPolicy.responseTimeHours}
          createdAt={ticket.createdAt}
          doneAt={ticket.respondedAt}
          isDone={!!ticket.respondedAt}
        />
        <SlaBar
          label="Resolution"
          hours={slaPolicy.resolutionTimeHours}
          createdAt={ticket.createdAt}
          doneAt={ticket.resolvedAt}
          isDone={!!ticket.resolvedAt}
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        {ticket.assigneeName && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />{ticket.assigneeName}
          </span>
        )}
        {ticket.reporterName && (
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />Reported by {ticket.reporterName}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>

      {isOpen && (
        <div className="flex gap-2 pt-1 border-t border-gray-100">
          {!ticket.respondedAt && (
            <Button size="sm" variant="outline" onClick={onRespond} className="text-xs h-7">
              <Timer className="w-3 h-3 mr-1" />Mark Responded
            </Button>
          )}
          {!ticket.resolvedAt && (
            <Button size="sm" variant="outline" onClick={onResolve} className="text-xs h-7 text-green-700 border-green-200 hover:bg-green-50">
              <CheckCircle2 className="w-3 h-3 mr-1" />Resolve
            </Button>
          )}
          <Select value={ticket.status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-7 text-xs w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Open", "In Progress", "Waiting", "Resolved", "Closed"].map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
