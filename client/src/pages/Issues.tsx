import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings, Eye, Save, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [newIssue, setNewIssue] = useState<any>({
    issueGroup: '',
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
  const { currentProjectId } = useProject();
  const { data: issueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  const createIssueGroupMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created successfully`);
      setNewIssue({ ...newIssue, issueGroup: data.name });
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

  const handleViewDetails = (issue: any) => {
    setSelectedIssue(issue);
    setIsEditMode(false);
    setEditFormData({
      issueGroup: issue.issueGroup || '',
      description: issue.description || '',
      source: issue.source || '',
      owner: issue.owner || '',
      status: issue.status || '',
      priority: issue.priority || '',
      requirementId: issue.requirementId || '',
      currentStatus: issue.currentStatus || '',
      lastUpdate: issue.lastUpdate || '',
      statusUpdate: issue.statusUpdate || '',
    });
    setViewDialogOpen(true);
  };

  const handleEditDetails = (issue: any) => {
    setSelectedIssue(issue);
    setIsEditMode(true);
    setEditFormData({
      issueGroup: issue.issueGroup || '',
      description: issue.description || '',
      source: issue.source || '',
      owner: issue.owner || '',
      status: issue.status || '',
      priority: issue.priority || '',
      requirementId: issue.requirementId || '',
      currentStatus: issue.currentStatus || '',
      lastUpdate: issue.lastUpdate || '',
      statusUpdate: issue.statusUpdate || '',
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

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return "secondary";
    if (status === "Closed" || status === "Resolved") return "default";
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Issue</DialogTitle>
            <DialogDescription>
              Add a new issue to the project. Issue ID will be auto-generated (I-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Issue Group - Dropdown from Issues */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issueGroup" className="text-right">Issue Group</Label>
              <div className="col-span-3 flex gap-2">
                <Select
                  value={newIssue.issueGroup}
                  onValueChange={(value) => setNewIssue({ ...newIssue, issueGroup: value })}
                >
                  <SelectTrigger className="flex-1">
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
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    const newGroup = prompt('Enter new Issue Group name:');
                    if (newGroup && newGroup.trim() && currentProjectId) {
                      createIssueGroupMutation.mutate({ projectId: currentProjectId, name: newGroup.trim() });
                    }
                  }}
                  title="Add new issue group"
                  disabled={createIssueGroupMutation.isPending}
                >
                  {createIssueGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>
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
              <div className="col-span-3">
                <SelectWithCreate
                  type="stakeholder"
                  value={newIssue.owner}
                  onValueChange={(value) => setNewIssue({ ...newIssue, owner: value })}
                  placeholder="Select owner..."
                  projectId={currentProjectId || undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <div className="col-span-3">
                <SelectWithCreate
                  type="status"
                  value={newIssue.status}
                  onValueChange={(value) => setNewIssue({ ...newIssue, status: value })}
                  placeholder="Select status"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <div className="col-span-3">
                <SelectWithCreate
                  type="priority"
                  value={newIssue.priority}
                  onValueChange={(value) => setNewIssue({ ...newIssue, priority: value })}
                  placeholder="Select priority"
                />
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
                  <Input value={editFormData.issueGroup} onChange={(e) => setEditFormData({...editFormData, issueGroup: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedIssue?.issueGroup || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requirement ID</Label>
                <p className="font-medium">{selectedIssue?.requirementId || '-'}</p>
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                {isEditMode ? (
                  <Input value={editFormData.status} onChange={(e) => setEditFormData({...editFormData, status: e.target.value})} className="h-8" />
                ) : (
                  <Badge variant={getStatusColor(selectedIssue?.status)}>{selectedIssue?.status || 'N/A'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                {isEditMode ? (
                  <Input value={editFormData.priority} onChange={(e) => setEditFormData({...editFormData, priority: e.target.value})} className="h-8" />
                ) : (
                  <Badge variant={getPriorityColor(selectedIssue?.priority)}>{selectedIssue?.priority || 'N/A'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Source</Label>
                {isEditMode ? (
                  <Input value={editFormData.source} onChange={(e) => setEditFormData({...editFormData, source: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedIssue?.source || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Owner</Label>
                {isEditMode ? (
                  <Input value={editFormData.owner} onChange={(e) => setEditFormData({...editFormData, owner: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{selectedIssue?.owner || '-'}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description</Label>
                {isEditMode ? (
                  <Textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="min-h-[80px]" />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{selectedIssue?.description || '-'}</p>
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
                    <p className="font-medium whitespace-pre-wrap">{selectedIssue?.currentStatus || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Last Update</Label>
                  {isEditMode ? (
                    <Textarea value={editFormData.lastUpdate} onChange={(e) => setEditFormData({...editFormData, lastUpdate: e.target.value})} className="min-h-[60px]" />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{selectedIssue?.lastUpdate || '-'}</p>
                  )}
                </div>
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status Update</Label>
                  {isEditMode ? (
                    <Textarea value={editFormData.statusUpdate} onChange={(e) => setEditFormData({...editFormData, statusUpdate: e.target.value})} className="min-h-[60px]" />
                  ) : (
                    <p className="font-medium whitespace-pre-wrap">{selectedIssue?.statusUpdate || '-'}</p>
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
