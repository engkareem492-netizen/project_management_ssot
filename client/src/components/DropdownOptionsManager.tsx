import { useState } from "react";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DropdownOptionsManagerProps {
  type: "status" | "priority" | "type" | "category";
  category?: string;
}

export function DropdownOptionsManager({ type, category }: DropdownOptionsManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newValue, setNewValue] = useState("");
  const [editValue, setEditValue] = useState("");

  const utils = trpc.useUtils();

  // Query options based on type
  const statusQuery = trpc.dropdownOptions.status.getAll.useQuery(undefined, { enabled: type === "status" });
  const priorityQuery = trpc.dropdownOptions.priority.getAll.useQuery(undefined, { enabled: type === "priority" });
  const typeQuery = trpc.dropdownOptions.type.getAll.useQuery(undefined, { enabled: type === "type" });
  const categoryQuery = trpc.dropdownOptions.category.getAll.useQuery(undefined, { enabled: type === "category" });

  const options = type === "status" ? statusQuery.data :
                  type === "priority" ? priorityQuery.data :
                  type === "type" ? typeQuery.data :
                  categoryQuery.data;

  const isLoading = type === "status" ? statusQuery.isLoading :
                    type === "priority" ? priorityQuery.isLoading :
                    type === "type" ? typeQuery.isLoading :
                    categoryQuery.isLoading;

  // Create mutations
  const createStatusMutation = trpc.dropdownOptions.status.create.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.status.getAll.invalidate();
      setNewValue("");
      toast.success("Status option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createPriorityMutation = trpc.dropdownOptions.priority.create.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.priority.getAll.invalidate();
      setNewValue("");
      toast.success("Priority option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createTypeMutation = trpc.dropdownOptions.type.create.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.type.getAll.invalidate();
      setNewValue("");
      toast.success("Type option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createCategoryMutation = trpc.dropdownOptions.category.create.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.category.getAll.invalidate();
      setNewValue("");
      toast.success("Category option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  // Update mutations
  const updateStatusMutation = trpc.dropdownOptions.status.update.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.status.getAll.invalidate();
      setEditingId(null);
      setEditValue("");
      toast.success("Status option updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update option: ${error.message}`);
    },
  });

  const updatePriorityMutation = trpc.dropdownOptions.priority.update.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.priority.getAll.invalidate();
      setEditingId(null);
      setEditValue("");
      toast.success("Priority option updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update option: ${error.message}`);
    },
  });

  const updateTypeMutation = trpc.dropdownOptions.type.update.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.type.getAll.invalidate();
      setEditingId(null);
      setEditValue("");
      toast.success("Type option updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update option: ${error.message}`);
    },
  });

  const updateCategoryMutation = trpc.dropdownOptions.category.update.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.category.getAll.invalidate();
      setEditingId(null);
      setEditValue("");
      toast.success("Category option updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update option: ${error.message}`);
    },
  });

  // Delete mutations
  const deleteStatusMutation = trpc.dropdownOptions.status.delete.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.status.getAll.invalidate();
      toast.success("Status option deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete option: ${error.message}`);
    },
  });

  const deletePriorityMutation = trpc.dropdownOptions.priority.delete.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.priority.getAll.invalidate();
      toast.success("Priority option deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete option: ${error.message}`);
    },
  });

  const deleteTypeMutation = trpc.dropdownOptions.type.delete.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.type.getAll.invalidate();
      toast.success("Type option deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete option: ${error.message}`);
    },
  });

  const deleteCategoryMutation = trpc.dropdownOptions.category.delete.useMutation({
    onSuccess: () => {
      utils.dropdownOptions.category.getAll.invalidate();
      toast.success("Category option deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete option: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    const input = { value: newValue, category };
    if (type === "status") createStatusMutation.mutate(input);
    else if (type === "priority") createPriorityMutation.mutate(input);
    else if (type === "type") createTypeMutation.mutate(input);
    else createCategoryMutation.mutate(input);
  };

  const handleUpdate = (id: number) => {
    if (!editValue.trim()) {
      toast.error("Please enter a value");
      return;
    }
    const input = { id, value: editValue };
    if (type === "status") updateStatusMutation.mutate(input);
    else if (type === "priority") updatePriorityMutation.mutate(input);
    else if (type === "type") updateTypeMutation.mutate(input);
    else updateCategoryMutation.mutate(input);
  };

  const handleDelete = (id: number, usageCount: number) => {
    if (usageCount > 0) {
      toast.error(`Cannot delete: This option is used by ${usageCount} item(s)`);
      return;
    }
    if (confirm("Are you sure you want to delete this option?")) {
      if (type === "status") deleteStatusMutation.mutate({ id });
      else if (type === "priority") deletePriorityMutation.mutate({ id });
      else if (type === "type") deleteTypeMutation.mutate({ id });
      else deleteCategoryMutation.mutate({ id });
    }
  };

  const isPending = type === "status" ? (createStatusMutation.isPending || updateStatusMutation.isPending || deleteStatusMutation.isPending) :
                    type === "priority" ? (createPriorityMutation.isPending || updatePriorityMutation.isPending || deletePriorityMutation.isPending) :
                    type === "type" ? (createTypeMutation.isPending || updateTypeMutation.isPending || deleteTypeMutation.isPending) :
                    (createCategoryMutation.isPending || updateCategoryMutation.isPending || deleteCategoryMutation.isPending);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage {type.charAt(0).toUpperCase() + type.slice(1)} Options</DialogTitle>
            <DialogDescription>
              Add, edit, or delete {type} options. Options in use cannot be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Add new option */}
            <div className="flex gap-2">
              <Input
                placeholder={`New ${type} option...`}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button onClick={handleCreate} disabled={isPending} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* List existing options */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : options && options.length > 0 ? (
                options.map((option: any) => (
                  <div key={option.id} className="flex items-center gap-2 p-2 border rounded">
                    {editingId === option.id ? (
                      <>
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleUpdate(option.id)}
                          className="flex-1"
                        />
                        <Button
                          onClick={() => handleUpdate(option.id)}
                          disabled={isPending}
                          size="icon"
                          variant="ghost"
                        >
                          ✓
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(null);
                            setEditValue("");
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1">{option.value}</span>
                        <span className="text-xs text-muted-foreground">
                          ({option.usageCount || 0} used)
                        </span>
                        <Button
                          onClick={() => {
                            setEditingId(option.id);
                            setEditValue(option.value);
                          }}
                          size="icon"
                          variant="ghost"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(option.id, option.usageCount || 0)}
                          disabled={isPending || (option.usageCount || 0) > 0}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No options available</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
