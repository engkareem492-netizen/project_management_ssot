import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StakeholderSelect } from "@/components/StakeholderSelect";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, Plus, Trash2, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";
import { RegistrySelect } from "@/components/RegistrySelect";

export default function Dependencies() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [newDependency, setNewDependency] = useState<any>({
    dependencyId: '',
    description: '',
    responsible: '',
    currentStatus: 'Pending',
  });

  const { data: dependencies, isLoading, refetch } = trpc.dependencies.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });

  const createMutation = trpc.dependencies.create.useMutation({
    onSuccess: () => {
      toast.success('Dependency created successfully');
      setCreateDialogOpen(false);
      setNewDependency({
        dependencyId: '',
        description: '',
        responsible: '',
        currentStatus: 'Pending',
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.dependencies.delete.useMutation({
    onSuccess: () => {
      toast.success('Dependency deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const filteredDependencies = dependencies?.filter(dep =>
    dep.dependencyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dep.responsible?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    if (!newDependency.dependencyId) {
      toast.error('Dependency ID is required');
      return;
    }
    createMutation.mutate(newDependency);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-gray-500" />
            Dependencies Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">View, edit, and track project dependencies</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-teal-700 border-teal-300">{filteredDependencies?.length || 0} Dependencies</Badge>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
            <Plus className="w-4 h-4" />Create New
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="dependencies"
              projectId={currentProjectId}
              onImportSuccess={() => {}}
            />
          )}
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by Dependency ID, description, or responsible..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Dependency ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Task ID</TableHead>
                  <TableHead>Requirement ID</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDependencies?.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">{dep.dependencyId}</TableCell>
                    <TableCell className="max-w-xs truncate">{dep.description || 'N/A'}</TableCell>
                    <TableCell>{dep.taskId || 'N/A'}</TableCell>
                    <TableCell>{dep.requirementId || 'N/A'}</TableCell>
                    <TableCell>{dep.responsible}</TableCell>
                    <TableCell>{formatDate(dep.dueDate) || 'N/A'}</TableCell>
                    <TableCell>{dep.currentStatus || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(dep.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredDependencies?.length === 0 && (
            <EmptyState
              icon={Link2}
              title="No dependencies found"
              description="Create a new dependency or import an Excel file to get started."
              actionLabel="Create Dependency"
              onAction={() => setCreateDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Dependency</DialogTitle>
            <DialogDescription>
              Add a new dependency to the project
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dependencyId" className="text-right">Dependency ID *</Label>
              <Input
                id="dependencyId"
                value={newDependency.dependencyId}
                onChange={(e) => setNewDependency({ ...newDependency, dependencyId: e.target.value })}
                className="col-span-3"
                placeholder="D-001"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input
                id="description"
                value={newDependency.description}
                onChange={(e) => setNewDependency({ ...newDependency, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsible" className="text-right">Responsible</Label>
              <div className="col-span-3">
                <StakeholderSelect
                  stakeholders={stakeholders as any[]}
                  value={newDependency.responsible}
                  onValueChange={(v) => setNewDependency({ ...newDependency, responsible: v })}
                  projectId={currentProjectId ?? undefined}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Current Status</Label>
              <div className="col-span-3">
                <RegistrySelect
                  projectId={currentProjectId!}
                  domain="dependencies"
                  fieldKey="status"
                  value={newDependency.currentStatus}
                  onValueChange={(v) => setNewDependency({ ...newDependency, currentStatus: v })}
                  placeholder="Select status"
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the dependency.
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
