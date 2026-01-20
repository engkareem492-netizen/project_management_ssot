import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Search, Package, Link2, X } from "lucide-react";

export default function Deliverables() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    description: "",
    status: "Pending",
    dueDate: "",
  });

  // Link form state
  const [linkData, setLinkData] = useState({
    entityType: "requirement" as "requirement" | "task" | "dependency",
    entityId: "",
  });

  const utils = trpc.useUtils();
  const { data: deliverables, isLoading } = trpc.deliverables.list.useQuery();
  const { data: requirements } = trpc.requirements.list.useQuery();
  const { data: tasks } = trpc.tasks.list.useQuery();
  const { data: dependencies } = trpc.dependencies.list.useQuery();
  const { data: deliverableLinks } = trpc.deliverables.getLinks.useQuery(
    { deliverableId: selectedDeliverable?.id || 0 },
    { enabled: isLinkOpen && !!selectedDeliverable?.id }
  );
  
  const createMutation = trpc.deliverables.create.useMutation({
    onSuccess: (data) => {
      utils.deliverables.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success(`Deliverable ${data.deliverableId} created successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });

  const updateMutation = trpc.deliverables.update.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      setIsEditOpen(false);
      setSelectedDeliverable(null);
      resetForm();
      toast.success("Deliverable updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update deliverable: ${error.message}`);
    },
  });

  const deleteMutation = trpc.deliverables.delete.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      setIsDeleteOpen(false);
      setSelectedDeliverable(null);
      toast.success("Deliverable deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete deliverable: ${error.message}`);
    },
  });

  const addLinkMutation = trpc.deliverables.addLink.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      utils.deliverables.getLinks.invalidate();
      setLinkData({ entityType: "requirement", entityId: "" });
      toast.success("Link added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add link: ${error.message}`);
    },
  });

  const removeLinkMutation = trpc.deliverables.removeLink.useMutation({
    onSuccess: () => {
      utils.deliverables.list.invalidate();
      utils.deliverables.getLinks.invalidate();
      toast.success("Link removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove link: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      status: "Pending",
      dueDate: "",
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (deliverable: any) => {
    setSelectedDeliverable(deliverable);
    setFormData({
      description: deliverable.description || "",
      status: deliverable.status || "Pending",
      dueDate: deliverable.dueDate || "",
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedDeliverable) return;
    updateMutation.mutate({
      id: selectedDeliverable.id,
      data: formData,
    });
  };

  const handleDelete = (deliverable: any) => {
    setSelectedDeliverable(deliverable);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedDeliverable) return;
    deleteMutation.mutate({ id: selectedDeliverable.id });
  };

  const handleOpenLinks = (deliverable: any) => {
    setSelectedDeliverable(deliverable);
    setIsLinkOpen(true);
  };

  const handleAddLink = () => {
    if (!selectedDeliverable || !linkData.entityId) {
      toast.error("Please select an entity to link");
      return;
    }
    addLinkMutation.mutate({
      deliverableId: selectedDeliverable.id,
      entityType: linkData.entityType,
      entityId: linkData.entityId,
    });
  };

  const getEntityOptions = () => {
    switch (linkData.entityType) {
      case "requirement":
        return requirements?.map((r) => ({ id: r.idCode, label: `${r.idCode} - ${r.description?.substring(0, 30) || "No description"}` })) || [];
      case "task":
        return tasks?.map((t) => ({ id: t.taskId, label: `${t.taskId} - ${t.description?.substring(0, 30) || "No description"}` })) || [];
      case "dependency":
        return dependencies?.map((d) => ({ id: d.dependencyId, label: `${d.dependencyId} - ${d.description?.substring(0, 30) || "No description"}` })) || [];
      default:
        return [];
    }
  };

  const getLinkedEntityDetails = (entityType: string, entityId: string) => {
    switch (entityType) {
      case "requirement":
        const req = requirements?.find((r) => r.idCode === entityId);
        return req ? { id: req.idCode, description: req.description, status: req.status } : null;
      case "task":
        const task = tasks?.find((t) => t.taskId === entityId);
        return task ? { id: task.taskId, description: task.description, status: task.currentStatus } : null;
      case "dependency":
        const dep = dependencies?.find((d) => d.dependencyId === entityId);
        return dep ? { id: dep.dependencyId, description: dep.description, status: dep.currentStatus } : null;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDeliverables = deliverables?.filter((d) => {
    const search = searchTerm.toLowerCase();
    return (
      d.deliverableId?.toLowerCase().includes(search) ||
      d.description?.toLowerCase().includes(search) ||
      d.status?.toLowerCase().includes(search)
    );
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" />
            Deliverables Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage deliverables linked to Requirements, Tasks, and Dependencies
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Deliverable
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by ID, description, status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Deliverables</p>
              <p className="text-2xl font-bold">{deliverables?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">
                {deliverables?.filter((d) => d.status?.toLowerCase() === "completed").length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold">
                {deliverables?.filter((d) => d.status?.toLowerCase() === "in progress").length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Package className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">
                {deliverables?.filter((d) => d.status?.toLowerCase() === "pending").length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Description</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Due Date</TableHead>
              <TableHead className="font-semibold">Links</TableHead>
              <TableHead className="font-semibold w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeliverables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No deliverables match your search" : "No deliverables yet. Add your first deliverable!"}
                </TableCell>
              </TableRow>
            ) : (
              filteredDeliverables.map((deliverable) => (
                <TableRow key={deliverable.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono font-medium">{deliverable.deliverableId}</TableCell>
                  <TableCell className="max-w-xs truncate">{deliverable.description || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(deliverable.status || "")}>
                      {deliverable.status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>{deliverable.dueDate || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenLinks(deliverable)}
                      className="gap-1"
                    >
                      <Link2 className="h-3 w-3" />
                      Manage Links
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(deliverable)}
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(deliverable)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Deliverable</DialogTitle>
            <DialogDescription>
              Create a new deliverable. The ID will be auto-generated (DEL-XXXX).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the deliverable..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Blocked">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                  <DropdownOptionsManager type="status" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
            <DialogDescription>
              Update deliverable information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Management Dialog */}
      <Dialog open={isLinkOpen} onOpenChange={setIsLinkOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Links for {selectedDeliverable?.deliverableId}</DialogTitle>
            <DialogDescription>
              Link this deliverable to Requirements, Tasks, or Dependencies.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add new link */}
            <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <h4 className="font-medium">Add New Link</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select
                    value={linkData.entityType}
                    onValueChange={(value: "requirement" | "task" | "dependency") => {
                      setLinkData({ entityType: value, entityId: "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requirement">Requirement</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="dependency">Dependency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Select Entity</Label>
                  <Select
                    value={linkData.entityId}
                    onValueChange={(value) => setLinkData({ ...linkData, entityId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getEntityOptions().map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddLink} disabled={addLinkMutation.isPending} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {addLinkMutation.isPending ? "Adding..." : "Add Link"}
              </Button>
            </div>

            {/* Current links */}
            <div className="space-y-3">
              <h4 className="font-medium">Current Links</h4>
              {!deliverableLinks || deliverableLinks.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                  No links yet. Add links to Requirements, Tasks, or Dependencies above.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliverableLinks.map((link: any) => {
                    const details = getLinkedEntityDetails(link.entityType, link.entityId);
                    if (!details) return null;
                    
                    return (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {link.entityType}
                            </Badge>
                            <span className="font-mono font-medium">{details.id}</span>
                            {details.status && (
                              <Badge className={getStatusColor(details.status)}>
                                {details.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {details.description || "No description"}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm(`Remove link to ${details.id}?`)) {
                              removeLinkMutation.mutate({
                                linkId: link.id,
                              });
                            }
                          }}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Deliverable</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{selectedDeliverable?.deliverableId}</strong>? 
              This will also remove all links to Requirements, Tasks, and Dependencies. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
