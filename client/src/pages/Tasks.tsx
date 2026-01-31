import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings, Eye, Save, X, CheckSquare, Info } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
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
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [addTaskGroupDialogOpen, setAddTaskGroupDialogOpen] = useState(false);
  const [newTaskGroupName, setNewTaskGroupName] = useState('');
  const [addRequirementDialogOpen, setAddRequirementDialogOpen] = useState(false);
  const [addDeliverableDialogOpen, setAddDeliverableDialogOpen] = useState(false);
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
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<any>(null);
  const [statusUpdateText, setStatusUpdateText] = useState('');
  const [requirementDetailDialogOpen, setRequirementDetailDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [deliverableDetailDialogOpen, setDeliverableDetailDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  const [linkRequirement, setLinkRequirement] = useState(false);
  const [newTask, setNewTask] = useState<any>({
    taskGroup: '',
    description: '',
    responsibleId: undefined,
    accountableId: undefined,
    consultedId: undefined,
    informedId: undefined,
    ownerId: undefined,
    status: 'Not Started',
    priority: 'Medium',
    requirementId: '',
    dueDate: '',
    assignDate: new Date().toISOString().split('T')[0],
  });

  const { currentProjectId } = useProject();
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: requirements } = trpc.requirements.list.useQuery();
  const { data: deliverables } = trpc.deliverables.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "task", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { data: taskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: issueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  const utils = trpc.useUtils();

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created successfully`);
      setNewTask({ ...newTask, taskGroup: data.name });
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      setAddTaskGroupDialogOpen(false);
      setNewTaskGroupName('');
    },
    onError: (error) => {
      toast.error(`Failed to create task group: ${error.message}`);
    },
  });

  const createRequirementMutation = trpc.requirements.create.useMutation({
      onSuccess: (data) => {
      toast.success(`Requirement "${data.idCode}" created successfully`);
      setNewTask({ ...newTask, requirementId: data.idCode });
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
      toast.success(`Deliverable "${data.deliverableId}" created successfully`);
      setNewTask({ ...newTask, deliverableId: data.id });
      utils.deliverables.list.invalidate();
      setAddDeliverableDialogOpen(false);
      setNewDeliverable({ description: '', status: 'Pending', dueDate: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: (data) => {
      toast.success(`Updated successfully. Changed fields: ${data.changedFields.join(', ') || 'none'}`);
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task ${data.taskId} created successfully`);
      setCreateDialogOpen(false);
      setLinkRequirement(false);
      setNewTask({
        taskGroup: '',
        description: '',
        responsible: '',
        accountable: '',
        consulted: '',
        informed: '',
        owner: '',
        status: 'Not Started',
        priority: 'Medium',
        requirementId: '',
        dueDate: '',
        assignDate: new Date().toISOString().split('T')[0],
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success('Task deleted successfully');
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
      // Refetch stakeholders to update dropdowns
      trpc.useUtils().stakeholders.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create stakeholder: ${error.message}`);
    },
  });

  const filteredTasks = tasks?.filter(task =>
    task.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.responsible?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRequirementStatus = (requirementId: string | null) => {
    if (!requirementId || !requirements) return null;
    const req = requirements.find(r => r.idCode === requirementId);
    return req?.status || null;
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditData({
      currentStatus: task.currentStatus || '',
      lastUpdate: task.lastUpdate || '',
      statusUpdate: task.statusUpdate || '',
    });
  };

  const handleSave = (task: any) => {
    updateMutation.mutate({
      id: task.id,
      taskId: task.taskId,
      data: editData,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleStatusUpdate = () => {
    if (!selectedTaskForStatus || !statusUpdateText.trim()) return;
    
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const updateText = `[${now}] ${statusUpdateText.trim()}`;
    
    updateMutation.mutate({
      id: selectedTaskForStatus.id,
      taskId: selectedTaskForStatus.taskId,
      data: {
        currentStatus: statusUpdateText.trim(),
        statusUpdate: updateText,
      },
    }, {
      onSuccess: () => {
        setStatusUpdateDialogOpen(false);
        setStatusUpdateText('');
        setSelectedTaskForStatus(null);
      },
    });
  };

  const showHistory = (taskId: string) => {
    setSelectedEntityId(taskId);
    setHistoryDialogOpen(true);
  };

  const handleCreate = () => {
    if (!newTask.taskGroup || !newTask.taskGroup.trim()) {
      toast.error('Task Group is required');
      return;
    }
    if (!newTask.description || !newTask.description.trim()) {
      toast.error('Description is required');
      return;
    }
    // Only include requirementId if linkRequirement checkbox is checked
    const taskData = {
      ...newTask,
      projectId: currentProjectId!,
      requirementId: linkRequirement && newTask.requirementId && newTask.requirementId !== "none" ? newTask.requirementId : undefined,
      dueDate: newTask.dueDate || undefined,
      // Preserve assignDate default value (today's date) if not changed
      assignDate: newTask.assignDate,
    };
    createMutation.mutate(taskData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleViewRequirementDetails = (requirementId: string | number) => {
    const requirement = requirements?.find(r => r.idCode === requirementId || r.id === requirementId);
    if (requirement) {
      setSelectedRequirement(requirement);
      setRequirementDetailDialogOpen(true);
    }
  };

  const handleViewDeliverableDetails = (deliverableId: number) => {
    const deliverable = deliverables?.find(d => d.id === deliverableId);
    if (deliverable) {
      setSelectedDeliverable(deliverable);
      setDeliverableDetailDialogOpen(true);
    }
  };

  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setIsEditMode(false);
    setEditFormData({
      taskGroup: task.taskGroup || '',
      description: task.description || '',
      responsible: task.responsible || '',
      accountable: task.accountable || '',
      consulted: task.consulted || '',
      informed: task.informed || '',
      owner: task.owner || '',
      status: task.status || '',
      priority: task.priority || '',
      requirementId: task.requirementId || '',
      dueDate: task.dueDate || '',
      assignDate: task.assignDate || '',
    });
    setViewDialogOpen(true);
  };

  const handleEditDetails = (task: any) => {
    setSelectedTask(task);
    setIsEditMode(true);
    setEditFormData({
      taskGroup: task.taskGroup || '',
      description: task.description || '',
      responsible: task.responsible || '',
      accountable: task.accountable || '',
      consulted: task.consulted || '',
      informed: task.informed || '',
      owner: task.owner || '',
      status: task.status || '',
      priority: task.priority || '',
      requirementId: task.requirementId || '',
      dueDate: task.dueDate || '',
      assignDate: task.assignDate || '',
    });
    setViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTask) return;
    updateMutation.mutate({
      id: selectedTask.id,
      taskId: selectedTask.taskId,
      data: editFormData,
    }, {
      onSuccess: () => {
        setIsEditMode(false);
        setViewDialogOpen(false);
      }
    });
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
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

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "Completed" || status === "Done") return "default";
    if (status === "In Progress") return "outline";
    return "secondary";
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return "secondary";
    if (priority === "Critical" || priority === "Very High") return "destructive";
    if (priority === "High") return "default";
    if (priority === "Medium") return "outline";
    return "secondary";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks Management</CardTitle>
              <CardDescription>
                View, edit, and track changes to project tasks
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {tasks?.length || 0} Tasks
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSettingsType("status");
                  setSettingsOpen(true);
                }}
                title="Manage Status Options"
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
              >
                <Settings className="w-4 h-4 mr-1" />
                Priority
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by Task ID, description, or responsible..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Task ID</TableHead>
                  <TableHead className="w-[120px]">Task Group</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Deliverable</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.taskId}</TableCell>
                    <TableCell>{task.taskGroup || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>
                      {task.requirementId ? (
                        <div className="flex items-center gap-2">
                          <span>{task.requirementId}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => task.requirementId && handleViewRequirementDetails(task.requirementId)}
                            title="View requirement details"
                          >
                            <Info className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.deliverableId ? (
                        <div className="flex items-center gap-2">
                          <span>DL-{String(task.deliverableId).padStart(4, '0')}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => task.deliverableId && handleViewDeliverableDetails(task.deliverableId)}
                            title="View deliverable details"
                          >
                            <Info className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{task.responsible}</TableCell>
                    <TableCell>{task.dueDate || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm font-medium">{task.currentStatus || 'N/A'}</div>
                        {task.statusUpdate && (
                          <div className="text-xs text-muted-foreground mt-1">{task.statusUpdate}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === task.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(task)} disabled={updateMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setSelectedTaskForStatus(task);
                                setStatusUpdateText('');
                                setStatusUpdateDialogOpen(true);
                              }} 
                              title="Update Status"
                            >
                              <CheckSquare className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(task)} title="View Details">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEditDetails(task)} title="Edit">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => showHistory(task.taskId)} title="History">
                              <History className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)} title="Delete">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTasks?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No tasks found. Create a new task or import an Excel file to get started.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change History - {selectedEntityId}</DialogTitle>
            <DialogDescription>
              Timeline of all changes made to this task
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
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the project. Task ID will be auto-generated (T-XXXX format).
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
                        {taskGroups?.map((group) => (
                          <SelectItem key={group.id} value={group.name}>
                            {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddTaskGroupDialogOpen(true)}
                      title="Add new task group"
                      disabled={createTaskGroupMutation.isPending}
                    >
                      {createTaskGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description..."
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
                          setNewTask({ ...newTask, requirementId: '' });
                        }
                      }}
                    />
                    <Label htmlFor="linkRequirement" className="cursor-pointer">Link to Requirement</Label>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.requirementId}
                      onValueChange={(value) => setNewTask({ ...newTask, requirementId: value })}
                      disabled={!linkRequirement}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {requirements?.map((req) => (
                          <SelectItem key={req.id} value={req.idCode}>
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
                      value={newTask.deliverableId?.toString() || ''}
                      onValueChange={(value) => setNewTask({ ...newTask, deliverableId: value ? parseInt(value) : undefined })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select deliverable..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deliverables?.map((del) => (
                          <SelectItem key={del.id} value={del.deliverableId}>
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
                  <Label htmlFor="status">Status</Label>
                  <SelectWithCreate
                    type="status"
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                    placeholder="Select status"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
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
          <div className="flex justify-end gap-2">
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
              Add, edit, or delete {settingsType} options for tasks
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
                <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded">{selectedTask?.taskId}</span>
                {isEditMode ? 'Edit Task' : 'Task Details'}
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
              {isEditMode ? 'Edit the task details below' : 'View all details for this task'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Task Group</Label>
                {isEditMode ? (
                  <Input value={editFormData.taskGroup} onChange={(e) => setEditFormData({...editFormData, taskGroup: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedTask?.taskGroup || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requirement ID</Label>
                <p className="font-medium">{selectedTask?.requirementId || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                {isEditMode ? (
                  <Input value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="h-8" />
                ) : (
                  <Badge variant={getStatusColor(selectedTask?.status)}>{selectedTask?.status || 'N/A'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                {isEditMode ? (
                  <Input value={editFormData.priority} onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})} className="h-8" />
                ) : (
                  <Badge variant={getPriorityColor(selectedTask?.priority)}>{selectedTask?.priority || 'N/A'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Assign Date</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.assignDate} onChange={(e) => setEditFormData({...editFormData, assignDate: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedTask?.assignDate || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Due Date (ETD)</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.dueDate} onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedTask?.dueDate || '-'}</p>
                )}
              </div>
            </div>

            {/* RACI Assignment */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">RACI Assignment</h4>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Responsible (R)</Label>
                  {isEditMode ? (
                    <Input value={editFormData.responsible} onChange={(e) => setEditFormData({...editFormData, responsible: e.target.value})} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedTask?.responsible || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Accountable (A)</Label>
                  {isEditMode ? (
                    <Input value={editFormData.accountable} onChange={(e) => setEditFormData({...editFormData, accountable: e.target.value})} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedTask?.accountable || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Consulted (C)</Label>
                  {isEditMode ? (
                    <Input value={editFormData.consulted} onChange={(e) => setEditFormData({...editFormData, consulted: e.target.value})} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedTask?.consulted || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Informed (I)</Label>
                  {isEditMode ? (
                    <Input value={editFormData.informed} onChange={(e) => setEditFormData({...editFormData, informed: e.target.value})} className="h-8" />
                  ) : (
                    <p className="font-medium">{selectedTask?.informed || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                {isEditMode ? (
                  <Textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="min-h-[80px]" />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{selectedTask?.description || '-'}</p>
                )}
              </div>
            </div>

            {/* Status Updates */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Current Status</h4>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status (Read-only - from latest history)</Label>
                <p className="font-medium whitespace-pre-wrap">{selectedTask?.currentStatus || 'No status updates yet'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
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

      {/* Add Task Group Dialog */}
      <Dialog open={addTaskGroupDialogOpen} onOpenChange={setAddTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task Group</DialogTitle>
            <DialogDescription>
              Enter a name for the new task group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskGroupName" className="text-right">Name *</Label>
              <Input
                id="taskGroupName"
                value={newTaskGroupName}
                onChange={(e) => setNewTaskGroupName(e.target.value)}
                placeholder="Enter task group name..."
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskGroupName.trim() && currentProjectId) {
                    createTaskGroupMutation.mutate({ projectId: currentProjectId, name: newTaskGroupName.trim() });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddTaskGroupDialogOpen(false);
              setNewTaskGroupName('');
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newTaskGroupName.trim() && currentProjectId) {
                  createTaskGroupMutation.mutate({ projectId: currentProjectId, name: newTaskGroupName.trim() });
                }
              }}
              disabled={!newTaskGroupName.trim() || !currentProjectId || createTaskGroupMutation.isPending}
            >
              {createTaskGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Requirement Dialog */}
      <Dialog open={addRequirementDialogOpen} onOpenChange={setAddRequirementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Requirement</DialogTitle>
            <DialogDescription>
              Create a new requirement to link with this task. ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Task Group</Label>
              <Select
                value={newRequirement.taskGroup}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, taskGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select task group" />
                </SelectTrigger>
                <SelectContent>
                  {taskGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue Group</Label>
              <Select
                value={newRequirement.issueGroup}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, issueGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select issue group" />
                </SelectTrigger>
                <SelectContent>
                  {issueGroups?.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                value={newRequirement.owner}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, owner: value })}
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
              <Label>Description *</Label>
              <Textarea
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Enter requirement description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
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
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newRequirement.description.trim() && currentProjectId) {
                  createRequirementMutation.mutate({ 
                    projectId: currentProjectId, 
                    description: newRequirement.description.trim(),
                    taskGroup: newRequirement.taskGroup || undefined,
                    issueGroup: newRequirement.issueGroup || undefined,
                    owner: newRequirement.owner || undefined,
                    status: newRequirement.status || undefined,
                    priority: newRequirement.priority || undefined,
                    type: newRequirement.type || undefined,
                    category: newRequirement.category || undefined,
                    sourceType: newRequirement.sourceType || undefined,
                    refSource: newRequirement.refSource || undefined,
                  });
                }
              }}
              disabled={!newRequirement.description.trim() || !currentProjectId || createRequirementMutation.isPending}
            >
              {createRequirementMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deliverable Dialog */}
      <Dialog open={addDeliverableDialogOpen} onOpenChange={setAddDeliverableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deliverable</DialogTitle>
            <DialogDescription>
              Create a new deliverable to link with this task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
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
                <Input
                  value={newDeliverable.status}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, status: e.target.value })}
                  placeholder="e.g., Pending, In Progress, Completed"
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
            <Button variant="outline" onClick={() => {
              setAddDeliverableDialogOpen(false);
              setNewDeliverable({ description: '', status: 'Pending', dueDate: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newDeliverable.description.trim() && currentProjectId) {
                  createDeliverableMutation.mutate({
                    projectId: currentProjectId,
                    description: newDeliverable.description.trim(),
                    status: newDeliverable.status || 'Pending',
                    dueDate: newDeliverable.dueDate || undefined,
                  });
                }
              }}
              disabled={!newDeliverable.description.trim() || !currentProjectId || createDeliverableMutation.isPending}
            >
              {createDeliverableMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Update the status for task {selectedTaskForStatus?.taskId}. The update will be recorded with a timestamp and saved to history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusUpdate">Status Update *</Label>
              <Textarea
                id="statusUpdate"
                value={statusUpdateText}
                onChange={(e) => setStatusUpdateText(e.target.value)}
                placeholder="Enter status update..."
                className="min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && statusUpdateText.trim()) {
                    // Ctrl+Enter to submit
                    handleStatusUpdate();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Press Ctrl+Enter to submit</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div><strong>Current Status:</strong> {selectedTaskForStatus?.currentStatus || 'N/A'}</div>
              {selectedTaskForStatus?.statusUpdate && (
                <div className="mt-2"><strong>Previous Update:</strong> {selectedTaskForStatus.statusUpdate}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setStatusUpdateDialogOpen(false);
              setStatusUpdateText('');
              setSelectedTaskForStatus(null);
            }}>Cancel</Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!statusUpdateText.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Status'}
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
              Full details for requirement {selectedRequirement?.idCode}
            </DialogDescription>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Code</Label>
                  <p className="font-medium">{selectedRequirement.idCode}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge>{selectedRequirement.status || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Badge variant="outline">{selectedRequirement.priority || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p>{selectedRequirement.type || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p>{selectedRequirement.category || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Owner</Label>
                  <p>{selectedRequirement.owner || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source Type</Label>
                  <p>{selectedRequirement.sourceType || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ref Source</Label>
                  <p>{selectedRequirement.refSource || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedRequirement.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deliverable Detail Dialog */}
      <Dialog open={deliverableDetailDialogOpen} onOpenChange={setDeliverableDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deliverable Details</DialogTitle>
            <DialogDescription>
              Full details for deliverable DL-{String(selectedDeliverable?.id).padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          {selectedDeliverable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p className="font-medium">DL-{String(selectedDeliverable.id).padStart(4, '0')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge>{selectedDeliverable.status || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p>{selectedDeliverable.dueDate || 'N/A'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedDeliverable.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
