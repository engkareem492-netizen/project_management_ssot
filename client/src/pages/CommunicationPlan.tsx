import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { EmptyState } from "@/components/EmptyState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREFERRED_METHODS_OPTIONS = [
  "Email",
  "Meeting",
  "Phone",
  "Slack",
  "Teams",
  "Report",
  "Newsletter",
  "Video Call",
];

const FREQUENCY_OPTIONS = [
  "Daily",
  "Weekly",
  "Bi-weekly",
  "Monthly",
  "Quarterly",
  "As needed",
  "Ad hoc",
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntryFormData = {
  stakeholderId: number | null;
  role: string;
  informationNeeded: string;
  preferredMethods: string[];
  frequency: string;
  textNote: string;
  escalationProcedures: string;
  responsible: string;
};

const EMPTY_FORM: EntryFormData = {
  stakeholderId: null,
  role: "",
  informationNeeded: "",
  preferredMethods: [],
  frequency: "",
  textNote: "",
  escalationProcedures: "",
  responsible: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string, maxLen = 60): string {
  if (!text) return "";
  return text.length > maxLen ? text.substring(0, maxLen) + "…" : text;
}

function exportToCsv(entries: any[], stakeholders: any[]) {
  const stakeholderMap: Record<number, string> = {};
  stakeholders.forEach((s: any) => {
    stakeholderMap[s.id] = s.fullName;
  });

  const headers = [
    "Stakeholder/Role",
    "Information Needed",
    "Preferred Methods",
    "Frequency",
    "Notes",
    "Escalation Procedures",
    "Responsible",
  ];

  const rows = entries.map((e: any) => {
    const stakeholderName = e.stakeholderId ? (stakeholderMap[e.stakeholderId] ?? "") : "";
    const stakeholderRole =
      stakeholderName && e.role
        ? `${stakeholderName} (${e.role})`
        : stakeholderName || e.role || "";
    const methods = Array.isArray(e.preferredMethods) ? e.preferredMethods.join("; ") : "";
    return [
      stakeholderRole,
      e.informationNeeded ?? "",
      methods,
      e.frequency ?? "",
      e.textNote ?? "",
      e.escalationProcedures ?? "",
      e.responsible ?? "",
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
  });

  const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join(
    "\n"
  );

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "communication_plan.csv";
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface MethodsBadgesProps {
  methods: string[];
}

function MethodsBadges({ methods }: MethodsBadgesProps) {
  if (!methods || methods.length === 0)
    return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {methods.map((m) => (
        <span
          key={m}
          className={`inline-block text-xs px-1.5 py-0.5 rounded-full font-medium ${
            METHOD_COLORS[m] ?? "bg-gray-100 text-gray-700"
          }`}
        >
          {m}
        </span>
      ))}
    </div>
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

  const {
    data: entries = [],
    isLoading: entriesLoading,
    refetch,
  } = trpc.communicationPlan.list.useQuery({ projectId }, { enabled });

  // ----- Mutations -----
  const createMut = trpc.communicationPlan.create.useMutation({
    onSuccess: () => {
      toast.success("Entry added");
      refetch();
      setEntryDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.communicationPlan.update.useMutation({
    onSuccess: () => {
      toast.success("Entry updated");
      refetch();
      setEntryDialogOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.communicationPlan.delete.useMutation({
    onSuccess: () => {
      toast.success("Entry deleted");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const importMut = trpc.communicationPlan.importFromStakeholders.useMutation({
    onSuccess: () => {
      toast.success("Stakeholders imported");
      refetch();
      setImportDialogOpen(false);
      setSelectedStakeholderIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  // ----- Dialog state: Add/Edit entry -----
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<EntryFormData>({ ...EMPTY_FORM });

  // ----- Dialog state: Import from stakeholders -----
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedStakeholderIds, setSelectedStakeholderIds] = useState<number[]>([]);

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

  // ----- Resolve stakeholder name from id -----
  const stakeholderMap = useMemo(() => {
    const m: Record<number, any> = {};
    (stakeholders as any[]).forEach((s) => {
      m[s.id] = s;
    });
    return m;
  }, [stakeholders]);

  // ----- Open new / edit dialogs -----
  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setEntryDialogOpen(true);
  };

  const openEdit = (entry: any) => {
    setEditing(entry);
    setForm({
      stakeholderId: entry.stakeholderId ?? null,
      role: entry.role ?? "",
      informationNeeded: entry.informationNeeded ?? "",
      preferredMethods: Array.isArray(entry.preferredMethods) ? entry.preferredMethods : [],
      frequency: entry.frequency ?? "",
      textNote: entry.textNote ?? "",
      escalationProcedures: entry.escalationProcedures ?? "",
      responsible: entry.responsible ?? "",
    });
    setEntryDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.informationNeeded.trim() && !form.role.trim() && !form.stakeholderId) {
      toast.error("Please fill in at least Stakeholder/Role and Information Needed");
      return;
    }
    const payload = {
      stakeholderId: form.stakeholderId,
      role: form.role || undefined,
      informationNeeded: form.informationNeeded,
      preferredMethods: form.preferredMethods,
      frequency: form.frequency || undefined,
      textNote: form.textNote || undefined,
      escalationProcedures: form.escalationProcedures || undefined,
      responsible: form.responsible || undefined,
    };
    if (editing) {
      updateMut.mutate({ id: editing.id, ...payload });
    } else {
      createMut.mutate({ projectId, ...payload });
    }
  };

  // ----- Import dialog helpers -----
  const toggleImportStakeholder = (id: number) => {
    setSelectedStakeholderIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImport = () => {
    if (selectedStakeholderIds.length === 0) {
      toast.error("Select at least one stakeholder");
      return;
    }
    importMut.mutate({ projectId, stakeholderIds: selectedStakeholderIds });
  };

  // ----- Summary stats -----
  const methodFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    (entries as any[]).forEach((e) => {
      if (Array.isArray(e.preferredMethods)) {
        e.preferredMethods.forEach((m: string) => {
          counts[m] = (counts[m] || 0) + 1;
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [entries]);

  // ----- Stakeholder name resolution for table -----
  const getStakeholderLabel = (entry: any): { primary: string; secondary?: string } => {
    const stakeholderName =
      entry.stakeholderId && stakeholderMap[entry.stakeholderId]
        ? stakeholderMap[entry.stakeholderId].fullName
        : null;
    const role = entry.role || null;

    if (stakeholderName && role) {
      return { primary: stakeholderName, secondary: role };
    }
    if (stakeholderName) return { primary: stakeholderName };
    if (role) return { primary: role };
    return { primary: "—" };
  };

  // ----- Guard -----
  if (!currentProjectId) {
    return (
      <div className="p-6 text-muted-foreground">Select a project to view the Communication Plan.</div>
    );
  }

  const isLoading = entriesLoading || stakeholdersLoading;
  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="p-6 space-y-6">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6" />
            Communication Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define how information flows between stakeholders
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedStakeholderIds([]);
              setImportDialogOpen(true);
            }}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import from Stakeholders
          </Button>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
          <Button
            variant="outline"
            onClick={() => exportToCsv(entries as any[], stakeholders as any[])}
            title="Export to CSV"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Summary Stats Bar                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {(entries as any[]).length} entr{(entries as any[]).length === 1 ? "y" : "ies"}
              </span>
            </div>
            {methodFrequency.length > 0 && (
              <>
                <span className="text-muted-foreground text-xs hidden sm:inline">|</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-muted-foreground mr-1">Top methods:</span>
                  {methodFrequency.map(([method, count]) => (
                    <span
                      key={method}
                      className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        METHOD_COLORS[method] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {method}
                      <span className="opacity-70">({count})</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Main Table                                                           */}
      {/* ------------------------------------------------------------------ */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (entries as any[]).length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No communication plan entries yet"
          description="Add entries to define how information flows between stakeholders, or import directly from your stakeholder list."
          actionLabel="Add Entry"
          onAction={openNew}
        />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Stakeholder / Role</TableHead>
                <TableHead className="w-52">Information Needed</TableHead>
                <TableHead className="w-52">Preferred Methods</TableHead>
                <TableHead className="w-28">Frequency</TableHead>
                <TableHead className="w-44">Notes</TableHead>
                <TableHead className="w-44">Escalation Procedures</TableHead>
                <TableHead className="w-36">Responsible</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(entries as any[]).map((entry: any) => {
                const label = getStakeholderLabel(entry);
                return (
                  <TableRow key={entry.id}>
                    {/* Stakeholder / Role */}
                    <TableCell>
                      <div className="font-medium text-sm">{label.primary}</div>
                      {label.secondary && (
                        <div className="text-xs text-muted-foreground mt-0.5">{label.secondary}</div>
                      )}
                    </TableCell>

                    {/* Information Needed */}
                    <TableCell>
                      <p className="text-sm whitespace-pre-wrap break-words max-w-[200px]">
                        {entry.informationNeeded || "—"}
                      </p>
                    </TableCell>

                    {/* Preferred Methods */}
                    <TableCell>
                      <MethodsBadges
                        methods={
                          Array.isArray(entry.preferredMethods) ? entry.preferredMethods : []
                        }
                      />
                    </TableCell>

                    {/* Frequency */}
                    <TableCell>
                      <span className="text-sm">{entry.frequency || "—"}</span>
                    </TableCell>

                    {/* Notes */}
                    <TableCell>
                      <span
                        className="text-sm text-muted-foreground"
                        title={entry.textNote ?? ""}
                      >
                        {truncate(entry.textNote ?? "", 55) || "—"}
                      </span>
                    </TableCell>

                    {/* Escalation Procedures */}
                    <TableCell>
                      <span
                        className="text-sm text-muted-foreground"
                        title={entry.escalationProcedures ?? ""}
                      >
                        {truncate(entry.escalationProcedures ?? "", 55) || "—"}
                      </span>
                    </TableCell>

                    {/* Responsible */}
                    <TableCell>
                      <span className="text-sm">{entry.responsible || "—"}</span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(entry)}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => deleteMut.mutate({ id: entry.id })}
                          title="Delete"
                          disabled={deleteMut.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit Entry Dialog                                              */}
      {/* ------------------------------------------------------------------ */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Entry" : "Add Communication Plan Entry"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Stakeholder */}
            <div>
              <Label>Stakeholder (optional)</Label>
              <StakeholderSelect
                stakeholders={stakeholders as any[]}
                value={
                  form.stakeholderId && stakeholderMap[form.stakeholderId]
                    ? stakeholderMap[form.stakeholderId].fullName
                    : ""
                }
                onValueChange={(name) => {
                  const found = (stakeholders as any[]).find((s) => s.fullName === name);
                  setField("stakeholderId", found ? found.id : null);
                }}
                placeholder="Select stakeholder..."
                projectId={projectId}
              />
            </div>

            {/* Role / Group Label */}
            <div>
              <Label>Role / Group Label (optional)</Label>
              <Input
                value={form.role}
                onChange={(e) => setField("role", e.target.value)}
                placeholder="e.g. Executive Sponsors, QA Team..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Used when no stakeholder is selected, or as an additional label.
              </p>
            </div>

            {/* Information Needed */}
            <div>
              <Label>Information Needed</Label>
              <Textarea
                rows={3}
                value={form.informationNeeded}
                onChange={(e) => setField("informationNeeded", e.target.value)}
                placeholder="What information does this stakeholder/group need?"
              />
            </div>

            {/* Preferred Methods */}
            <div>
              <Label>Preferred Methods</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                {PREFERRED_METHODS_OPTIONS.map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 cursor-pointer text-sm select-none"
                  >
                    <Checkbox
                      checked={form.preferredMethods.includes(method)}
                      onCheckedChange={() => toggleMethod(method)}
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <Label>Frequency</Label>
              <Select
                value={form.frequency || "__none__"}
                onValueChange={(v) => setField("frequency", v === "__none__" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.textNote}
                onChange={(e) => setField("textNote", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            {/* Escalation Procedures */}
            <div>
              <Label>Escalation Procedures</Label>
              <Textarea
                rows={3}
                value={form.escalationProcedures}
                onChange={(e) => setField("escalationProcedures", e.target.value)}
                placeholder="Describe escalation steps if communication breaks down..."
              />
            </div>

            {/* Responsible */}
            <div>
              <Label>Responsible</Label>
              <Input
                value={form.responsible}
                onChange={(e) => setField("responsible", e.target.value)}
                placeholder="Who is responsible for this communication?"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editing ? "Update" : "Add Entry"}
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
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Import from Stakeholders
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-3">
              Select stakeholders to create communication plan entries for:
            </p>

            {stakeholdersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (stakeholders as any[]).length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No stakeholders found. Add stakeholders first.
                </p>
              </div>
            ) : (
              <div className="border rounded-md divide-y max-h-72 overflow-y-auto">
                {(stakeholders as any[]).map((s: any) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedStakeholderIds.includes(s.id)}
                      onCheckedChange={() => toggleImportStakeholder(s.id)}
                    />
                    <div>
                      <div className="text-sm font-medium">{s.fullName}</div>
                      {(s.role || s.position) && (
                        <div className="text-xs text-muted-foreground">
                          {[s.role, s.position].filter(Boolean).join(" · ")}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            {(stakeholders as any[]).length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() =>
                    setSelectedStakeholderIds((stakeholders as any[]).map((s: any) => s.id))
                  }
                >
                  Select all
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setSelectedStakeholderIds([])}
                >
                  Clear
                </Button>
                <span className="text-xs text-muted-foreground ml-auto">
                  {selectedStakeholderIds.length} selected
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={importMut.isPending || selectedStakeholderIds.length === 0}
            >
              {importMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Import Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
