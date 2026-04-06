import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings, Eye, Save, X, Info, AlertCircle, List, LayoutGrid, AlignJustify } from "lucide-react";
import { KanbanBoard, KanbanItem, KanbanColumn } from "@/components/KanbanBoard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";
import { CustomFieldsSection } from "@/components/CustomFieldsSection";

export default function Issues() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"status" | "priority">("status");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({
    issueGroup: '',
    description: '',
    source: '',
    owner: '',
    ownerId: undefined as number | undefined,
    status: '',
    priority: '',
    type: '',
    class: '',
    sourceType: '',
    refSource: '',
    requirementId: '',
    currentStatus: '',
    lastUpdate: '',
    statusUpdate: '',
    openDate: '',
    knowledgeBaseCode: '',
    taskId: '',
    resolutionDate: '',
    scopeItemId: undefined as number | undefined,
  });
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [addIssueGroupDialogOpen, setAddIssueGroupDialogOpen] = useState(false);
  const [newIssueGroupName, setNewIssueGroupName] = useState('');
  const [addRequirementDialogOpen, setAddRequirementDialogOpen] = useState(false);
  const [addDeliverableDialogOpen, setAddDeliverableDialogOpen] = useState(false);
  const [requirementDetailDialogOpen, setRequirementDetailDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [deliverableDetailDialogOpen, setDeliverableDetailDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  const [taskGroupDialogOpen, setTaskGroupDialogOpen] = useState(false);
  const [issueGroupDialogOpen, setIssueGroupDialogOpen] = useState(false);
  const [newTaskGroup, setNewTaskGroup] = useState({ name: '', description: '' });
  const [newIssueGroup, setNewIssueGroup] = useState({ name: '', description: '' });
  const [linkRequirement, setLinkRequirement] = useState(false);
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [newTask, setNewTask] = useState({
    taskGroup: '',
    description: '',
    responsibleId: undefined as number | undefined,
    accountableId: undefined as number | undefined,
    consultedId: undefined as number | undefined,
    informedId: undefined as number | undefined,
    assignDate: '',
    dueDate: '',
    status: 'Not Started',
    priority: 'Medium',
    requirementId: '',
    deliverableId: undefined as number | undefined,
  });
  const [newDeliverable, setNewDeliverable] = useState({ description: '', status: 'Pending', dueDate: '' });
  const [newRequirement, setNewRequirement] = useState({
    description: '',
    taskGroup: '',
    issueGroup: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    type: '',
    category: '',
    sourceType: '',
    refSource: '',
    createdAt: new Date().toISOString().split('T')[0],
  });
  const [viewMode, setViewMode] = useState<'compact' | 'full' | 'kanban'>(() => {
    return (localStorage.getItem('issues-view-mode') as 'compact' | 'full' | 'kanban') || 'full';
  });
  const setAndSaveViewMode = (mode: 'compact' | 'full' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('issues-view-mode', mode);
  };
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [newIssue, setNewIssue] = useState<any>({
    issueGroup: '',
    description: '',
    source: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    type: '',
    class: '',
    requirementId: '',
    deliverableId: undefined,
    taskId: '',
    openDate: new Date().toISOString().split('T')[0],
    knowledgeBaseCode: '',
    resolutionDate: '',
    scopeItemId: undefined as number | undefined,
    linkedDocumentId: undefined as number | undefined,
  });  const { data: issues, isLoading, refetch } = trpc.issues.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: stakeholders } = trpc.stakeholders.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: requirements } = trpc.requirements.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: scopeItemsList = [] } = trpc.scopeItems.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: deliverables } = trpc.deliverables.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: tasks } = trpc.tasks.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "issue", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { data: issueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: taskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: statusOptions } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions } = trpc.dropdownOptions.priority.getAll.useQuery();
  const { data: issueTypeOptions } = trpc.issueTypes.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: classOptions } = trpc.classOptions.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: knowledgeBaseEntries } = trpc.knowledgeBase.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: allDocuments = [] } = trpc.documents.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  const utils = trpc.useUtils();

  const createIssueGroupMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created successfully`);
      setNewIssue({ ...newIssue, issueGroup: data.name });
      utils.dropdownOptions.issueGroups.getAll.invalidate();
      setAddIssueGroupDialogOpen(false);
      setNewIssueGroupName('');
    },
    onError: (error) => {
      toast.error(`Failed to create issue group: ${error.message}`);
    },
  });

  const createRequirementMutation = trpc.requirements.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Requirement ${data.idCode} created successfully`);
      setNewIssue({ ...newIssue, requirementId: data.idCode });
      utils.requirements.list.invalidate();
      setAddRequirementDialogOpen(false);
      setNewRequirement({
        description: '',
        taskGroup: '',
        issueGroup: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        type: '',
        category: '',
        sourceType: '',
        refSource: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error(`Failed to create requirement: ${error.message}`);
    },
  });

  const createDeliverableMutation = trpc.deliverables.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Deliverable ${data.deliverableId} created successfully`);
      setNewIssue({ ...newIssue, deliverableId: data.id });
      utils.deliverables.list.invalidate();
      setAddDeliverableDialogOpen(false);
      setNewDeliverable({ description: '', status: 'Pending', dueDate: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task ${data.taskId} created successfully`);
      setNewIssue({ ...newIssue, taskId: data.taskId });
      utils.tasks.list.invalidate();
      setAddTaskDialogOpen(false);
      setNewTask({
        taskGroup: '',
        description: '',
        responsibleId: undefined,
        accountableId: undefined,
        consultedId: undefined,
        informedId: undefined,
        assignDate: '',
        dueDate: '',
        status: 'Not Started',
        priority: 'Medium',
        requirementId: '',
        deliverableId: undefined,
      });
    },
    onError: (error) => {
      toast.error(`Failed to create task: ${error.message}`);
    },
  });

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created successfully`);
      setNewRequirement({ ...newRequirement, taskGroup: data.name });
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      setTaskGroupDialogOpen(false);
      setNewTaskGroup({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create task group: ${error.message}`);
    },
  });

  const createIssueGroupForReqMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created successfully`);
      setNewRequirement({ ...newRequirement, issueGroup: data.name });
      utils.dropdownOptions.issueGroups.getAll.invalidate();
      setIssueGroupDialogOpen(false);
      setNewIssueGroup({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create issue group: ${error.message}`);
    },
  });

  const updateMutation = trpc.issues.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated successfully. Changed fields: ${data.changedFields.join(', ') || 'none'}`);
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const createMutation = trpc.issues.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue ${data.issueId} created successfully`);
      setCreateDialogOpen(false);
      setNewIssue({
        issueGroup: '',
        description: '',
        source: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        requirementId: '',
        deliverableId: undefined,
      });
      setLinkRequirement(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.issues.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} issue(s) deleted`);
      setSelectedIssueIds([]);
      refetch();
    },
    onError: (error) => toast.error(`Bulk delete failed: ${error.message}`),
  });

  const bulkUpdateStatusMutation = trpc.issues.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} issue(s) updated`);
      setSelectedIssueIds([]);
      setBulkStatusDialogOpen(false);
      setBulkStatus("");
      refetch();
    },
    onError: (error) => toast.error(`Bulk update failed: ${error.message}`),
  });

  const handleToggleSelectIssue = (id: number) => {
    setSelectedIssueIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllIssues = () => {
    if (!filteredIssues) return;
    if (selectedIssueIds.length === filteredIssues.length) {
      setSelectedIssueIds([]);
    } else {
      setSelectedIssueIds(filteredIssues.map(i => i.id));
    }
  };

  const deleteMutation = trpc.issues.delete.useMutation({
    onSuccess: () => {
      toast.success('Issue deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Stakeholder ${data.fullName} created successfully`);
      setAddStakeholderDialogOpen(false);
      setNewStakeholder({ fullName: '', position: '', role: '' });
      trpc.useUtils().stakeholders.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create stakeholder: ${error.message}`);
    },
  });

  const filteredIssues = issues?.filter(issue => {
    const matchesSearch =
      issue.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || issue.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || issue.priority === priorityFilter;
    const matchesType = typeFilter === "all" || issue.type === typeFilter;
    const matchesClass = classFilter === "all" || issue.class === classFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesType && matchesClass;
  });

  const getRequirementStatus = (requirementId: string | null) => {
    if (!requirementId || !requirements) return null;
    const req = requirements.find(r => r.idCode === requirementId);
    return req?.status || null;
  };

  const handleEdit = (issue: any) => {
    setEditingId(issue.id);
    setEditData({
      status: issue.status || '',
      priority: issue.priority || '',
      deliverables1: issue.deliverables1 || '',
      d1Status: issue.d1Status || '',
      deliverables2: issue.deliverables2 || '',
      d2Status: issue.d2Status || '',
      lastUpdate: issue.lastUpdate || '',
      updateDate: new Date().toLocaleDateString('en-GB'),
    });
  };

  const handleSave = (issue: any) => {
    updateMutation.mutate({
      id: issue.id,
      issueId: issue.issueId,
      data: editData,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const showHistory = (issueId: string) => {
    setSelectedEntityId(issueId);
    setHistoryDialogOpen(true);
  };

  const handleCreate = () => {
    if (!newIssue.description) {
      toast.error('Description is required');
      return;
    }
    
    // Convert owner ID to stakeholder name
    let ownerName = newIssue.owner;
    if (newIssue.owner && stakeholders) {
      const stakeholder = stakeholders.find(s => s.id.toString() === newIssue.owner);
      if (stakeholder) {
        ownerName = stakeholder.fullName;
      }
    }
    
    // Convert "none" to undefined for optional fields
    const issueData: any = {
      ...newIssue,
      owner: ownerName,
      ownerId: newIssue.owner ? (isNaN(parseInt(newIssue.owner)) ? undefined : parseInt(newIssue.owner)) : undefined,
      projectId: currentProjectId!,
      requirementId: (linkRequirement && newIssue.requirementId && newIssue.requirementId !== "none") ? newIssue.requirementId : undefined,
      deliverableId: newIssue.deliverableId ? parseInt(newIssue.deliverableId) : undefined,
      taskId: (newIssue.taskId && newIssue.taskId !== "none") ? newIssue.taskId : undefined,
      // Preserve openDate default value (today's date) if not changed
      openDate: newIssue.openDate,
    };
    
    // Clean up empty strings and convert to undefined to prevent SQL errors
    Object.keys(issueData).forEach(key => {
      if (issueData[key] === '' || issueData[key] === 'none') {
        issueData[key] = undefined;
      }
    });
    
    createMutation.mutate(issueData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleViewDetails = (issue: any) => {
    setSelectedIssue(issue);
    setIsEditMode(false);
    setEditFormData({
      issueGroup: issue.issueGroup || '',
      description: issue.description || '',
      source: issue.source || '',
      owner: issue.owner || '',
      ownerId: issue.ownerId ?? undefined,
      status: issue.status || '',
      priority: issue.priority || '',
      type: issue.type || '',
      class: issue.class || '',
      sourceType: issue.sourceType || '',
      refSource: issue.refSource || '',
      requirementId: issue.requirementId || '',
      currentStatus: issue.currentStatus || '',
      lastUpdate: issue.lastUpdate || '',
      statusUpdate: issue.statusUpdate || '',
      openDate: issue.openDate || '',
      knowledgeBaseCode: issue.knowledgeBaseCode || '',
      taskId: issue.taskId || '',
      resolutionDate: issue.resolutionDate || '',
      scopeItemId: issue.scopeItemId ?? undefined,
      linkedDocumentId: issue.linkedDocumentId ?? undefined,
    });
    setViewDialogOpen(true);
  };

  const handleEditDetails = (issue: any) => {
    setSelectedIssue(issue);
    setIsEditMode(true);
    setEditFormData({ scopeItemId: issue.scopeItemId ?? undefined,
      linkedDocumentId: issue.linkedDocumentId ?? undefined,
      issueGroup: issue.issueGroup || '',
      description: issue.description || '',
      source: issue.source || '',
      owner: issue.owner || '',
      ownerId: issue.ownerId ?? undefined,
      status: issue.status || '',
      priority: issue.priority || '',
      type: issue.type || '',
      class: issue.class || '',
      sourceType: issue.sourceType || '',
      refSource: issue.refSource || '',
      requirementId: issue.requirementId || '',
      currentStatus: issue.currentStatus || '',
      lastUpdate: issue.lastUpdate || '',
      statusUpdate: issue.statusUpdate || '',
      openDate: issue.openDate || '',
      knowledgeBaseCode: issue.knowledgeBaseCode || '',
      taskId: issue.taskId || '',
      resolutionDate: issue.resolutionDate || '',
    });
    setViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedIssue) return;
    updateMutation.mutate({
      id: selectedIssue.id,
      issueId: selectedIssue.issueId,
      data: editFormData,
    }, {
      onSuccess: () => {
        setIsEditMode(false);
        setViewDialogOpen(false);
      }
    });
  };

  const isStatusComplete = (status: string | null | undefined) => {
    if (!status) return false;
    return statusOptions?.some((s: any) => (s.value || '').toLowerCase() === status.toLowerCase() && s.isComplete) ?? false;
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return "secondary";
    if (isStatusComplete(status)) return "default";
    if (status === "In Progress") return "outline";
    if (status === "Open") return "destructive";
    return "secondary";
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return "secondary";
    if (priority === "Critical" || priority === "Very High") return "destructive";
    if (priority === "High") return "default";
    if (priority === "Medium") return "outline";
    return "secondary";
  };

  const handleCreateStakeholder = () => {
    if (!newStakeholder.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createStakeholderMutation.mutate({ ...newStakeholder, projectId: currentProjectId });
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const handleViewRequirementDetails = (requirementId: string) => {
    const req = requirements?.find(r => r.idCode === requirementId);
    if (req) {
      setSelectedRequirement(req);
      setRequirementDetailDialogOpen(true);
    }
  };

  const handleViewDeliverableDetails = (deliverableId: number) => {
    const del = deliverables?.find(d => d.id === deliverableId);
    if (del) {
      setSelectedDeliverable(del);
      setDeliverableDetailDialogOpen(true);
    }
  };

  const handleCreateRequirement = () => {
    if (!newRequirement.description) {
      toast.error('Description is required');
      return;
    }
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createRequirementMutation.mutate({
      ...newRequirement,
      projectId: currentProjectId,
    });
  };

  const handleCreateDeliverable = () => {
    if (!newDeliverable.description) {
      toast.error('Description is required');
      return;
    }
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createDeliverableMutation.mutate({
      ...newDeliverable,
      projectId: currentProjectId,
    });
  };

  const handleCreateTask = () => {
    if (!newTask.description) {
      toast.error('Description is required');
      return;
    }
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createTaskMutation.mutate({
      ...newTask,
      projectId: currentProjectId,
    });
  };

  const handleViewTaskDetails = (taskId: string) => {
    const task = tasks?.find(t => t.taskId === taskId);
    if (task) {
      setSelectedTask(task);
      setTaskDetailDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-gray-500" />
            Issues Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">View, edit, and track changes to project issues</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-red-700 border-red-300">{issues?.length || 0} Issues</Badge>
          <div className="flex items-center border border-red-300 rounded-md flex-shrink-0">
            <Button size="sm" variant={viewMode === 'compact' ? 'default' : 'ghost'} onClick={() => setAndSaveViewMode('compact')} title="Compact View" className="h-8 w-8 p-0 rounded-r-none border-r border-red-300">
              <AlignJustify className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'full' ? 'default' : 'ghost'} onClick={() => setAndSaveViewMode('full')} title="Full View" className="h-8 w-8 p-0 border-r border-red-300 rounded-none">
              <List className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'ghost'} onClick={() => setAndSaveViewMode('kanban')} title="Board View" className="h-8 w-8 p-0 rounded-l-none">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("status"); setSettingsOpen(true); }} className="border-red-300 hover:bg-red-50 text-red-700">
            <Settings className="w-4 h-4 mr-1" />Status
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("priority"); setSettingsOpen(true); }} className="border-red-300 hover:bg-red-50 text-red-700">
            <Settings className="w-4 h-4 mr-1" />Priority
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="issues"
              projectId={currentProjectId}
              onImportSuccess={() => utils.issues.list.invalidate()}
            />
          )}
        </div>
      </div>
      <Card className="border-red-100">
        <CardContent>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by Issue ID, description, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-36 h-9">
                 <SelectValue placeholder="Status" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Statuses</SelectItem>
                 {statusOptions?.filter((opt: any) => opt.value).map((opt: any) => (
                   <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorityOptions?.map((opt: any) => (
                  <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {issueTypeOptions?.map((opt: any) => (
                  <SelectItem key={opt.id} value={opt.value}>{opt.label || opt.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={classFilter} onValueChange={setClassFilter}>
               <SelectTrigger className="w-36 h-9">
                 <SelectValue placeholder="Class" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All Classes</SelectItem>
                 {classOptions?.filter((c: any) => c.value).map((c: any) => (
                   <SelectItem key={c.id} value={c.value}>{c.value}</SelectItem>
                 ))}
               </SelectContent>
             </Select>
            {(statusFilter !== "all" || priorityFilter !== "all" || typeFilter !== "all" || classFilter !== "all") && (
               <Button
                 size="sm"
                 variant="ghost"
                 className="h-9 text-muted-foreground"
                 onClick={() => { setStatusFilter("all"); setPriorityFilter("all"); setTypeFilter("all"); setClassFilter("all"); }}
               >
                 <X className="w-3.5 h-3.5 mr-1" />Clear
               </Button>
             )}
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          {/* Bulk Action Toolbar */}
          {selectedIssueIds.length > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-sm font-medium text-red-700">{selectedIssueIds.length} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setBulkStatusDialogOpen(true)}>
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedIssueIds.length} selected issue(s)? This cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ ids: selectedIssueIds });
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedIssueIds([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className={viewMode === 'kanban' ? '' : 'rounded-md border overflow-hidden'}>
            {viewMode === 'kanban' ? (
              (() => {
                const palette = [
                  { color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
                  { color: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
                  { color: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
                  { color: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300' },
                  { color: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300' },
                  { color: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300' },
                ];
                const kanbanColumns: KanbanColumn[] = (statusOptions && statusOptions.length > 0
                  ? statusOptions.filter((s: any) => s.value)
                  : [{ value: 'Open' }, { value: 'In Progress' }, { value: 'Resolved' }, { value: 'Closed' }]
                ).map((s: any, idx: number) => ({
                  id: s.value, label: s.value,
                  color: palette[idx % palette.length].color,
                  textColor: palette[idx % palette.length].text,
                }));
                const priorityColor: Record<string, string> = {
                  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                  Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                };
                const kanbanItems: KanbanItem[] = (filteredIssues ?? []).map((issue) => ({
                  ...issue, id: issue.id, columnId: issue.status || kanbanColumns[0]?.id || 'Open',
                }));
                return (
                  <KanbanBoard
                    columns={kanbanColumns}
                    items={kanbanItems}
                    isLoading={!issues}
                    onMove={(itemId, newColumnId) => {
                      const issue = issues?.find((i) => i.id === itemId);
                      if (!issue) return;
                      updateMutation.mutate({ id: issue.id, issueId: issue.issueId, data: { status: newColumnId } });
                    }}
                    renderCard={(item) => {
                      const issue = item as any;
                      return (
                        <div className="bg-card border border-border/60 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-mono text-red-600 font-semibold">{issue.issueId}</span>
                            {issue.priority && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${priorityColor[issue.priority] || 'bg-muted text-muted-foreground'}`}>{issue.priority}</span>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-snug mb-2 line-clamp-2">{issue.description}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            {issue.issueGroup && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-medium truncate max-w-[100px]">{issue.issueGroup}</span>
                            )}
                            {issue.owner && (
                              <span className="text-[10px] text-muted-foreground truncate max-w-[80px] ml-auto" title={issue.owner}>{issue.owner.split(' ')[0]}</span>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                );
              })()
            ) : <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredIssues && filteredIssues.length > 0 && selectedIssueIds.length === filteredIssues.length}
                      onCheckedChange={handleSelectAllIssues}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-auto">Issue Details</TableHead>
                  <TableHead className="w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues?.map((issue) => (
                  <TableRow key={issue.id} className={selectedIssueIds.includes(issue.id) ? 'bg-red-50' : ''}>
                    <TableCell className="w-10 align-top pt-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIssueIds.includes(issue.id)}
                        onCheckedChange={() => handleToggleSelectIssue(issue.id)}
                        aria-label={`Select issue ${issue.issueId}`}
                      />
                    </TableCell>
                    <TableCell colSpan={1} className="overflow-hidden">
                      {viewMode === 'compact' ? (
                        /* Compact View */
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 flex-wrap">
                            <span className="font-bold text-sm whitespace-nowrap">{issue.issueId}</span>
                            {issue.issueGroup && (
                              <Badge variant="outline" className="whitespace-nowrap flex-shrink-0">{issue.issueGroup}</Badge>
                            )}
                            <span className="text-sm flex-1 break-words min-w-0">{issue.description}</span>
                          </div>
                          <div className="flex items-center gap-2 pl-4">
                            <Badge variant={getPriorityColor(issue.priority)} className="whitespace-nowrap">{issue.priority || '-'}</Badge>
                            <Badge variant={getStatusColor(issue.status)} className="whitespace-nowrap">{issue.status || '-'}</Badge>
                          </div>
                        </div>
                      ) : (
                        /* Full View */
                        <div>
                          {/* Line 1: Issue ID, Issue Group badge, Description */}
                          <div className="flex items-start gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-sm whitespace-nowrap">{issue.issueId}</span>
                            {issue.issueGroup && (
                              <Badge variant="outline" className="whitespace-nowrap flex-shrink-0">{issue.issueGroup}</Badge>
                            )}
                            <span className="text-sm flex-1 break-words min-w-0">{issue.description}</span>
                          </div>
                          {/* Line 2: Vertical field layout */}
                          <div className="pl-4 border-l-2 border-muted">
                            <div className="grid grid-cols-1 gap-1 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Requirement:</span>
                                {issue.requirementId ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary">{issue.requirementId}</Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => issue.requirementId && handleViewRequirementDetails(issue.requirementId)}
                                      title="View requirement details"
                                    >
                                      <Info className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Deliverable:</span>
                                {issue.deliverableId ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary">
                                      {deliverables?.find(d => d.id === issue.deliverableId)?.deliverableId || (issue.deliverableId ? `DL-${issue.deliverableId}` : '-')}
                                    </Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => issue.deliverableId && handleViewDeliverableDetails(issue.deliverableId)}
                                      title="View deliverable details"
                                    >
                                      <Info className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Task:</span>
                                {issue.taskId ? (
                                  <div className="flex items-center gap-1">
                                    <Badge variant="secondary">{issue.taskId}</Badge>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-5 w-5 p-0"
                                      onClick={() => issue.taskId && handleViewTaskDetails(issue.taskId)}
                                      title="View task details"
                                    >
                                      <Info className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span>-</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Owner:</span>
                                <span>{issue.owner || '-'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Priority:</span>
                                <Badge variant={getPriorityColor(issue.priority)}>{issue.priority || '-'}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[100px]">Status:</span>
                                <Badge variant={getStatusColor(issue.status)}>{issue.status || '-'}</Badge>
                              </div>
                              {issue.resolutionDate && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium min-w-[100px] text-amber-700">Resolve By:</span>
                                  <span className={`text-sm font-medium ${new Date(issue.resolutionDate) < new Date() && !isStatusComplete(issue.status) ? 'text-red-600' : 'text-amber-700'}`}>
                                    {formatDate(issue.resolutionDate)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(issue)} title="View Details">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleEditDetails(issue)} title="Edit">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => showHistory(issue.issueId)} title="History">
                            <History className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(issue.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button 
                          size="sm" 
                          variant="default" 
                          onClick={() => {
                            setNewTask({
                              ...newTask,
                              description: `Task for ${issue.issueId}`,
                            });
                            setAddTaskDialogOpen(true);
                            setSelectedIssue(issue);
                          }} 
                          title="Create Task" 
                          className="h-7 text-xs w-full"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Task
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>}
          </div>
          {filteredIssues?.length === 0 && viewMode !== 'kanban' && (
            <EmptyState
              icon={AlertCircle}
              title="No issues found"
              description="Create a new issue or import an Excel file to get started."
              actionLabel="Create Issue"
              onAction={() => setCreateDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change History - {selectedEntityId}</DialogTitle>
            <DialogDescription>
              Timeline of all changes made to this issue
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionLogs?.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {new Date(log.changedAt).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(log.changedFields as Record<string, { oldValue: any; newValue: any }>).map(([field, change]) => (
                      <div key={field} className="grid grid-cols-3 gap-4 text-sm">
                        <div className="font-medium">{field}</div>
                        <div className="text-muted-foreground">
                          <span className="line-through">{change.oldValue || 'empty'}</span>
                        </div>
                        <div className="text-green-600 font-medium">
                          {change.newValue || 'empty'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {actionLogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No changes recorded yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to the project. Issue ID will be auto-generated (I-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Basic Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueGroup">Issue Group</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newIssue.issueGroup || ''}
                      onValueChange={(value) => setNewIssue({ ...newIssue, issueGroup: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select issue group..." />
                      </SelectTrigger>
                      <SelectContent>
                        {issueGroups?.filter(g => g.name).map((group) => (
                          <SelectItem key={group.id} value={group.name!}>
                            {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddIssueGroupDialogOpen(true)}
                      title="Add new issue group"
                      disabled={createIssueGroupMutation.isPending}
                    >
                      {createIssueGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {/* Scope Item */}
                 <div className="space-y-2">
                   <Label>Scope Item</Label>
                   <Select
                     value={newIssue.scopeItemId ? String(newIssue.scopeItemId) : '__none__'}
                     onValueChange={(v) => setNewIssue({ ...newIssue, scopeItemId: v === '__none__' ? undefined : Number(v) })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select scope item..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="__none__">— None —</SelectItem>
                       {scopeItemsList.map((si) => (
                         <SelectItem key={si.id} value={String(si.id)}>
                           {si.idCode} – {si.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                 {/* Document Library Reference */}
                 <div className="space-y-2">
                   <Label>Linked Document</Label>
                   <Select
                     value={newIssue.linkedDocumentId ? String(newIssue.linkedDocumentId) : '__none__'}
                     onValueChange={(v) => setNewIssue({ ...newIssue, linkedDocumentId: v === '__none__' ? undefined : Number(v) })}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select document from library..." />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="__none__">— None —</SelectItem>
                       {allDocuments.map((doc: any) => (
                         <SelectItem key={doc.id} value={String(doc.id)}>
                           {doc.documentId} – {doc.originalName || doc.fileName}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={newIssue.description || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Issue description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={newIssue.source || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, source: e.target.value })}
                    placeholder="Source (max 20 characters)..."
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id="linkRequirement"
                      checked={linkRequirement}
                      onCheckedChange={(checked) => {
                        setLinkRequirement(checked as boolean);
                        if (!checked) {
                          setNewIssue({ ...newIssue, requirementId: '' });
                        }
                      }}
                    />
                    <Label htmlFor="linkRequirement" className="cursor-pointer">Link to Requirement</Label>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={newIssue.requirementId || ''}
                      onValueChange={(value) => setNewIssue({ ...newIssue, requirementId: value })}
                      disabled={!linkRequirement}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {requirements?.filter(r => r.idCode).map((req) => (
                          <SelectItem key={req.id} value={req.idCode!}>
                            {req.idCode} - {req.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddRequirementDialogOpen(true)}
                      title="Add new requirement"
                      disabled={!linkRequirement || createRequirementMutation.isPending}
                    >
                      {createRequirementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverableId">Deliverable</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newIssue.deliverableId?.toString() || ''}
                      onValueChange={(value) => setNewIssue({ ...newIssue, deliverableId: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select deliverable..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deliverables?.map((del) => (
                          <SelectItem key={del.id} value={del.id.toString()}>
                            {del.deliverableId} - {del.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddDeliverableDialogOpen(true)}
                      title="Add new deliverable"
                      disabled={createDeliverableMutation.isPending}
                    >
                      {createDeliverableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskId">Task</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newIssue.taskId || ''}
                      onValueChange={(value) => setNewIssue({ ...newIssue, taskId: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select task..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {tasks?.filter(t => t.taskId).map((task) => (
                          <SelectItem key={task.id} value={task.taskId!}>
                            {task.taskId} - {task.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddTaskDialogOpen(true)}
                      title="Add new task"
                      disabled={createTaskMutation.isPending}
                    >
                      {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner">Owner</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newIssue.owner || ''}
                    onValueChange={(value) => setNewIssue({ ...newIssue, owner: value })}
                    placeholder="Select owner..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Status & Priority Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Status & Priority</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <SelectWithCreate
                    type="status"
                    value={newIssue.status || ''}
                    onValueChange={(value) => setNewIssue({ ...newIssue, status: value })}
                    placeholder="Select status"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <SelectWithCreate
                    type="priority"
                    value={newIssue.priority || ''}
                    onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
                    placeholder="Select priority"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <SelectWithCreate
                    type="issueType"
                    value={newIssue.type || ''}
                    onValueChange={(value) => setNewIssue({ ...newIssue, type: value })}
                    placeholder="Select type..."
                    projectId={currentProjectId!}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <SelectWithCreate
                    type="class"
                    value={newIssue.class || ''}
                    onValueChange={(value) => setNewIssue({ ...newIssue, class: value })}
                    placeholder="Select class..."
                    projectId={currentProjectId!}
                  />
                </div>
              </div>
            </div>
            {/* Dates Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Dates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openDate">Open Date</Label>
                  <Input
                    id="openDate"
                    type="date"
                    value={newIssue.openDate || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, openDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolutionDate">Required Resolution Date</Label>
                  <Input
                    id="resolutionDate"
                    type="date"
                    value={newIssue.resolutionDate || ''}
                    onChange={(e) => setNewIssue({ ...newIssue, resolutionDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Knowledge Base Link */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Knowledge Base</h4>
              <div className="space-y-2">
                <Label htmlFor="knowledgeBaseCode">Knowledge Base Link</Label>
                <Select
                  value={newIssue.knowledgeBaseCode || ''}
                  onValueChange={(value) => setNewIssue({ ...newIssue, knowledgeBaseCode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select KB entry..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {knowledgeBaseEntries?.filter((kb: any) => kb.kbCode).map((kb: any) => (
                      <SelectItem key={kb.id} value={kb.kbCode}>
                        {kb.kbCode} - {kb.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage {settingsType === 'status' ? 'Status' : 'Priority'} Options</DialogTitle>
            <DialogDescription>
              Add, edit, or delete {settingsType} options for issues
            </DialogDescription>
          </DialogHeader>
          <DropdownOptionsManager type={settingsType} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stakeholder Dialog */}
      <Dialog open={addStakeholderDialogOpen} onOpenChange={setAddStakeholderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Stakeholder</DialogTitle>
            <DialogDescription>
              Create a new stakeholder to use in dropdowns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Enter full name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={newStakeholder.position}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                placeholder="Enter position..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newStakeholder.role}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                placeholder="Enter role..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStakeholderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStakeholder} disabled={createStakeholderMutation.isPending}>
              {createStakeholderMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded">{selectedIssue?.issueId}</span>
                {isEditMode ? 'Edit Issue' : 'Issue Details'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditMode(true)} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>
              {isEditMode ? 'Edit the issue details below' : 'View all details for this issue'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Issue Group</Label>
                {isEditMode ? (
                  <Select value={editFormData.issueGroup || ''} onValueChange={(v) => setEditFormData({...editFormData, issueGroup: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select issue group" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueGroups?.filter(g => g.name).map((g) => (
                        <SelectItem key={g.id} value={g.name!}>{g.idCode ? `${g.idCode} - ${g.name}` : g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedIssue?.issueGroup || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Scope Item</Label>
                {isEditMode ? (
                  <Select
                    value={editFormData.scopeItemId ? String(editFormData.scopeItemId) : '__none__'}
                    onValueChange={(v) => setEditFormData({ ...editFormData, scopeItemId: v === '__none__' ? undefined : Number(v) })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select scope item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {scopeItemsList.map((si) => (
                        <SelectItem key={si.id} value={String(si.id)}>
                          {si.idCode} – {si.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium text-sm">
                    {selectedIssue?.scopeItemId
                      ? (() => { const si = scopeItemsList.find((s) => s.id === selectedIssue.scopeItemId); return si ? `${si.idCode} – ${si.name}` : `#${selectedIssue.scopeItemId}`; })()
                      : '—'}
                  </p>
                )}
              </div>
              {/* Linked Document */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Linked Document</Label>
                {isEditMode ? (
                  <Select
                    value={editFormData.linkedDocumentId ? String(editFormData.linkedDocumentId) : '__none__'}
                    onValueChange={(v) => setEditFormData({ ...editFormData, linkedDocumentId: v === '__none__' ? undefined : Number(v) })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select document" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {allDocuments.map((doc: any) => (
                        <SelectItem key={doc.id} value={String(doc.id)}>
                          {doc.documentId} – {doc.originalName || doc.fileName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium text-sm">
                    {selectedIssue?.linkedDocumentId
                      ? (() => { const doc = allDocuments.find((d: any) => d.id === selectedIssue.linkedDocumentId); return doc ? `${doc.documentId} – ${doc.originalName || doc.fileName}` : `#${selectedIssue.linkedDocumentId}`; })()
                      : '—'}
                  </p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requirement ID</Label>
                <p className="font-medium">{selectedIssue?.requirementId || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                {isEditMode ? (
                  <Select value={editFormData.status || ''} onValueChange={(v) => setEditFormData({...editFormData, status: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions?.filter(opt => opt.value).map((opt) => (
                        <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getStatusColor(selectedIssue?.status)}>{selectedIssue?.status || '-'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                {isEditMode ? (
                  <Select value={editFormData.priority || ''} onValueChange={(v) => setEditFormData({...editFormData, priority: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions?.filter(p => p.value).map((p) => (
                        <SelectItem key={p.id} value={p.value!}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getPriorityColor(selectedIssue?.priority)}>{selectedIssue?.priority || '-'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
                {isEditMode ? (
                  <Select value={editFormData.type || ''} onValueChange={(v) => setEditFormData({...editFormData, type: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypeOptions?.filter(t => t.value).map((t) => (
                        <SelectItem key={t.id} value={t.value!}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedIssue?.type || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Class</Label>
                {isEditMode ? (
                  <Select value={editFormData.class || ''} onValueChange={(value) => setEditFormData({...editFormData, class: value})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions?.filter(c => c.value).map((c) => (
                        <SelectItem key={c.id} value={c.value!}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedIssue?.class || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Owner (Stakeholder)</Label>
                {isEditMode ? (
                  <Select
                    value={editFormData.ownerId ? String(editFormData.ownerId) : '__none__'}
                    onValueChange={(v) => {
                      if (v === '__none__') {
                        setEditFormData({ ...editFormData, ownerId: undefined, owner: '' });
                      } else {
                        const s = stakeholders?.find(s => s.id === parseInt(v));
                        setEditFormData({ ...editFormData, ownerId: parseInt(v), owner: s?.fullName || '' });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select stakeholder..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— None —</SelectItem>
                      {stakeholders?.filter(s => s.fullName?.trim()).map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedIssue?.owner || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Source Type</Label>
                {isEditMode ? (
                  <Input value={editFormData.sourceType || ''} onChange={(e) => setEditFormData({...editFormData, sourceType: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedIssue?.sourceType || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">External Source</Label>
                {isEditMode ? (
                  <Input value={editFormData.refSource || ''} onChange={(e) => setEditFormData({...editFormData, refSource: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedIssue?.refSource || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Open Date</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.openDate || ''} onChange={(e) => setEditFormData({...editFormData, openDate: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{formatDate(selectedIssue?.openDate) || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Label className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Required Resolution Date</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.resolutionDate || ''} onChange={(e) => setEditFormData({...editFormData, resolutionDate: e.target.value})} className="h-8 border-amber-300" />
                ) : (
                  <p className="font-medium text-amber-800">{formatDate(selectedIssue?.resolutionDate) || '-'}</p>
                )}
              </div>
              {isEditMode && (
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Knowledge Base Link</Label>
                  <Select 
                    value={editFormData.knowledgeBaseCode || ''} 
                    onValueChange={(v) => setEditFormData({...editFormData, knowledgeBaseCode: v})}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select KB entry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {knowledgeBaseEntries?.map((kb: any) => (
                        <SelectItem key={kb.id} value={kb.kbCode}>
                          {kb.kbCode} - {kb.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isEditMode && (
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Task Link</Label>
                  <Select 
                    value={editFormData.taskId || ''} 
                    onValueChange={(v) => setEditFormData({...editFormData, taskId: v})}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select task" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {tasks?.map((task: any) => (
                        <SelectItem key={task.id} value={task.taskId}>
                          {task.taskId} - {task.description?.substring(0, 50) || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                {isEditMode ? (
                  <Textarea value={editFormData.description || ''} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="min-h-[80px]" />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{selectedIssue?.description || '-'}</p>
                )}
              </div>
            </div>

            {/* Last Update */}
            <div className="col-span-2 space-y-1 p-3 bg-muted/50 rounded-lg">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Last Update</Label>
              {isEditMode ? (
                <Textarea
                  value={editFormData.lastUpdate || ''}
                  onChange={(e) => setEditFormData({...editFormData, lastUpdate: e.target.value})}
                  className="min-h-[60px]"
                  placeholder="Enter update notes"
                />
              ) : (
                <p className="font-medium">{selectedIssue?.lastUpdate || '-'}</p>
              )}
            </div>
          </div>
          {/* Custom Fields */}
          {currentProjectId && selectedIssue?.issueId && (
            <div className="px-1 pb-2">
              <CustomFieldsSection
                projectId={currentProjectId}
                entityType="issue"
                entityId={selectedIssue.issueId}
                readOnly={!isEditMode}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the issue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedIssueIds.length} Issue(s)</DialogTitle>
            <DialogDescription>Select a new status to apply to all selected issues.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions?.filter((s: any) => s.value).map((s: any) => (
                  <SelectItem key={s.id} value={s.value}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!bulkStatus) { toast.error('Please select a status'); return; }
                bulkUpdateStatusMutation.mutate({ ids: selectedIssueIds, status: bulkStatus });
              }}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending ? 'Updating...' : 'Apply Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Issue Group Dialog */}
      <Dialog open={addIssueGroupDialogOpen} onOpenChange={setAddIssueGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Issue Group</DialogTitle>
            <DialogDescription>
              Enter a name for the new issue group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issueGroupName" className="text-right">Name *</Label>
              <Input
                id="issueGroupName"
                value={newIssueGroupName}
                onChange={(e) => setNewIssueGroupName(e.target.value)}
                placeholder="Enter issue group name..."
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newIssueGroupName.trim() && currentProjectId) {
                    createIssueGroupMutation.mutate({ projectId: currentProjectId, name: newIssueGroupName.trim() });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddIssueGroupDialogOpen(false);
              setNewIssueGroupName('');
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newIssueGroupName.trim() && currentProjectId) {
                  createIssueGroupMutation.mutate({ projectId: currentProjectId, name: newIssueGroupName.trim() });
                }
              }}
              disabled={!newIssueGroupName.trim() || createIssueGroupMutation.isPending}
            >
              {createIssueGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Requirement Dialog */}
      <Dialog open={addRequirementDialogOpen} onOpenChange={setAddRequirementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Requirement</DialogTitle>
            <DialogDescription>
              Add a new requirement to link with this issue. Requirement ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reqDescription">Description *</Label>
              <Textarea
                id="reqDescription"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Requirement description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reqTaskGroup">Task Group</Label>
                <div className="flex gap-2">
                  <Select
                    value={newRequirement.taskGroup}
                    onValueChange={(value) => setNewRequirement({ ...newRequirement, taskGroup: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select task group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {taskGroups?.filter(g => g.name).map((group) => (
                        <SelectItem key={group.id} value={group.name!}>
                          {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setTaskGroupDialogOpen(true)}
                    title="Add new task group"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqIssueGroup">Issue Group</Label>
                <div className="flex gap-2">
                  <Select
                    value={newRequirement.issueGroup}
                    onValueChange={(value) => setNewRequirement({ ...newRequirement, issueGroup: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select issue group..." />
                    </SelectTrigger>
                    <SelectContent>
                      {issueGroups?.filter(g => g.name).map((group) => (
                        <SelectItem key={group.id} value={group.name!}>
                          {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => setIssueGroupDialogOpen(true)}
                    title="Add new issue group"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reqType">Type</Label>
                <SelectWithCreate
                  type="type"
                  value={newRequirement.type}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}
                  placeholder="Select type..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqCategory">Category</Label>
                <SelectWithCreate
                  type="category"
                  value={newRequirement.category}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, category: value })}
                  placeholder="Select category..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reqPriority">Priority</Label>
                <SelectWithCreate
                  type="priority"
                  value={newRequirement.priority}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
                  placeholder="Select priority..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqStatus">Status</Label>
                <SelectWithCreate
                  type="status"
                  value={newRequirement.status}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
                  placeholder="Select status..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reqOwner">Owner</Label>
                <SelectWithCreate
                  type="stakeholder"
                  value={newRequirement.owner}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, owner: value })}
                  placeholder="Select owner..."
                  projectId={currentProjectId || undefined}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reqSourceType">Source Type</Label>
                <Input
                  id="reqSourceType"
                  value={newRequirement.sourceType}
                  onChange={(e) => setNewRequirement({ ...newRequirement, sourceType: e.target.value })}
                  placeholder="Source type..."
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reqRefSource">Reference Source</Label>
              <Input
                id="reqRefSource"
                value={newRequirement.refSource}
                onChange={(e) => setNewRequirement({ ...newRequirement, refSource: e.target.value })}
                placeholder="Reference source..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reqCreatedAt">Creation Date</Label>
              <Input
                id="reqCreatedAt"
                type="date"
                value={newRequirement.createdAt}
                onChange={(e) => setNewRequirement({ ...newRequirement, createdAt: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRequirementDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateRequirement} disabled={createRequirementMutation.isPending}>
              {createRequirementMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deliverable Dialog */}
      <Dialog open={addDeliverableDialogOpen} onOpenChange={setAddDeliverableDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Deliverable</DialogTitle>
            <DialogDescription>
              Add a new deliverable to link with this issue. Deliverable ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delDescription">Description *</Label>
              <Textarea
                id="delDescription"
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                placeholder="Deliverable description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delStatus">Status</Label>
              <SelectWithCreate
                type="status"
                value={newDeliverable.status}
                onValueChange={(value) => setNewDeliverable({ ...newDeliverable, status: value })}
                placeholder="Select status..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delDueDate">Due Date</Label>
              <Input
                id="delDueDate"
                type="date"
                value={newDeliverable.dueDate}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, dueDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeliverableDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDeliverable} disabled={createDeliverableMutation.isPending}>
              {createDeliverableMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Group Creation Dialog (for requirement creation) */}
      <Dialog open={taskGroupDialogOpen} onOpenChange={setTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Group</DialogTitle>
            <DialogDescription>
              Enter details for the new task group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="taskGroupName">Name *</Label>
              <Input
                id="taskGroupName"
                value={newTaskGroup.name}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, name: e.target.value })}
                placeholder="Enter task group name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskGroupDescription">Description</Label>
              <Textarea
                id="taskGroupDescription"
                value={newTaskGroup.description}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, description: e.target.value })}
                placeholder="Enter task group description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTaskGroupDialogOpen(false);
              setNewTaskGroup({ name: '', description: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newTaskGroup.name.trim() && currentProjectId) {
                  createTaskGroupMutation.mutate({
                    projectId: currentProjectId,
                    name: newTaskGroup.name.trim(),
                    description: newTaskGroup.description
                  });
                }
              }}
              disabled={!newTaskGroup.name.trim() || createTaskGroupMutation.isPending}
            >
              {createTaskGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Group Creation Dialog (for requirement creation) */}
      <Dialog open={issueGroupDialogOpen} onOpenChange={setIssueGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Issue Group</DialogTitle>
            <DialogDescription>
              Enter details for the new issue group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="issueGroupName2">Name *</Label>
              <Input
                id="issueGroupName2"
                value={newIssueGroup.name}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, name: e.target.value })}
                placeholder="Enter issue group name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueGroupDescription">Description</Label>
              <Textarea
                id="issueGroupDescription"
                value={newIssueGroup.description}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, description: e.target.value })}
                placeholder="Enter issue group description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIssueGroupDialogOpen(false);
              setNewIssueGroup({ name: '', description: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newIssueGroup.name.trim() && currentProjectId) {
                  createIssueGroupForReqMutation.mutate({
                    projectId: currentProjectId,
                    name: newIssueGroup.name.trim(),
                    description: newIssueGroup.description
                  });
                }
              }}
              disabled={!newIssueGroup.name.trim() || createIssueGroupForReqMutation.isPending}
            >
              {createIssueGroupForReqMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirement Detail Dialog */}
      <Dialog open={requirementDetailDialogOpen} onOpenChange={setRequirementDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Requirement Details</DialogTitle>
            <DialogDescription>
              View full details of the linked requirement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="font-medium">{selectedRequirement?.idCode}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="font-medium">{selectedRequirement?.type || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <p className="font-medium">{selectedRequirement?.category || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge>{selectedRequirement?.status || '-'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Badge>{selectedRequirement?.priority || '-'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Owner</Label>
                <p className="font-medium">{selectedRequirement?.owner || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Source Type</Label>
                <p className="font-medium">{selectedRequirement?.sourceType || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Ref Source</Label>
                <p className="font-medium">{selectedRequirement?.refSource || '-'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="font-medium whitespace-pre-wrap">{selectedRequirement?.description || '-'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequirementDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deliverable Detail Dialog */}
      <Dialog open={deliverableDetailDialogOpen} onOpenChange={setDeliverableDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deliverable Details</DialogTitle>
            <DialogDescription>
              View full details of the linked deliverable
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="font-medium">{selectedDeliverable?.deliverableId}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge>{selectedDeliverable?.status || '-'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="font-medium">{formatDate(selectedDeliverable?.dueDate) || '-'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="font-medium whitespace-pre-wrap">{selectedDeliverable?.description || '-'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeliverableDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addTaskDialogOpen} onOpenChange={setAddTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to link with this issue. Task ID will be auto-generated (T-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Basic Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskGroup">Task Group *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.taskGroup}
                      onValueChange={(value) => setNewTask({ ...newTask, taskGroup: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select task group..." />
                      </SelectTrigger>
                      <SelectContent>
                          {taskGroups?.filter(g => g.name).map((group) => (
                            <SelectItem key={group.id} value={group.name!}>
                              {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setTaskGroupDialogOpen(true)}
                      title="Add new task group"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Description *</Label>
                  <Input
                    id="taskDescription"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskRequirementId">Requirement</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.requirementId}
                      onValueChange={(value) => setNewTask({ ...newTask, requirementId: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {requirements?.filter(r => r.idCode).map((req) => (
                          <SelectItem key={req.id} value={req.idCode!}>
                            {req.idCode} - {req.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddRequirementDialogOpen(true)}
                      title="Add new requirement"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskDeliverableId">Deliverable</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.deliverableId?.toString() || ''}
                      onValueChange={(value) => setNewTask({ ...newTask, deliverableId: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select deliverable..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deliverables?.map((del) => (
                          <SelectItem key={del.id} value={del.id.toString()}>
                            {del.deliverableId} - {del.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddDeliverableDialogOpen(true)}
                      title="Add new deliverable"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* RACI Assignment Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">RACI Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsible (R)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.responsibleId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, responsibleId: value ? parseInt(value) : undefined })}
                    placeholder="Select responsible person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountable">Accountable (A)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.accountableId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, accountableId: value ? parseInt(value) : undefined })}
                    placeholder="Select accountable person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consulted">Consulted (C)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.consultedId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, consultedId: value ? parseInt(value) : undefined })}
                    placeholder="Select consulted person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="informed">Informed (I)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.informedId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, informedId: value ? parseInt(value) : undefined })}
                    placeholder="Select informed person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Dates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignDate">Assign Date</Label>
                  <Input
                    id="assignDate"
                    type="date"
                    value={newTask.assignDate}
                    onChange={(e) => setNewTask({ ...newTask, assignDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (ETD)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status & Priority Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Status & Priority</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taskStatus">Status</Label>
                  <SelectWithCreate
                    type="status"
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                    placeholder="Select status"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskPriority">Priority</Label>
                  <SelectWithCreate
                    type="priority"
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    placeholder="Select priority"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={taskDetailDialogOpen} onOpenChange={setTaskDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View full details of the linked task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">ID</Label>
                <p className="font-medium">{selectedTask?.taskId}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Task Group</Label>
                <p className="font-medium">{selectedTask?.taskGroup || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge>{selectedTask?.status || '-'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Badge>{selectedTask?.priority || '-'}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Assign Date</Label>
                <p className="font-medium">{formatDate(selectedTask?.assignDate) || '-'}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <p className="font-medium">{formatDate(selectedTask?.dueDate) || '-'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="font-medium whitespace-pre-wrap">{selectedTask?.description || '-'}</p>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">RACI Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Responsible (R)</Label>
                  <p className="font-medium">{stakeholders?.find(s => s.id === selectedTask?.responsibleId)?.fullName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Accountable (A)</Label>
                  <p className="font-medium">{stakeholders?.find(s => s.id === selectedTask?.accountableId)?.fullName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Consulted (C)</Label>
                  <p className="font-medium">{stakeholders?.find(s => s.id === selectedTask?.consultedId)?.fullName || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Informed (I)</Label>
                  <p className="font-medium">{stakeholders?.find(s => s.id === selectedTask?.informedId)?.fullName || '-'}</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Floating Add Button */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 flex items-center justify-center transition-all hover:scale-110"
        title="Add Issue"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
