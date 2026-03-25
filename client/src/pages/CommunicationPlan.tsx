<<<<<<< HEAD
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
=======
import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
>>>>>>> github/MANUS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
<<<<<<< HEAD
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Plus, Pencil, Trash2, Download, Filter } from "lucide-react";

const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed", "One-time", "Event-driven"];
const CHANNELS = ["Email", "Meeting", "Video Call", "Phone", "Report", "Dashboard", "Instant Message", "Newsletter", "Workshop", "Presentation"];
const PURPOSES = ["Inform", "Consult", "Approve", "Collaborate", "Escalate", "Report", "Coordinate"];

const FREQ_BADGE: Record<string, string> = {
  Daily: "bg-red-100 text-red-700",
  Weekly: "bg-orange-100 text-orange-700",
  "Bi-weekly": "bg-yellow-100 text-yellow-700",
  Monthly: "bg-blue-100 text-blue-700",
  Quarterly: "bg-purple-100 text-purple-700",
  "As needed": "bg-gray-100 text-gray-700",
  "One-time": "bg-teal-100 text-teal-700",
  "Event-driven": "bg-pink-100 text-pink-700",
};

const EMPTY_FORM = {
  stakeholderId: "",
  purpose: "",
  message: "",
  channel: "",
  frequency: "",
  responsible: "",
  responsibleId: "",
  timing: "",
  format: "",
  notes: "",
};

export default function CommunicationPlan() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterFreq, setFilterFreq] = useState("all");

  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Communication plan entries are stored in the stakeholders table's communication fields.
  // We use the stakeholders list as the source of truth and allow editing per-stakeholder.
  // For a richer communication plan, we show all stakeholders with communication data
  // and allow adding/editing communication entries.

  const updateMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      setIsAddOpen(false);
      setEditingId(null);
      toast.success("Communication plan updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const stakeholdersWithComm = stakeholders.filter(
    (s) => s.communicationFrequency || s.communicationChannel || s.communicationMessage
  );

  const filteredEntries = stakeholdersWithComm.filter((s) => {
    if (filterChannel !== "all" && s.communicationChannel !== filterChannel) return false;
    if (filterFreq !== "all" && s.communicationFrequency !== filterFreq) return false;
    return true;
  });

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      stakeholderId: s.id.toString(),
      purpose: s.communicationPurpose || "",
      message: s.communicationMessage || "",
      channel: s.communicationChannel || "",
      frequency: s.communicationFrequency || "",
      responsible: s.communicationResponsible || "",
      responsibleId: s.communicationResponsibleId?.toString() || "",
      timing: s.communicationTiming || "",
      format: s.communicationFormat || "",
      notes: s.communicationNotes || "",
    });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setIsAddOpen(true);
  };

  const handleSave = () => {
    const targetId = editingId || parseInt(form.stakeholderId);
    if (!targetId) { toast.error("Please select a stakeholder"); return; }
    updateMutation.mutate({
      id: targetId,
      data: {
        communicationFrequency: form.frequency || undefined,
        communicationChannel: form.channel || undefined,
        communicationMessage: form.message || undefined,
        communicationResponsible: form.responsible || undefined,
        communicationResponsibleId: form.responsibleId ? parseInt(form.responsibleId) : undefined,
      },
    });
  };

  const renderForm = () => (
    <div className="space-y-3">
      {!editingId && (
        <div className="space-y-2">
          <Label>Stakeholder *</Label>
          <Select value={form.stakeholderId} onValueChange={(v) => setForm({ ...form, stakeholderId: v })}>
            <SelectTrigger><SelectValue placeholder="Select stakeholder..." /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}{s.position ? ` — ${s.position}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Communication Channel</Label>
          <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
            <SelectTrigger><SelectValue placeholder="Channel..." /></SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
            <SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Key Message / Purpose</Label>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={2}
          placeholder="What is the key message or purpose of this communication?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Responsible Person</Label>
          <Select value={form.responsibleId} onValueChange={(v) => {
            const s = stakeholders.find((x) => x.id.toString() === v);
            setForm({ ...form, responsibleId: v, responsible: s?.fullName || "" });
          }}>
            <SelectTrigger><SelectValue placeholder="Who sends it?" /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="e.g. PDF Report, Slide Deck, Email" />
        </div>
      </div>
    </div>
  );

  // Summary stats
  const byChannel = CHANNELS.reduce((acc, c) => {
    acc[c] = stakeholdersWithComm.filter((s) => s.communicationChannel === c).length;
    return acc;
  }, {} as Record<string, number>);
  const topChannels = Object.entries(byChannel).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Communication Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define how, when, and what to communicate with each stakeholder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stakeholdersWithComm.length} entries</Badge>
          <Button onClick={openAdd} className="gap-2" size="sm">
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {topChannels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topChannels.map(([channel, count]) => (
            <Card key={channel} className="border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{channel}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFreq} onValueChange={setFilterFreq}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Frequency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterChannel !== "all" || filterFreq !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterChannel("all"); setFilterFreq("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Communication Plan Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Communication Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Key Message</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.fullName}</div>
                      {s.position && <div className="text-xs text-muted-foreground">{s.position}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        s.classification === "team_member" || s.isInternalTeam
                          ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                          : s.classification === "external"
                          ? "bg-purple-100 text-purple-700 border-purple-200 text-xs"
                          : "bg-orange-100 text-orange-700 border-orange-200 text-xs"
                      }>
                        {s.classification === "team_member" || s.isInternalTeam ? "Team Member"
                          : s.classification === "external" ? "External" : "Stakeholder"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.communicationChannel ? (
                        <Badge variant="outline" className="text-xs">{s.communicationChannel}</Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {s.communicationFrequency ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${FREQ_BADGE[s.communicationFrequency] || "bg-gray-100 text-gray-700"}`}>
                          {s.communicationFrequency}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={s.communicationMessage || ""}>
                        {s.communicationMessage || <span className="text-muted-foreground text-xs">—</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.communicationResponsible || <span className="text-muted-foreground text-xs">—</span>}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No communication entries yet</p>
                      <p className="text-sm mt-1">Add communication details to stakeholders or click "Add Entry" above.</p>
                    </TableCell>
                  </TableRow>
                )}
=======
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Radio,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Users,
  MessageSquare,
  Loader2,
  Briefcase,
  UserCheck,
  Building2,
  Info,
  RefreshCw,
  ClipboardList,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREQUENCY_OPTIONS = [
  "Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed", "Ad hoc",
];

const METHOD_COLORS: Record<string, string> = {
  Email: "bg-blue-100 text-blue-800",
  Meeting: "bg-purple-100 text-purple-800",
  Phone: "bg-green-100 text-green-800",
  Slack: "bg-yellow-100 text-yellow-800",
  Teams: "bg-indigo-100 text-indigo-800",
  Report: "bg-orange-100 text-orange-800",
  Newsletter: "bg-pink-100 text-pink-800",
  "Video Call": "bg-teal-100 text-teal-800",
};

type TargetType = "stakeholder" | "role" | "job";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommNeedItem = {
  id?: number;
  localId: string;
  description: string;
  commType: "Push" | "Pull" | "Interactive" | "Other";
  periodic: string;
};

type InputNeededItem = {
  id?: number;
  localId: string;
  description: string;
};

type EntryFormData = {
  targetType: TargetType;
  targetValue: string;
  informationNeeded: string;
  acknowledgmentNeeded: boolean;
  preferredMethods: string[];
  frequency: string;
  textNote: string;
  escalationProcedures: string;
  responsibleStakeholderId: number | null;
  commNeeded: CommNeedItem[];
  inputNeeded: InputNeededItem[];
};

const EMPTY_FORM: EntryFormData = {
  targetType: "stakeholder",
  targetValue: "",
  informationNeeded: "",
  acknowledgmentNeeded: false,
  preferredMethods: [],
  frequency: "",
  textNote: "",
  escalationProcedures: "",
  responsibleStakeholderId: null,
  commNeeded: [],
  inputNeeded: [],
};

function makeLocalId() {
  return Math.random().toString(36).slice(2);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxLen = 60): string {
  if (!text) return "";
  return text.length > maxLen ? text.substring(0, maxLen) + "…" : text;
}

function exportToCsv(entries: any[], stakeholders: any[]) {
  const stakeholderMap: Record<number, string> = {};
  stakeholders.forEach((s: any) => { stakeholderMap[s.id] = s.fullName; });
  const headers = ["Target Type", "Target", "Information Needed", "Preferred Methods", "Notes", "Escalation Procedures", "Responsible"];
  const rows = entries.map((e: any) => {
    const targetLabel = e.targetType === "stakeholder"
      ? (e.stakeholderId ? (stakeholderMap[e.stakeholderId] ?? e.targetValue ?? "") : (e.targetValue ?? ""))
      : (e.targetValue ?? e.role ?? "");
    const responsibleName = e.responsibleStakeholderId
      ? (stakeholderMap[e.responsibleStakeholderId] ?? e.responsible ?? "")
      : (e.responsible ?? "");
    const methods = Array.isArray(e.preferredMethods) ? e.preferredMethods.join("; ") : "";
    return [e.targetType, targetLabel, e.informationNeeded ?? "", methods, e.textNote ?? "", e.escalationProcedures ?? "", responsibleName]
      .map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
  });
  const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = "communication_plan.csv"; link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MethodsBadges({ methods }: { methods: string[] }) {
  if (!methods || methods.length === 0)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((m) => (
        <span key={m} className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${METHOD_COLORS[m] ?? "bg-gray-100 text-gray-700"}`}>
          {m}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared table for role/position tabs
// ---------------------------------------------------------------------------

function CommPlanTable({
  entries,
  allCommItems,
  stakeholderMap,
  onEdit,
  onDelete,
  deleteIsPending,
}: {
  entries: any[];
  allCommItems: any[];
  stakeholderMap: Record<number, any>;
  onEdit: (entry: any) => void;
  onDelete: (id: number) => void;
  deleteIsPending: boolean;
}) {
  if (entries.length === 0) return null;

  const rows: React.ReactNode[] = [];
  entries.forEach((entry: any) => {
    const responsibleName = entry.responsibleStakeholderId
      ? (stakeholderMap[entry.responsibleStakeholderId]?.fullName ?? entry.responsible ?? "—")
      : (entry.responsible ?? "—");
    const entryItems = allCommItems.filter((i: any) => i.entryId === entry.id);
    const label = entry.targetValue ?? entry.role ?? "—";

    if (entryItems.length === 0) {
      rows.push(
        <TableRow key={entry.id}>
          <TableCell className="align-top border-r font-medium text-sm">{label}</TableCell>
          <TableCell className="align-top border-r text-sm whitespace-pre-wrap break-words max-w-[200px]">{entry.informationNeeded || "—"}</TableCell>
          <TableCell className="text-xs text-muted-foreground italic" colSpan={3}>No communication lines added</TableCell>
          <TableCell className="align-top"><MethodsBadges methods={Array.isArray(entry.preferredMethods) ? entry.preferredMethods : []} /></TableCell>
          <TableCell className="align-top text-sm">{responsibleName}</TableCell>
          <TableCell className="text-right align-top">
            <div className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(entry.id)} disabled={deleteIsPending}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          </TableCell>
        </TableRow>
      );
      return;
    }

    entryItems.forEach((item: any, idx: number) => {
      rows.push(
        <TableRow key={`${entry.id}-${item.id ?? idx}`} className={idx < entryItems.length - 1 ? "border-b-0" : "border-b"}>
          {idx === 0 && <TableCell rowSpan={entryItems.length} className="align-top border-r bg-muted/20 font-medium text-sm">{label}</TableCell>}
          {idx === 0 && <TableCell rowSpan={entryItems.length} className="align-top border-r bg-muted/20 text-sm whitespace-pre-wrap break-words max-w-[200px]">{entry.informationNeeded || "—"}</TableCell>}
          <TableCell className="align-middle py-2 text-sm font-medium">{item.description || "—"}</TableCell>
          <TableCell className="align-middle py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{item.commType || "—"}</span></TableCell>
          <TableCell className="align-middle py-2 text-sm text-muted-foreground">{item.periodic || "—"}</TableCell>
          {idx === 0 && <TableCell rowSpan={entryItems.length} className="align-top bg-muted/20"><MethodsBadges methods={Array.isArray(entry.preferredMethods) ? entry.preferredMethods : []} /></TableCell>}
          {idx === 0 && <TableCell rowSpan={entryItems.length} className="align-top bg-muted/20 text-sm">{responsibleName}</TableCell>}
          {idx === 0 && (
            <TableCell rowSpan={entryItems.length} className="text-right align-top bg-muted/20">
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(entry)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(entry.id)} disabled={deleteIsPending}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </TableCell>
          )}
        </TableRow>
      );
    });
  });

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Target</TableHead>
            <TableHead className="w-52">Information Needed</TableHead>
            <TableHead>Communication Needed</TableHead>
            <TableHead className="w-28">Type</TableHead>
            <TableHead className="w-28">Frequency</TableHead>
            <TableHead className="w-48">Preferred Methods</TableHead>
            <TableHead className="w-36">Responsible</TableHead>
            <TableHead className="w-20 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{rows}</TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stakeholder card — shows direct entry + merged role + merged position entries
// ---------------------------------------------------------------------------

function StakeholderCard({
  stakeholder,
  directEntry,
  roleEntry,
  positionEntry,
  allCommItems,
  onEdit,
  onDelete,
  onAdd,
  deleteIsPending,
}: {
  stakeholder: any;
  directEntry: any | null;
  roleEntry: any | null;
  positionEntry: any | null;
  allCommItems: any[];
  onEdit: (entry: any) => void;
  onDelete: (id: number) => void;
  onAdd: (stakeholder: any) => void;
  deleteIsPending: boolean;
}) {
  const hasAny = directEntry || roleEntry || positionEntry;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="py-3 px-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{stakeholder.fullName}</CardTitle>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {stakeholder.role && <Badge variant="secondary" className="text-xs">{stakeholder.role}</Badge>}
              {stakeholder.job && <Badge variant="outline" className="text-xs">{stakeholder.job}</Badge>}
            </div>
          </div>
          {!directEntry ? (
            <Button size="sm" variant="outline" className="shrink-0 h-8 text-xs" onClick={() => onAdd(stakeholder)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Card
            </Button>
          ) : (
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(directEntry)} title="Edit direct entry">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => onDelete(directEntry.id)} disabled={deleteIsPending} title="Delete direct entry">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      {!hasAny ? (
        <CardContent className="py-4 text-center text-xs text-muted-foreground">
          No communication plan entry yet.
        </CardContent>
      ) : (
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-32 text-xs">Source</TableHead>
                  <TableHead className="text-xs">Information Needed</TableHead>
                  <TableHead className="text-xs">Communication Needed</TableHead>
                  <TableHead className="w-24 text-xs">Type</TableHead>
                  <TableHead className="w-24 text-xs">Frequency</TableHead>
                  <TableHead className="w-44 text-xs">Preferred Methods</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { entry: directEntry, sourceLabel: "Direct", sourceBadge: "bg-primary/10 text-primary" },
                  { entry: roleEntry, sourceLabel: `Role: ${roleEntry?.targetValue ?? ""}`, sourceBadge: "bg-purple-100 text-purple-700" },
                  { entry: positionEntry, sourceLabel: `Position: ${positionEntry?.targetValue ?? ""}`, sourceBadge: "bg-orange-100 text-orange-700" },
                ].filter(({ entry }) => !!entry).flatMap(({ entry, sourceLabel, sourceBadge }) => {
                  const items = allCommItems.filter((i: any) => i.entryId === entry.id);
                  if (items.length === 0) {
                    return [(
                      <TableRow key={`${entry.id}-empty`}>
                        <TableCell className="align-top border-r">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceBadge}`}>{sourceLabel}</span>
                        </TableCell>
                        <TableCell className="text-sm align-top border-r whitespace-pre-wrap break-words max-w-[200px]">{entry.informationNeeded || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground italic" colSpan={4}>No communication lines</TableCell>
                      </TableRow>
                    )];
                  }
                  return items.map((item: any, idx: number) => (
                    <TableRow key={`${entry.id}-${item.id ?? idx}`} className={idx < items.length - 1 ? "border-b-0" : "border-b"}>
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="align-top border-r bg-muted/10">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${sourceBadge}`}>{sourceLabel}</span>
                        </TableCell>
                      )}
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="align-top border-r bg-muted/10 text-sm whitespace-pre-wrap break-words max-w-[200px]">
                          {entry.informationNeeded || "—"}
                        </TableCell>
                      )}
                      <TableCell className="py-2 text-sm font-medium">{item.description || "—"}</TableCell>
                      <TableCell className="py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{item.commType || "—"}</span></TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{item.periodic || "—"}</TableCell>
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="align-top bg-muted/10">
                          <MethodsBadges methods={Array.isArray(entry.preferredMethods) ? entry.preferredMethods : []} />
                        </TableCell>
                      )}
                    </TableRow>
                  ));
                })}
>>>>>>> github/MANUS
              </TableBody>
            </Table>
          </div>
        </CardContent>
<<<<<<< HEAD
      </Card>

      {/* Stakeholders without communication plan */}
      {stakeholders.length > stakeholdersWithComm.length && (
        <Card className="border-dashed border-orange-300 bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
              ⚠ Stakeholders without communication plan ({stakeholders.length - stakeholdersWithComm.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stakeholders
                .filter((s) => !s.communicationFrequency && !s.communicationChannel && !s.communicationMessage)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s)}
                    className="px-3 py-1 rounded-full border border-orange-200 bg-white text-sm hover:bg-orange-50 transition-colors"
                  >
                    {s.fullName}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { if (!o) { setIsAddOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Communication Entry" : "Add Communication Entry"}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
=======
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function CommunicationPlan() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  // ----- tRPC queries -----
  const { data: stakeholders = [], isLoading: stakeholdersLoading } =
    trpc.stakeholders.list.useQuery({ projectId }, { enabled });

  const { data: entries = [], isLoading: entriesLoading, refetch } =
    trpc.communicationPlan.list.useQuery({ projectId }, { enabled });

  const { data: allCommItems = [], refetch: refetchAllItems } =
    trpc.commPlanOptions.items.listAllByProject.useQuery({ projectId }, { enabled });

  const { data: roleOptions = [], refetch: refetchRoles } =
    trpc.commPlanOptions.roleOptions.list.useQuery({ projectId }, { enabled });
  const { data: jobOptions = [], refetch: refetchJobs } =
    trpc.commPlanOptions.jobOptions.list.useQuery({ projectId }, { enabled });
  const { data: methodOptions = [], refetch: refetchMethods } =
    trpc.commPlanOptions.methodOptions.list.useQuery({ projectId }, { enabled });

  const createRoleOption = trpc.commPlanOptions.roleOptions.create.useMutation({ onSuccess: () => refetchRoles() });
  const deleteRoleOption = trpc.commPlanOptions.roleOptions.delete.useMutation({ onSuccess: () => refetchRoles() });
  const createJobOption = trpc.commPlanOptions.jobOptions.create.useMutation({ onSuccess: () => refetchJobs() });
  const deleteJobOption = trpc.commPlanOptions.jobOptions.delete.useMutation({ onSuccess: () => refetchJobs() });
  const createMethodOption = trpc.commPlanOptions.methodOptions.create.useMutation({ onSuccess: () => refetchMethods() });
  const deleteMethodOption = trpc.commPlanOptions.methodOptions.delete.useMutation({ onSuccess: () => refetchMethods() });
  const bulkReplaceItems = trpc.commPlanOptions.items.bulkReplace.useMutation();
  const bulkReplaceInputItems = trpc.commPlanOptions.inputItems.bulkReplace.useMutation();

  // ----- Inline add option state -----
  const [newRoleInput, setNewRoleInput] = useState("");
  const [newJobInput, setNewJobInput] = useState("");
  const [newMethodInput, setNewMethodInput] = useState("");

  // ----- Mutations -----
  const createMut = trpc.communicationPlan.create.useMutation({
    onSuccess: () => { toast.success("Entry added"); refetch(); refetchAllItems(); setEntryDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.communicationPlan.update.useMutation({
    onSuccess: () => { toast.success("Entry updated"); refetch(); refetchAllItems(); setEntryDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.communicationPlan.delete.useMutation({
    onSuccess: () => { toast.success("Entry deleted"); refetch(); refetchAllItems(); },
    onError: (e) => toast.error(e.message),
  });

  const importMut = trpc.communicationPlan.importFromStakeholders.useMutation({
    onSuccess: () => { toast.success("Stakeholders imported"); refetch(); setImportDialogOpen(false); setSelectedStakeholderIds([]); },
    onError: (e) => toast.error(e.message),
  });
  const syncMut = trpc.communicationPlan.syncFromRoleAndPosition.useMutation({
    onSuccess: (data) => {
      const parts: string[] = [];
      if (data.created > 0) parts.push(`${data.created} card(s) created`);
      if (data.synced > 0) parts.push(`${data.synced} stakeholder(s) updated`);
      if (data.itemsAdded > 0) parts.push(`${data.itemsAdded} item(s) added`);
      toast.success(parts.length > 0 ? `Sync complete: ${parts.join(", ")}` : "Sync complete: nothing to update");
      refetch();
      refetchAllItems();
    },
    onError: (e) => toast.error(e.message),
  });

  // ----- Dialog state -----
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<EntryFormData>({ ...EMPTY_FORM });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<number[]>([]);
  // Active tab
  const [activeTab, setActiveTab] = useState<"stakeholder" | "role" | "position" | "commlog">("stakeholder");

  // ----- Communication Log state -----
  const [commLogDialogOpen, setCommLogDialogOpen] = useState(false);
  const [commLogEditing, setCommLogEditing] = useState<any>(null);
  const [commLogForm, setCommLogForm] = useState({
    logDate: new Date().toISOString().slice(0, 10),
    communicationType: "",
    subject: "",
    sentBy: "",
    recipients: "",
    method: "",
    summary: "",
    linkedCommPlanEntryId: null as number | null,
    attachmentUrl: "",
    notes: "",
  });
  const [commLogFilter, setCommLogFilter] = useState({ method: "", sentBy: "", dateFrom: "", dateTo: "" });
  const [commClassFilter, setCommClassFilter] = useState<"all" | "TeamMember" | "External" | "Stakeholder">("all");
  const [expandedLogRows, setExpandedLogRows] = useState<Set<number>>(new Set());
  const { data: commLogEntries = [], refetch: refetchCommLog } =
    trpc.communicationLog.list.useQuery({ projectId }, { enabled });
  const commLogCreate = trpc.communicationLog.create.useMutation({
    onSuccess: () => { toast.success("Communication logged"); refetchCommLog(); setCommLogDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const commLogUpdate = trpc.communicationLog.update.useMutation({
    onSuccess: () => { toast.success("Log entry updated"); refetchCommLog(); setCommLogDialogOpen(false); },
    onError: (e) => toast.error(e.message),
  });
  const commLogDelete = trpc.communicationLog.delete.useMutation({
    onSuccess: () => { toast.success("Log entry deleted"); refetchCommLog(); },
    onError: (e) => toast.error(e.message),
  });

  // ----- Helpers for the form -----
  const setField = <K extends keyof EntryFormData>(field: K, value: EntryFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMethod = (method: string) => {
    setForm((prev) => ({
      ...prev,
      preferredMethods: prev.preferredMethods.includes(method)
        ? prev.preferredMethods.filter((m) => m !== method)
        : [...prev.preferredMethods, method],
    }));
  };

  // ----- Derived data -----
  const stakeholderMap = useMemo(() => {
    const m: Record<number, any> = {};
    (stakeholders as any[]).forEach((s) => { m[s.id] = s; });
    return m;
  }, [stakeholders]);

  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    (stakeholders as any[]).forEach((s) => { if (s.role) roles.add(s.role); });
    return Array.from(roles).sort();
  }, [stakeholders]);

  const uniqueJobs = useMemo(() => {
    const jobs = new Set<string>();
    (stakeholders as any[]).forEach((s) => { if (s.job) jobs.add(s.job); });
    return Array.from(jobs).sort();
  }, [stakeholders]);

  // Partition entries by type
  const stakeholderEntries = useMemo(() =>
    (entries as any[]).filter(e => e.targetType === "stakeholder" || (!e.targetType && e.stakeholderId)),
    [entries]);
  const roleEntries = useMemo(() =>
    (entries as any[]).filter(e => e.targetType === "role"),
    [entries]);
  const positionEntries = useMemo(() =>
    (entries as any[]).filter(e => e.targetType === "job"),
    [entries]);

  // Map: stakeholderId -> entry (for uniqueness check)
  const stakeholderEntryMap = useMemo(() => {
    const m: Record<number, any> = {};
    stakeholderEntries.forEach((e: any) => {
      const sid = e.stakeholderId ?? (e.targetValue ? Number(e.targetValue) : null);
      if (sid) m[sid] = e;
    });
    return m;
  }, [stakeholderEntries]);

  // Map: role -> entry
  const roleEntryMap = useMemo(() => {
    const m: Record<string, any> = {};
    roleEntries.forEach((e: any) => { if (e.targetValue) m[e.targetValue] = e; });
    return m;
  }, [roleEntries]);

  // Map: job/position -> entry
  const positionEntryMap = useMemo(() => {
    const m: Record<string, any> = {};
    positionEntries.forEach((e: any) => { if (e.targetValue) m[e.targetValue] = e; });
    return m;
  }, [positionEntries]);

  // ----- Open new / edit dialogs -----
  const openNew = (defaultType?: TargetType, prefillValue?: string) => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      targetType: defaultType ?? (activeTab === "role" ? "role" : activeTab === "position" ? "job" : "stakeholder"),
      targetValue: prefillValue ?? "",
    });
    setEntryDialogOpen(true);
  };

  // Open new dialog pre-filled for a specific stakeholder
  const openNewForStakeholder = (stakeholder: any) => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, targetType: "stakeholder", targetValue: String(stakeholder.id) });
    setEntryDialogOpen(true);
  };

  const openEdit = (entry: any) => {
    setEditing(entry);
    let targetType: TargetType = "stakeholder";
    let targetValue = "";
    if (entry.targetType === "role") { targetType = "role"; targetValue = entry.targetValue ?? entry.role ?? ""; }
    else if (entry.targetType === "job") { targetType = "job"; targetValue = entry.targetValue ?? ""; }
    else { targetType = "stakeholder"; targetValue = entry.stakeholderId ? String(entry.stakeholderId) : (entry.targetValue ?? ""); }
    setForm({
      targetType, targetValue,
      informationNeeded: entry.informationNeeded ?? "",
      acknowledgmentNeeded: entry.acknowledgmentNeeded ?? false,
      preferredMethods: Array.isArray(entry.preferredMethods) ? entry.preferredMethods : [],
      frequency: entry.frequency ?? "",
      textNote: entry.textNote ?? "",
      escalationProcedures: entry.escalationProcedures ?? "",
      responsibleStakeholderId: entry.responsibleStakeholderId ?? null,
      commNeeded: [],
      inputNeeded: [],
    });
    setEntryDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.targetValue) { toast.error("Please select a target"); return; }
    if (!form.informationNeeded.trim()) { toast.error("Please fill in Information Needed"); return; }

    // Uniqueness check (only for new entries)
    if (!editing) {
      if (form.targetType === "stakeholder") {
        const sid = Number(form.targetValue);
        if (stakeholderEntryMap[sid]) {
          toast.error("A card for this stakeholder already exists. Please edit the existing card to add more lines.");
          return;
        }
      } else if (form.targetType === "role") {
        if (roleEntryMap[form.targetValue]) {
          toast.error("A card for this role already exists. Please edit the existing card to add more lines.");
          return;
        }
      } else if (form.targetType === "job") {
        if (positionEntryMap[form.targetValue]) {
          toast.error("A card for this position already exists. Please edit the existing card to add more lines.");
          return;
        }
      }
    }

    const payload: any = {
      targetType: form.targetType,
      targetValue: form.targetValue,
      stakeholderId: form.targetType === "stakeholder" ? Number(form.targetValue) : undefined,
      role: form.targetType === "role" ? form.targetValue : undefined,
      informationNeeded: form.informationNeeded,
      acknowledgmentNeeded: form.acknowledgmentNeeded,
      preferredMethods: form.preferredMethods,
      frequency: form.frequency || undefined,
      textNote: form.textNote || undefined,
      escalationProcedures: form.escalationProcedures || undefined,
      responsibleStakeholderId: form.responsibleStakeholderId ?? undefined,
      responsible: form.responsibleStakeholderId
        ? (stakeholderMap[form.responsibleStakeholderId]?.fullName ?? undefined)
        : undefined,
    };

    const validItems = form.commNeeded.filter(i => i.description.trim());
    const validInputItems = form.inputNeeded.filter(i => i.description.trim());

    if (editing) {
      updateMut.mutate({ id: editing.id, data: payload }, {
        onSuccess: async () => {
          if (validItems.length > 0) {
            await bulkReplaceItems.mutateAsync({ entryId: editing.id, projectId, items: validItems.map((item, idx) => ({ description: item.description, commType: item.commType, periodic: item.periodic || undefined, sequence: idx })) });
          }
          await bulkReplaceInputItems.mutateAsync({ entryId: editing.id, projectId, items: validInputItems.map((item, idx) => ({ description: item.description, sequence: idx })) });
        }
      });
    } else {
      createMut.mutate({ projectId, ...payload }, {
        onSuccess: async (entry: any) => {
          if (validItems.length > 0 && entry?.id) {
            await bulkReplaceItems.mutateAsync({ entryId: entry.id, projectId, items: validItems.map((item, idx) => ({ description: item.description, commType: item.commType, periodic: item.periodic || undefined, sequence: idx })) });
          }
          if (entry?.id) {
            await bulkReplaceInputItems.mutateAsync({ entryId: entry.id, projectId, items: validInputItems.map((item, idx) => ({ description: item.description, sequence: idx })) });
          }
        }
      });
    }
  };

  // ----- Load commNeeded items when editing -----
  const { data: editingItems = [] } = trpc.commPlanOptions.items.listByEntry.useQuery(
    { entryId: editing?.id ?? 0 },
    { enabled: !!editing?.id && entryDialogOpen }
  );
  const { data: editingInputItems = [] } = trpc.commPlanOptions.inputItems.listByEntry.useQuery(
    { entryId: editing?.id ?? 0 },
    { enabled: !!editing?.id && entryDialogOpen }
  );

  useEffect(() => {
    if (editing && entryDialogOpen && Array.isArray(editingItems) && editingItems.length > 0) {
      setForm(prev => ({
        ...prev,
        commNeeded: (editingItems as any[]).map((item: any) => ({ id: item.id, localId: makeLocalId(), description: item.description ?? "", commType: item.commType ?? "Push", periodic: item.periodic ?? "" })),
      }));
    }
  }, [editingItems, editing?.id]);

  useEffect(() => {
    if (editing && entryDialogOpen && Array.isArray(editingInputItems) && editingInputItems.length > 0) {
      setForm(prev => ({
        ...prev,
        inputNeeded: (editingInputItems as any[]).map((item: any) => ({ id: item.id, localId: makeLocalId(), description: item.description ?? "" })),
      }));
    }
  }, [editingInputItems, editing?.id]);

  // ----- CommNeeded list helpers -----
  const addCommNeedRow = () => setForm(prev => ({ ...prev, commNeeded: [...prev.commNeeded, { localId: makeLocalId(), description: "", commType: "Push", periodic: "" }] }));
  const updateCommNeedRow = (localId: string, field: keyof CommNeedItem, value: string) => setForm(prev => ({ ...prev, commNeeded: prev.commNeeded.map(item => item.localId === localId ? { ...item, [field]: value } : item) }));
  const removeCommNeedRow = (localId: string) => setForm(prev => ({ ...prev, commNeeded: prev.commNeeded.filter(item => item.localId !== localId) }));

  // ----- InputNeeded list helpers -----
  const addInputNeedRow = () => setForm(prev => ({ ...prev, inputNeeded: [...prev.inputNeeded, { localId: makeLocalId(), description: "" }] }));
  const updateInputNeedRow = (localId: string, value: string) => setForm(prev => ({ ...prev, inputNeeded: prev.inputNeeded.map(item => item.localId === localId ? { ...item, description: value } : item) }));
  const removeInputNeedRow = (localId: string) => setForm(prev => ({ ...prev, inputNeeded: prev.inputNeeded.filter(item => item.localId !== localId) }));

  // ----- Import dialog helpers -----
  const toggleImportStakeholder = (id: number) => setSelectedStakeholderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleImport = () => {
    if (selectedStakeholderIds.length === 0) { toast.error("Select at least one stakeholder"); return; }
    importMut.mutate({ projectId, stakeholderIds: selectedStakeholderIds });
  };

  // ----- Guard -----
  if (!currentProjectId) {
    return <div className="p-6 text-muted-foreground">Select a project to view the Communication Plan.</div>;
  }

  const isLoading = entriesLoading || stakeholdersLoading;
  const isSaving = createMut.isPending || updateMut.isPending;

  // Dialog title based on context
  const dialogTitle = editing
    ? "Edit Communication Plan Entry"
    : form.targetType === "stakeholder" ? "Add Stakeholder Card"
    : form.targetType === "role" ? "Add Role Card"
    : "Add Position Card";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6" />
            Communication Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define how information flows between stakeholders, roles, and positions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={() => { setSelectedStakeholderIds([]); setImportDialogOpen(true); }}>
            <Upload className="w-4 h-4 mr-2" /> Import from Stakeholders
          </Button>
          <Button
            variant="outline"
            onClick={() => syncMut.mutate({ projectId })}
            disabled={syncMut.isPending}
            title="Merge By Role and By Position plans into each stakeholder's plan"
          >
            {syncMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Sync Role/Position
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(entries as any[], stakeholders as any[])} title="Export to CSV">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="stakeholder" className="flex items-center gap-1.5">
            <UserCheck className="w-4 h-4" /> Stakeholders
          </TabsTrigger>
          <TabsTrigger value="role" className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" /> By Role
          </TabsTrigger>
          <TabsTrigger value="position" className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> By Position
          </TabsTrigger>
          <TabsTrigger value="commlog" className="flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" /> Comm Log
          </TabsTrigger>
        </TabsList>

        {/* ─── Stakeholder Tab ─── */}
        <TabsContent value="stakeholder" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing only stakeholders with a communication plan entry. Use <strong>Import from Stakeholders</strong> to add more.
            </p>
            <div className="flex gap-1 border rounded-lg p-1">
              {([
                { key: "all", label: "All Types" },
                { key: "TeamMember", label: "Team Members" },
                { key: "External", label: "External" },
                { key: "Stakeholder", label: "Stakeholders" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setCommClassFilter(t.key)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    commClassFilter === t.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (() => {
            // Only stakeholders who have a direct comm plan entry, filtered by type
            const stakeholdersWithPlan = (stakeholders as any[]).filter(
              (s: any) => {
                if (!stakeholderEntryMap[s.id]) return false;
                if (commClassFilter === "all") return true;
                const cls = s.classification ?? (s.isInternalTeam ? "TeamMember" : "Stakeholder");
                return cls === commClassFilter;
              }
            );
            if (stakeholdersWithPlan.length === 0) {
              return (
                <EmptyState
                  icon={Users}
                  title="No stakeholder plans yet"
                  description="Import stakeholders or add a card to get started."
                  actionLabel="Import from Stakeholders"
                  onAction={() => { setSelectedStakeholderIds([]); setImportDialogOpen(true); }}
                />
              );
            }
            // Build flat rows: one row per comm-item per stakeholder entry
            const rows: React.ReactNode[] = [];
            stakeholdersWithPlan.forEach((s: any) => {
              const entry = stakeholderEntryMap[s.id];
              const roleEntry = s.role ? (roleEntryMap[s.role] ?? null) : null;
              const positionEntry = s.job ? (positionEntryMap[s.job] ?? null) : null;
              // Collect all sources for this stakeholder
              const sources = [
                { entry, label: s.fullName, badge: "bg-primary/10 text-primary", isDirect: true },
                roleEntry ? { entry: roleEntry, label: `Role: ${s.role}`, badge: "bg-purple-100 text-purple-700", isDirect: false } : null,
                positionEntry ? { entry: positionEntry, label: `Position: ${s.job}`, badge: "bg-orange-100 text-orange-700", isDirect: false } : null,
              ].filter(Boolean) as { entry: any; label: string; badge: string; isDirect: boolean }[];

              sources.forEach(({ entry: src, label, badge, isDirect }) => {
                const items = (allCommItems as any[]).filter((i: any) => i.entryId === src.id);
                const methods = Array.isArray(src.preferredMethods) ? src.preferredMethods : [];
                const responsibleName = src.responsibleStakeholderId
                  ? (stakeholderMap[src.responsibleStakeholderId]?.fullName ?? src.responsible ?? "—")
                  : (src.responsible ?? "—");

                if (items.length === 0) {
                  rows.push(
                    <TableRow key={`${s.id}-${src.id}-empty`}>
                      <TableCell className="font-medium text-sm align-top">
                        <div className="font-semibold">{s.fullName}</div>
                        <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${badge}`}>{label}</span>
                      </TableCell>
                      <TableCell className="text-sm align-top whitespace-pre-wrap break-words max-w-[200px]">{src.informationNeeded || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground italic align-top" colSpan={3}>No communication lines</TableCell>
                      <TableCell className="align-top"><MethodsBadges methods={methods} /></TableCell>
                      <TableCell className="text-sm align-top">{responsibleName}</TableCell>
                      <TableCell className="text-right align-top">
                        {isDirect && (
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(src)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMut.mutate({ id: src.id })} disabled={deleteMut.isPending} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                  return;
                }

                items.forEach((item: any, idx: number) => {
                  rows.push(
                    <TableRow key={`${s.id}-${src.id}-${item.id ?? idx}`} className={idx < items.length - 1 ? "border-b-0" : ""}>
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="font-medium text-sm align-top bg-muted/10">
                          <div className="font-semibold">{s.fullName}</div>
                          <span className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded font-medium ${badge}`}>{label}</span>
                        </TableCell>
                      )}
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="text-sm align-top bg-muted/10 whitespace-pre-wrap break-words max-w-[200px]">{src.informationNeeded || "—"}</TableCell>
                      )}
                      <TableCell className="py-2 text-sm">{item.description || "—"}</TableCell>
                      <TableCell className="py-2"><span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{item.commType || "—"}</span></TableCell>
                      <TableCell className="py-2 text-sm text-muted-foreground">{item.periodic || "—"}</TableCell>
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="align-top bg-muted/10"><MethodsBadges methods={methods} /></TableCell>
                      )}
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="text-sm align-top bg-muted/10">{responsibleName}</TableCell>
                      )}
                      {idx === 0 && (
                        <TableCell rowSpan={items.length} className="text-right align-top bg-muted/10">
                          {isDirect && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(src)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMut.mutate({ id: src.id })} disabled={deleteMut.isPending} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                });
              });
            });

            return (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-44">Stakeholder / Source</TableHead>
                      <TableHead className="w-52">Information Needed</TableHead>
                      <TableHead>Communication Needed</TableHead>
                      <TableHead className="w-28">Type</TableHead>
                      <TableHead className="w-28">Frequency</TableHead>
                      <TableHead className="w-48">Preferred Methods</TableHead>
                      <TableHead className="w-36">Responsible</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{rows}</TableBody>
                </Table>
              </div>
            );
          })()}
        </TabsContent>

        {/* ─── Role Tab ─── */}
        <TabsContent value="role" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">One card per role. All stakeholders with that role inherit this plan.</p>
            <Button size="sm" onClick={() => openNew("role")}>
              <Plus className="w-4 h-4 mr-1" /> Add Role Card
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : roleEntries.length === 0 ? (
            <EmptyState icon={Briefcase} title="No role cards yet" description="Create communication plan cards for roles." actionLabel="Add Role Card" onAction={() => openNew("role")} />
          ) : (
            <CommPlanTable
              entries={roleEntries}
              allCommItems={allCommItems as any[]}
              stakeholderMap={stakeholderMap}
              onEdit={openEdit}
              onDelete={(id) => deleteMut.mutate({ id })}
              deleteIsPending={deleteMut.isPending}
            />
          )}
        </TabsContent>

        {/* ─── Position Tab ─── */}
        <TabsContent value="position" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">One card per position/job title. All stakeholders with that position inherit this plan.</p>
            <Button size="sm" onClick={() => openNew("job")}>
              <Plus className="w-4 h-4 mr-1" /> Add Position Card
            </Button>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : positionEntries.length === 0 ? (
            <EmptyState icon={Building2} title="No position cards yet" description="Create communication plan cards for job positions." actionLabel="Add Position Card" onAction={() => openNew("job")} />
          ) : (
            <CommPlanTable
              entries={positionEntries}
              allCommItems={allCommItems as any[]}
              stakeholderMap={stakeholderMap}
              onEdit={openEdit}
              onDelete={(id) => deleteMut.mutate({ id })}
              deleteIsPending={deleteMut.isPending}
            />
          )}
        </TabsContent>



        {/* ─── Communication Log Tab ─── */}
        <TabsContent value="commlog" className="mt-4 space-y-4">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Method filter */}
              <Select value={commLogFilter.method || "__all__"} onValueChange={(v) => setCommLogFilter(f => ({ ...f, method: v === "__all__" ? "" : v }))}>
                <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All methods" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All methods</SelectItem>
                  {["Email", "Meeting", "Phone", "Teams", "Slack", "Report", "Video Call", "Other"].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Date range */}
              <input type="date" className="h-8 text-xs border rounded-md px-2" value={commLogFilter.dateFrom}
                onChange={e => setCommLogFilter(f => ({ ...f, dateFrom: e.target.value }))} title="From date" />
              <span className="text-xs text-muted-foreground">to</span>
              <input type="date" className="h-8 text-xs border rounded-md px-2" value={commLogFilter.dateTo}
                onChange={e => setCommLogFilter(f => ({ ...f, dateTo: e.target.value }))} title="To date" />
              {(commLogFilter.method || commLogFilter.dateFrom || commLogFilter.dateTo) && (
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setCommLogFilter({ method: "", sentBy: "", dateFrom: "", dateTo: "" })}>
                  Clear filters
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const list = (commLogEntries as any[]);
                  if (list.length === 0) { toast.error("No entries to export"); return; }
                  const headers = ["Date", "Subject", "Sent By", "Recipients", "Method", "Summary", "Notes"];
                  const rows = list.map((e: any) => [e.logDate, e.subject, e.sentBy ?? "", e.recipients ?? "", e.method ?? "", e.summary ?? "", e.notes ?? ""]);
                  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "communication_log.csv"; a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="w-4 h-4 mr-1.5" /> Export CSV
              </Button>
              <Button size="sm" onClick={() => {
                setCommLogEditing(null);
                setCommLogForm({ logDate: new Date().toISOString().slice(0, 10), communicationType: "", subject: "", sentBy: "", recipients: "", method: "", summary: "", linkedCommPlanEntryId: null, attachmentUrl: "", notes: "" });
                setCommLogDialogOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-1.5" /> Log Communication
              </Button>
            </div>
          </div>

          {/* Filtered list */}
          {(() => {
            const filtered = (commLogEntries as any[]).filter((e: any) => {
              if (commLogFilter.method && e.method !== commLogFilter.method) return false;
              if (commLogFilter.dateFrom && e.logDate < commLogFilter.dateFrom) return false;
              if (commLogFilter.dateTo && e.logDate > commLogFilter.dateTo) return false;
              return true;
            });

            if (filtered.length === 0) {
              return (
                <EmptyState
                  icon={ClipboardList}
                  title="No communication logs yet"
                  description='Click "Log Communication" to record a communication event.'
                  actionLabel="Log Communication"
                  onAction={() => {
                    setCommLogEditing(null);
                    setCommLogForm({ logDate: new Date().toISOString().slice(0, 10), communicationType: "", subject: "", sentBy: "", recipients: "", method: "", summary: "", linkedCommPlanEntryId: null, attachmentUrl: "", notes: "" });
                    setCommLogDialogOpen(true);
                  }}
                />
              );
            }

            const LOG_METHOD_COLORS: Record<string, string> = {
              Email: "bg-blue-100 text-blue-800",
              Meeting: "bg-purple-100 text-purple-800",
              Phone: "bg-green-100 text-green-800",
              Teams: "bg-indigo-100 text-indigo-800",
              Slack: "bg-yellow-100 text-yellow-800",
              Report: "bg-orange-100 text-orange-800",
              "Video Call": "bg-teal-100 text-teal-800",
              Other: "bg-gray-100 text-gray-700",
            };

            return (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="w-36">Sent By</TableHead>
                      <TableHead className="w-44">Recipients</TableHead>
                      <TableHead className="w-28">Method</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((entry: any) => {
                      const isExpanded = expandedLogRows.has(entry.id);
                      return (
                        <React.Fragment key={entry.id}>
                          <TableRow className="cursor-pointer hover:bg-muted/30">
                            <TableCell className="text-sm font-mono align-top">{entry.logDate}</TableCell>
                            <TableCell className="text-sm font-medium align-top">
                              <button
                                className="text-left hover:underline"
                                onClick={() => setExpandedLogRows(prev => {
                                  const next = new Set(prev);
                                  if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id);
                                  return next;
                                })}
                              >
                                {entry.subject}
                              </button>
                            </TableCell>
                            <TableCell className="text-sm align-top">{entry.sentBy || "—"}</TableCell>
                            <TableCell className="text-sm align-top max-w-[160px] truncate" title={entry.recipients ?? ""}>{entry.recipients || "—"}</TableCell>
                            <TableCell className="align-top">
                              {entry.method ? (
                                <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${LOG_METHOD_COLORS[entry.method] ?? "bg-gray-100 text-gray-700"}`}>
                                  {entry.method}
                                </span>
                              ) : <span className="text-muted-foreground text-xs">—</span>}
                            </TableCell>
                            <TableCell className="text-sm align-top max-w-[200px]">
                              <div className="truncate">{entry.summary || "—"}</div>
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => setExpandedLogRows(prev => { const next = new Set(prev); if (next.has(entry.id)) next.delete(entry.id); else next.add(entry.id); return next; })}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                  onClick={() => {
                                    setCommLogEditing(entry);
                                    setCommLogForm({
                                      logDate: entry.logDate,
                                      communicationType: entry.communicationType ?? "",
                                      subject: entry.subject,
                                      sentBy: entry.sentBy ?? "",
                                      recipients: entry.recipients ?? "",
                                      method: entry.method ?? "",
                                      summary: entry.summary ?? "",
                                      linkedCommPlanEntryId: entry.linkedCommPlanEntryId ?? null,
                                      attachmentUrl: entry.attachmentUrl ?? "",
                                      notes: entry.notes ?? "",
                                    });
                                    setCommLogDialogOpen(true);
                                  }}
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => commLogDelete.mutate({ id: entry.id })}
                                  disabled={commLogDelete.isPending}
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${entry.id}-expanded`} className="bg-muted/20">
                              <TableCell colSpan={7} className="py-3 px-6">
                                <div className="space-y-2 text-sm">
                                  {entry.summary && (
                                    <div>
                                      <span className="font-semibold">Summary: </span>
                                      <span className="text-muted-foreground whitespace-pre-wrap">{entry.summary}</span>
                                    </div>
                                  )}
                                  {entry.notes && (
                                    <div>
                                      <span className="font-semibold">Notes: </span>
                                      <span className="text-muted-foreground whitespace-pre-wrap">{entry.notes}</span>
                                    </div>
                                  )}
                                  {entry.attachmentUrl && (
                                    <div>
                                      <span className="font-semibold">Attachment: </span>
                                      <a href={entry.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{entry.attachmentUrl}</a>
                                    </div>
                                  )}
                                  {!entry.summary && !entry.notes && !entry.attachmentUrl && (
                                    <span className="text-muted-foreground italic">No additional details.</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------------ */}
      {/* Communication Log Dialog                                            */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={commLogDialogOpen} onOpenChange={setCommLogDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              {commLogEditing ? "Edit Communication Log" : "Log Communication"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <input
                  type="date"
                  className="w-full h-9 border rounded-md px-3 text-sm"
                  value={commLogForm.logDate}
                  onChange={e => setCommLogForm(f => ({ ...f, logDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <Select value={commLogForm.method || "__none__"} onValueChange={v => setCommLogForm(f => ({ ...f, method: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select method..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {["Email", "Meeting", "Phone", "Teams", "Slack", "Report", "Video Call", "Other"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input value={commLogForm.subject} onChange={e => setCommLogForm(f => ({ ...f, subject: e.target.value }))} placeholder="Brief subject or title..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Sent By</Label>
                <Input value={commLogForm.sentBy} onChange={e => setCommLogForm(f => ({ ...f, sentBy: e.target.value }))} placeholder="Name or email..." />
              </div>
              <div className="space-y-1.5">
                <Label>Recipients</Label>
                <Input value={commLogForm.recipients} onChange={e => setCommLogForm(f => ({ ...f, recipients: e.target.value }))} placeholder="Names, comma-separated..." />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Summary</Label>
              <Textarea rows={3} value={commLogForm.summary} onChange={e => setCommLogForm(f => ({ ...f, summary: e.target.value }))} placeholder="What was communicated?" />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={commLogForm.notes} onChange={e => setCommLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
            </div>
            <div className="space-y-1.5">
              <Label>Attachment URL</Label>
              <Input value={commLogForm.attachmentUrl} onChange={e => setCommLogForm(f => ({ ...f, attachmentUrl: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommLogDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!commLogForm.subject.trim()) { toast.error("Subject is required"); return; }
                if (!commLogForm.logDate) { toast.error("Date is required"); return; }
                if (commLogEditing) {
                  commLogUpdate.mutate({
                    id: commLogEditing.id,
                    logDate: commLogForm.logDate,
                    communicationType: commLogForm.communicationType || null,
                    subject: commLogForm.subject,
                    sentBy: commLogForm.sentBy || null,
                    recipients: commLogForm.recipients || null,
                    method: commLogForm.method || null,
                    summary: commLogForm.summary || null,
                    linkedCommPlanEntryId: commLogForm.linkedCommPlanEntryId,
                    attachmentUrl: commLogForm.attachmentUrl || null,
                    notes: commLogForm.notes || null,
                  });
                } else {
                  commLogCreate.mutate({
                    projectId,
                    logDate: commLogForm.logDate,
                    communicationType: commLogForm.communicationType || undefined,
                    subject: commLogForm.subject,
                    sentBy: commLogForm.sentBy || undefined,
                    recipients: commLogForm.recipients || undefined,
                    method: commLogForm.method || undefined,
                    summary: commLogForm.summary || undefined,
                    linkedCommPlanEntryId: commLogForm.linkedCommPlanEntryId ?? undefined,
                    attachmentUrl: commLogForm.attachmentUrl || undefined,
                    notes: commLogForm.notes || undefined,
                  });
                }
              }}
              disabled={commLogCreate.isPending || commLogUpdate.isPending}
            >
              {(commLogCreate.isPending || commLogUpdate.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {commLogEditing ? "Update" : "Save Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Entry Dialog                                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-1">

            {/* ── Target selector (context-aware) ── */}
            {form.targetType === "stakeholder" && (
              <div className="space-y-1.5">
                <Label>Stakeholder</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                  disabled={!!editing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stakeholder..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select stakeholder —</SelectItem>
                    {(stakeholders as any[])
                      .filter((s: any) => editing || !stakeholderEntryMap[s.id])
                      .map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          <span className="font-medium">{s.fullName}</span>
                          {(s.role || s.job) && <span className="text-muted-foreground ml-1.5 text-xs">{[s.role, s.job].filter(Boolean).join(" · ")}</span>}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {!editing && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Info className="w-3 h-3" /> Only stakeholders without an existing card are shown.
                  </p>
                )}
              </div>
            )}

            {form.targetType === "role" && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                  disabled={!!editing}
                >
                  <SelectTrigger><SelectValue placeholder="Select role..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select role —</SelectItem>
                    {(roleOptions as any[])
                      .filter((r: any) => editing || !roleEntryMap[r.label])
                      .map((r: any) => <SelectItem key={r.id} value={r.label}>{r.label}</SelectItem>)}
                    {uniqueRoles
                      .filter(r => !(roleOptions as any[]).some((o: any) => o.label === r) && (editing || !roleEntryMap[r]))
                      .map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={newRoleInput} onChange={e => setNewRoleInput(e.target.value)} placeholder="Add new role option..." className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && newRoleInput.trim()) { createRoleOption.mutate({ projectId, label: newRoleInput.trim() }); setNewRoleInput(""); } }} />
                  <Button size="sm" variant="outline" className="h-8 shrink-0" disabled={!newRoleInput.trim() || createRoleOption.isPending}
                    onClick={() => { if (newRoleInput.trim()) { createRoleOption.mutate({ projectId, label: newRoleInput.trim() }); setNewRoleInput(""); } }}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(roleOptions as any[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(roleOptions as any[]).map((r: any) => (
                      <span key={r.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full">
                        {r.label}
                        <button type="button" className="text-muted-foreground hover:text-red-500 ml-0.5" onClick={() => deleteRoleOption.mutate({ id: r.id })}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.targetType === "job" && (
              <div className="space-y-1.5">
                <Label>Position / Job Title</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                  disabled={!!editing}
                >
                  <SelectTrigger><SelectValue placeholder="Select position..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select position —</SelectItem>
                    {(jobOptions as any[])
                      .filter((j: any) => editing || !positionEntryMap[j.label])
                      .map((j: any) => <SelectItem key={j.id} value={j.label}>{j.label}</SelectItem>)}
                    {uniqueJobs
                      .filter(j => !(jobOptions as any[]).some((o: any) => o.label === j) && (editing || !positionEntryMap[j]))
                      .map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Input value={newJobInput} onChange={e => setNewJobInput(e.target.value)} placeholder="Add new position option..." className="h-8 text-sm"
                    onKeyDown={e => { if (e.key === "Enter" && newJobInput.trim()) { createJobOption.mutate({ projectId, label: newJobInput.trim() }); setNewJobInput(""); } }} />
                  <Button size="sm" variant="outline" className="h-8 shrink-0" disabled={!newJobInput.trim() || createJobOption.isPending}
                    onClick={() => { if (newJobInput.trim()) { createJobOption.mutate({ projectId, label: newJobInput.trim() }); setNewJobInput(""); } }}>
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(jobOptions as any[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(jobOptions as any[]).map((j: any) => (
                      <span key={j.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full">
                        {j.label}
                        <button type="button" className="text-muted-foreground hover:text-red-500 ml-0.5" onClick={() => deleteJobOption.mutate({ id: j.id })}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Information Needed ── */}
            <div className="space-y-1.5">
              <Label>Information Needed</Label>
              <Textarea rows={3} value={form.informationNeeded} onChange={(e) => setField("informationNeeded", e.target.value)} placeholder="What information does this stakeholder/group need?" />
            </div>

            {/* ── Acknowledgment Needed ── */}
            <div className="flex items-center gap-3 py-1">
              <Checkbox id="ack-needed" checked={form.acknowledgmentNeeded} onCheckedChange={(v) => setField("acknowledgmentNeeded", !!v)} />
              <label htmlFor="ack-needed" className="text-sm font-medium cursor-pointer select-none">
                Acknowledgment Needed <span className="text-muted-foreground font-normal ml-1.5 text-xs">(recipient must confirm receipt)</span>
              </label>
            </div>

            {/* ── Communication Needed List ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Communication Needed</Label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addCommNeedRow}>
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">What we need from or need to communicate to this stakeholder/group.</p>
              {form.commNeeded.length === 0 ? (
                <div className="border border-dashed rounded-md py-4 text-center text-xs text-muted-foreground">No communication items yet. Click "Add Line" to add one.</div>
              ) : (
                <div className="space-y-2">
                  {form.commNeeded.map((item) => (
                    <div key={item.localId} className="flex items-start gap-2 p-2 border rounded-md bg-muted/30">
                      <div className="flex-1 space-y-1.5">
                        <Input value={item.description} onChange={e => updateCommNeedRow(item.localId, "description", e.target.value)} placeholder="Describe what needs to be communicated..." className="h-8 text-sm" />
                        <div className="flex items-center gap-2">
                          <Select value={item.commType} onValueChange={v => updateCommNeedRow(item.localId, "commType", v)}>
                            <SelectTrigger className="h-7 text-xs w-36"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Push">Push</SelectItem>
                              <SelectItem value="Pull">Pull</SelectItem>
                              <SelectItem value="Interactive">Interactive</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={item.periodic || "__none__"} onValueChange={v => updateCommNeedRow(item.localId, "periodic", v === "__none__" ? "" : v)}>
                            <SelectTrigger className="h-7 text-xs flex-1"><SelectValue placeholder="Periodic..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— No period —</SelectItem>
                              {FREQUENCY_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button type="button" size="sm" variant="secondary" className="h-8 text-xs shrink-0 mt-0.5 px-2 font-medium" onClick={() => { if (item.description.trim()) toast.success("Line noted — click Update to persist"); }}>Save</Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 mt-0.5" onClick={() => removeCommNeedRow(item.localId)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Inputs Needed from Stakeholder ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Inputs Needed from Stakeholder</Label>
                <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addInputNeedRow}>
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Information, approvals, or data we need to receive from this stakeholder/group.</p>
              {form.inputNeeded.length === 0 ? (
                <div className="border border-dashed rounded-md py-4 text-center text-xs text-muted-foreground">No inputs listed yet. Click "Add Line" to add one.</div>
              ) : (
                <div className="space-y-2">
                  {form.inputNeeded.map((item) => (
                    <div key={item.localId} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                      <Input value={item.description} onChange={e => updateInputNeedRow(item.localId, e.target.value)} placeholder="Describe the input needed..." className="h-8 text-sm flex-1" />
                      <Button type="button" size="sm" variant="secondary" className="h-8 text-xs shrink-0 px-2 font-medium" onClick={() => { if (item.description.trim()) toast.success("Line noted — click Update to persist"); }}>Save</Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0" onClick={() => removeInputNeedRow(item.localId)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Preferred Methods ── */}
            <div className="space-y-1.5">
              <Label>Preferred Methods</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {(methodOptions as any[]).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-1.5 group">
                    <label className="flex items-center gap-2 cursor-pointer text-sm select-none flex-1">
                      <Checkbox checked={form.preferredMethods.includes(m.label)} onCheckedChange={() => toggleMethod(m.label)} />
                      {m.label}
                    </label>
                    <button type="button" title="Remove method" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity text-xs leading-none"
                      onClick={() => { deleteMethodOption.mutate({ id: m.id }); if (form.preferredMethods.includes(m.label)) toggleMethod(m.label); }}>×</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 p-2 border border-dashed rounded-md bg-muted/20">
                <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input value={newMethodInput} onChange={e => setNewMethodInput(e.target.value)} placeholder="Type new method name and press Enter or click Add..." className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 px-0"
                  onKeyDown={e => { if (e.key === "Enter" && newMethodInput.trim()) { createMethodOption.mutate({ projectId, label: newMethodInput.trim() }); setNewMethodInput(""); } }} />
                <Button type="button" size="sm" variant="default" className="h-8 shrink-0 gap-1" disabled={!newMethodInput.trim() || createMethodOption.isPending}
                  onClick={() => { if (newMethodInput.trim()) { createMethodOption.mutate({ projectId, label: newMethodInput.trim() }); setNewMethodInput(""); } }}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Hover a method checkbox to reveal the remove (×) button.</p>
            </div>

            {/* ── Notes ── */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.textNote} onChange={(e) => setField("textNote", e.target.value)} placeholder="Additional notes..." />
            </div>

            {/* ── Escalation Procedures ── */}
            <div className="space-y-1.5">
              <Label>Escalation Procedures</Label>
              <Textarea rows={3} value={form.escalationProcedures} onChange={(e) => setField("escalationProcedures", e.target.value)} placeholder="Describe escalation steps if communication breaks down..." />
            </div>

            {/* ── Responsible ── */}
            <div className="space-y-1.5">
              <Label>Responsible</Label>
              <Select
                value={form.responsibleStakeholderId != null ? String(form.responsibleStakeholderId) : "__none__"}
                onValueChange={(v) => setField("responsibleStakeholderId", v === "__none__" ? null : Number(v))}
              >
                <SelectTrigger><SelectValue placeholder="Select responsible person..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not assigned —</SelectItem>
                  {(stakeholders as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="font-medium">{s.fullName}</span>
                      {(s.role || s.job) && <span className="text-muted-foreground ml-1.5 text-xs">{[s.role, s.job].filter(Boolean).join(" · ")}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Add Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* Import from Stakeholders Dialog                                      */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Import from Stakeholders</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">Select stakeholders to create communication plan cards for (only those without existing cards are shown):</p>
            {stakeholdersLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (stakeholders as any[]).filter((s: any) => !stakeholderEntryMap[s.id]).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">All stakeholders already have communication plan cards.</p>
              </div>
            ) : (
              <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
                {(stakeholders as any[]).filter((s: any) => !stakeholderEntryMap[s.id]).map((s: any) => (
                  <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={selectedStakeholderIds.includes(s.id)} onCheckedChange={() => toggleImportStakeholder(s.id)} />
                    <div>
                      <div className="text-sm font-medium">{s.fullName}</div>
                      {(s.role || s.position) && <div className="text-xs text-muted-foreground">{[s.role, s.position].filter(Boolean).join(" · ")}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
            {(stakeholders as any[]).filter((s: any) => !stakeholderEntryMap[s.id]).length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedStakeholderIds((stakeholders as any[]).filter((s: any) => !stakeholderEntryMap[s.id]).map((s: any) => s.id))}>Select all</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedStakeholderIds([])}>Clear</Button>
                <span className="text-xs text-muted-foreground ml-auto">{selectedStakeholderIds.length} selected</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={importMut.isPending || selectedStakeholderIds.length === 0}>
              {importMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Selected
>>>>>>> github/MANUS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
