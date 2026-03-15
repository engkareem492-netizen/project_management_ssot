import { useState, useMemo, useEffect } from "react";
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
import { EmptyState } from "@/components/EmptyState";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

type TargetType = "stakeholder" | "role" | "job";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type CommNeedItem = {
  id?: number;          // DB id (if already saved)
  localId: string;      // client-side key
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
  targetValue: string;          // stakeholder id (string) | role string | job string
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
  stakeholders.forEach((s: any) => {
    stakeholderMap[s.id] = s.fullName;
  });

  const headers = [
    "Target Type",
    "Target",
    "Information Needed",
    "Preferred Methods",
    "Frequency",
    "Notes",
    "Escalation Procedures",
    "Responsible",
  ];

  const rows = entries.map((e: any) => {
    const targetTypeLabel =
      e.targetType === "stakeholder" ? "Stakeholder" :
      e.targetType === "role" ? "By Role" :
      e.targetType === "job" ? "By Job" :
      e.role ? "Role" : "Stakeholder";

    const targetLabel =
      e.targetType === "stakeholder"
        ? (e.stakeholderId ? (stakeholderMap[e.stakeholderId] ?? e.targetValue ?? "") : (e.targetValue ?? ""))
        : (e.targetValue ?? e.role ?? "");

    const responsibleName = e.responsibleStakeholderId
      ? (stakeholderMap[e.responsibleStakeholderId] ?? e.responsible ?? "")
      : (e.responsible ?? "");

    const methods = Array.isArray(e.preferredMethods) ? e.preferredMethods.join("; ") : "";
    return [
      targetTypeLabel,
      targetLabel,
      e.informationNeeded ?? "",
      methods,
      e.frequency ?? "",
      e.textNote ?? "",
      e.escalationProcedures ?? "",
      responsibleName,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`);
  });

  const csvContent = [headers.map((h) => `"${h}"`).join(","), ...rows.map((r) => r.join(","))].join("\n");
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

function MethodsBadges({ methods }: { methods: string[] }) {
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

  // ----- Unique roles and jobs from all stakeholders -----
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    (stakeholders as any[]).forEach((s) => {
      if (s.role) roles.add(s.role);
    });
    return Array.from(roles).sort();
  }, [stakeholders]);

  const uniqueJobs = useMemo(() => {
    const jobs = new Set<string>();
    (stakeholders as any[]).forEach((s) => {
      if (s.job) jobs.add(s.job);
    });
    return Array.from(jobs).sort();
  }, [stakeholders]);

  // ----- Open new / edit dialogs -----
  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setEntryDialogOpen(true);
  };

  const openEdit = (entry: any) => {
    setEditing(entry);
    // Determine targetType and targetValue from stored data
    let targetType: TargetType = "stakeholder";
    let targetValue = "";

    if (entry.targetType === "role") {
      targetType = "role";
      targetValue = entry.targetValue ?? entry.role ?? "";
    } else if (entry.targetType === "job") {
      targetType = "job";
      targetValue = entry.targetValue ?? "";
    } else {
      // legacy or explicit stakeholder
      targetType = "stakeholder";
      targetValue = entry.stakeholderId ? String(entry.stakeholderId) : (entry.targetValue ?? "");
    }

    setForm({
      targetType,
      targetValue,
      informationNeeded: entry.informationNeeded ?? "",
      acknowledgmentNeeded: entry.acknowledgmentNeeded ?? false,
      preferredMethods: Array.isArray(entry.preferredMethods) ? entry.preferredMethods : [],
      frequency: entry.frequency ?? "",
      textNote: entry.textNote ?? "",
      escalationProcedures: entry.escalationProcedures ?? "",
      responsibleStakeholderId: entry.responsibleStakeholderId ?? null,
      commNeeded: [],  // will be loaded async below
    });
    // Load commNeeded items for this entry (they come from commPlanItems table)
    // We'll fetch them via a separate query triggered by editing state
    setEntryDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.targetValue) {
      toast.error("Please select a target (Stakeholder, Role, or Job)");
      return;
    }
    if (!form.informationNeeded.trim()) {
      toast.error("Please fill in Information Needed");
      return;
    }

    // Build payload based on targetType
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
        onSuccess: async (entry: any) => {
          if (validItems.length > 0) {
            await bulkReplaceItems.mutateAsync({
              entryId: editing.id,
              projectId,
              items: validItems.map((item, idx) => ({
                description: item.description,
                commType: item.commType,
                periodic: item.periodic || undefined,
                sequence: idx,
              })),
            });
          }
          await bulkReplaceInputItems.mutateAsync({
            entryId: editing.id,
            projectId,
            items: validInputItems.map((item, idx) => ({
              description: item.description,
              sequence: idx,
            })),
          });
        }
      });
    } else {
      createMut.mutate({ projectId, ...payload }, {
        onSuccess: async (entry: any) => {
          if (validItems.length > 0 && entry?.id) {
            await bulkReplaceItems.mutateAsync({
              entryId: entry.id,
              projectId,
              items: validItems.map((item, idx) => ({
                description: item.description,
                commType: item.commType,
                periodic: item.periodic || undefined,
                sequence: idx,
              })),
            });
          }
          if (entry?.id) {
            await bulkReplaceInputItems.mutateAsync({
              entryId: entry.id,
              projectId,
              items: validInputItems.map((item, idx) => ({
                description: item.description,
                sequence: idx,
              })),
            });
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

  // ----- Load inputNeeded items when editing -----
  const { data: editingInputItems = [] } = trpc.commPlanOptions.inputItems.listByEntry.useQuery(
    { entryId: editing?.id ?? 0 },
    { enabled: !!editing?.id && entryDialogOpen }
  );

  useEffect(() => {
    if (editing && entryDialogOpen && Array.isArray(editingItems) && editingItems.length > 0) {
      setForm(prev => ({
        ...prev,
        commNeeded: (editingItems as any[]).map((item: any) => ({
          id: item.id,
          localId: makeLocalId(),
          description: item.description ?? "",
          commType: item.commType ?? "Push",
          periodic: item.periodic ?? "",
        })),
      }));
    }
  }, [editingItems, editing?.id]);

  useEffect(() => {
    if (editing && entryDialogOpen && Array.isArray(editingInputItems) && editingInputItems.length > 0) {
      setForm(prev => ({
        ...prev,
        inputNeeded: (editingInputItems as any[]).map((item: any) => ({
          id: item.id,
          localId: makeLocalId(),
          description: item.description ?? "",
        })),
      }));
    }
  }, [editingInputItems, editing?.id]);

  // ----- CommNeeded list helpers -----
  const addCommNeedRow = () => {
    setForm(prev => ({
      ...prev,
      commNeeded: [...prev.commNeeded, { localId: makeLocalId(), description: "", commType: "Push", periodic: "" }],
    }));
  };

  const updateCommNeedRow = (localId: string, field: keyof CommNeedItem, value: string) => {
    setForm(prev => ({
      ...prev,
      commNeeded: prev.commNeeded.map(item =>
        item.localId === localId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removeCommNeedRow = (localId: string) => {
    setForm(prev => ({
      ...prev,
      commNeeded: prev.commNeeded.filter(item => item.localId !== localId),
    }));
  };

  // ----- InputNeeded list helpers -----
  const addInputNeedRow = () => {
    setForm(prev => ({
      ...prev,
      inputNeeded: [...prev.inputNeeded, { localId: makeLocalId(), description: "" }],
    }));
  };

  const updateInputNeedRow = (localId: string, value: string) => {
    setForm(prev => ({
      ...prev,
      inputNeeded: prev.inputNeeded.map(item =>
        item.localId === localId ? { ...item, description: value } : item
      ),
    }));
  };

  const removeInputNeedRow = (localId: string) => {
    setForm(prev => ({
      ...prev,
      inputNeeded: prev.inputNeeded.filter(item => item.localId !== localId),
    }));
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

  // ----- Resolve display label for a table row -----
  const getTargetLabel = (entry: any): { primary: string; secondary?: string } => {
    if (entry.targetType === "role") {
      return { primary: entry.targetValue ?? entry.role ?? "—", secondary: "By Role" };
    }
    if (entry.targetType === "job") {
      return { primary: entry.targetValue ?? "—", secondary: "By Job" };
    }
    // stakeholder (default/legacy)
    const sid = entry.stakeholderId ?? (entry.targetValue ? Number(entry.targetValue) : null);
    const s = sid ? stakeholderMap[sid] : null;
    if (s) return { primary: s.fullName, secondary: s.role ?? s.job ?? undefined };
    if (entry.role) return { primary: entry.role };
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
                <TableHead className="w-44">Target</TableHead>
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
                const label = getTargetLabel(entry);
                const responsibleName = entry.responsibleStakeholderId
                  ? (stakeholderMap[entry.responsibleStakeholderId]?.fullName ?? entry.responsible ?? "—")
                  : (entry.responsible ?? "—");
                return (
                  <TableRow key={entry.id}>
                    {/* Target */}
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
                        methods={Array.isArray(entry.preferredMethods) ? entry.preferredMethods : []}
                      />
                    </TableCell>

                    {/* Frequency */}
                    <TableCell>
                      <span className="text-sm">{entry.frequency || "—"}</span>
                    </TableCell>

                    {/* Notes */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground" title={entry.textNote ?? ""}>
                        {truncate(entry.textNote ?? "", 55) || "—"}
                      </span>
                    </TableCell>

                    {/* Escalation Procedures */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground" title={entry.escalationProcedures ?? ""}>
                        {truncate(entry.escalationProcedures ?? "", 55) || "—"}
                      </span>
                    </TableCell>

                    {/* Responsible */}
                    <TableCell>
                      <span className="text-sm">{responsibleName}</span>
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

          <div className="space-y-5 py-1">

            {/* ── Target Type selector ── */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Target Type</Label>
              <div className="flex gap-2">
                {(["stakeholder", "role", "job"] as TargetType[]).map((type) => {
                  const labels: Record<TargetType, string> = {
                    stakeholder: "Stakeholder",
                    role: "By Role",
                    job: "By Job",
                  };
                  const active = form.targetType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setField("targetType", type);
                        setField("targetValue", "");
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {labels[type]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Conditional target value ── */}
            {form.targetType === "stakeholder" && (
              <div className="space-y-1.5">
                <Label>Stakeholder</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stakeholder..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select stakeholder —</SelectItem>
                    {(stakeholders as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        <span className="font-medium">{s.fullName}</span>
                        {(s.role || s.job) && (
                          <span className="text-muted-foreground ml-1.5 text-xs">
                            {[s.role, s.job].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.targetType === "role" && (
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select role —</SelectItem>
                    {(roleOptions as any[]).map((r: any) => (
                      <SelectItem key={r.id} value={r.label}>
                        <span className="flex items-center justify-between w-full gap-2">
                          <span>{r.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                    {uniqueRoles.filter(r => !(roleOptions as any[]).some((o: any) => o.label === r)).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newRoleInput}
                    onChange={e => setNewRoleInput(e.target.value)}
                    placeholder="Add new role option..."
                    className="h-8 text-sm"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newRoleInput.trim()) {
                        createRoleOption.mutate({ projectId, label: newRoleInput.trim() });
                        setNewRoleInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    disabled={!newRoleInput.trim() || createRoleOption.isPending}
                    onClick={() => {
                      if (newRoleInput.trim()) {
                        createRoleOption.mutate({ projectId, label: newRoleInput.trim() });
                        setNewRoleInput("");
                      }
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(roleOptions as any[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(roleOptions as any[]).map((r: any) => (
                      <span key={r.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full">
                        {r.label}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-red-500 ml-0.5"
                          onClick={() => deleteRoleOption.mutate({ id: r.id })}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {form.targetType === "job" && (
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Select
                  value={form.targetValue || "__none__"}
                  onValueChange={(v) => setField("targetValue", v === "__none__" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job title..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Select job title —</SelectItem>
                    {(jobOptions as any[]).map((j: any) => (
                      <SelectItem key={j.id} value={j.label}>{j.label}</SelectItem>
                    ))}
                    {uniqueJobs.filter(j => !(jobOptions as any[]).some((o: any) => o.label === j)).map((j) => (
                      <SelectItem key={j} value={j}>{j}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newJobInput}
                    onChange={e => setNewJobInput(e.target.value)}
                    placeholder="Add new job option..."
                    className="h-8 text-sm"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newJobInput.trim()) {
                        createJobOption.mutate({ projectId, label: newJobInput.trim() });
                        setNewJobInput("");
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 shrink-0"
                    disabled={!newJobInput.trim() || createJobOption.isPending}
                    onClick={() => {
                      if (newJobInput.trim()) {
                        createJobOption.mutate({ projectId, label: newJobInput.trim() });
                        setNewJobInput("");
                      }
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {(jobOptions as any[]).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(jobOptions as any[]).map((j: any) => (
                      <span key={j.id} className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full">
                        {j.label}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-red-500 ml-0.5"
                          onClick={() => deleteJobOption.mutate({ id: j.id })}
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Information Needed ── */}
            <div className="space-y-1.5">
              <Label>Information Needed</Label>
              <Textarea
                rows={3}
                value={form.informationNeeded}
                onChange={(e) => setField("informationNeeded", e.target.value)}
                placeholder="What information does this stakeholder/group need?"
              />
            </div>

            {/* ── Acknowledgment Needed ── */}
            <div className="flex items-center gap-3 py-1">
              <Checkbox
                id="ack-needed"
                checked={form.acknowledgmentNeeded}
                onCheckedChange={(v) => setField("acknowledgmentNeeded", !!v)}
              />
              <label htmlFor="ack-needed" className="text-sm font-medium cursor-pointer select-none">
                Acknowledgment Needed
                <span className="text-muted-foreground font-normal ml-1.5 text-xs">
                  (recipient must confirm receipt)
                </span>
              </label>
            </div>

            {/* ── Communication Needed List ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Communication Needed</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={addCommNeedRow}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                What we need from or need to communicate to this stakeholder/group.
              </p>
              {form.commNeeded.length === 0 ? (
                <div className="border border-dashed rounded-md py-4 text-center text-xs text-muted-foreground">
                  No communication items yet. Click "Add Line" to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.commNeeded.map((item) => (
                    <div key={item.localId} className="flex items-start gap-2 p-2 border rounded-md bg-muted/30">
                      <div className="flex-1 space-y-1.5">
                        <Input
                          value={item.description}
                          onChange={e => updateCommNeedRow(item.localId, "description", e.target.value)}
                          placeholder="Describe what needs to be communicated..."
                          className="h-8 text-sm"
                        />
                        <div className="flex items-center gap-2">
                          <Select
                            value={item.commType}
                            onValueChange={v => updateCommNeedRow(item.localId, "commType", v)}
                          >
                            <SelectTrigger className="h-7 text-xs w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Push">Push</SelectItem>
                              <SelectItem value="Pull">Pull</SelectItem>
                              <SelectItem value="Interactive">Interactive</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={item.periodic || "__none__"}
                            onValueChange={v => updateCommNeedRow(item.localId, "periodic", v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger className="h-7 text-xs flex-1">
                              <SelectValue placeholder="Periodic..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— No period —</SelectItem>
                              {FREQUENCY_OPTIONS.map(f => (
                                <SelectItem key={f} value={f}>{f}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs shrink-0 mt-0.5 px-2 font-medium"
                        title="Mark line as saved"
                        onClick={() => {
                          if (item.description.trim()) {
                            toast.success("Line noted — click Update to persist all changes");
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0 mt-0.5"
                        onClick={() => removeCommNeedRow(item.localId)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Inputs Needed from Stakeholder ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Inputs Needed from Stakeholder</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1"
                  onClick={addInputNeedRow}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Line
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Information, approvals, or data we need to receive from this stakeholder/group.
              </p>
              {form.inputNeeded.length === 0 ? (
                <div className="border border-dashed rounded-md py-4 text-center text-xs text-muted-foreground">
                  No inputs listed yet. Click "Add Line" to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {form.inputNeeded.map((item) => (
                    <div key={item.localId} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                      <Input
                        value={item.description}
                        onChange={e => updateInputNeedRow(item.localId, e.target.value)}
                        placeholder="Describe the input needed from this stakeholder..."
                        className="h-8 text-sm flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-8 text-xs shrink-0 px-2 font-medium"
                        title="Mark line as saved"
                        onClick={() => {
                          if (item.description.trim()) {
                            toast.success("Line noted — click Update to persist all changes");
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        onClick={() => removeInputNeedRow(item.localId)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Preferred Methods ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Preferred Methods</Label>
              </div>
              {/* Dynamic checkboxes from DB */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                {(methodOptions as any[]).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-1.5 group">
                    <label className="flex items-center gap-2 cursor-pointer text-sm select-none flex-1">
                      <Checkbox
                        checked={form.preferredMethods.includes(m.label)}
                        onCheckedChange={() => toggleMethod(m.label)}
                      />
                      {m.label}
                    </label>
                    <button
                      type="button"
                      title="Remove method"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-opacity text-xs leading-none"
                      onClick={() => {
                        deleteMethodOption.mutate({ id: m.id });
                        // Also uncheck if currently selected
                        if (form.preferredMethods.includes(m.label)) {
                          toggleMethod(m.label);
                        }
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {/* Add new method — prominent row */}
              <div className="flex items-center gap-2 mt-3 p-2 border border-dashed rounded-md bg-muted/20">
                <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  value={newMethodInput}
                  onChange={e => setNewMethodInput(e.target.value)}
                  placeholder="Type new method name and press Enter or click Add..."
                  className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 px-0"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newMethodInput.trim()) {
                      createMethodOption.mutate({ projectId, label: newMethodInput.trim() });
                      setNewMethodInput("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="h-8 shrink-0 gap-1"
                  disabled={!newMethodInput.trim() || createMethodOption.isPending}
                  onClick={() => {
                    if (newMethodInput.trim()) {
                      createMethodOption.mutate({ projectId, label: newMethodInput.trim() });
                      setNewMethodInput("");
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Hover a method checkbox to reveal the remove (×) button.</p>
            </div>

            {/* ── Notes ── */}
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                rows={3}
                value={form.textNote}
                onChange={(e) => setField("textNote", e.target.value)}
                placeholder="Additional notes..."
              />
            </div>

            {/* ── Escalation Procedures ── */}
            <div className="space-y-1.5">
              <Label>Escalation Procedures</Label>
              <Textarea
                rows={3}
                value={form.escalationProcedures}
                onChange={(e) => setField("escalationProcedures", e.target.value)}
                placeholder="Describe escalation steps if communication breaks down..."
              />
            </div>

            {/* ── Responsible (stakeholder dropdown) ── */}
            <div className="space-y-1.5">
              <Label>Responsible</Label>
              <Select
                value={form.responsibleStakeholderId != null ? String(form.responsibleStakeholderId) : "__none__"}
                onValueChange={(v) =>
                  setField("responsibleStakeholderId", v === "__none__" ? null : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select responsible person..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— Not assigned —</SelectItem>
                  {(stakeholders as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      <span className="font-medium">{s.fullName}</span>
                      {(s.role || s.job) && (
                        <span className="text-muted-foreground ml-1.5 text-xs">
                          {[s.role, s.job].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
