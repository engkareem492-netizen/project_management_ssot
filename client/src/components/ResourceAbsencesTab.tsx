import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Check, X, CalendarOff, Clock } from "lucide-react";
import { toast } from "sonner";

const ABSENCE_TYPES = ["Vacation", "Sick Leave", "Training", "Personal", "Part-Time", "Other"] as const;
const STATUS_COLORS: Record<string, string> = {
  Approved: "bg-green-100 text-green-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Rejected: "bg-red-100 text-red-700",
};
const TYPE_COLORS: Record<string, string> = {
  Vacation: "bg-blue-100 text-blue-700",
  "Sick Leave": "bg-red-100 text-red-700",
  Training: "bg-purple-100 text-purple-700",
  Personal: "bg-orange-100 text-orange-700",
  "Part-Time": "bg-indigo-100 text-indigo-700",
  Other: "bg-gray-100 text-gray-700",
};

interface Props {
  projectId: number;
  stakeholders: Array<{ id: number; fullName: string; classification?: string }>;
}

const EMPTY_FORM = {
  stakeholderId: "",
  startDate: "",
  endDate: "",
  absenceType: "Vacation" as typeof ABSENCE_TYPES[number],
  status: "Pending" as "Approved" | "Pending" | "Rejected",
  isPartial: false,
  hoursPerDay: "",
  notes: "",
};

export default function ResourceAbsencesTab({ projectId, stakeholders }: Props) {
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStakeholder, setFilterStakeholder] = useState<string>("all");

  const { data: absences = [], isLoading } = trpc.stakeholderSub.absences.list.useQuery({ projectId });

  const invalidate = () => utils.stakeholderSub.absences.list.invalidate({ projectId });

  const createMutation = trpc.stakeholderSub.absences.create.useMutation({
    onSuccess: () => { toast.success("Absence recorded"); invalidate(); setShowCreate(false); setForm({ ...EMPTY_FORM }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.stakeholderSub.absences.update.useMutation({
    onSuccess: () => { toast.success("Updated"); invalidate(); setEditId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.stakeholderSub.absences.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const approveMutation = trpc.stakeholderSub.absences.approve.useMutation({
    onSuccess: () => { toast.success("Approved"); invalidate(); },
  });
  const rejectMutation = trpc.stakeholderSub.absences.reject.useMutation({
    onSuccess: () => { toast.success("Rejected"); invalidate(); },
  });

  const filtered = absences.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterStakeholder !== "all" && String(a.stakeholderId) !== filterStakeholder) return false;
    return true;
  });

  function handleSubmit() {
    if (!form.stakeholderId || !form.startDate || !form.endDate) {
      toast.error("Resource, start date and end date are required");
      return;
    }
    const payload = {
      projectId,
      stakeholderId: Number(form.stakeholderId),
      startDate: form.startDate,
      endDate: form.endDate,
      absenceType: form.absenceType,
      status: form.status,
      isPartial: form.isPartial,
      hoursPerDay: form.isPartial && form.hoursPerDay ? Number(form.hoursPerDay) : null,
      notes: form.notes || undefined,
    };
    if (editId !== null) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function openEdit(a: typeof absences[number]) {
    setEditId(a.id);
    setForm({
      stakeholderId: String(a.stakeholderId),
      startDate: a.startDate,
      endDate: a.endDate,
      absenceType: a.absenceType as typeof ABSENCE_TYPES[number],
      status: a.status as "Approved" | "Pending" | "Rejected",
      isPartial: a.isPartial,
      hoursPerDay: a.hoursPerDay != null ? String(a.hoursPerDay) : "",
      notes: a.notes ?? "",
    });
    setShowCreate(true);
  }

  // Summary stats
  const pending = absences.filter(a => a.status === "Pending").length;
  const approved = absences.filter(a => a.status === "Approved").length;

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4 flex items-center gap-3">
            <CalendarOff className="h-5 w-5 text-yellow-600" />
            <div>
              <div className="text-2xl font-bold text-yellow-700">{pending}</div>
              <div className="text-xs text-yellow-600">Pending Approval</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-2xl font-bold text-green-700">{approved}</div>
              <div className="text-xs text-green-600">Approved</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold text-indigo-700">{absences.length}</div>
              <div className="text-xs text-indigo-600">Total Records</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStakeholder} onValueChange={setFilterStakeholder}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All Resources" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {stakeholders.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto h-8 gap-1" onClick={() => { setEditId(null); setForm({ ...EMPTY_FORM }); setShowCreate(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Absence
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Partial</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No absence records found</TableCell></TableRow>
              ) : filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium text-sm">{a.stakeholderName ?? `#${a.stakeholderId}`}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${TYPE_COLORS[a.absenceType] ?? "bg-gray-100 text-gray-700"}`}>{a.absenceType}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{a.startDate}</TableCell>
                  <TableCell className="text-sm">{a.endDate}</TableCell>
                  <TableCell className="text-sm">
                    {a.isPartial ? <span className="text-indigo-600 font-medium">{a.hoursPerDay}h/day</span> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_COLORS[a.status] ?? ""}`}>{a.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{a.notes || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {a.status === "Pending" && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600 hover:text-green-700" title="Approve" onClick={() => approveMutation.mutate({ id: a.id })}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" title="Reject" onClick={() => rejectMutation.mutate({ id: a.id })}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(a)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Delete this absence record?")) deleteMutation.mutate({ id: a.id }); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setEditId(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editId !== null ? "Edit Absence" : "Record Absence"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Resource *</Label>
              <Select value={form.stakeholderId} onValueChange={(v) => setForm({ ...form, stakeholderId: v })}>
                <SelectTrigger><SelectValue placeholder="Select resource..." /></SelectTrigger>
                <SelectContent>
                  {stakeholders.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>End Date *</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.absenceType} onValueChange={(v) => setForm({ ...form, absenceType: v as typeof ABSENCE_TYPES[number] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ABSENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "Approved" | "Pending" | "Rejected" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="partial" checked={form.isPartial} onCheckedChange={(c) => setForm({ ...form, isPartial: !!c })} />
              <Label htmlFor="partial" className="cursor-pointer">Partial day (reduced hours)</Label>
              {form.isPartial && (
                <Input type="number" min={0.5} max={12} step={0.5} className="h-7 w-20 ml-2 text-xs" placeholder="hrs/day" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} />
              )}
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditId(null); }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
              {editId !== null ? "Save Changes" : "Record Absence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
