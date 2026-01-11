import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, History, Loader2, Plus, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
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
  const [newIssue, setNewIssue] = useState<any>({
    issueId: '',
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
  });

  const { data: issues, isLoading, refetch } = trpc.issues.list.useQuery();
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
    onSuccess: () => {
      toast.success('Issue created successfully');
      setCreateDialogOpen(false);
      setNewIssue({
        issueId: '',
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
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

  const filteredIssues = issues?.filter(issue =>
    issue.issueId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    issue.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    if (!newIssue.issueId) {
      toast.error('Issue ID is required');
      return;
    }
    createMutation.mutate(newIssue);
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
          <CardTitle>Issues Management</CardTitle>
          <CardDescription>
            View, edit, and track changes to project issues
          </CardDescription>
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
              Add a new issue to the project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issueId" className="text-right">Issue ID *</Label>
              <Input
                id="issueId"
                value={newIssue.issueId}
                onChange={(e) => setNewIssue({ ...newIssue, issueId: e.target.value })}
                className="col-span-3"
                placeholder="I-001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">Owner</Label>
              <Input
                id="owner"
                value={newIssue.owner}
                onChange={(e) => setNewIssue({ ...newIssue, owner: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Input
                id="status"
                value={newIssue.status}
                onChange={(e) => setNewIssue({ ...newIssue, status: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Input
                id="priority"
                value={newIssue.priority}
                onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
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
