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
import { Search, Edit, History, Loader2, Plus, Trash2, Eye, CheckSquare, Save, X, Link2, Settings, Calendar, User, FileText, Tag, Clock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
import { toast } from "sonner";

export default function Requirements() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
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
  });

  const utils = trpc.useUtils();
  const { data: requirements, isLoading, refetch } = trpc.requirements.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: stakeholders } = trpc.stakeholders.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: tasks } = trpc.tasks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: issues } = trpc.issues.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
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
    { entityType: "requirement", entityId: selectedRequirement?.idCode || "" },
    { enabled: viewDialogOpen && !!selectedRequirement?.idCode }
  );
  const { data: allDeliverables } = trpc.deliverables.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId && viewDialogOpen }
  );
  const { data: knowledgeBaseEntries } = trpc.knowledgeBase.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId && viewDialogOpen && isEditMode }
  );

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

  const filteredRequirements = requirements?.filter(req =>
    req.idCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.owner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.taskGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.issueGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  const getStatusColor = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'new':
        return 'default';
      case 'in progress':
      case 'active':
        return 'secondary';
      case 'closed':
      case 'completed':
      case 'done':
        return 'outline';
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
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
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
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Requirements Management
              </CardTitle>
              <CardDescription className="mt-1">
                View, edit, and track changes to project requirements. IDs are auto-generated.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm border-primary/30 bg-primary/5">
                {requirements?.length || 0} Requirements
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSettingsType("status");
                  setSettingsOpen(true);
                }}
                title="Manage Status Options"
                className="border-primary/30 hover:bg-primary/10"
              >
                <Settings className="w-4 h-4 mr-1" />
                Status
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSettingsType("priority");
                  setSettingsOpen(true);
                }}
                title="Manage Priority Options"
                className="border-primary/30 hover:bg-primary/10"
              >
                <Settings className="w-4 h-4 mr-1" />
                Priority
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by ID, description, owner, task group, or issue group..."
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

          {/* Requirements Table with Vertical Layout */}
          <div className="rounded-md border border-primary/20">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableHead className="font-semibold text-primary">Requirement Details</TableHead>
                  <TableHead className="w-[200px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements?.map((req) => (
                  <TableRow key={req.id} className="hover:bg-primary/5">
                    <TableCell className="py-4">
                      <div className="space-y-3">
                        {/* Line 1: ID, Task Group, Issue Group, Description */}
                        <div className="flex items-start gap-3">
                          <span className="font-mono font-bold text-primary text-base">{req.idCode}</span>
                          <div className="flex items-center gap-2">
                            {req.taskGroup && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                {req.taskGroup}
                              </span>
                            )}
                            {req.issueGroup && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                {req.issueGroup}
                              </span>
                            )}
                          </div>
                          <p className="flex-1 text-sm">{req.description || '-'}</p>
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium min-w-[120px]">Source Type:</span>
                            <span>{req.sourceType || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium min-w-[120px]">External Source:</span>
                            <span className="truncate max-w-[300px]" title={req.refSource || ''}>{req.refSource || '-'}</span>
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
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex items-center justify-end gap-1">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequirements?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground border border-dashed border-primary/20 rounded-lg mt-4">
              No requirements found. Create a new requirement or import an Excel file to get started.
            </div>
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
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">
                Tasks ({linkedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Issues ({linkedIssues.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4 flex-1 overflow-y-auto">
              {/* Main Details Grid */}
              <div className="grid grid-cols-3 gap-4">
                {/* Task Group */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Task Group</Label>
                  {isEditMode ? (
                    <div className="flex gap-2">
                      <Select value={editFormData.taskGroup} onValueChange={(v) => setEditFormData({...editFormData, taskGroup: v})}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select task group" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskGroups?.map((g) => (
                            <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <p className="font-medium">{selectedRequirement?.taskGroup || '-'}</p>
                  )}
                </div>
                {/* Issue Group */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Issue Group</Label>
                  {isEditMode ? (
                    <Select value={editFormData.issueGroup} onValueChange={(v) => setEditFormData({...editFormData, issueGroup: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select issue group" />
                      </SelectTrigger>
                      <SelectContent>
                        {issueGroups?.map((g) => (
                          <SelectItem key={g.id} value={g.name}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{selectedRequirement?.issueGroup || '-'}</p>
                  )}
                </div>
                {/* Priority */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                  {isEditMode ? (
                    <Select value={editFormData.priority} onValueChange={(v) => setEditFormData({...editFormData, priority: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
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
                    <Select value={editFormData.type} onValueChange={(v) => setEditFormData({...editFormData, type: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
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
                    <Select value={editFormData.category} onValueChange={(v) => setEditFormData({...editFormData, category: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
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
                    <Select value={editFormData.owner} onValueChange={(v) => setEditFormData({...editFormData, owner: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        {stakeholders?.map((s) => (
                          <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
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
                      value={editFormData.sourceType}
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
                      value={editFormData.refSource}
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
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Knowledge Base Link</Label>
                    <Select 
                      value={editFormData.knowledgeBaseCode} 
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
                {/* Status */}
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                  {isEditMode ? (
                    <Select value={editFormData.status} onValueChange={(v) => setEditFormData({...editFormData, status: v})}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions?.map((opt) => (
                          <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
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
                      value={editFormData.lastUpdate}
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
                    value={editFormData.description}
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
                        {taskGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.name}>
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
                      {stakeholders?.map((s) => (
                        <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
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
                        {issueGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.name}>
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
    </div>
  );
}
