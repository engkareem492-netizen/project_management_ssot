import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, History, Loader2, Plus, Trash2, Eye, CheckSquare, Save, X, Link2, Settings } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { toast } from "sonner";

export default function Requirements() {
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
  const [createTaskDialogOpen, setCreateTaskDialogOpen] = useState(false);
  const [createIssueDialogOpen, setCreateIssueDialogOpen] = useState(false);
  const [createDeliverableDialogOpen, setCreateDeliverableDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"status" | "priority" | "type" | "category">("status");
  const [newTask, setNewTask] = useState({
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
  });
  const [newIssue, setNewIssue] = useState({
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
  });
  const [newDeliverable, setNewDeliverable] = useState({
    description: '',
    status: 'Pending',
    dueDate: '',
  });
  const [newRequirement, setNewRequirement] = useState<any>({
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    deliverables1: '',
    d1Status: 'Pending',
    type: '',
    class: '',
    category: '',
  });

  const utils = trpc.useUtils();
  const { data: requirements, isLoading, refetch } = trpc.requirements.list.useQuery();
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: issues } = trpc.issues.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "requirement", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { data: linkedDeliverables } = trpc.deliverables.getByEntity.useQuery(
    { entityType: "requirement", entityId: selectedRequirement?.idCode || "" },
    { enabled: viewDialogOpen && !!selectedRequirement?.idCode }
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
        owner: '',
        status: 'Open',
        priority: 'Medium',
        deliverables1: '',
        d1Status: 'Pending',
        type: '',
        class: '',
        category: '',
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
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
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

  const filteredRequirements = requirements?.filter(req =>
    req.idCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (req: any) => {
    setEditingId(req.id);
    setEditData({
      status: req.status || '',
      priority: req.priority || '',
      deliverables1: req.deliverables1 || '',
      d1Status: req.d1Status || '',
      deliverables2: req.deliverables2 || '',
      d2Status: req.d2Status || '',
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
    createMutation.mutate(newRequirement);
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
    setViewDialogOpen(true);
  };

  const handleCreateTaskFromRequirement = () => {
    if (!selectedRequirement) return;
    createTaskMutation.mutate({
      ...newTask,
      requirementId: selectedRequirement.idCode,
    });
  };

  const handleCreateIssueFromRequirement = () => {
    if (!selectedRequirement) return;
    createIssueMutation.mutate({
      ...newIssue,
      requirementId: selectedRequirement.idCode,
    });
  };

  const handleCreateDeliverableFromRequirement = () => {
    if (!selectedRequirement) return;
    createDeliverableMutation.mutate({
      ...newDeliverable,
      linkedEntities: [{
        entityType: 'requirement' as const,
        entityId: selectedRequirement.idCode,
      }],
    });
  };

  // Get linked items for selected requirement
  const linkedTasks = tasks?.filter(t => t.requirementId === selectedRequirement?.idCode) || [];
  const linkedIssues = issues?.filter(i => i.requirementId === selectedRequirement?.idCode) || [];

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "secondary";
    if (priority.includes("Very High")) return "destructive";
    if (priority.includes("High")) return "default";
    if (priority.includes("Medium")) return "outline";
    return "secondary";
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "Closed" || status === "Solved" || status === "Completed") return "default";
    if (status === "Pending" || status === "Open") return "outline";
    if (status === "In Progress") return "secondary";
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
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Requirements Management</CardTitle>
              <CardDescription>
                View, edit, and track changes to project requirements. IDs are auto-generated.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
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
                placeholder="Search by ID, description, or owner..."
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
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>D1</TableHead>
                  <TableHead>D1 Status</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="w-[180px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono font-medium">{req.idCode}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{req.description}</TableCell>
                    <TableCell>{req.owner}</TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-24 h-8"
                        />
                      ) : (
                        <Badge variant={getStatusColor(req.status)}>{req.status || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.priority}
                          onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                          className="w-24 h-8"
                        />
                      ) : (
                        <Badge variant={getPriorityColor(req.priority)}>{req.priority || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.deliverables1}
                          onChange={(e) => setEditData({ ...editData, deliverables1: e.target.value })}
                          className="w-24 h-8"
                        />
                      ) : (
                        <span className="truncate max-w-[100px] block">{req.deliverables1 || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.d1Status}
                          onChange={(e) => setEditData({ ...editData, d1Status: e.target.value })}
                          className="w-24 h-8"
                        />
                      ) : (
                        req.d1Status || '-'
                      )}
                    </TableCell>
                    <TableCell>{req.lastUpdate || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {editingId === req.id ? (
                          <>
                            <Button size="sm" variant="default" onClick={() => handleSave(req)} disabled={updateMutation.isPending}>
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(req)} title="View Details">
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(req)} title="Edit">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => showHistory(req.idCode)} title="History">
                              <History className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(req.id)} title="Delete">
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

          {filteredRequirements?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No requirements found. Create a new requirement or import an Excel file to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog with Linked Items */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="font-mono bg-muted px-2 py-1 rounded">{selectedRequirement?.idCode}</span>
              Requirement Details
            </DialogTitle>
            <DialogDescription>
              View all details and linked items for this requirement
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tasks">
                Linked Tasks ({linkedTasks.length})
              </TabsTrigger>
              <TabsTrigger value="issues">
                Linked Issues ({linkedIssues.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedRequirement?.description || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Owner</Label>
                  <p className="font-medium">{selectedRequirement?.owner || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={getStatusColor(selectedRequirement?.status)}>
                    {selectedRequirement?.status || 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Priority</Label>
                  <Badge variant={getPriorityColor(selectedRequirement?.priority)}>
                    {selectedRequirement?.priority || 'N/A'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <p className="font-medium">{selectedRequirement?.type || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Class</Label>
                  <p className="font-medium">{selectedRequirement?.class || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedRequirement?.category || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{selectedRequirement?.createdAt || '-'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Linked Deliverables</h4>
                  <Button size="sm" onClick={() => setCreateDeliverableDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Deliverable
                  </Button>
                </div>
                {linkedDeliverables && linkedDeliverables.length > 0 ? (
                  <div className="space-y-2">
                    {linkedDeliverables.map((deliverable) => (
                      <Card key={deliverable.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-sm font-medium">{deliverable.deliverableId}</span>
                            <p className="text-sm text-muted-foreground mt-1">{deliverable.description || 'No description'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{deliverable.status || 'N/A'}</Badge>
                            {deliverable.dueDate && (
                              <span className="text-xs text-muted-foreground">Due: {deliverable.dueDate}</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-lg">
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
                <Button size="sm" onClick={() => setCreateTaskDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
              
              {linkedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No tasks linked to this requirement yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedTasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{task.taskId}</span>
                          <span className="text-sm">{task.description || 'No description'}</span>
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
                <Button size="sm" onClick={() => setCreateIssueDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Issue
                </Button>
              </div>
              
              {linkedIssues.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  No issues linked to this requirement yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedIssues.map((issue) => (
                    <Card key={issue.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Link2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-mono text-sm">{issue.issueId}</span>
                          <span className="text-sm">{issue.description || 'No description'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(issue.status)}>{issue.status || 'N/A'}</Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => showHistory(selectedRequirement?.idCode)}>
              <History className="w-4 h-4 mr-2" />
              View History
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task from Requirement Dialog */}
      <Dialog open={createTaskDialogOpen} onOpenChange={setCreateTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Task for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new task linked to this requirement. Task ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Task description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={newTask.owner}
                  onValueChange={(value) => setNewTask({ ...newTask, owner: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Very High">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTaskFromRequirement} disabled={createTaskMutation.isPending}>
              {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Issue from Requirement Dialog */}
      <Dialog open={createIssueDialogOpen} onOpenChange={setCreateIssueDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Issue for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new issue linked to this requirement. Issue ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                placeholder="Issue description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Owner</Label>
                <Select
                  value={newIssue.owner}
                  onValueChange={(value) => setNewIssue({ ...newIssue, owner: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>{s.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Very High">Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateIssueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateIssueFromRequirement} disabled={createIssueMutation.isPending}>
              {createIssueMutation.isPending ? 'Creating...' : 'Create Issue'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Deliverable from Requirement Dialog */}
      <Dialog open={createDeliverableDialogOpen} onOpenChange={setCreateDeliverableDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Deliverable for {selectedRequirement?.idCode}</DialogTitle>
            <DialogDescription>
              Create a new deliverable linked to this requirement. Deliverable ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                placeholder="Deliverable description..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newDeliverable.status}
                  onValueChange={(value) => setNewDeliverable({ ...newDeliverable, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button onClick={handleCreateDeliverableFromRequirement} disabled={createDeliverableMutation.isPending}>
              {createDeliverableMutation.isPending ? 'Creating...' : 'Create Deliverable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change History - {selectedEntityId}</DialogTitle>
            <DialogDescription>
              Timeline of all changes made to this requirement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionLogs?.map((log) => (
              <Card key={log.id}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">
                    {new Date(log.changedAt).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
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

      {/* Create Requirement Dialog - Auto ID */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Requirement</DialogTitle>
            <DialogDescription>
              Add a new requirement to the project. ID will be auto-generated (Q-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description *</Label>
              <Textarea
                id="description"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                className="col-span-3"
                placeholder="Describe the requirement..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">Owner</Label>
              <Select
                value={newRequirement.owner}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, owner: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select owner from stakeholders..." />
                </SelectTrigger>
                <SelectContent>
                  {stakeholders?.map((s) => (
                    <SelectItem key={s.id} value={s.fullName}>{s.fullName} - {s.position || s.role || 'N/A'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newRequirement.status}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                    <SelectItem value="Solved">Solved</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="status" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newRequirement.priority}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newRequirement.type}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WRICEF">WRICEF</SelectItem>
                    <SelectItem value="Configuration">Configuration</SelectItem>
                    <SelectItem value="Solution">Solution</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="type" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newRequirement.category}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, category: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FICO">FICO</SelectItem>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="MM">MM</SelectItem>
                    <SelectItem value="HXM">HXM</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="category" />
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage {settingsType === 'status' ? 'Status' : settingsType === 'priority' ? 'Priority' : settingsType === 'type' ? 'Type' : 'Category'} Options</DialogTitle>
            <DialogDescription>
              Add, edit, or delete {settingsType} options for requirements
            </DialogDescription>
          </DialogHeader>
          <DropdownOptionsManager type={settingsType} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the requirement.
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
