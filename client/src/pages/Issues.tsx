import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Issues() {
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
  const [newIssue, setNewIssue] = useState<any>({
    description: '',
    source: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    requirementId: '',
  });

  const { data: issues, isLoading, refetch } = trpc.issues.list.useQuery();
  const { data: stakeholders } = trpc.stakeholders.list.useQuery();
  const { data: requirements } = trpc.requirements.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "issue", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );

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
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        requirementId: '',
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

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

  const filteredIssues = issues?.filter(issue =>
    issue.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    // Convert "none" to undefined for optional requirementId
    const issueData = {
      ...newIssue,
      requirementId: newIssue.requirementId === "none" ? undefined : newIssue.requirementId,
    };
    createMutation.mutate(issueData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
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

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "secondary";
    if (priority.includes("Very High")) return "destructive";
    if (priority.includes("High")) return "default";
    if (priority.includes("Medium")) return "outline";
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
              <CardTitle>Issues Management</CardTitle>
              <CardDescription>
                View, edit, and track changes to project issues
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {issues?.length || 0} Issues
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
                placeholder="Search by Issue ID, description, or owner..."
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
                  <TableHead className="w-[100px]">Issue ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Req Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Last Update</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues?.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">{issue.issueId}</TableCell>
                    <TableCell className="max-w-xs truncate">{issue.description}</TableCell>
                    <TableCell>{issue.requirementId || 'N/A'}</TableCell>
                    <TableCell>
                      {getRequirementStatus(issue.requirementId) ? (
                        <Badge variant="outline">{getRequirementStatus(issue.requirementId)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{issue.owner}</TableCell>
                    <TableCell>
                      {editingId === issue.id ? (
                        <Input
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        <Badge>{issue.status || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === issue.id ? (
                        <Input
                          value={editData.priority}
                          onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        <Badge variant={getPriorityColor(issue.priority)}>{issue.priority || 'N/A'}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {editingId === issue.id ? (
                        <Input
                          value={editData.lastUpdate}
                          onChange={(e) => setEditData({ ...editData, lastUpdate: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        issue.lastUpdate || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === issue.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(issue)} disabled={updateMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(issue)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => showHistory(issue.issueId)}>
                              <History className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(issue.id)}>
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

          {filteredIssues?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No issues found. Create a new issue or import an Excel file to get started.
            </div>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to the project. Issue ID will be auto-generated (I-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description *</Label>
              <Input
                id="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="col-span-3"
                placeholder="Issue description..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right">Source</Label>
              <Input
                id="source"
                value={newIssue.source}
                onChange={(e) => setNewIssue({ ...newIssue, source: e.target.value })}
                className="col-span-3"
                placeholder="Source (max 20 characters)..."
                maxLength={20}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="requirementId" className="text-right">Requirement ID</Label>
              <Select
                value={newIssue.requirementId}
                onValueChange={(value) => setNewIssue({ ...newIssue, requirementId: value })}
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
              <Label htmlFor="owner" className="text-right">Owner</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newIssue.owner}
                  onValueChange={(value) => setNewIssue({ ...newIssue, owner: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select owner..." />
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
                  value={newIssue.status}
                  onValueChange={(value) => setNewIssue({ ...newIssue, status: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownOptionsManager type="status" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newIssue.priority}
                  onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
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
    </div>
  );
}
