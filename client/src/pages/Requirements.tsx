// @ts-nocheck
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, History, Loader2, Plus, Trash2, Eye, CheckSquare, Save, X, Link2, Settings, Calendar, User, FileText, Tag, Clock, List, LayoutGrid } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate as _formatDateUtil } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";
import { CustomFieldsSection } from "@/components/CustomFieldsSection";

export default function Requirements() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [createIssueDialogOpen, setCreateIssueDialogOpen] = useState(false);
  const [createDeliverableDialogOpen, setCreateDeliverableDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"status" | "priority" | "type" | "category">("status");
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [editingDeliverableId, setEditingDeliverableId] = useState<number | null>(null);
  const [editDeliverableData, setEditDeliverableData] = useState<any>({});
  const [deletingDeliverableId, setDeletingDeliverableId] = useState<number | null>(null);
  const [deleteDeliverableDialogOpen, setDeleteDeliverableDialogOpen] = useState(false);
  const [taskGroupDialogOpen, setTaskGroupDialogOpen] = useState(false);
  const [issueGroupDialogOpen, setIssueGroupDialogOpen] = useState(false);
  const [newTaskGroup, setNewTaskGroup] = useState({ name: '', description: '' });
  const [newIssueGroup, setNewIssueGroup] = useState({ name: '', description: '' });
  const [newTask, setNewTask] = useState({
    taskGroup: '',
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    responsible: '',
    accountable: '',
    informed: '',
    consulted: '',
    dueDate: '',
    requirementId: '',
  });
  const [newIssue, setNewIssue] = useState({
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    issueGroup: '',
  });
  const [newDeliverable, setNewDeliverable] = useState({
    description: '',
    status: 'Pending',
    dueDate: '',
  });
  const [selectedDeliverableToLink, setSelectedDeliverableToLink] = useState<string>('');
  const [selectedReqIds, setSelectedReqIds] = useState<number[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [newRequirement, setNewRequirement] = useState<any>({
    description: '',
    taskGroup: '',
    issueGroup: '',
    ownerId: undefined,
    status: 'Open',
    priority: 'Medium',
    type: '',
    category: '',
    sourceType: '',
    refSource: '',
    createdAt: new Date().toISOString().split('T')[0],
    knowledgeBaseCode: '',
    scopeItemId: undefined as number | undefined,
    linkedDocumentId: undefined as number | undefined,
  });
  const [viewMode, setViewMode] = useState<'compact' | 'full'>('full');
  // Quick-create Document mini-dialog state
  const [quickDocDialogOpen, setQuickDocDialogOpen] = useState(false);
  const [quickDocFor, setQuickDocFor] = useState<'edit' | 'create'>('edit');
  const [quickDocForm, setQuickDocForm] = useState({ title: '', url: '', description: '' });
  // Quick-create KB mini-dialog state
  const [quickKbDialogOpen, setQuickKbDialogOpen] = useState(false);
  const [quickKbFor, setQuickKbFor] = useState<'edit' | 'create'>('edit');
  const [quickKbForm, setQuickKbForm] = useState({ title: '', description: '' });

  const utils = trpc.useUtils();
  const { data: requirements, isLoading, refetch } = trpc.requirements.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: stakeholders } = trpc.stakeholders.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: tasks } = trpc.tasks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: issues } = trpc.issues.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: scopeItemsList = [] } = trpc.scopeItems.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: userStoriesList = [] } = trpc.userStories.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: testCasesList = [] } = trpc.testCases.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: changeRequestsList = [] } = trpc.changeRequests.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const linkUserStoryMut = trpc.userStories.linkRequirement.useMutation({ onSuccess: () => utils.userStories.list.invalidate() });
  const unlinkUserStoryMut = trpc.userStories.unlinkRequirement.useMutation({ onSuccess: () => utils.userStories.list.invalidate() });
  const { data: statusOptions } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions } = trpc.dropdownOptions.priority.getAll.useQuery();
  const { data: typeOptions } = trpc.dropdownOptions.type.getAll.useQuery();
  const { data: categoryOptions } = trpc.dropdownOptions.category.getAll.useQuery();  const { data: taskGroups, refetch: refetchTaskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );
  const { data: issueGroups, refetch: refetchIssueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created`);
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      setNewRequirement({ ...newRequirement, taskGroup: data.name });
      setTaskGroupDialogOpen(false);
      setNewTaskGroup({ name: '', description: '' });
    },
    onError: (error) => toast.error(`Failed to create Task Group: ${error.message}`),
  });
  const createIssueGroupMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created`);
      utils.dropdownOptions.issueGroups.getAll.invalidate();
      setNewRequirement({ ...newRequirement, issueGroup: data.name });
      setIssueGroupDialogOpen(false);
      setNewIssueGroup({ name: '', description: '' });
    },
    onError: (error) => toast.error(`Failed to create Issue Group: ${error.message}`),
  });
  const createIssueGroupMutationOld = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created`);
      utils.dropdownOptions.issueGroups.getAll.invalidate();
      setNewRequirement({ ...newRequirement, issueGroup: data.name });
    },
    onError: (error) => toast.error(`Failed to create Issue Group: ${error.message}`),
  });
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "requirement", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { data: linkedDeliverables } = trpc.deliverables.getByEntity.useQuery(
    { 
      entityType: "requirement", 
      entityId: selectedRequirement?.idCode || "",
      projectId: currentProjectId || undefined
    },
    { enabled: viewDialogOpen && !!selectedRequirement?.idCode && !!currentProjectId }
  );
  const { data: allDeliverables } = trpc.deliverables.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId && viewDialogOpen }
  );
  const { data: knowledgeBaseEntries } = trpc.knowledgeBase.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId && viewDialogOpen && isEditMode }
  );
  const { data: allDocuments = [] } = trpc.documents.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  // Quick-create Document mutation
  const quickCreateDocMutation = trpc.documents.create.useMutation({
    onSuccess: (doc) => {
      toast.success(`Document ${doc.documentId} created`);
      utils.documents.list.invalidate();
      if (quickDocFor === 'edit') {
        setEditFormData((prev: any) => ({ ...prev, linkedDocumentId: doc.id }));
      } else {
        setNewRequirement((prev: any) => ({ ...prev, linkedDocumentId: doc.id }));
      }
      setQuickDocDialogOpen(false);
      setQuickDocForm({ title: '', url: '', description: '' });
    },
    onError: (e) => toast.error(`Failed to create document: ${e.message}`),
  });

  // Quick-create KB mutation
  const quickCreateKbMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: (kb) => {
      toast.success(`KB entry ${kb.kbCode} created`);
      utils.knowledgeBase.list.invalidate();
      if (quickKbFor === 'edit') {
        setEditFormData((prev: any) => ({ ...prev, knowledgeBaseCode: kb.kbCode }));
      } else {
        setNewRequirement((prev: any) => ({ ...prev, knowledgeBaseCode: kb.kbCode }));
      }
      setQuickKbDialogOpen(false);
      setQuickKbForm({ title: '', description: '' });
    },
    onError: (e) => toast.error(`Failed to create KB entry: ${e.message}`),
  });

  const updateMutation = trpc.requirements.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated successfully. Changed fields: ${data.changedFields.join(', ') || 'none'}`);
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const createMutation = trpc.requirements.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Requirement ${data.idCode} created successfully`);
      setCreateDialogOpen(false);
      setNewRequirement({
        description: '',
        taskGroup: '',
        issueGroup: '',
        ownerId: undefined,
        status: 'Open',
        priority: 'Medium',
        type: '',
        category: '',
        sourceType: '',
        refSource: '',
        createdAt: new Date().toISOString().split('T')[0],
        knowledgeBaseCode: '',
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.requirements.delete.useMutation({
    onSuccess: () => {
      toast.success('Requirement deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.requirements.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} requirement(s) deleted`);
      setSelectedReqIds([]);
      refetch();
    },
    onError: (error) => toast.error(`Bulk delete failed: ${error.message}`),
  });

  const bulkUpdateStatusMutation = trpc.requirements.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} requirement(s) updated`);
      setSelectedReqIds([]);
      setBulkStatusDialogOpen(false);
      setBulkStatus("");
      refetch();
    },
    onError: (error) => toast.error(`Bulk update failed: ${error.message}`),
  });

  const handleToggleSelectReq = (id: number) => {
    setSelectedReqIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllReqs = () => {
    if (!filteredRequirements) return;
    if (selectedReqIds.length === filteredRequirements.length) {
      setSelectedReqIds([]);
    } else {
      setSelectedReqIds(filteredRequirements.map(r => r.id));
    }
  };

  const createTaskMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task ${data.taskId} created and linked to ${selectedRequirement?.idCode}`);
      setCreateTaskDialogOpen(false);
      setNewTask({
        taskGroup: '',
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        responsible: '',
        accountable: '',
        informed: '',
        consulted: '',
        dueDate: '',
        requirementId: '',
      });
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Create task failed: ${error.message}`);
    },
  });

  const createIssueMutation = trpc.issues.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue ${data.issueId} created and linked to ${selectedRequirement?.idCode}`);
      setCreateIssueDialogOpen(false);
      setNewIssue({
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        issueGroup: '',
      });
      utils.issues.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Create issue failed: ${error.message}`);
    },
  });

  const createDeliverableMutation = trpc.deliverables.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Deliverable ${data.deliverableId} created and linked to ${selectedRequirement?.idCode}`);
      setCreateDeliverableDialogOpen(false);
      setNewDeliverable({
        description: '',
        status: 'Pending',
        dueDate: '',
      });
      utils.deliverables.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Create deliverable failed: ${error.message}`);
    },
  });

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Stakeholder ${data.fullName} created successfully`);
      setAddStakeholderDialogOpen(false);
      setNewStakeholder({ fullName: '', position: '', role: '' });
      utils.stakeholders.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create stakeholder: ${error.message}`);
    },
  });

  const updateDeliverableMutation = trpc.deliverables.update.useMutation({
    onSuccess: () => {
      toast.success('Deliverable updated successfully');
      setEditingDeliverableId(null);
      setEditDeliverableData({});
      utils.deliverables.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const deleteDeliverableMutation = trpc.deliverables.delete.useMutation({
    onSuccess: () => {
      toast.success('Deliverable deleted successfully');
      setDeleteDeliverableDialogOpen(false);
      setDeletingDeliverableId(null);
      utils.deliverables.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const linkDeliverableMutation = trpc.deliverables.addLink.useMutation({
    onSuccess: () => {
      toast.success('Deliverable linked successfully');
      setSelectedDeliverableToLink('');
      utils.deliverables.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Link failed: ${error.message}`);
    },
  });

  const filteredRequirements = requirements?.filter(req => {
    const matchesSearch =
      req.idCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.owner?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    const matchesType = typeFilter === 'all' || req.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
    const matchesOwner = ownerFilter === 'all' || String(req.ownerId) === ownerFilter;
    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesOwner;
  });

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setEditData({
      status: req.status || '',
      priority: req.priority || '',
      lastUpdate: req.lastUpdate || '',
      updateDate: new Date().toLocaleDateString('en-GB'),
    });
  };

  const handleSave = (req: any) => {
    updateMutation.mutate({
      id: req.id,
      idCode: req.idCode,
      data: editData,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const showHistory = (idCode: string) => {
    setSelectedEntityId(idCode);
    setHistoryDialogOpen(true);
  };

  const handleCreate = () => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createMutation.mutate({ ...newRequirement, projectId: currentProjectId });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const handleViewDetails = (req: any) => {
    setSelectedRequirement(req);
    setEditFormData({
      taskGroup: req.taskGroup || '',
      issueGroup: req.issueGroup || '',
      priority: req.priority || 'Medium',
      type: req.type || '',
      category: req.category || '',
      owner: req.owner || '',
      sourceType: req.sourceType || '',
      refSource: req.refSource || '',
      status: req.status || 'Open',
      description: req.description || '',
      lastUpdate: req.lastUpdate || '',
      knowledgeBaseCode: req.knowledgeBaseCode || '',
      linkedDocumentId: req.linkedDocumentId ?? undefined,
    });
    setIsEditMode(false);
    setViewDialogOpen(true);
  };

  const handleEditDetails = (req: any) => {
    setSelectedRequirement(req);
    setEditFormData({
      taskGroup: req.taskGroup || '',
      issueGroup: req.issueGroup || '',
      priority: req.priority || 'Medium',
      type: req.type || '',
      category: req.category || '',
      owner: req.owner || '',
      sourceType: req.sourceType || '',
      refSource: req.refSource || '',
      status: req.status || 'Open',
      description: req.description || '',
      lastUpdate: req.lastUpdate || '',
      knowledgeBaseCode: req.knowledgeBaseCode || '',
      linkedDocumentId: req.linkedDocumentId ?? undefined,
    });
    setIsEditMode(true);
    setViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedRequirement || !currentProjectId) return;
    updateMutation.mutate({
      id: selectedRequirement.id,
      idCode: selectedRequirement.idCode,
      data: editFormData,
    });
    setIsEditMode(false);
  };

  const handleCreateTaskFromRequirement = () => {
    if (!selectedRequirement || !currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createTaskMutation.mutate({
      ...newTask,
      projectId: currentProjectId,
      requirementId: selectedRequirement.idCode,
      taskGroup: newTask.taskGroup || selectedRequirement.taskGroup || '',
    });
  };

  const handleCreateIssueFromRequirement = () => {
    if (!selectedRequirement || !currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createIssueMutation.mutate({
      ...newIssue,
      projectId: currentProjectId,
      requirementId: selectedRequirement.idCode,
      issueGroup: selectedRequirement.issueGroup || '',
    });
  };

  const handleCreateDeliverableFromRequirement = () => {
    if (!selectedRequirement || !currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createDeliverableMutation.mutate({
      ...newDeliverable,
      projectId: currentProjectId,
      linkedEntities: [{ entityType: 'requirement' as const, entityId: selectedRequirement.idCode }],
    });
  };

  const handleCreateStakeholder = () => {
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createStakeholderMutation.mutate({ ...newStakeholder, projectId: currentProjectId });
  };

  const handleEditDeliverable = (deliverable: any) => {
    setEditingDeliverableId(deliverable.id);
    setEditDeliverableData({
      description: deliverable.description || '',
      status: deliverable.status || '',
      dueDate: deliverable.dueDate || '',
    });
  };

  const handleSaveDeliverable = (deliverable: any) => {
    updateDeliverableMutation.mutate({
      id: deliverable.id,
      data: editDeliverableData,
    });
  };

  const handleCancelEditDeliverable = () => {
    setEditingDeliverableId(null);
    setEditDeliverableData({});
  };

  const handleDeleteDeliverable = (id: number) => {
    setDeletingDeliverableId(id);
    setDeleteDeliverableDialogOpen(true);
  };

  const confirmDeleteDeliverable = () => {
    if (deletingDeliverableId) {
      deleteDeliverableMutation.mutate({ id: deletingDeliverableId });
    }
  };

  // Get linked tasks and issues
  const linkedTasks = tasks?.filter(t => t.requirementId === selectedRequirement?.idCode) || [];
  const linkedIssues = issues?.filter(i => i.requirementId === selectedRequirement?.idCode) || [];

  // Status and Priority color helpers - Oracle theme colors
  const isStatusComplete = (status: string | null | undefined) => {
    if (!status) return false;
    return statusOptions?.some((s: any) => (s.value || '').toLowerCase() === status.toLowerCase() && s.isComplete) ?? false;
  };

  const getStatusColor = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    if (!status) return 'outline';
    if (isStatusComplete(status)) return 'outline';
    switch (status?.toLowerCase()) {
      case 'open':
      case 'new':
        return 'default';
      case 'in progress':
      case 'active':
        return 'secondary';
      case 'blocked':
      case 'on hold':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority?.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return _formatDateUtil(dateStr);
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
            <FileText className="w-6 h-6 text-gray-500" />
            Requirements Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">View, edit, and track changes to project requirements. IDs are auto-generated.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-emerald-700 border-emerald-300">{requirements?.length || 0} Requirements</Badge>
          <div className="flex items-center border border-emerald-300 rounded-md flex-shrink-0">
            <Button size="sm" variant={viewMode === 'compact' ? 'default' : 'ghost'} onClick={() => setViewMode('compact')} title="Compact View" className="h-8 w-8 p-0 rounded-r-none border-r border-emerald-300">
              <List className="w-4 h-4" />
            </Button>
            <Button size="sm" variant={viewMode === 'full' ? 'default' : 'ghost'} onClick={() => setViewMode('full')} title="Full View" className="h-8 w-8 p-0 rounded-l-none">
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("status"); setSettingsOpen(true); }} className="border-emerald-300 hover:bg-emerald-50 text-emerald-700">
            <Settings className="w-4 h-4 mr-1" />Status
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("priority"); setSettingsOpen(true); }} className="border-emerald-300 hover:bg-emerald-50 text-emerald-700">
            <Settings className="w-4 h-4 mr-1" />Priority
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="requirements"
              projectId={currentProjectId}
              onImportSuccess={() => utils.requirements.list.invalidate()}
            />
          )}
        </div>
      </div>
      <Card className="border-emerald-100">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by ID, description, owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions?.filter((o: any) => o.value).map((o: any) => (
                  <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {typeOptions?.filter((o: any) => o.value).map((o: any) => (
                  <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions?.filter((o: any) => o.value).map((o: any) => (
                  <SelectItem key={o.id} value={o.value}>{o.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-[150px] h-8 text-xs">
                <SelectValue placeholder="All Owners" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                {stakeholders?.filter((s: any) => s.fullName).map((s: any) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || typeFilter !== 'all' || categoryFilter !== 'all' || ownerFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setCategoryFilter('all'); setOwnerFilter('all'); }}
              >
                <X className="w-3 h-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          {/* Bulk Action Toolbar */}
          {selectedReqIds.length > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium text-primary">{selectedReqIds.length} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" variant="outline" onClick={() => setBulkStatusDialogOpen(true)}>
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedReqIds.length} selected requirement(s)? This cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ ids: selectedReqIds });
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedReqIds([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Requirements Table with Vertical Layout */}
          <div className="rounded-md border border-primary/20 overflow-hidden">
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredRequirements && filteredRequirements.length > 0 && selectedReqIds.length === filteredRequirements.length}
                      onCheckedChange={handleSelectAllReqs}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-primary w-auto">Requirement Details</TableHead>
                  <TableHead className="w-[220px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements?.map((req) => (
                  <TableRow key={req.id} className={`hover:bg-primary/5 ${selectedReqIds.includes(req.id) ? 'bg-primary/10' : ''}`}>
                    <TableCell className="w-10 align-top pt-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedReqIds.includes(req.id)}
                        onCheckedChange={() => handleToggleSelectReq(req.id)}
                        aria-label={`Select ${req.idCode}`}
                      />
                    </TableCell>
                    <TableCell className="py-4 overflow-hidden">
                      {viewMode === 'compact' ? (
                        /* Compact View */
                        <div className="space-y-2">
                          <div className="flex items-start gap-3 flex-wrap">
                            <span className="font-mono font-bold text-primary text-base whitespace-nowrap">{req.idCode}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {req.taskGroup && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
                                  {req.taskGroup}
                                </span>
                              )}
                              {req.issueGroup && (
                                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 whitespace-nowrap">
                                  {req.issueGroup}
                                </span>
                              )}
                            </div>
                            <p className="flex-1 text-sm break-words min-w-0">{req.description || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2 pl-4">
                            <Badge variant={getPriorityColor(req.priority)} className="text-xs whitespace-nowrap">{req.priority || '-'}</Badge>
                            <Badge variant={getStatusColor(req.status)} className="text-xs whitespace-nowrap">{req.status || '-'}</Badge>
                          </div>
                        </div>
                      ) : (
                        /* Full View */
                        <div className="space-y-3">
                          {/* Line 1: ID, Task Group, Issue Group, Description */}
                          <div className="flex items-start gap-3 flex-wrap">
                            <span className="font-mono font-bold text-primary text-base whitespace-nowrap">{req.idCode}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {req.taskGroup && (
                                <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 whitespace-nowrap">
                                  {req.taskGroup}
                                </span>
                              )}
                              {req.issueGroup && (
                                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 whitespace-nowrap">
                                  {req.issueGroup}
                                </span>
                              )}
                            </div>
                            <p className="flex-1 text-sm break-words min-w-0">{req.description || '-'}</p>
                          </div>

                          {/* Line 2: Details Grid */}
                          <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground pl-4 border-l-2 border-muted">
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Priority:</span>
                              <Badge variant={getPriorityColor(req.priority)} className="text-xs">{req.priority || '-'}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Created:</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Type:</span>
                              <span>{req.type || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Category:</span>
                              <span>{req.category || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Owner:</span>
                              <span>{req.owner || '-'}</span>
                            </div>
                            {req.scopeItemId && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[120px]">Scope Item:</span>
                                <span className="text-primary font-mono text-xs">
                                  {(() => { const si = scopeItemsList.find((s: any) => s.id === req.scopeItemId); return si ? `${si.idCode} – ${si.name}` : `#${req.scopeItemId}`; })()}
                                </span>
                              </div>
                            )}
                            {req.linkedDocumentId && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium min-w-[120px]">Linked Document:</span>
                                <span className="text-primary font-mono text-xs">
                                  {(() => { const doc = allDocuments.find((d: any) => d.id === req.linkedDocumentId); return doc ? `${doc.documentId} – ${doc.originalName || doc.fileName}` : `#${req.linkedDocumentId}`; })()}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Source Type:</span>
                              <span>{req.sourceType || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">External Source:</span>
                              <span className="break-words" title={req.refSource || ''}>{req.refSource || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Status:</span>
                              <Badge variant={getStatusColor(req.status)} className="text-xs">{req.status || '-'}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium min-w-[120px]">Last Update:</span>
                              {req.lastUpdate ? (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{req.lastUpdate}</span>
                                </div>
                              ) : (
                                <span>-</span>
                              )}
                            </div>
                            {/* Linked Tasks summary */}
                            {(() => {
                              const linkedTasks = tasks?.filter(t => t.requirementId === req.idCode) || [];
                              const linkedIssues = issues?.filter(i => i.requirementId === req.idCode) || [];
                              if (linkedTasks.length === 0 && linkedIssues.length === 0) return null;
                              return (
                                <div className="flex items-start gap-2 mt-1">
                                  <span className="font-medium min-w-[120px]">Linked:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {linkedTasks.map(t => (
                                      <Badge key={t.id} variant="secondary" className="text-xs font-mono" title={t.description || ''}>
                                        {t.taskId} <span className="ml-1 opacity-60">[{t.status || '?'}]</span>
                                      </Badge>
                                    ))}
                                    {linkedIssues.map(i => (
                                      <Badge key={i.id} variant="outline" className="text-xs font-mono text-orange-700 border-orange-300" title={i.description || ''}>
                                        {i.issueId} <span className="ml-1 opacity-60">[{i.status || '?'}]</span>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewDetails(req)} title="View Details" className="h-8 w-8 p-0 hover:bg-primary/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleEditDetails(req)} title="Edit" className="h-8 w-8 p-0 hover:bg-primary/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => showHistory(req.idCode)} title="History" className="h-8 w-8 p-0 hover:bg-primary/10">
                            <History className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(req.id)} title="Delete" className="h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setSelectedRequirement(req);
                            setNewTask({
                              ...newTask,
                              requirementId: req.idCode,
                              description: `Task for ${req.idCode}`,
                              taskGroup: req.taskGroup || '',
                            });
                            setCreateTaskDialogOpen(true);
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
            </Table>
          </div>

          {filteredRequirements?.length === 0 && (
            <EmptyState
              icon={FileText}
              title="No requirements found"
              description="Create a new requirement or import an Excel file to get started."
              actionLabel="Create Requirement"
              onAction={() => setCreateDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      {/* View/Edit Details Dialog with Linked Items */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded">{selectedRequirement?.idCode}</span>
                {isEditMode ? 'Edit Requirement' : 'Requirement Details'}
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
              {isEditMode ? 'Edit the requirement details below' : 'View all details and linked items for this requirement'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4 flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-7 flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({linkedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({linkedIssues.length})
              </TabsTrigger>
              <TabsTrigger value="userstories">
                Stories ({userStoriesList.filter((s: any) => s.requirements?.some((r: any) => r.id === selectedRequirement?.id)).length})
              </TabsTrigger>
              <TabsTrigger value="tests">
                Tests ({(testCasesList as any[]).filter((tc) => tc.requirementId === selectedRequirement?.idCode).length})
              </TabsTrigger>
              <TabsTrigger value="changes">
                Changes ({(changeRequestsList as any[]).filter((cr) => cr.requirementId === selectedRequirement?.idCode).length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {/* Main Details Grid */}
              <div className="grid grid-cols-3 gap-4">

                {/* Priority */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                  {isEditMode ? (
                    <Select value={editFormData.priority || ''} onValueChange={(v) => setEditFormData({...editFormData, priority: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions?.filter(opt => opt.value).map((opt) => (
                          <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getPriorityColor(selectedRequirement?.priority)}>
                      {selectedRequirement?.priority || 'N/A'}
                    </Badge>
                  )}
                </div>
                {/* Creation Date */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Creation Date</Label>
                  <p className="font-medium">{formatDate(selectedRequirement?.createdAt)}</p>
                </div>
                {/* Type */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Type</Label>
                  {isEditMode ? (
                    <Select value={editFormData.type || ''} onValueChange={(v) => setEditFormData({...editFormData, type: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions?.filter(opt => opt.value).map((opt) => (
                          <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedRequirement?.type || '-'}</p>
                  )}
                </div>
                {/* Category */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Category</Label>
                  {isEditMode ? (
                    <Select value={editFormData.category || ''} onValueChange={(v) => setEditFormData({...editFormData, category: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions?.filter(opt => opt.value).map((opt) => (
                          <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedRequirement?.category || '-'}</p>
                  )}
                </div>
                {/* Owner */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Owner</Label>
                  {isEditMode ? (
                    <Select value={editFormData.owner || ''} onValueChange={(v) => setEditFormData({...editFormData, owner: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholders?.filter(s => s.fullName).map((s) => (
                          <SelectItem key={s.id} value={s.fullName!}>{s.fullName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedRequirement?.owner || '-'}</p>
                  )}
                </div>
                {/* Source Type */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Source Type</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.sourceType || ''}
                      onChange={(e) => setEditFormData({...editFormData, sourceType: e.target.value})}
                      className="h-8"
                      placeholder="Enter source type"
                    />
                  ) : (
                    <p className="font-medium">{selectedRequirement?.sourceType || '-'}</p>
                  )}
                </div>
                {/* External Source */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">External Source</Label>
                  {isEditMode ? (
                    <Input
                      value={editFormData.refSource || ''}
                      onChange={(e) => setEditFormData({...editFormData, refSource: e.target.value})}
                      className="h-8"
                      placeholder="Enter external source"
                    />
                  ) : (
                    <p className="font-medium">{selectedRequirement?.refSource || '-'}</p>
                  )}
                </div>
                {/* Knowledge Base Code */}
                {isEditMode && (
                  <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Knowledge Base Link</Label>
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => { setQuickKbFor('edit'); setQuickKbDialogOpen(true); }}>
                        <Plus className="w-3 h-3 mr-1" /> New KB Entry
                      </Button>
                    </div>
                    <Select 
                      value={editFormData.knowledgeBaseCode || ''} 
                      onValueChange={(v) => setEditFormData({...editFormData, knowledgeBaseCode: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select KB entry" />
                      </SelectTrigger>
                      <SelectContent>
                        {knowledgeBaseEntries?.map((kb: any) => (
                          <SelectItem key={kb.id} value={kb.kbCode}>
                            {kb.kbCode} - {kb.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {/* Linked Document */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Linked Document</Label>
                    {isEditMode && (
                      <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => { setQuickDocFor('edit'); setQuickDocDialogOpen(true); }}>
                        <Plus className="w-3 h-3 mr-1" /> New Document
                      </Button>
                    )}
                  </div>
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
                      {selectedRequirement?.linkedDocumentId
                        ? (() => { const doc = allDocuments.find((d: any) => d.id === selectedRequirement.linkedDocumentId); return doc ? `${doc.documentId} – ${doc.originalName || doc.fileName}` : `#${selectedRequirement.linkedDocumentId}`; })()
                        : '—'}
                    </p>
                  )}
                </div>
                {/* Status */}
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
                    <Badge variant={getStatusColor(selectedRequirement?.status)}>
                      {selectedRequirement?.status || 'N/A'}
                    </Badge>
                  )}
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
                    <p className="font-medium">{selectedRequirement?.lastUpdate || '-'}</p>
                  )}
                </div>
              </div>
              
              {/* Description */}
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                {isEditMode ? (
                  <Textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="min-h-[100px]"
                    placeholder="Enter description"
                  />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{selectedRequirement?.description || '-'}</p>
                )}
              </div>
              
              {/* Linked Deliverables Section */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    Linked Deliverables
                  </h4>
                  <Button size="sm" onClick={() => setCreateDeliverableDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Deliverable
                  </Button>
                </div>
                {/* Link Existing Deliverable */}
                <div className="flex gap-2 mb-3">
                  <Select
                    value={selectedDeliverableToLink}
                    onValueChange={setSelectedDeliverableToLink}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select deliverable to link..." />
                    </SelectTrigger>
                    <SelectContent>
                      {allDeliverables?.filter(del => 
                        !linkedDeliverables?.some(linked => linked.id === del.id)
                      ).map((del) => (
                        <SelectItem key={del.id} value={del.id.toString()}>
                          {del.deliverableId} - {del.description?.substring(0, 50) || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (selectedDeliverableToLink && selectedRequirement?.idCode) {
                        linkDeliverableMutation.mutate({
                          deliverableId: parseInt(selectedDeliverableToLink),
                          entityType: 'requirement',
                          entityId: selectedRequirement.idCode,
                        });
                      }
                    }}
                    disabled={!selectedDeliverableToLink || linkDeliverableMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {linkDeliverableMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Link
                      </>
                    )}
                  </Button>
                </div>
                {linkedDeliverables && linkedDeliverables.length > 0 ? (
                  <div className="space-y-2">
                    {linkedDeliverables.map((deliverable) => (
                      <Card key={deliverable.id} className="p-3 border-primary/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <span className="font-mono text-sm font-medium text-primary">{deliverable.deliverableId}</span>
                            {editingDeliverableId === deliverable.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editDeliverableData.description}
                                  onChange={(e) => setEditDeliverableData({ ...editDeliverableData, description: e.target.value })}
                                  className="text-sm"
                                  rows={2}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                <div className="text-sm">
                                  <SelectWithCreate
                                    type="status"
                                    value={editDeliverableData.status}
                                    onValueChange={(value) => setEditDeliverableData({ ...editDeliverableData, status: value })}
                                    placeholder="Select status..."
                                  />
                                </div>
                                  <Input
                                    type="date"
                                    value={editDeliverableData.dueDate}
                                    onChange={(e) => setEditDeliverableData({ ...editDeliverableData, dueDate: e.target.value })}
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground mt-1">{deliverable.description || 'No description'}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            {editingDeliverableId === deliverable.id ? (
                              <>
                                <Button size="sm" onClick={() => handleSaveDeliverable(deliverable)} disabled={updateDeliverableMutation.isPending}>
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEditDeliverable}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline">{deliverable.status || 'N/A'}</Badge>
                                {deliverable.dueDate && (
                                  <span className="text-xs text-muted-foreground">Due: {deliverable.dueDate}</span>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => handleEditDeliverable(deliverable)}>
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteDeliverable(deliverable.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                    No deliverables linked yet.
                  </div>
                )}
              </div>
              {/* Custom Fields */}
              {currentProjectId && selectedRequirement?.idCode && (
                <CustomFieldsSection
                  projectId={currentProjectId}
                  entityType="requirement"
                  entityId={selectedRequirement.idCode}
                  readOnly={!isEditMode}
                />
              )}
            </TabsContent>
            
            <TabsContent value="tasks" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Tasks linked to this requirement
                </p>
                <Button size="sm" onClick={() => setCreateTaskDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
              
              {linkedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                  No tasks linked to this requirement yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedTasks.map((task) => (
                    <Card 
                      key={task.id} 
                      className="p-3 border-primary/20 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        // Navigate to Tasks page - the Tasks page will need to handle opening the task details
                        window.location.href = `/tasks?taskId=${task.taskId}`;
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm font-medium text-primary">{task.taskId}</span>
                          <p className="text-sm text-muted-foreground mt-1">{task.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(task.status)}>{task.status || 'N/A'}</Badge>
                          <Badge variant={getPriorityColor(task.priority)}>{task.priority || 'N/A'}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="issues" className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  Issues linked to this requirement
                </p>
                <Button size="sm" onClick={() => setCreateIssueDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Issue
                </Button>
              </div>
              
              {linkedIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                  No issues linked to this requirement yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedIssues.map((issue) => (
                    <Card key={issue.id} className="p-3 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono text-sm font-medium text-primary">{issue.issueId}</span>
                          <p className="text-sm text-muted-foreground mt-1">{issue.description || 'No description'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(issue.status)}>{issue.status || 'N/A'}</Badge>
                          <Badge variant={getPriorityColor(issue.priority)}>{issue.priority || 'N/A'}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* ── User Stories Tab ─────────────────────────────────── */}
            <TabsContent value="userstories" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-2">
                  User stories that include this requirement. Click a story to link/unlink.
                </p>
                {userStoriesList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                    No user stories in this project yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userStoriesList.map((story: any) => {
                      const isLinked = story.requirements?.some((r: any) => r.id === selectedRequirement?.id);
                      return (
                        <div
                          key={story.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isLinked ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-muted hover:border-primary/40 hover:bg-muted/30'}`}
                          onClick={() => {
                            if (!selectedRequirement) return;
                            if (isLinked) {
                              unlinkUserStoryMut.mutate({ userStoryId: story.id, requirementId: selectedRequirement.id });
                            } else {
                              linkUserStoryMut.mutate({ userStoryId: story.id, requirementId: selectedRequirement.id, projectId: currentProjectId! });
                            }
                          }}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${isLinked ? 'border-blue-500 bg-blue-500' : 'border-muted-foreground'}`}>
                            {isLinked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-primary">{story.storyId}</span>
                              {story.scopeItemName && (
                                <span className="text-xs text-muted-foreground">→ {story.scopeItemCode} {story.scopeItemName}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground truncate">{story.title}</p>
                            {story.status && (
                              <span className="text-xs text-muted-foreground">{story.status}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ── Test Cases Tab ─────────────────────────────────────────── */}
            <TabsContent value="tests" className="mt-4">
              <div className="space-y-3">
                {(() => {
                  const linked = (testCasesList as any[]).filter(
                    (tc) => tc.requirementId === selectedRequirement?.idCode
                  );
                  if (linked.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                        <p className="text-sm">No test cases linked to this requirement.</p>
                        <p className="text-xs mt-1">Link test cases from the Test Cases page.</p>
                      </div>
                    );
                  }
                  return linked.map((tc: any) => (
                    <div key={tc.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <span className="font-mono text-xs font-bold text-primary w-20 flex-shrink-0">{tc.testId}</span>
                      <span className="flex-1 text-sm truncate">{tc.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        tc.status === "Passed" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                        tc.status === "Failed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                        tc.status === "In Progress" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>{tc.status ?? "Not Executed"}</span>
                      {tc.tester && <span className="text-xs text-muted-foreground flex-shrink-0">{tc.tester}</span>}
                    </div>
                  ));
                })()}
              </div>
            </TabsContent>

            {/* ── Change Requests Tab ────────────────────────────────────── */}
            <TabsContent value="changes" className="mt-4">
              <div className="space-y-3">
                {(() => {
                  const linked = (changeRequestsList as any[]).filter(
                    (cr) => cr.requirementId === selectedRequirement?.idCode
                  );
                  if (linked.length === 0) {
                    return (
                      <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                        <p className="text-sm">No change requests linked to this requirement.</p>
                        <p className="text-xs mt-1">Set the Requirement ID when creating a change request.</p>
                      </div>
                    );
                  }
                  return linked.map((cr: any) => (
                    <div key={cr.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <span className="font-mono text-xs font-bold text-primary w-24 flex-shrink-0">{cr.crId}</span>
                      <span className="flex-1 text-sm truncate">{cr.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                        cr.status === "Approved" || cr.status === "Implemented" ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" :
                        cr.status === "Rejected" || cr.status === "Closed" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" :
                        cr.status === "Under Review" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                      }`}>{cr.status ?? "Draft"}</span>
                      {cr.requestedBy && <span className="text-xs text-muted-foreground flex-shrink-0">{cr.requestedBy}</span>}
                    </div>
                  ));
                })()}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Modification history for this requirement
                </p>
                {actionLogs && actionLogs.length > 0 ? (
                  <div className="space-y-2">
                    {actionLogs.map((log) => {
                      const changedFieldNames = Object.keys(log.changedFields || {}).join(', ');
                      const oldValues = Object.entries(log.changedFields || {}).map(([k, v]) => `${k}: ${v.oldValue}`).join(', ');
                      const newValues = Object.entries(log.changedFields || {}).map(([k, v]) => `${k}: ${v.newValue}`).join(', ');
                      return (
                        <Card key={log.id} className="p-3 border-primary/20">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Update</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.changedAt).toLocaleString()}
                                </span>
                              </div>
                              {changedFieldNames && (
                                <p className="text-sm mt-1">
                                  <span className="text-muted-foreground">Changed: </span>
                                  {changedFieldNames}
                                </p>
                              )}
                              {oldValues && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Old: {oldValues}
                                </p>
                              )}
                              {newValues && (
                                <p className="text-xs text-primary mt-1">
                                  New: {newValues}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">User #{log.changedBy}</span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                    No history records found.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Requirement Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Create New Requirement
            </DialogTitle>
            <DialogDescription>
              Fill in the details below. ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Creation Date</Label>
              <Input
                type="date"
                value={newRequirement.createdAt}
                onChange={(e) => setNewRequirement({ ...newRequirement, createdAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <SelectWithCreate
                type="priority"
                value={newRequirement.priority}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
                placeholder="Select priority"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <SelectWithCreate
                type="type"
                value={newRequirement.type}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}
                placeholder="Select type"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <SelectWithCreate
                type="category"
                value={newRequirement.category}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, category: value })}
                placeholder="Select category"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner (Stakeholder)</Label>
              <SelectWithCreate
                type="stakeholder"
                value={newRequirement.ownerId?.toString() || ''}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, ownerId: value ? parseInt(value) : undefined })}
                placeholder="Select owner"
                projectId={currentProjectId || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Input
                value={newRequirement.sourceType}
                onChange={(e) => setNewRequirement({ ...newRequirement, sourceType: e.target.value })}
                placeholder="e.g., Internal, External, Customer"
              />
            </div>
            <div className="space-y-2">
              <Label>External Source</Label>
              <Input
                value={newRequirement.refSource}
                onChange={(e) => setNewRequirement({ ...newRequirement, refSource: e.target.value })}
                placeholder="Reference source URL or name"
              />
            </div>

            {/* Scope Item */}
            <div className="space-y-2">
              <Label>Scope Item</Label>
              <Select
                value={newRequirement.scopeItemId ? String(newRequirement.scopeItemId) : '__none__'}
                onValueChange={(v) => setNewRequirement({ ...newRequirement, scopeItemId: v === '__none__' ? undefined : Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to scope item..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {scopeItemsList.map((si: any) => (
                    <SelectItem key={si.id} value={String(si.id)}>
                      {si.idCode} – {si.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Knowledge Base Link */}
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label>Knowledge Base Link</Label>
                 <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => { setQuickKbFor('create'); setQuickKbDialogOpen(true); }}>+ New KB Entry</Button>
               </div>
               <Select
                 value={newRequirement.knowledgeBaseCode || '__none__'}
                 onValueChange={(v) => setNewRequirement({ ...newRequirement, knowledgeBaseCode: v === '__none__' ? '' : v })}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Select KB entry..." />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="__none__">— None —</SelectItem>
                   {knowledgeBaseEntries?.map((kb: any) => (
                     <SelectItem key={kb.id} value={kb.kbCode}>
                       {kb.kbCode} – {kb.title}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

            {/* Document Library Reference */}
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <Label>Linked Document</Label>
                 <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary" onClick={() => { setQuickDocFor('create'); setQuickDocDialogOpen(true); }}>+ New Document</Button>
               </div>
               <Select
                 value={newRequirement.linkedDocumentId ? String(newRequirement.linkedDocumentId) : '__none__'}
                 onValueChange={(v) => setNewRequirement({ ...newRequirement, linkedDocumentId: v === '__none__' ? undefined : Number(v) })}
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
              <Label>Status</Label>
              <SelectWithCreate
                type="status"
                value={newRequirement.status}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
                placeholder="Select status"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Enter requirement description"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Task for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new task linked to this requirement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Task Group *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.taskGroup}
                      onValueChange={(value) => setNewTask({ ...newTask, taskGroup: value })}
                    >
                      <SelectTrigger>
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
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const name = prompt('Enter new Task Group name:');
                        if (name && currentProjectId) {
                          createTaskGroupMutation.mutate({ projectId: currentProjectId, name });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description..."
                  />
                </div>
              </div>
            </div>

            {/* RACI Assignment */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">RACI Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Responsible (R)</Label>
                  <Select
                    value={newTask.responsible}
                    onValueChange={(value) => setNewTask({ ...newTask, responsible: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select responsible..." />
                    </SelectTrigger>
                    <SelectContent>
                          {stakeholders?.filter(s => s.fullName).map((s) => (
                            <SelectItem key={s.id} value={s.fullName!}>{s.fullName}</SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Accountable (A)</Label>
                  <Select
                    value={newTask.accountable}
                    onValueChange={(value) => setNewTask({ ...newTask, accountable: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select accountable..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders?.map((s) => (
                        <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Consulted (C)</Label>
                  <Select
                    value={newTask.consulted}
                    onValueChange={(value) => setNewTask({ ...newTask, consulted: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select consulted..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders?.map((s) => (
                        <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Informed (I)</Label>
                  <Select
                    value={newTask.informed}
                    onValueChange={(value) => setNewTask({ ...newTask, informed: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select informed..." />
                    </SelectTrigger>
                    <SelectContent>
                      {stakeholders?.map((s) => (
                        <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Status, Priority & Due Date */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">Status, Priority & Due Date</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTaskFromRequirement} disabled={createTaskMutation.isPending} className="bg-primary hover:bg-primary/90">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={createIssueDialogOpen} onOpenChange={setCreateIssueDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Issue for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new issue linked to this requirement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Group *</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newIssue.issueGroup || ''}
                      onValueChange={(value) => setNewIssue({ ...newIssue, issueGroup: value })}
                    >
                      <SelectTrigger>
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
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const name = prompt('Enter new Issue Group name:');
                        if (name && currentProjectId) {
                          createIssueGroupMutation.mutate({ projectId: currentProjectId, name });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description *</Label>
                  <Input
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Issue description..."
                  />
                </div>
              </div>
            </div>

            {/* Status & Priority */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">Status & Priority</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newIssue.status}
                    onValueChange={(value) => setNewIssue({ ...newIssue, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={newIssue.priority}
                    onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions?.map((opt) => (
                        <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Owner */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm border-b pb-2">Assignment</h4>
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={newIssue.owner}
                  onValueChange={(value) => setNewIssue({ ...newIssue, owner: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateIssueFromRequirement} disabled={createIssueMutation.isPending} className="bg-primary hover:bg-primary/90">
              Create Issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deliverable Dialog */}
      <Dialog open={createDeliverableDialogOpen} onOpenChange={setCreateDeliverableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Deliverable for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new deliverable linked to this requirement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                placeholder="Enter deliverable description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <SelectWithCreate
                  type="status"
                  value={newDeliverable.status}
                  onValueChange={(value) => setNewDeliverable({ ...newDeliverable, status: value })}
                  placeholder="Select status..."
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newDeliverable.dueDate}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDeliverableDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDeliverableFromRequirement} disabled={createDeliverableMutation.isPending} className="bg-primary hover:bg-primary/90">
              Create Deliverable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Change History for {selectedEntityId}
            </DialogTitle>
            <DialogDescription>
              View all modifications made to this requirement
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto py-4">
            {actionLogs && actionLogs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[140px] font-semibold">Update</TableHead>
                    <TableHead className="w-[180px] font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Changed</TableHead>
                    <TableHead className="font-semibold">Old</TableHead>
                    <TableHead className="font-semibold">New</TableHead>
                    <TableHead className="w-[100px] font-semibold">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionLogs.map((log) => {
                    const changedFields = Object.entries(log.changedFields || {});
                    return changedFields.map(([fieldName, values], idx) => (
                      <TableRow key={`${log.id}-${idx}`} className="hover:bg-muted/30">
                        {idx === 0 && (
                          <>
                            <TableCell rowSpan={changedFields.length} className="align-top">
                              <Badge variant="outline" className="text-xs">Update</Badge>
                            </TableCell>
                            <TableCell rowSpan={changedFields.length} className="text-xs text-muted-foreground align-top">
                              {new Date(log.changedAt).toLocaleString()}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-sm font-medium">{fieldName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{values.oldValue || '-'}</TableCell>
                        <TableCell className="text-sm text-primary font-medium">{values.newValue || '-'}</TableCell>
                        {idx === 0 && (
                          <TableCell rowSpan={changedFields.length} className="text-xs text-muted-foreground align-top">
                            User #{log.changedBy}
                          </TableCell>
                        )}
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No history records found for this requirement.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the requirement
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Deliverable Confirmation Dialog */}
      <AlertDialog open={deleteDeliverableDialogOpen} onOpenChange={setDeleteDeliverableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this deliverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeliverable} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedReqIds.length} Requirement(s)</DialogTitle>
            <DialogDescription>Select a new status to apply to all selected requirements.</DialogDescription>
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
                bulkUpdateStatusMutation.mutate({ ids: selectedReqIds, status: bulkStatus });
              }}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending ? 'Updating...' : 'Apply Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Group Creation Dialog */}
      <Dialog open={taskGroupDialogOpen} onOpenChange={setTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Group</DialogTitle>
            <DialogDescription>
              Add a new task group to categorize requirements and tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newTaskGroup.name}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, name: e.target.value })}
                placeholder="Enter task group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTaskGroup.description}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, description: e.target.value })}
                placeholder="Enter task group description (optional)"
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
                    description: newTaskGroup.description.trim() || undefined,
                  });
                }
              }}
              disabled={!newTaskGroup.name.trim() || !currentProjectId || createTaskGroupMutation.isPending}
            >
              {createTaskGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Group Creation Dialog */}
      <Dialog open={issueGroupDialogOpen} onOpenChange={setIssueGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Issue Group</DialogTitle>
            <DialogDescription>
              Add a new issue group to categorize requirements and issues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newIssueGroup.name}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, name: e.target.value })}
                placeholder="Enter issue group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newIssueGroup.description}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, description: e.target.value })}
                placeholder="Enter issue group description (optional)"
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
                  createIssueGroupMutation.mutate({
                    projectId: currentProjectId,
                    name: newIssueGroup.name.trim(),
                    description: newIssueGroup.description.trim() || undefined,
                  });
                }
              }}
              disabled={!newIssueGroup.name.trim() || !currentProjectId || createIssueGroupMutation.isPending}
            >
              {createIssueGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dropdown Options Manager Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="capitalize flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Manage {settingsType} Options
            </DialogTitle>
            <DialogDescription>
              Add, edit, or remove {settingsType} options used across the system
            </DialogDescription>
          </DialogHeader>
          <DropdownOptionsManager type={settingsType} />
        </DialogContent>
      </Dialog>

      {/* Add Stakeholder Dialog */}
      <Dialog open={addStakeholderDialogOpen} onOpenChange={setAddStakeholderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Stakeholder</DialogTitle>
            <DialogDescription>
              Create a new stakeholder to assign as owner
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Input
                value={newStakeholder.position}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                placeholder="Enter position"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input
                value={newStakeholder.role}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                placeholder="Enter role"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStakeholderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStakeholder} disabled={createStakeholderMutation.isPending} className="bg-primary hover:bg-primary/90">
              Add Stakeholder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick-Create Document Mini-Dialog */}
      <Dialog open={quickDocDialogOpen} onOpenChange={setQuickDocDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Add a document link to the library. It will be automatically linked to this requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Document Title <span className="text-destructive">*</span></Label>
              <Input
                value={quickDocForm.title}
                onChange={(e) => setQuickDocForm({ ...quickDocForm, title: e.target.value })}
                placeholder="e.g., Business Requirements Document"
              />
            </div>
            <div className="space-y-2">
              <Label>Document URL / File Path <span className="text-destructive">*</span></Label>
              <Input
                value={quickDocForm.url}
                onChange={(e) => setQuickDocForm({ ...quickDocForm, url: e.target.value })}
                placeholder="https://... or /path/to/file"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={quickDocForm.description}
                onChange={(e) => setQuickDocForm({ ...quickDocForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickDocDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!quickDocForm.title || !quickDocForm.url || quickCreateDocMutation.isPending}
              onClick={() => quickCreateDocMutation.mutate({
                projectId: currentProjectId!,
                fileName: quickDocForm.title,
                originalName: quickDocForm.title,
                fileUrl: quickDocForm.url,
                description: quickDocForm.description || undefined,
              })}
            >
              {quickCreateDocMutation.isPending ? 'Creating...' : 'Create & Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick-Create KB Entry Mini-Dialog */}
      <Dialog open={quickKbDialogOpen} onOpenChange={setQuickKbDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New KB Entry</DialogTitle>
            <DialogDescription>Add a knowledge base entry. It will be automatically linked to this requirement.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input
                value={quickKbForm.title}
                onChange={(e) => setQuickKbForm({ ...quickKbForm, title: e.target.value })}
                placeholder="e.g., Authentication Policy"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={quickKbForm.description}
                onChange={(e) => setQuickKbForm({ ...quickKbForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickKbDialogOpen(false)}>Cancel</Button>
            <Button
              disabled={!quickKbForm.title || quickCreateKbMutation.isPending}
              onClick={() => quickCreateKbMutation.mutate({
                projectId: currentProjectId!,
                title: quickKbForm.title,
                description: quickKbForm.description || undefined,
              })}
            >
              {quickCreateKbMutation.isPending ? 'Creating...' : 'Create & Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
