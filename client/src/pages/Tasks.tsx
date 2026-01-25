import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
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
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [newTask, setNewTask] = useState<any>({
    taskGroup: '',
    description: '',
    responsible: '',
    accountable: '',
    owner: '',
    status: 'Not Started',
    priority: 'Medium',
    requirementId: '',
  });

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery();
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: requirements } = trpc.requirements.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "task", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { currentProjectId } = useProject();

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
        owner: '',
        status: 'Not Started',
        priority: 'Medium',
        requirementId: '',
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
    };
    createMutation.mutate(taskData);
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
                            <Button size="sm" variant="outline" onClick={() => handleEdit(task)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => showHistory(task.taskId)}>
                              <History className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)}>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the project. Task ID will be auto-generated (T-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskGroup" className="text-right">Task Group *</Label>
              <Input
                id="taskGroup"
                value={newTask.taskGroup}
                onChange={(e) => setNewTask({ ...newTask, taskGroup: e.target.value })}
                className="col-span-3"
                placeholder="Enter task group..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description *</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="col-span-3"
                placeholder="Task description..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requirementId" className="text-right">Requirement ID</Label>
              <Select
                value={newTask.requirementId}
                onValueChange={(value) => setNewTask({ ...newTask, requirementId: value })}
              >
                <SelectTrigger className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsible" className="text-right">Responsible</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newTask.responsible}
                  onValueChange={(value) => setNewTask({ ...newTask, responsible: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select responsible person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>
                        {s.fullName} - {s.position || s.role || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddStakeholderDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accountable" className="text-right">Accountable</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newTask.accountable}
                  onValueChange={(value) => setNewTask({ ...newTask, accountable: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select accountable person..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>
                        {s.fullName} - {s.position || s.role || 'N/A'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAddStakeholderDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newTask.status}
                  onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="status" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Very High">Very High</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="priority" />
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
