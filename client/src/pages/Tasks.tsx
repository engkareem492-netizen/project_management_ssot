import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings, Eye, Save, X, CheckSquare } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  const [newTask, setNewTask] = useState<any>({
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

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery();
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: requirements } = trpc.requirements.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "task", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { currentProjectId } = useProject();
  const { data: taskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created successfully`);
      setNewTask({ ...newTask, taskGroup: data.name });
    },
    onError: (error) => {
      toast.error(`Failed to create task group: ${error.message}`);
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
    // Convert "none" to undefined for optional requirementId
    const taskData = {
      ...newTask,
      requirementId: newTask.requirementId === "none" ? undefined : newTask.requirementId,
      dueDate: newTask.dueDate || undefined,
      assignDate: newTask.assignDate || undefined,
      consulted: newTask.consulted || undefined,
      informed: newTask.informed || undefined,
    };
    createMutation.mutate(taskData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
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
      currentStatus: task.currentStatus || '',
      lastUpdate: task.lastUpdate || '',
      statusUpdate: task.statusUpdate || '',
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
      currentStatus: task.currentStatus || '',
      lastUpdate: task.lastUpdate || '',
      statusUpdate: task.statusUpdate || '',
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
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Req Status</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead>Status Update</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.taskId}</TableCell>
                    <TableCell>{task.taskGroup || 'N/A'}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>{task.requirementId || 'N/A'}</TableCell>
                    <TableCell>
                      {getRequirementStatus(task.requirementId) ? (
                        <Badge variant="outline">{getRequirementStatus(task.requirementId)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{task.responsible}</TableCell>
                    <TableCell>{task.dueDate || 'N/A'}</TableCell>
                    <TableCell>
                      {editingId === task.id ? (
                        <Input
                          value={editData.currentStatus}
                          onChange={(e) => setEditData({ ...editData, currentStatus: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        task.currentStatus || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === task.id ? (
                        <Input
                          value={editData.lastUpdate}
                          onChange={(e) => setEditData({ ...editData, lastUpdate: e.target.value })}
                          className="w-full"
                          placeholder="Enter update..."
                        />
                      ) : (
                        task.lastUpdate || '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === task.id ? (
                        <Input
                          value={editData.statusUpdate}
                          onChange={(e) => setEditData({ ...editData, statusUpdate: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        task.statusUpdate || 'N/A'
                      )}
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
                      onClick={() => {
                        const newGroup = prompt('Enter new Task Group name:');
                        if (newGroup && newGroup.trim() && currentProjectId) {
                          createTaskGroupMutation.mutate({ projectId: currentProjectId, name: newGroup.trim() });
                        }
                      }}
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
                  <Label htmlFor="requirementId">Requirement ID</Label>
                  <Select
                    value={newTask.requirementId}
                    onValueChange={(value) => setNewTask({ ...newTask, requirementId: value })}
                  >
                    <SelectTrigger>
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
                    value={newTask.responsible}
                    onValueChange={(value) => setNewTask({ ...newTask, responsible: value })}
                    placeholder="Select responsible person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountable">Accountable (A)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.accountable}
                    onValueChange={(value) => setNewTask({ ...newTask, accountable: value })}
                    placeholder="Select accountable person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consulted">Consulted (C)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.consulted}
                    onValueChange={(value) => setNewTask({ ...newTask, consulted: value })}
                    placeholder="Select consulted person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="informed">Informed (I)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.informed}
                    onValueChange={(value) => setNewTask({ ...newTask, informed: value })}
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
              <h4 className="font-medium mb-3">Status Updates</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Status</Label>
                  {isEditMode ? (
                    <Textarea value={editFormData.currentStatus} onChange={(e) => setEditFormData({...editFormData, currentStatus: e.target.value})} className="min-h-[60px]" />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{selectedTask?.currentStatus || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Last Update</Label>
                  {isEditMode ? (
                    <Textarea value={editFormData.lastUpdate} onChange={(e) => setEditFormData({...editFormData, lastUpdate: e.target.value})} className="min-h-[60px]" />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{selectedTask?.lastUpdate || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status Update</Label>
                  {isEditMode ? (
                    <Textarea value={editFormData.statusUpdate} onChange={(e) => setEditFormData({...editFormData, statusUpdate: e.target.value})} className="min-h-[60px]" />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{selectedTask?.statusUpdate || '-'}</p>
                  )}
                </div>
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
    </div>
  );
}
