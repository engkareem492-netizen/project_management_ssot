import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Pencil, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { RegistrySelect } from "@/components/RegistrySelect";

const STATUS_COLORS: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Submitted: "bg-blue-100 text-blue-700",
  "Under Review": "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Implemented: "bg-purple-100 text-purple-700",
  Closed: "bg-gray-200 text-gray-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-50 text-blue-600",
  Medium: "bg-yellow-50 text-yellow-700",
  High: "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

const STATUSES = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Implemented", "Closed"] as const;
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

type CRStatus = typeof STATUSES[number];

interface CRForm {
  title: string;
  description: string;
  requestedBy: string;
  assignedTo: string;
  priority: string;
  impactAssessment: string;
  requirementId: string;
  taskId: string;
  issueId: string;
  estimatedEffort: string;
}

const emptyForm: CRForm = {
  title: "",
  description: "",
  requestedBy: "",
  assignedTo: "",
  priority: "Medium",
  impactAssessment: "",
  requirementId: "",
  taskId: "",
  issueId: "",
  estimatedEffort: "",
};

export default function ChangeRequests() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [selectedCR, setSelectedCR] = useState<number | null>(null);
  const [form, setForm] = useState<CRForm>(emptyForm);
  const [newStatus, setNewStatus] = useState<CRStatus>("Submitted");
  const [statusNote, setStatusNote] = useState("");

  const utils = trpc.useUtils();
  const enabled = !!projectId;
  const { data: crs = [], isLoading } = trpc.changeRequests.list.useQuery({ projectId }, { enabled });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId }, { enabled });
  const { data: requirements = [] } = trpc.requirements.list.useQuery({ projectId }, { enabled });
  const { data: tasks = [] } = trpc.tasks.list.useQuery({ projectId }, { enabled });
  const { data: issues = [] } = trpc.issues.list.useQuery({ projectId }, { enabled });

  const createMutation = trpc.changeRequests.create.useMutation({
    onSuccess: () => { utils.changeRequests.list.invalidate(); setShowCreate(false); setForm(emptyForm); toast.success("Change Request created"); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.changeRequests.update.useMutation({
    onSuccess: () => { utils.changeRequests.list.invalidate(); setShowEdit(false); toast.success("Change Request updated"); },
    onError: (e) => toast.error(e.message),
  });

  const statusMutation = trpc.changeRequests.updateStatus.useMutation({
    onSuccess: () => { utils.changeRequests.list.invalidate(); setShowStatusChange(false); toast.success("Status updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.changeRequests.delete.useMutation({
    onSuccess: () => { utils.changeRequests.list.invalidate(); toast.success("Change Request deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = crs.filter((cr) => {
    const matchSearch = !search || cr.title.toLowerCase().includes(search.toLowerCase()) || cr.crId.toLowerCase().includes(search.toLowerCase()) || (cr.requestedBy ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || cr.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const selectedCRData = crs.find((cr) => cr.id === selectedCR);

  function openEdit(cr: typeof crs[0]) {
    setSelectedCR(cr.id);
    setForm({
      title: cr.title,
      description: cr.description ?? "",
      requestedBy: cr.requestedBy ?? "",
      assignedTo: cr.assignedTo ?? "",
      priority: cr.priority ?? "Medium",
      impactAssessment: cr.impactAssessment ?? "",
      requirementId: cr.requirementId ?? "",
      taskId: cr.taskId ?? "",
      issueId: cr.issueId ?? "",
      estimatedEffort: cr.estimatedEffort ?? "",
    });
    setShowEdit(true);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRight className="w-6 h-6 text-gray-500" />
            Change Request Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track formal change requests with approval workflow</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-orange-700 border-orange-300">{crs.length} CRs</Badge>
          <Button onClick={() => { setForm(emptyForm); setShowCreate(true); }} className="bg-gray-900 hover:bg-gray-800 text-white">
            <Plus className="w-4 h-4 mr-1" /> Create CR
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search by ID, title, or requester..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter by status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-orange-50">
              <TableHead className="w-24 font-semibold">CR ID</TableHead>
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="w-32 font-semibold">Requested By</TableHead>
              <TableHead className="w-28 font-semibold">Priority</TableHead>
              <TableHead className="w-36 font-semibold">Status</TableHead>
              <TableHead className="w-32 font-semibold">Linked To</TableHead>
              <TableHead className="w-44 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No change requests found</TableCell></TableRow>
            ) : filtered.map((cr) => (
              <TableRow key={cr.id} className="hover:bg-orange-50/30">
                <TableCell className="font-mono text-sm font-semibold text-orange-700">{cr.crId}</TableCell>
                <TableCell className="max-w-xs">
                  <div className="font-medium text-sm truncate">{cr.title}</div>
                  {cr.description && <div className="text-xs text-muted-foreground truncate mt-0.5">{cr.description}</div>}
                </TableCell>
                <TableCell className="text-sm">{cr.requestedBy ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={`text-xs ${PRIORITY_COLORS[cr.priority ?? "Medium"] ?? ""}`}>{cr.priority ?? "Medium"}</Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-xs ${STATUS_COLORS[cr.status] ?? ""}`}>{cr.status}</Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {cr.requirementId && <div>REQ: {cr.requirementId}</div>}
                  {cr.taskId && <div>TASK: {cr.taskId}</div>}
                  {cr.issueId && <div>ISS: {cr.issueId}</div>}
                  {!cr.requirementId && !cr.taskId && !cr.issueId && "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setSelectedCR(cr.id); setShowView(true); }}><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(cr)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-orange-600 hover:text-orange-700" onClick={() => { setSelectedCR(cr.id); setNewStatus(cr.status as CRStatus); setShowStatusChange(true); }}>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => { if (confirm("Delete this CR?")) deleteMutation.mutate({ id: cr.id }); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Change Request</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title of the change" /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Requested By</Label><StakeholderSelect stakeholders={stakeholders as any[]} value={form.requestedBy} onValueChange={(v) => setForm({ ...form, requestedBy: v })} projectId={projectId} /></div>
            <div className="space-y-1"><Label>Assigned To</Label><StakeholderSelect stakeholders={stakeholders as any[]} value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })} projectId={projectId} /></div>
            <div className="space-y-1"><Label>Priority</Label>
              <RegistrySelect projectId={projectId} domain="change_requests" fieldKey="priority"
                value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}
                placeholder="Select priority" />
            </div>
            <div className="space-y-1"><Label>Estimated Effort</Label><Input value={form.estimatedEffort} onChange={(e) => setForm({ ...form, estimatedEffort: e.target.value })} placeholder="e.g. 3 days" /></div>
            <div className="col-span-2 space-y-1"><Label>Impact Assessment</Label><Textarea value={form.impactAssessment} onChange={(e) => setForm({ ...form, impactAssessment: e.target.value })} rows={2} /></div>
            <div className="space-y-1"><Label>Linked Requirement</Label>
              <Select value={form.requirementId || "__none__"} onValueChange={(v) => setForm({ ...form, requirementId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select requirement..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(requirements as any[]).map((r: any) => <SelectItem key={r.id} value={r.idCode ?? ''}>{r.idCode}{r.description ? ` — ${r.description}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Task</Label>
              <Select value={form.taskId || "__none__"} onValueChange={(v) => setForm({ ...form, taskId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select task..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(tasks as any[]).map((t: any) => <SelectItem key={t.id} value={t.taskId}>{t.taskId}{t.title ? ` — ${t.title}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Issue</Label>
              <Select value={form.issueId || "__none__"} onValueChange={(v) => setForm({ ...form, issueId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select issue..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(issues as any[]).map((i: any) => <SelectItem key={i.id} value={i.issueId}>{i.issueId}{i.description ? ` — ${i.description}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => createMutation.mutate({ projectId, ...form })} disabled={!form.title || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create CR"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Change Request Details</DialogTitle></DialogHeader>
          {selectedCRData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-orange-700 text-lg">{selectedCRData.crId}</span>
                <Badge className={STATUS_COLORS[selectedCRData.status]}>{selectedCRData.status}</Badge>
                <Badge className={PRIORITY_COLORS[selectedCRData.priority ?? "Medium"]}>{selectedCRData.priority}</Badge>
              </div>
              <h2 className="text-xl font-semibold">{selectedCRData.title}</h2>
              {selectedCRData.description && <p className="text-muted-foreground">{selectedCRData.description}</p>}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Requested By:</span> {selectedCRData.requestedBy ?? "—"}</div>
                <div><span className="font-medium">Assigned To:</span> {selectedCRData.assignedTo ?? "—"}</div>
                <div><span className="font-medium">Estimated Effort:</span> {selectedCRData.estimatedEffort ?? "—"}</div>
                <div><span className="font-medium">Actual Effort:</span> {selectedCRData.actualEffort ?? "—"}</div>
                {selectedCRData.requirementId && <div><span className="font-medium">Requirement:</span> {selectedCRData.requirementId}</div>}
                {selectedCRData.taskId && <div><span className="font-medium">Task:</span> {selectedCRData.taskId}</div>}
                {selectedCRData.issueId && <div><span className="font-medium">Issue:</span> {selectedCRData.issueId}</div>}
              </div>
              {selectedCRData.impactAssessment && (
                <div><span className="font-medium text-sm">Impact Assessment:</span><p className="text-sm text-muted-foreground mt-1">{selectedCRData.impactAssessment}</p></div>
              )}
              {selectedCRData.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded p-3"><span className="font-medium text-red-700 text-sm">Rejection Reason:</span><p className="text-sm text-red-600 mt-1">{selectedCRData.rejectionReason}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Change Request</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Requested By</Label><StakeholderSelect stakeholders={stakeholders as any[]} value={form.requestedBy} onValueChange={(v) => setForm({ ...form, requestedBy: v })} projectId={projectId} /></div>
            <div className="space-y-1"><Label>Assigned To</Label><StakeholderSelect stakeholders={stakeholders as any[]} value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })} projectId={projectId} /></div>
            <div className="space-y-1"><Label>Priority</Label>
              <RegistrySelect projectId={projectId} domain="change_requests" fieldKey="priority"
                value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}
                placeholder="Select priority" />
            </div>
            <div className="space-y-1"><Label>Estimated Effort</Label><Input value={form.estimatedEffort} onChange={(e) => setForm({ ...form, estimatedEffort: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Impact Assessment</Label><Textarea value={form.impactAssessment} onChange={(e) => setForm({ ...form, impactAssessment: e.target.value })} rows={2} /></div>
            <div className="space-y-1"><Label>Linked Requirement</Label>
              <Select value={form.requirementId || "__none__"} onValueChange={(v) => setForm({ ...form, requirementId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select requirement..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(requirements as any[]).map((r: any) => <SelectItem key={r.id} value={r.idCode ?? ''}>{r.idCode}{r.description ? ` — ${r.description}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Task</Label>
              <Select value={form.taskId || "__none__"} onValueChange={(v) => setForm({ ...form, taskId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select task..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(tasks as any[]).map((t: any) => <SelectItem key={t.id} value={t.taskId}>{t.taskId}{t.title ? ` — ${t.title}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Issue</Label>
              <Select value={form.issueId || "__none__"} onValueChange={(v) => setForm({ ...form, issueId: v === "__none__" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select issue..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(issues as any[]).map((i: any) => <SelectItem key={i.id} value={i.issueId}>{i.issueId}{i.description ? ` — ${i.description}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => selectedCR && updateMutation.mutate({ id: selectedCR, ...form })} disabled={!form.title || updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChange} onOpenChange={setShowStatusChange}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update CR Status</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1"><Label>New Status</Label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as CRStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {(newStatus === "Approved" || newStatus === "Under Review") && (
              <div className="space-y-1"><Label>{newStatus === "Approved" ? "Approved By" : "Reviewed By"}</Label><Input value={statusNote} onChange={(e) => setStatusNote(e.target.value)} /></div>
            )}
            {newStatus === "Rejected" && (
              <div className="space-y-1"><Label>Rejection Reason</Label><Textarea value={statusNote} onChange={(e) => setStatusNote(e.target.value)} rows={3} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChange(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => {
              if (!selectedCR) return;
              statusMutation.mutate({
                id: selectedCR,
                status: newStatus,
                reviewedBy: newStatus === "Under Review" ? statusNote : undefined,
                approvedBy: newStatus === "Approved" ? statusNote : undefined,
                rejectionReason: newStatus === "Rejected" ? statusNote : undefined,
              });
            }} disabled={statusMutation.isPending}>
              {statusMutation.isPending ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Floating Add Button */}
      <button
        onClick={() => { setForm(emptyForm); setShowCreate(true); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110"
        title="Add Change Request"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
