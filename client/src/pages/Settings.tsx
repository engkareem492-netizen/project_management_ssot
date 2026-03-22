import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Settings as SettingsIcon, Save, Plus, Edit, Trash2, Hash, AlertCircle, Sun, Moon, Monitor, Lock, Unlock, KeyRound, ShieldOff, ShieldCheck, AlertTriangle, Copy, CheckSquare, Square, Pencil, DollarSign } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useProject } from "@/contexts/ProjectContext";
import { ThemeSelector } from "@/components/ThemeSelector";
import CollaborationTab from "@/components/CollaborationTab";
import { useLocation } from "wouter";
import { CURRENCIES } from "@/lib/currencies";

interface IdConfigEdit {
  prefix: string;
  startNumber: number;
  minNumber: number;
  maxNumber: number;
  padLength: number;
}

function ThemeSelectorInline() {
  const { theme, toggleTheme, switchable } = useTheme();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => toggleTheme && theme === 'dark' && toggleTheme()}
          className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
            theme === 'light'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Sun className="w-8 h-8" />
          <span className="font-medium">Light Mode</span>
          <span className="text-xs text-muted-foreground">Bright and clean interface</span>
        </button>
        <button
          onClick={() => toggleTheme && theme === 'light' && toggleTheme()}
          className={`flex flex-col items-center gap-3 p-6 rounded-lg border-2 transition-all ${
            theme === 'dark'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <Moon className="w-8 h-8" />
          <span className="font-medium">Dark Mode</span>
          <span className="text-xs text-muted-foreground">Easy on the eyes</span>
        </button>
      </div>
      {!switchable && (
        <p className="text-sm text-muted-foreground text-center">
          Theme switching is currently disabled. Contact administrator to enable.
        </p>
      )}
    </div>
  );
}

const COPYABLE_ENTITIES = [
  { key: "stakeholders", label: "Stakeholders (team members)" },
  { key: "requirements", label: "Requirements" },
  { key: "tasks", label: "Tasks" },
  { key: "issues", label: "Issues" },
  { key: "dependencies", label: "Dependencies" },
  { key: "assumptions", label: "Assumptions" },
  { key: "deliverables", label: "Deliverables" },
  { key: "taskGroups", label: "Task Groups" },
  { key: "issueGroups", label: "Issue Groups" },
];

const DOMAIN_FIELD_KEYS: Record<string, string[]> = {
  tasks: ["status", "priority", "type"],
  issues: ["status", "priority", "type"],
  risks: ["status", "probability", "impact", "category", "response_strategy"],
  requirements: ["status", "priority", "type"],
  deliverables: ["status", "type"],
  change_requests: ["status", "impact", "type"],
  milestones: ["status"],
  budget: ["category"],
  stakeholders: ["engagement_status", "communication_frequency", "communication_channel"],
  test_cases: ["status", "priority"],
  assumptions: ["status", "impact"],
};

const DOMAIN_LABELS: Record<string, string> = {
  tasks: "Tasks",
  issues: "Issues",
  risks: "Risks",
  requirements: "Requirements",
  deliverables: "Deliverables",
  change_requests: "Change Requests",
  milestones: "Milestones",
  budget: "Budget",
  stakeholders: "Stakeholders",
  test_cases: "Test Cases",
  assumptions: "Assumptions",
};

function DropdownOptionsTab({ projectId }: { projectId: number }) {
  const [selectedDomain, setSelectedDomain] = useState("tasks");
  const [selectedFieldKey, setSelectedFieldKey] = useState("status");
  const [newValue, setNewValue] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editColor, setEditColor] = useState("");
  const utils = trpc.useUtils();

  const fieldKeys = DOMAIN_FIELD_KEYS[selectedDomain] ?? [];

  useEffect(() => {
    setSelectedFieldKey(fieldKeys[0] ?? "status");
  }, [selectedDomain]);

  const { data: options = [], isLoading } = trpc.dropdownRegistry.list.useQuery(
    { projectId, domain: selectedDomain, fieldKey: selectedFieldKey },
    { enabled: !!projectId && !!selectedDomain && !!selectedFieldKey }
  );

  const addMutation = trpc.dropdownRegistry.add.useMutation({
    onSuccess: () => {
      utils.dropdownRegistry.list.invalidate();
      setNewValue("");
    },
  });

  const updateMutation = trpc.dropdownRegistry.update.useMutation({
    onSuccess: () => {
      utils.dropdownRegistry.list.invalidate();
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.dropdownRegistry.delete.useMutation({
    onSuccess: () => utils.dropdownRegistry.list.invalidate(),
  });

  return (
    <div className="flex gap-6 h-full min-h-[500px]">
      {/* Domain selector */}
      <div className="w-48 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Domains</p>
        <div className="flex flex-col gap-1">
          {Object.entries(DOMAIN_LABELS).map(([domain, label]) => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedDomain === domain ? "bg-primary text-primary-foreground font-medium" : "hover:bg-accent text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Options editor */}
      <div className="flex-1">
        {/* Field key tabs */}
        <div className="flex gap-1 mb-4 border-b pb-2">
          {fieldKeys.map((fk) => (
            <button
              key={fk}
              onClick={() => setSelectedFieldKey(fk)}
              className={`px-3 py-1.5 rounded-t text-sm capitalize transition-colors ${selectedFieldKey === fk ? "bg-accent font-medium" : "hover:bg-accent/50 text-muted-foreground"}`}
            >
              {fk.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Options list */}
        <div className="space-y-2 mb-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : options.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No options yet. Add one below.</p>
          ) : (
            options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-3 p-2 border rounded-md hover:bg-accent/30">
                {editingId === opt.id ? (
                  <>
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="h-6 w-8 rounded cursor-pointer border"
                    />
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 text-sm border rounded px-2 py-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") updateMutation.mutate({ id: opt.id, value: editValue, color: editColor });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      autoFocus
                    />
                    <button onClick={() => updateMutation.mutate({ id: opt.id, value: editValue, color: editColor })} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded">Save</button>
                    <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border rounded">Cancel</button>
                  </>
                ) : (
                  <>
                    <div
                      className="h-4 w-4 rounded-full shrink-0 border"
                      style={{ backgroundColor: opt.color ?? "#6b7280" }}
                    />
                    <span className="flex-1 text-sm">{opt.value}</span>
                    {opt.isDefault && <span className="text-[10px] text-muted-foreground border rounded px-1">default</span>}
                    <button
                      onClick={() => { setEditingId(opt.id); setEditValue(opt.value); setEditColor(opt.color ?? "#6b7280"); }}
                      className="text-muted-foreground hover:text-foreground p-1 rounded"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate({ id: opt.id })}
                      className="text-muted-foreground hover:text-destructive p-1 rounded"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add new option */}
        <div className="flex items-center gap-2 p-2 border rounded-md border-dashed">
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="h-7 w-10 rounded cursor-pointer border"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="New option value..."
            className="flex-1 text-sm border rounded px-2 py-1.5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newValue.trim()) {
                addMutation.mutate({ projectId, domain: selectedDomain, fieldKey: selectedFieldKey, value: newValue.trim(), color: newColor });
              }
            }}
          />
          <button
            onClick={() => {
              if (newValue.trim()) {
                addMutation.mutate({ projectId, domain: selectedDomain, fieldKey: selectedFieldKey, value: newValue.trim(), color: newColor });
              }
            }}
            disabled={!newValue.trim() || addMutation.isPending}
            className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm disabled:opacity-50"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("id-config");

  // Password management state
  const [pwNewPassword, setPwNewPassword] = useState("");
  const [pwConfirmPassword, setPwConfirmPassword] = useState("");
  const [pwShowForm, setPwShowForm] = useState(false);

  // Delete project state
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [deleteConfirmCode, setDeleteConfirmCode] = useState("");
  const [deleteCaptchaCode, setDeleteCaptchaCode] = useState("");

  // Copy from project state
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [sourceProjectId, setSourceProjectId] = useState<number | null>(null);
  const [sourcePassword, setSourcePassword] = useState("");
  const [copyEntities, setCopyEntities] = useState<Record<string, boolean>>({
    stakeholders: true, requirements: false, tasks: false, issues: false,
    dependencies: false, assumptions: false, deliverables: false,
    taskGroups: true, issueGroups: true,
  });
  const [copyLoading, setCopyLoading] = useState(false);

  // Work-week calendar configuration
  const [wwSaved, setWwSaved] = useState(false);
  const [wwForm, setWwForm] = useState(() => {
    try {
      const saved = localStorage.getItem(`workWeek_${currentProjectId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { workDays: [0, 1, 2, 3, 4], workStartHour: 8, workEndHour: 17, endOfWeekDay: 4 };
  });

  const projectQuery = trpc.projects.list.useQuery();
  const currentProject = projectQuery.data?.find(p => p.id === currentProjectId);
  const isCreator = user && currentProject?.createdBy === user.id;

  const setPasswordMutation = trpc.projects.setPassword.useMutation({
    onSuccess: (data) => {
      if (data.hasPassword) {
        toast.success("Password set successfully!");
      } else {
        toast.success("Password removed. Project is now open access.");
      }
      projectQuery.refetch();
      setPwNewPassword("");
      setPwConfirmPassword("");
      setPwShowForm(false);
    },
    onError: (error) => toast.error(`Failed to update password: ${error.message}`),
  });

  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully.");
      setCurrentProjectId(null);
      setShowDeleteProject(false);
      navigate("/");
    },
    onError: (err) => toast.error(`Failed to delete: ${err.message}`),
  });

  // Project currency
  const { data: budgetSummary, refetch: refetchBudget } = trpc.budget.getSummary.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const [projectCurrency, setProjectCurrency] = useState("USD");
  useEffect(() => {
    if (budgetSummary?.budget?.currency) {
      setProjectCurrency(budgetSummary.budget.currency);
    }
  }, [budgetSummary?.budget?.currency]);
  const upsertBudgetMutation = trpc.budget.upsertBudget.useMutation({
    onSuccess: () => {
      toast.success("Project currency updated");
      refetchBudget();
    },
    onError: (err) => toast.error(`Failed to update currency: ${err.message}`),
  });

  // Program / Portfolio / Logo
  const [programName, setProgramName] = useState("");
  const [portfolioName, setPortfolioName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  useEffect(() => {
    if (currentProject) {
      setProgramName((currentProject as any).programName ?? "");
      setPortfolioName((currentProject as any).portfolioName ?? "");
      setLogoUrl((currentProject as any).logoUrl ?? "");
    }
  }, [currentProject?.id]);
  const updateProjectMutation = trpc.projects.update.useMutation({
    onSuccess: () => {
      toast.success("Project settings updated");
      projectQuery.refetch();
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });

  const exportDataMutation = trpc.projects.exportData.useMutation();
  const importDataMutation = trpc.projects.importData.useMutation({
    onSuccess: () => {
      toast.success("Elements copied successfully!");
      setShowCopyDialog(false);
      setSourceProjectId(null);
      setSourcePassword("");
      setCopyLoading(false);
    },
    onError: (err) => { toast.error(`Copy failed: ${err.message}`); setCopyLoading(false); },
  });

  const handleCopyFromProject = async () => {
    if (!sourceProjectId || !currentProjectId) return;
    setCopyLoading(true);
    try {
      const sourceData = await exportDataMutation.mutateAsync({
        projectId: sourceProjectId,
        password: sourcePassword || undefined,
      });
      await importDataMutation.mutateAsync({
        targetProjectId: currentProjectId,
        sourceData,
        selectedEntities: copyEntities,
      });
    } catch {
      setCopyLoading(false);
    }
  };

  const handleSetPassword = () => {
    if (!currentProjectId) return;
    if (!pwNewPassword) { toast.error("Please enter a password"); return; }
    if (pwNewPassword !== pwConfirmPassword) { toast.error("Passwords do not match"); return; }
    if (pwNewPassword.length < 4) { toast.error("Password must be at least 4 characters"); return; }
    setPasswordMutation.mutate({ projectId: currentProjectId, newPassword: pwNewPassword });
  };

  const handleRemovePassword = () => {
    if (!currentProjectId) return;
    if (!confirm("Remove password protection? Anyone will be able to open this project directly.")) return;
    setPasswordMutation.mutate({ projectId: currentProjectId, newPassword: null });
  };
  const [optionsTab, setOptionsTab] = useState("status");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [optionFormData, setOptionFormData] = useState({ name: "", isComplete: false });

  // ID Config queries and state
  const { data: idConfigs, isLoading: idConfigsLoading } = trpc.idConfig.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const updateConfig = trpc.idConfig.update.useMutation();
  const initDefaults = trpc.idConfig.initDefaults.useMutation();
  const utils = trpc.useUtils();
  const [editingConfigs, setEditingConfigs] = useState<Record<string, IdConfigEdit>>({});

  const handleInitDefaults = async () => {
    if (!currentProjectId) return;
    try {
      const result = await initDefaults.mutateAsync({ projectId: currentProjectId });
      await utils.idConfig.list.invalidate();
      toast.success(`Created ${result.created} default ID configurations`);
    } catch (err) {
      toast.error("Failed to initialize default configurations");
    }
  };

  // Dropdown options queries
  const { data: statusOptions, refetch: refetchStatus } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions, refetch: refetchPriority } = trpc.dropdownOptions.priority.getAll.useQuery();
  const { data: typeOptions, refetch: refetchType } = trpc.dropdownOptions.type.getAll.useQuery();
  const { data: categoryOptions, refetch: refetchCategory } = trpc.dropdownOptions.category.getAll.useQuery();

  // Task Groups and Issue Groups queries
  const { data: taskGroupsData, refetch: refetchTaskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: issueGroupsData, refetch: refetchIssueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  // Issue Types, Deliverable Types, KB Types, KB Components queries
  const { data: issueTypesData, refetch: refetchIssueTypes } = trpc.issueTypes.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: deliverableTypesData, refetch: refetchDeliverableTypes } = trpc.deliverableTypes.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: kbTypesData, refetch: refetchKBTypes } = trpc.knowledgeBase.types.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: kbComponentsData, refetch: refetchKBComponents } = trpc.knowledgeBase.components.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  // Risk dropdown queries
  const { data: riskTypesData, refetch: refetchRiskTypes } = trpc.risks.types.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: riskStatusData, refetch: refetchRiskStatus } = trpc.risks.status.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: responseStrategyData, refetch: refetchResponseStrategy } = trpc.risks.strategy.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  // Risk Types mutations
  const createRiskTypeMutation = trpc.risks.types.create.useMutation({
    onSuccess: () => {
      toast.success("Risk Type created successfully");
      refetchRiskTypes();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateRiskTypeMutation = trpc.risks.types.update.useMutation({
    onSuccess: () => {
      toast.success("Risk Type updated successfully");
      refetchRiskTypes();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteRiskTypeMutation = trpc.risks.types.delete.useMutation({
    onSuccess: () => {
      toast.success("Risk Type deleted successfully");
      refetchRiskTypes();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // Risk Status mutations
  const createRiskStatusMutation = trpc.risks.status.create.useMutation({
    onSuccess: () => {
      toast.success("Risk Status created successfully");
      refetchRiskStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateRiskStatusMutation = trpc.risks.status.update.useMutation({
    onSuccess: () => {
      toast.success("Risk Status updated successfully");
      refetchRiskStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteRiskStatusMutation = trpc.risks.status.delete.useMutation({
    onSuccess: () => {
      toast.success("Risk Status deleted successfully");
      refetchRiskStatus();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // Response Strategy mutations
  const createResponseStrategyMutation = trpc.risks.strategy.create.useMutation({
    onSuccess: () => {
      toast.success("Response Strategy created successfully");
      refetchResponseStrategy();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateResponseStrategyMutation = trpc.risks.strategy.update.useMutation({
    onSuccess: () => {
      toast.success("Response Strategy updated successfully");
      refetchResponseStrategy();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteResponseStrategyMutation = trpc.risks.strategy.delete.useMutation({
    onSuccess: () => {
      toast.success("Response Strategy deleted successfully");
      refetchResponseStrategy();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // Task Groups mutations
  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Task Group created successfully");
      refetchTaskGroups();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateTaskGroupMutation = trpc.dropdownOptions.taskGroups.update.useMutation({
    onSuccess: () => {
      toast.success("Task Group updated successfully");
      refetchTaskGroups();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteTaskGroupMutation = trpc.dropdownOptions.taskGroups.delete.useMutation({
    onSuccess: () => {
      toast.success("Task Group deleted successfully");
      refetchTaskGroups();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // Issue Groups mutations
  const createIssueGroupMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Issue Group created successfully");
      refetchIssueGroups();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateIssueGroupMutation = trpc.dropdownOptions.issueGroups.update.useMutation({
    onSuccess: () => {
      toast.success("Issue Group updated successfully");
      refetchIssueGroups();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteIssueGroupMutation = trpc.dropdownOptions.issueGroups.delete.useMutation({
    onSuccess: () => {
      toast.success("Issue Group deleted successfully");
      refetchIssueGroups();
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // Dropdown options mutations
  const createStatusMutation = trpc.dropdownOptions.status.create.useMutation({
    onSuccess: () => {
      toast.success("Status option created successfully");
      refetchStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateStatusMutation = trpc.dropdownOptions.status.update.useMutation({
    onSuccess: () => {
      toast.success("Status option updated successfully");
      refetchStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const toggleStatusCompleteMutation = trpc.dropdownOptions.status.update.useMutation({
    onSuccess: () => { refetchStatus(); },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteStatusMutation = trpc.dropdownOptions.status.delete.useMutation({
    onSuccess: () => {
      toast.success("Status option deleted successfully");
      refetchStatus();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createPriorityMutation = trpc.dropdownOptions.priority.create.useMutation({
    onSuccess: () => {
      toast.success("Priority option created successfully");
      refetchPriority();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updatePriorityMutation = trpc.dropdownOptions.priority.update.useMutation({
    onSuccess: () => {
      toast.success("Priority option updated successfully");
      refetchPriority();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deletePriorityMutation = trpc.dropdownOptions.priority.delete.useMutation({
    onSuccess: () => {
      toast.success("Priority option deleted successfully");
      refetchPriority();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createTypeMutation = trpc.dropdownOptions.type.create.useMutation({
    onSuccess: () => {
      toast.success("Type option created successfully");
      refetchType();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateTypeMutation = trpc.dropdownOptions.type.update.useMutation({
    onSuccess: () => {
      toast.success("Type option updated successfully");
      refetchType();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteTypeMutation = trpc.dropdownOptions.type.delete.useMutation({
    onSuccess: () => {
      toast.success("Type option deleted successfully");
      refetchType();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createCategoryMutation = trpc.dropdownOptions.category.create.useMutation({
    onSuccess: () => {
      toast.success("Category option created successfully");
      refetchCategory();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateCategoryMutation = trpc.dropdownOptions.category.update.useMutation({
    onSuccess: () => {
      toast.success("Category option updated successfully");
      refetchCategory();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteCategoryMutation = trpc.dropdownOptions.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Category option deleted successfully");
      refetchCategory();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // ID Config functions
  const handleSaveIdConfig = async (entityType: string) => {
    const config = editingConfigs[entityType];
    if (!config) return;

    // Validate number range
    if (config.minNumber >= config.maxNumber) {
      toast.error("Minimum number must be less than maximum number");
      return;
    }

    if (config.startNumber < config.minNumber || config.startNumber > config.maxNumber) {
      toast.error(`Start number must be between ${config.minNumber} and ${config.maxNumber}`);
      return;
    }

    if (config.padLength < 1 || config.padLength > 10) {
      toast.error("Padding length must be between 1 and 10");
      return;
    }

    try {
      await updateConfig.mutateAsync({
        entityType,
        prefix: config.prefix,
        startNumber: config.startNumber,
        minNumber: config.minNumber,
        maxNumber: config.maxNumber,
        padLength: config.padLength,
        projectId: currentProjectId || 1,
      });
      
      await utils.idConfig.list.invalidate();
      toast.success(`Updated ${entityType} configuration successfully`);
      
      setEditingConfigs(prev => {
        const newState = { ...prev };
        delete newState[entityType];
        return newState;
      });
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const getEditingConfig = (entityType: string, currentConfig: any): IdConfigEdit => {
    return editingConfigs[entityType] || {
      prefix: currentConfig.prefix,
      startNumber: currentConfig.currentNumber + 1,
      minNumber: currentConfig.minNumber || 1,
      maxNumber: currentConfig.maxNumber || 9999,
      padLength: currentConfig.padLength || 4,
    };
  };

  const updateEditingConfig = (entityType: string, field: string, value: string | number) => {
    const currentConfig = idConfigs?.find(c => c.entityType === entityType);
    setEditingConfigs(prev => ({
      ...prev,
      [entityType]: {
        ...getEditingConfig(entityType, currentConfig),
        [field]: value,
      },
    }));
  };

  const getNextIdPreview = (config: any) => {
    const editingConfig = getEditingConfig(config.entityType, config);
    const nextNumber = config.currentNumber + 1;
    const padLength = editingConfig.padLength || 4;
    return `${editingConfig.prefix}${String(nextNumber).padStart(padLength, '0')}`;
  };

  const getRangeUsagePercent = (config: any) => {
    const min = config.minNumber || 1;
    const max = config.maxNumber || 9999;
    const current = config.currentNumber || 0;
    const range = max - min + 1;
    const used = current - min + 1;
    return Math.min(100, Math.max(0, (used / range) * 100));
  };

  // Dropdown options functions
  const resetOptionForm = () => {
    setOptionFormData({ name: "", isComplete: false });
    setEditingItem(null);
  };

  const handleCreateOption = () => {
    if (!optionFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    switch (optionsTab) {
      case "status":
        createStatusMutation.mutate({ value: optionFormData.name, isComplete: optionFormData.isComplete });
        break;
      case "priority":
        createPriorityMutation.mutate({ value: optionFormData.name });
        break;
      case "type":
        createTypeMutation.mutate({ value: optionFormData.name });
        break;
      case "category":
        createCategoryMutation.mutate({ value: optionFormData.name });
        break;
      case "riskTypes":
        if (currentProjectId) createRiskTypeMutation.mutate({ projectId: currentProjectId, name: optionFormData.name });
        break;
      case "riskStatus":
        if (currentProjectId) createRiskStatusMutation.mutate({ projectId: currentProjectId, name: optionFormData.name });
        break;
      case "responseStrategy":
        if (currentProjectId) createResponseStrategyMutation.mutate({ projectId: currentProjectId, name: optionFormData.name });
        break;
    }
  };

  const handleUpdateOption = () => {
    if (!editingItem || !optionFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    switch (optionsTab) {
      case "status":
        updateStatusMutation.mutate({ id: editingItem.id, value: optionFormData.name, isComplete: optionFormData.isComplete });
        break;
      case "priority":
        updatePriorityMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "type":
        updateTypeMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "category":
        updateCategoryMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "riskTypes":
        updateRiskTypeMutation.mutate({ id: editingItem.id, name: optionFormData.name });
        break;
      case "riskStatus":
        updateRiskStatusMutation.mutate({ id: editingItem.id, name: optionFormData.name });
        break;
      case "responseStrategy":
        updateResponseStrategyMutation.mutate({ id: editingItem.id, name: optionFormData.name });
        break;
    }
  };

  const handleDeleteOption = () => {
    if (!deletingItem) return;

    switch (optionsTab) {
      case "status":
        deleteStatusMutation.mutate({ id: deletingItem.id });
        break;
      case "priority":
        deletePriorityMutation.mutate({ id: deletingItem.id });
        break;
      case "type":
        deleteTypeMutation.mutate({ id: deletingItem.id });
        break;
      case "category":
        deleteCategoryMutation.mutate({ id: deletingItem.id });
        break;
      case "riskTypes":
        deleteRiskTypeMutation.mutate({ id: deletingItem.id });
        break;
      case "riskStatus":
        deleteRiskStatusMutation.mutate({ id: deletingItem.id });
        break;
      case "responseStrategy":
        deleteResponseStrategyMutation.mutate({ id: deletingItem.id });
        break;
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setOptionFormData({
      name: item.value || item.name,
      isComplete: item.isComplete ?? false,
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetOptionForm();
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const renderOptionsTable = (options: any[] | undefined, type: string) => {
    if (!options) return <div className="text-center py-8">Loading...</div>;
    const isStatus = type === "status";
    const colSpan = isStatus ? 4 : 3;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {isStatus && <TableHead className="w-36">Counts as Complete</TableHead>}
            <TableHead>Usage Count</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.length === 0 ? (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
                No {type} options configured. Click "Add New" to create one.
              </TableCell>
            </TableRow>
          ) : (
            options.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-medium">{option.value}</TableCell>
                {isStatus && (
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!option.isComplete}
                        onCheckedChange={(checked) =>
                          toggleStatusCompleteMutation.mutate({ id: option.id, isComplete: checked })
                        }
                      />
                      {option.isComplete ? (
                        <span className="text-xs text-green-600 font-medium">Complete</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">In Progress</span>
                      )}
                    </div>
                  </TableCell>
                )}
                <TableCell>
                  <Badge variant="secondary">{option.usageCount || 0}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(option)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(option)}
                      disabled={(option.usageCount || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  if (idConfigsLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-gray-500" />
            Settings
          </h1>
          <p className="text-gray-600 text-sm mt-1">Configure ID formats, number ranges, and manage dropdown options for the entire system</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="id-config">ID Configuration</TabsTrigger>
          <TabsTrigger value="dropdown-options">Dropdown Options</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
        </TabsList>

        {/* ID Configuration Tab */}
        <TabsContent value="id-config" className="space-y-6">
          <div className="bg-muted/50 border rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">ID Number Range Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the prefix, number range (min/max), and padding for auto-generated IDs. 
                  The system will generate IDs like PREFIX + padded number (e.g., REQ-0001).
                </p>
              </div>
            </div>
          </div>

          {(!idConfigs || idConfigs.length === 0) && !idConfigsLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Hash className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No ID Configurations Found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  This project doesn't have any ID configurations yet. Initialize defaults to set up standard prefixes for all entity types.
                </p>
                <Button onClick={handleInitDefaults} disabled={initDefaults.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  {initDefaults.isPending ? "Initializing..." : "Initialize Default Configurations"}
                </Button>
              </CardContent>
            </Card>
          )}

          {idConfigs?.map((config) => {
            const editing = getEditingConfig(config.entityType, config);
            const hasChanges = editingConfigs[config.entityType] !== undefined;
            const usagePercent = getRangeUsagePercent(config);
            const isNearLimit = usagePercent > 80;

            return (
              <Card key={config.id} className={isNearLimit ? "border-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.entityType}
                        {isNearLimit && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Near Limit
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Next ID: <span className="font-mono font-bold text-primary">{getNextIdPreview(config)}</span>
                        {' '} | Current: <span className="font-mono">{config.currentNumber}</span>
                        {' '} | Range: <span className="font-mono">{config.minNumber || 1} - {config.maxNumber || 9999}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Usage</div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isNearLimit ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{usagePercent.toFixed(1)}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor={`prefix-${config.id}`}>Prefix</Label>
                      <Input
                        id={`prefix-${config.id}`}
                        value={editing.prefix}
                        onChange={(e) => updateEditingConfig(config.entityType, 'prefix', e.target.value)}
                        placeholder="REQ-"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">e.g., REQ-, TASK-</p>
                    </div>

                    <div>
                      <Label htmlFor={`min-${config.id}`}>Min Number</Label>
                      <Input
                        id={`min-${config.id}`}
                        type="number"
                        value={editing.minNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'minNumber', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Starting range</p>
                    </div>

                    <div>
                      <Label htmlFor={`max-${config.id}`}>Max Number</Label>
                      <Input
                        id={`max-${config.id}`}
                        type="number"
                        value={editing.maxNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'maxNumber', parseInt(e.target.value) || 9999)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ending range</p>
                    </div>

                    <div>
                      <Label htmlFor={`pad-${config.id}`}>Pad Length</Label>
                      <Input
                        id={`pad-${config.id}`}
                        type="number"
                        value={editing.padLength}
                        onChange={(e) => updateEditingConfig(config.entityType, 'padLength', parseInt(e.target.value) || 4)}
                        min="1"
                        max="10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Zero padding</p>
                    </div>

                    <div>
                      <Label htmlFor={`start-${config.id}`}>Reset To</Label>
                      <Input
                        id={`start-${config.id}`}
                        type="number"
                        value={editing.startNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'startNumber', parseInt(e.target.value) || 1)}
                        min={editing.minNumber}
                        max={editing.maxNumber}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Next ID number</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Preview: <span className="font-mono font-bold">{editing.prefix}{String(editing.startNumber).padStart(editing.padLength, '0')}</span>
                    </div>
                    {hasChanges && (
                      <Button onClick={() => handleSaveIdConfig(config.entityType)} disabled={updateConfig.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Dropdown Options Tab */}
        <TabsContent value="dropdown-options" className="mt-0">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Dropdown Options</h3>
            <p className="text-sm text-muted-foreground mb-4">Customize all dropdown options across the system for this project.</p>
            <DropdownOptionsTab projectId={currentProjectId!} />
          </div>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5" />
                Task Groups & Issue Groups
              </CardTitle>
              <CardDescription>
                Manage Task Groups and Issue Groups used across requirements, tasks, and issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Task Groups Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Task Groups</h3>
                  <Button size="sm" onClick={() => {
                    const name = prompt("Enter new Task Group name:");
                    if (name && currentProjectId) {
                      createTaskGroupMutation.mutate({ projectId: currentProjectId, name, description: "" });
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task Group
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskGroupsData?.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-mono text-sm">{group.idCode}</TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newName = prompt("Enter new name:", group.name);
                                if (newName && newName !== group.name) {
                                  updateTaskGroupMutation.mutate({ id: group.id, data: { name: newName, description: group.description || "" } });
                                }
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete Task Group "${group.name}"?`)) {
                                  deleteTaskGroupMutation.mutate({ id: group.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Issue Groups Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Issue Groups</h3>
                  <Button size="sm" onClick={() => {
                    const name = prompt("Enter new Issue Group name:");
                    if (name && currentProjectId) {
                      createIssueGroupMutation.mutate({ projectId: currentProjectId, name, description: "" });
                    }
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Issue Group
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {issueGroupsData?.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-mono text-sm">{group.idCode}</TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newName = prompt("Enter new name:", group.name);
                                if (newName && newName !== group.name) {
                                  updateIssueGroupMutation.mutate({ id: group.id, data: { name: newName, description: group.description || "" } });
                                }
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Delete Issue Group "${group.name}"?`)) {
                                  deleteIssueGroupMutation.mutate({ id: group.id });
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </TabsContent>

        {/* Collaboration Tab */}
        <TabsContent value="collaboration" className="space-y-6">
          <CollaborationTab projectId={currentProjectId!} />
        </TabsContent>

        {/* Theme Tab */}
        <TabsContent value="theme" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5" />
                Theme Settings
              </CardTitle>
              <CardDescription>
                Choose your preferred color theme for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ThemeSelectorInline />
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium mb-4">Color Palette</h3>
                <ThemeSelector />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Tab */}
        <TabsContent value="project" className="space-y-6">

          {/* Project Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Project Currency
              </CardTitle>
              <CardDescription>
                Set the main currency used across all financial objects in this project (Budget, Resources, costs, etc.).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <Label className="text-sm mb-1.5 block">Currency</Label>
                  <Select
                    value={projectCurrency}
                    onValueChange={setProjectCurrency}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(({ code, label }) => (
                        <SelectItem key={code} value={code}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-6">
                  <Button
                    onClick={() => {
                      if (!currentProjectId) return;
                      upsertBudgetMutation.mutate({
                        projectId: currentProjectId,
                        totalBudget: budgetSummary?.budget?.totalBudget ?? "0",
                        currency: projectCurrency,
                        notes: budgetSummary?.budget?.notes ?? undefined,
                      });
                    }}
                    disabled={upsertBudgetMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Currency
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This currency is used in the Budget page, resource cost rates, and all financial reporting across the project.
              </p>
            </CardContent>
          </Card>

          {/* Project Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Project Logo
              </CardTitle>
              <CardDescription>
                Upload a logo for this project. It will appear in the sidebar header and periodic reports.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <img src={logoUrl} alt="Project logo" className="w-16 h-16 object-contain rounded border" />
                )}
                <div className="space-y-2 flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Image must be under 2 MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const result = ev.target?.result as string;
                        setLogoUrl(result);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">PNG, JPG, SVG — max 2 MB</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => {
                    if (!currentProjectId) return;
                    updateProjectMutation.mutate({ projectId: currentProjectId, logoUrl: logoUrl || null });
                  }}
                  disabled={updateProjectMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Logo
                </Button>
                {logoUrl && (
                  <Button variant="outline" onClick={() => {
                    setLogoUrl("");
                    if (currentProjectId) updateProjectMutation.mutate({ projectId: currentProjectId, logoUrl: null });
                  }}>
                    Remove Logo
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Program / Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="w-5 h-5 text-primary" />
                Program &amp; Portfolio
              </CardTitle>
              <CardDescription>
                Assign this project to a Program or Portfolio for higher-level grouping and resource pooling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Program Name</Label>
                  <Input value={programName} onChange={e => setProgramName(e.target.value)} placeholder="e.g. Digital Transformation Program" />
                </div>
                <div className="space-y-1">
                  <Label>Portfolio Name</Label>
                  <Input value={portfolioName} onChange={e => setPortfolioName(e.target.value)} placeholder="e.g. IT Portfolio 2026" />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    if (!currentProjectId) return;
                    updateProjectMutation.mutate({ projectId: currentProjectId, programName: programName || null, portfolioName: portfolioName || null });
                  }}
                  disabled={updateProjectMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Program &amp; Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password Protection
              </CardTitle>
              <CardDescription>
                Control who can access this project by setting or removing a password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current status */}
              <div className="flex items-center gap-3 p-4 rounded-lg border">
                {currentProject?.hasPassword ? (
                  <>
                    <Lock className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Password Protected</p>
                      <p className="text-sm text-muted-foreground">Users must enter a password to open this project.</p>
                    </div>
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Active</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-5 h-5 text-green-600 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium">Open Access</p>
                      <p className="text-sm text-muted-foreground">Anyone can open this project without a password.</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">No Password</span>
                  </>
                )}
              </div>

              {!isCreator && (
                <p className="text-sm text-muted-foreground italic">Only the project creator can manage password settings.</p>
              )}

              {isCreator && (
                <div className="space-y-4">
                  {/* Toggle form */}
                  {!pwShowForm ? (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPwShowForm(true)}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        {currentProject?.hasPassword ? "Change Password" : "Set Password"}
                      </Button>
                      {currentProject?.hasPassword && (
                        <Button
                          variant="outline"
                          onClick={handleRemovePassword}
                          disabled={setPasswordMutation.isPending}
                          className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                        >
                          <ShieldOff className="w-4 h-4 mr-2" />
                          Remove Password
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4 border rounded-lg p-4">
                      <h4 className="font-medium">
                        {currentProject?.hasPassword ? "Change Password" : "Set a Password"}
                      </h4>
                      <div className="space-y-2">
                        <Label htmlFor="pw-new">New Password</Label>
                        <Input
                          id="pw-new"
                          type="password"
                          value={pwNewPassword}
                          onChange={(e) => setPwNewPassword(e.target.value)}
                          placeholder="Enter new password (min 4 characters)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pw-confirm">Confirm Password</Label>
                        <Input
                          id="pw-confirm"
                          type="password"
                          value={pwConfirmPassword}
                          onChange={(e) => setPwConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPwShowForm(false);
                            setPwNewPassword("");
                            setPwConfirmPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSetPassword}
                          disabled={setPasswordMutation.isPending}
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          {setPasswordMutation.isPending ? "Saving..." : "Save Password"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Copy elements from another project ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Copy Elements from Another Project
              </CardTitle>
              <CardDescription>
                Import stakeholders, requirements, tasks or other elements from a project you have access to.
                If the source project is password-protected, you will be asked for the password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setShowCopyDialog(true)}>
                <Copy className="w-4 h-4 mr-2" />
                Open Copy Wizard
              </Button>
            </CardContent>
          </Card>

          {/* ── Danger Zone ── */}
          {isCreator && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <p className="font-medium text-red-700">Delete This Project</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently deletes this project and ALL its data. This cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => { setDeleteConfirmCode(""); setDeleteCaptchaCode(String(Math.floor(100000 + Math.random() * 900000))); setShowDeleteProject(true); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Work Calendar Configuration Tab */}
        <TabsContent value="calendar-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Work Week Calendar Configuration
              </CardTitle>
              <CardDescription>
                Define the project's working days, hours, and end-of-week day. These settings affect default due dates for recurring tasks (weekly tasks default to end-of-week day, monthly tasks default to end-of-month).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Working Days */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Working Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, idx) => {
                    const isSelected = wwForm.workDays.includes(idx);
                    return (
                      <button
                        key={day}
                        onClick={() => setWwForm((p: any) => ({
                          ...p,
                          workDays: isSelected
                            ? p.workDays.filter((d: number) => d !== idx)
                            : [...p.workDays, idx].sort()
                        }))}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Currently selected: {wwForm.workDays.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</p>
              </div>

              {/* End of Week Day */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">End of Work Week</Label>
                <p className="text-xs text-muted-foreground mb-2">Weekly recurring tasks will default their due date to this day.</p>
                <div className="flex flex-wrap gap-2">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => setWwForm((p: any) => ({ ...p, endOfWeekDay: idx }))}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        wwForm.endOfWeekDay === idx
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Current end-of-week: <strong>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wwForm.endOfWeekDay]}</strong></p>
              </div>

              {/* Work Hours */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Work Hours</Label>
                <div className="flex items-center gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Start Hour</Label>
                    <Input
                      type="number" min={0} max={23}
                      value={wwForm.workStartHour}
                      onChange={(e: any) => setWwForm((p: any) => ({ ...p, workStartHour: parseInt(e.target.value) || 8 }))}
                      className="w-24"
                    />
                  </div>
                  <span className="text-muted-foreground mt-5">to</span>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">End Hour</Label>
                    <Input
                      type="number" min={0} max={23}
                      value={wwForm.workEndHour}
                      onChange={(e: any) => setWwForm((p: any) => ({ ...p, workEndHour: parseInt(e.target.value) || 17 }))}
                      className="w-24"
                    />
                  </div>
                  <div className="mt-5 text-sm text-muted-foreground">
                    = {wwForm.workEndHour - wwForm.workStartHour} working hours/day
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-muted/40 rounded-lg p-4 border space-y-1">
                <p className="text-sm font-medium">Summary</p>
                <p className="text-xs text-muted-foreground">Work days: {wwForm.workDays.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}</p>
                <p className="text-xs text-muted-foreground">Hours: {wwForm.workStartHour}:00 – {wwForm.workEndHour}:00 ({wwForm.workEndHour - wwForm.workStartHour}h/day)</p>
                <p className="text-xs text-muted-foreground">End of week: <strong>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][wwForm.endOfWeekDay]}</strong></p>
                <p className="text-xs text-muted-foreground">Weekly capacity: {wwForm.workDays.length * (wwForm.workEndHour - wwForm.workStartHour)} hours/week</p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (currentProjectId) {
                      localStorage.setItem(`workWeek_${currentProjectId}`, JSON.stringify(wwForm));
                      setWwSaved(true);
                      toast.success('Work calendar configuration saved');
                      setTimeout(() => setWwSaved(false), 3000);
                    }
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {wwSaved ? 'Saved!' : 'Save Configuration'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setWwForm({ workDays: [0,1,2,3,4], workStartHour: 8, workEndHour: 17, endOfWeekDay: 4 })}
                >
                  Reset to Default (Sun–Thu)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
      {/* ── Delete Project Dialog ── */}
      <AlertDialog open={showDeleteProject} onOpenChange={setShowDeleteProject}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" /> Delete Project
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{currentProject?.name}&rdquo; and all its data (tasks, requirements, issues, risks, etc.). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 px-1 pb-2">
            <Label className="text-sm">Enter this code to confirm deletion:</Label>
            <div className="flex items-center justify-center bg-muted rounded-md py-3">
              <span className="text-2xl font-mono font-bold tracking-widest text-red-600 select-none">{deleteCaptchaCode}</span>
            </div>
            <Input
              value={deleteConfirmCode}
              onChange={(e) => setDeleteConfirmCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              maxLength={6}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmCode("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteConfirmCode !== deleteCaptchaCode || deleteProjectMutation.isPending}
              onClick={() => currentProjectId && deleteProjectMutation.mutate({ projectId: currentProjectId })}
            >
              {deleteProjectMutation.isPending ? "Deleting…" : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Copy from Project Dialog ── */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5" /> Copy Elements from Another Project
            </DialogTitle>
            <DialogDescription>
              Select a source project and choose which elements to copy into the current project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Source project selector */}
            <div className="space-y-1">
              <Label>Source Project</Label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={sourceProjectId ?? ""}
                onChange={(e) => setSourceProjectId(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">— Select a project —</option>
                {projectQuery.data
                  ?.filter((p) => p.id !== currentProjectId)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.hasPassword ? " 🔒" : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* Password field if source project requires one */}
            {sourceProjectId && projectQuery.data?.find((p) => p.id === sourceProjectId)?.hasPassword && (
              <div className="space-y-1">
                <Label className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Source Project Password
                </Label>
                <Input
                  type="password"
                  value={sourcePassword}
                  onChange={(e) => setSourcePassword(e.target.value)}
                  placeholder="Enter password for source project"
                />
              </div>
            )}

            {/* Entity checkboxes */}
            <div className="space-y-1">
              <Label>Elements to Copy</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {COPYABLE_ENTITIES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors text-left
                      ${copyEntities[key] ? "border-violet-500 bg-violet-50 text-violet-700" : "border-border hover:border-violet-300"}`}
                    onClick={() => setCopyEntities((prev) => ({ ...prev, [key]: !prev[key] }))}
                  >
                    {copyEntities[key]
                      ? <CheckSquare className="w-4 h-4 shrink-0 text-violet-600" />
                      : <Square className="w-4 h-4 shrink-0 text-muted-foreground" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Copied elements will be added to the current project with new IDs. Existing data will not be overwritten.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCopyFromProject}
              disabled={!sourceProjectId || copyLoading || Object.values(copyEntities).every((v) => !v)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {copyLoading ? "Copying…" : "Copy Elements"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Option" : "Create New Option"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the option value below" : "Enter the new option value"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="option-name">Name</Label>
              <Input
                id="option-name"
                value={optionFormData.name}
                onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                placeholder="Enter option name"
              />
            </div>
            {optionsTab === "status" && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm font-medium">Counts as Complete</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tasks/issues with this status will be treated as done (not overdue)
                  </p>
                </div>
                <Switch
                  checked={optionFormData.isComplete}
                  onCheckedChange={(checked) => setOptionFormData({ ...optionFormData, isComplete: checked })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdateOption : handleCreateOption}>
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the option
              "{deletingItem?.value || deletingItem?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOption}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
