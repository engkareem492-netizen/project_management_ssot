import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
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
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [editingDeliverableId, setEditingDeliverableId] = useState<number | null>(null);
  const [editDeliverableData, setEditDeliverableData] = useState<any>({});
  const [deletingDeliverableId, setDeletingDeliverableId] = useState<number | null>(null);
  const [deleteDeliverableDialogOpen, setDeleteDeliverableDialogOpen] = useState(false);
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
    source: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    type: '',
    class: '',
    category: '',
  });

  const utils = trpc.useUtils();
  const { data: requirements, isLoading, refetch } = trpc.requirements.list.useQuery();
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: issues } = trpc.issues.list.useQuery();
  const { data: statusOptions } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions } = trpc.dropdownOptions.priority.getAll.useQuery();
  const { data: typeOptions } = trpc.dropdownOptions.type.getAll.useQuery();
  const { data: categoryOptions } = trpc.dropdownOptions.category.getAll.useQuery();
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
        taskGroup: '',
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        responsible: '',
        accountable: '',
        informed: '',
        consulted: '',
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
    if (!newTask.taskGroup.trim()) {
      toast.error('Task Group is required');
      return;
    }
    const { currentProjectId } = useProject();
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createTaskMutation.mutate({
      projectId: currentProjectId,
      ...newTask,
      requirementId: selectedRequirement.idCode,
    });
  };

  const handleCreateIssueFromRequirement = () => {
    if (!selectedRequirement) return;
    const { currentProjectId } = useProject();
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createIssueMutation.mutate({
      projectId: currentProjectId,
      ...newIssue,
      requirementId: selectedRequirement.idCode,
    });
  };

  const handleCreateDeliverableFromRequirement = () => {
    if (!selectedRequirement) return;
    const { currentProjectId } = useProject();
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createDeliverableMutation.mutate({
      projectId: currentProjectId,
      ...newDeliverable,
      linkedEntities: [{
        entityType: 'requirement' as const,
        entityId: selectedRequirement.idCode,
      }],
    });
  };

  const handleCreateStakeholder = () => {
    if (!newStakeholder.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    const { currentProjectId } = useProject();
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

  // Get linked items for selected requirement
  const linkedTasks = tasks?.filter(t => t.requirementId === selectedRequirement?.idCode) || [];
  const linkedIssues = issues?.filter(i => i.requirementId === selectedRequirement?.idCode) || [];
  
  // Group tasks by Task Group
  const tasksByGroup = linkedTasks.reduce((acc, task) => {
    const group = task.taskGroup || 'Ungrouped';
    if (!acc[group]) acc[group] = [];
    acc[group].push(task);
    return acc;
  }, {} as Record<string, typeof linkedTasks>);

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
                          value={editData.lastUpdate}
                          onChange={(e) => setEditData({ ...editData, lastUpdate: e.target.value })}
                          className="w-full h-8"
                          placeholder="Enter update..."
                        />
                      ) : (
                        req.lastUpdate || '-'
                      )}
                    </TableCell>
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
                          <div className="flex-1">
                            <span className="font-mono text-sm font-medium">{deliverable.deliverableId}</span>
                            {editingDeliverableId === deliverable.id ? (
                              <div className="mt-2 space-y-2">
                                <Textarea
                                  value={editDeliverableData.description}
                                  onChange={(e) => setEditDeliverableData({ ...editDeliverableData, description: e.target.value })}
                                  className="text-sm"
                                  rows={2}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    value={editDeliverableData.status}
                                    onChange={(e) => setEditDeliverableData({ ...editDeliverableData, status: e.target.value })}
                                    placeholder="Status"
                                    className="text-sm"
                                  />
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
                <div className="space-y-4">
                  {Object.entries(tasksByGroup).map(([group, groupTasks]) => (
                    <div key={group} className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-sm">{group}</h4>
                        <Badge variant="outline" className="text-xs">{groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}</Badge>
                      </div>
                      <div className="space-y-2 pl-4">
                        {groupTasks.map((task) => (
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
                    </div>
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
              <Label>Task Group *</Label>
              <Input
                value={newTask.taskGroup}
                onChange={(e) => setNewTask({ ...newTask, taskGroup: e.target.value })}
                placeholder="Enter task group name..."
              />
            </div>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsible</Label>
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
                <Label>Accountable</Label>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Informed</Label>
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
              <div className="space-y-2">
                <Label>Consulted</Label>
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
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSettingsType('status');
                      setSettingsOpen(true);
                    }}
                    className="h-6 px-2"
                  >
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
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
              <Label htmlFor="source" className="text-right">Source</Label>
              <Input
                id="source"
                value={newRequirement.source}
                onChange={(e) => setNewRequirement({ ...newRequirement, source: e.target.value })}
                className="col-span-3"
                placeholder="Source (max 20 characters)..."
                maxLength={20}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">Owner</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newRequirement.owner}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, owner: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select owner from stakeholders..." />
                  </SelectTrigger>
                  <SelectContent>
                    {stakeholders?.map((s) => (
                      <SelectItem key={s.id} value={s.fullName}>{s.fullName} - {s.position || s.role || 'N/A'}</SelectItem>
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
                  value={newRequirement.status}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions?.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {opt.label || opt.value}
                      </SelectItem>
                    ))}
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
                    {priorityOptions?.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {opt.label || opt.value}
                      </SelectItem>
                    ))}
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
                    {typeOptions?.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {opt.label || opt.value}
                      </SelectItem>
                    ))}
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
                    {categoryOptions?.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {opt.label || opt.value}
                      </SelectItem>
                    ))}
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

      {/* Delete Deliverable Confirmation */}
      <AlertDialog open={deleteDeliverableDialogOpen} onOpenChange={setDeleteDeliverableDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the deliverable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDeliverable} disabled={deleteDeliverableMutation.isPending}>
              {deleteDeliverableMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
