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

export default function Requirements() {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newRequirement, setNewRequirement] = useState<any>({
    idCode: '',
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    deliverables1: '',
    d1Status: 'Pending',
  });

  const { data: requirements, isLoading, refetch } = trpc.requirements.list.useQuery();
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "requirement", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
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
    onSuccess: () => {
      toast.success('Requirement created successfully');
      setCreateDialogOpen(false);
      setNewRequirement({
        idCode: '',
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        deliverables1: '',
        d1Status: 'Pending',
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
    if (!newRequirement.idCode) {
      toast.error('ID Code is required');
      return;
    }
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

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return "secondary";
    if (priority.includes("Very High")) return "destructive";
    if (priority.includes("High")) return "default";
    if (priority.includes("Medium")) return "outline";
    return "secondary";
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "Closed" || status === "Solved") return "default";
    if (status === "Pending") return "outline";
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
          <CardTitle>Requirements Management</CardTitle>
          <CardDescription>
            View, edit, and track changes to project requirements
          </CardDescription>
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
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequirements?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.idCode}</TableCell>
                    <TableCell className="max-w-xs truncate">{req.description}</TableCell>
                    <TableCell>{req.owner}</TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="w-32"
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
                          className="w-32"
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
                          className="w-32"
                        />
                      ) : (
                        req.deliverables1 || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === req.id ? (
                        <Input
                          value={editData.d1Status}
                          onChange={(e) => setEditData({ ...editData, d1Status: e.target.value })}
                          className="w-32"
                        />
                      ) : (
                        req.d1Status || 'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {editingId === req.id ? (
                        <Input
                          value={editData.lastUpdate}
                          onChange={(e) => setEditData({ ...editData, lastUpdate: e.target.value })}
                          className="w-full"
                        />
                      ) : (
                        req.lastUpdate || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === req.id ? (
                          <>
                            <Button size="sm" onClick={() => handleSave(req)} disabled={updateMutation.isPending}>
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(req)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => showHistory(req.idCode)}>
                              <History className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(req.id)}>
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
            <DialogTitle>Create New Requirement</DialogTitle>
            <DialogDescription>
              Add a new requirement to the project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="idCode" className="text-right">ID Code *</Label>
              <Input
                id="idCode"
                value={newRequirement.idCode}
                onChange={(e) => setNewRequirement({ ...newRequirement, idCode: e.target.value })}
                className="col-span-3"
                placeholder="Q-0001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="owner" className="text-right">Owner</Label>
              <Input
                id="owner"
                value={newRequirement.owner}
                onChange={(e) => setNewRequirement({ ...newRequirement, owner: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Input
                id="status"
                value={newRequirement.status}
                onChange={(e) => setNewRequirement({ ...newRequirement, status: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="priority" className="text-right">Priority</Label>
              <Input
                id="priority"
                value={newRequirement.priority}
                onChange={(e) => setNewRequirement({ ...newRequirement, priority: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="deliverables1" className="text-right">Deliverables 1</Label>
              <Input
                id="deliverables1"
                value={newRequirement.deliverables1}
                onChange={(e) => setNewRequirement({ ...newRequirement, deliverables1: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="d1Status" className="text-right">D1 Status</Label>
              <Input
                id="d1Status"
                value={newRequirement.d1Status}
                onChange={(e) => setNewRequirement({ ...newRequirement, d1Status: e.target.value })}
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
