import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { StakeholderSelect } from "@/components/StakeholderSelect";
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
} from "lucide-react";

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700 border-gray-200",
  Medium: "bg-blue-100 text-blue-700 border-blue-200",
  High: "bg-orange-100 text-orange-700 border-orange-200",
  Critical: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-700 border-yellow-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Waiting: "bg-purple-100 text-purple-700 border-purple-200",
  Resolved: "bg-green-100 text-green-700 border-green-200",
  Closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const emptyTicketForm = {
  ticketTypeId: "",
  title: "",
  description: "",
  priority: "Medium" as "Low" | "Medium" | "High" | "Critical",
  assigneeName: "",
  reporterName: "",
};

const emptyTypeForm = {
  name: "",
  description: "",
  responseTimeHours: "4",
  resolutionTimeHours: "24",
};

export default function SlaTickets() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  // Ticket dialog state
  const [ticketOpen, setTicketOpen] = useState(false);
  const [editTicket, setEditTicket] = useState<any>(null);
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [deleteTicketId, setDeleteTicketId] = useState<number | null>(null);

  // Ticket type dialog state
  const [typeOpen, setTypeOpen] = useState(false);
  const [editType, setEditType] = useState<any>(null);
  const [typeForm, setTypeForm] = useState(emptyTypeForm);
  const [deleteTypeId, setDeleteTypeId] = useState<number | null>(null);

  // Data queries
  const { data: tickets = [], refetch: refetchTickets } = trpc.tickets.list.useQuery(
    { projectId },
    { enabled },
  );
  const { data: ticketTypes = [], refetch: refetchTypes } = trpc.ticketTypes.list.useQuery(
    { projectId },
    { enabled },
  );
  const { data: summary } = trpc.tickets.slaSummary.useQuery(
    { projectId },
    { enabled },
  );
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery(
    { projectId },
    { enabled },
  );

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
    onSuccess: () => { toast.success("Ticket type created"); refetchTypes(); setTypeOpen(false); setTypeForm(emptyTypeForm); },
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
    setTypeForm({
      name: t.name,
      description: t.description ?? "",
      responseTimeHours: String(t.responseTimeHours),
      resolutionTimeHours: String(t.resolutionTimeHours),
    });
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
    if (!typeForm.name.trim()) return;
    const payload = {
      name: typeForm.name,
      description: typeForm.description || undefined,
      responseTimeHours: parseInt(typeForm.responseTimeHours) || 4,
      resolutionTimeHours: parseInt(typeForm.resolutionTimeHours) || 24,
    };
    if (editType) {
      updateType.mutate({ id: editType.id, data: payload });
    } else {
      createType.mutate({ projectId, ...payload });
    }
  }

  const openTickets = (tickets as any[]).filter(t => t.status === "Open" || t.status === "In Progress" || t.status === "Waiting");
  const resolvedTickets = (tickets as any[]).filter(t => t.status === "Resolved" || t.status === "Closed");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-blue-600" />
          SLA Tickets
        </h1>
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
              onEdit={() => openEditTicket(t)}
              onDelete={() => setDeleteTicketId(t.id)}
              onRespond={() => respondMut.mutate({ id: t.id })}
              onResolve={() => resolveMut.mutate({ id: t.id })}
              onStatusChange={(status) => updateTicket.mutate({ id: t.id, data: { status } })}
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
              onEdit={() => openEditTicket(t)}
              onDelete={() => setDeleteTicketId(t.id)}
              onRespond={() => respondMut.mutate({ id: t.id })}
              onResolve={() => resolveMut.mutate({ id: t.id })}
              onStatusChange={(status) => updateTicket.mutate({ id: t.id, data: { status } })}
            />
          ))}
        </TabsContent>

        {/* Ticket Types (SLA Settings) */}
        <TabsContent value="types" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">Configure SLA response and resolution times per ticket type.</p>
            <Button size="sm" onClick={() => { setEditType(null); setTypeForm(emptyTypeForm); setTypeOpen(true); }}>
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
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Timer className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">Response SLA:</span>
                    <span className="font-semibold">{tt.responseTimeHours}h</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600">Resolution SLA:</span>
                    <span className="font-semibold">{tt.resolutionTimeHours}h</span>
                  </div>
                </CardContent>
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
              <Label>Ticket Type *</Label>
              <Select value={ticketForm.ticketTypeId} onValueChange={(v) => setTicketForm({ ...ticketForm, ticketTypeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {(ticketTypes as any[]).map((tt: any) => (
                    <SelectItem key={tt.id} value={String(tt.id)}>
                      {tt.name} (R:{tt.responseTimeHours}h / Res:{tt.resolutionTimeHours}h)
                    </SelectItem>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select
                  value={ticketForm.priority}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v as any })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Low", "Medium", "High", "Critical"].map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </div>
            {!editTicket && (
              <div>
                <Label>Reporter</Label>
                <StakeholderSelect
                  stakeholders={stakeholders as any[]}
                  value={ticketForm.reporterName}
                  onValueChange={(v) => setTicketForm({ ...ticketForm, reporterName: v })}
                  projectId={projectId}
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
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                placeholder="e.g. Bug, Feature Request, Incident"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={typeForm.description}
                onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Response SLA (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  value={typeForm.responseTimeHours}
                  onChange={(e) => setTypeForm({ ...typeForm, responseTimeHours: e.target.value })}
                />
              </div>
              <div>
                <Label>Resolution SLA (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  value={typeForm.resolutionTimeHours}
                  onChange={(e) => setTypeForm({ ...typeForm, resolutionTimeHours: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTypeOpen(false); setEditType(null); }}>Cancel</Button>
            <Button
              disabled={!typeForm.name.trim() || createType.isPending || updateType.isPending}
              onClick={submitType}
            >
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
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTicketId && deleteTicket.mutate({ id: deleteTicketId })}
            >
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
            <AlertDialogDescription>This will not delete existing tickets of this type, but new tickets cannot be created with it.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteTypeId && deleteType.mutate({ id: deleteTypeId })}
            >
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
  onEdit,
  onDelete,
  onRespond,
  onResolve,
  onStatusChange,
}: {
  ticket: any;
  ticketTypes: any[];
  onEdit: () => void;
  onDelete: () => void;
  onRespond: () => void;
  onResolve: () => void;
  onStatusChange: (s: string) => void;
}) {
  const type = ticketTypes.find(t => t.id === ticket.ticketTypeId);
  const isOpen = ticket.status !== "Resolved" && ticket.status !== "Closed";

  return (
    <div className={`bg-white border rounded-xl p-4 space-y-3 ${ticket.slaResolutionBreached ? "border-red-300" : "border-gray-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {(ticket.slaResponseBreached || ticket.slaResolutionBreached) && (
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400">{ticket.idCode}</span>
              {type && <span className="text-xs text-gray-500">{type.name}</span>}
            </div>
            <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
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
        <Badge className={`text-xs border ${PRIORITY_COLORS[ticket.priority] ?? ""}`} variant="outline">
          {ticket.priority}
        </Badge>
        <Badge className={`text-xs border ${STATUS_COLORS[ticket.status] ?? ""}`} variant="outline">
          {ticket.status}
        </Badge>
        {ticket.slaResponseBreached && (
          <Badge className="text-xs bg-red-50 text-red-600 border-red-200" variant="outline">
            Response Breached
          </Badge>
        )}
        {ticket.slaResolutionBreached && (
          <Badge className="text-xs bg-red-50 text-red-600 border-red-200" variant="outline">
            Resolution Breached
          </Badge>
        )}
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
        {ticket.respondedAt && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Responded {new Date(ticket.respondedAt).toLocaleDateString()}
          </span>
        )}
        {ticket.resolvedAt && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="w-3 h-3" />
            Resolved {new Date(ticket.resolvedAt).toLocaleDateString()}
          </span>
        )}
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
