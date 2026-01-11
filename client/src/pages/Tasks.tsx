import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, History, Loader2, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  const [newTask, setNewTask] = useState<any>({
    taskId: '',
    description: '',
    responsible: '',
    currentStatus: 'Not Started',
    statusUpdate: '',
  });

  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "task", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );

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
    onSuccess: () => {
      toast.success('Task created successfully');
      setCreateDialogOpen(false);
      setNewTask({
        taskId: '',
        description: '',
        responsible: '',
        currentStatus: 'Not Started',
        statusUpdate: '',
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

  const filteredTasks = tasks?.filter(task =>
    task.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.responsible?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditData({
      currentStatus: task.currentStatus || '',
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
    if (!newTask.taskId) {
      toast.error('Task ID is required');
      return;
    }
    createMutation.mutate(newTask);
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
          <CardTitle>Tasks Management</CardTitle>
          <CardDescription>
            View, edit, and track changes to project tasks
          </CardDescription>
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
                  <TableHead>Description</TableHead>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Status Update</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.taskId}</TableCell>
                    <TableCell className="max-w-xs truncate">{task.description}</TableCell>
                    <TableCell>{task.requirementId || 'N/A'}</TableCell>
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
              Add a new task to the project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskId" className="text-right">Task ID *</Label>
              <Input
                id="taskId"
                value={newTask.taskId}
                onChange={(e) => setNewTask({ ...newTask, taskId: e.target.value })}
                className="col-span-3"
                placeholder="T-001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsible" className="text-right">Responsible</Label>
              <Input
                id="responsible"
                value={newTask.responsible}
                onChange={(e) => setNewTask({ ...newTask, responsible: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentStatus" className="text-right">Current Status</Label>
              <Input
                id="currentStatus"
                value={newTask.currentStatus}
                onChange={(e) => setNewTask({ ...newTask, currentStatus: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="statusUpdate" className="text-right">Status Update</Label>
              <Input
                id="statusUpdate"
                value={newTask.statusUpdate}
                onChange={(e) => setNewTask({ ...newTask, statusUpdate: e.target.value })}
                className="col-span-3"
              />
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
