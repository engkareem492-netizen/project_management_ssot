import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface SelectWithCreateProps {
  type: "status" | "priority" | "type" | "category" | "stakeholder";
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  category?: string;
  projectId?: number;
}

export function SelectWithCreate({ type, value, onValueChange, placeholder, category, projectId }: SelectWithCreateProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newValue, setNewValue] = useState("");
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });

  const utils = trpc.useUtils();

  // Query options based on type
  const statusQuery = trpc.dropdownOptions.status.getAll.useQuery(undefined, { enabled: type === "status" });
  const priorityQuery = trpc.dropdownOptions.priority.getAll.useQuery(undefined, { enabled: type === "priority" });
  const typeQuery = trpc.dropdownOptions.type.getAll.useQuery(undefined, { enabled: type === "type" });
  const categoryQuery = trpc.dropdownOptions.category.getAll.useQuery(undefined, { enabled: type === "category" });
  const stakeholdersQuery = trpc.stakeholders.list.useQuery(undefined, { enabled: type === "stakeholder" });

  const options = type === "status" ? statusQuery.data :
                  type === "priority" ? priorityQuery.data :
                  type === "type" ? typeQuery.data :
                  type === "category" ? categoryQuery.data :
                  stakeholdersQuery.data;

  // Create mutations
  const createStatusMutation = trpc.dropdownOptions.status.create.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownOptions.status.getAll.invalidate();
      setNewValue("");
      setCreateDialogOpen(false);
      if (data?.value) onValueChange(data.value);
      toast.success("Status option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createPriorityMutation = trpc.dropdownOptions.priority.create.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownOptions.priority.getAll.invalidate();
      setNewValue("");
      setCreateDialogOpen(false);
      if (data?.value) onValueChange(data.value);
      toast.success("Priority option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createTypeMutation = trpc.dropdownOptions.type.create.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownOptions.type.getAll.invalidate();
      setNewValue("");
      setCreateDialogOpen(false);
      if (data?.value) onValueChange(data.value);
      toast.success("Type option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createCategoryMutation = trpc.dropdownOptions.category.create.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownOptions.category.getAll.invalidate();
      setNewValue("");
      setCreateDialogOpen(false);
      if (data?.value) onValueChange(data.value);
      toast.success("Category option added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add option: ${error.message}`);
    },
  });

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data: any) => {
      utils.stakeholders.list.invalidate();
      setNewStakeholder({ fullName: '', position: '', role: '' });
      setCreateDialogOpen(false);
      if (data?.id) onValueChange(data.id.toString());
      toast.success("Stakeholder added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add stakeholder: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (type === "stakeholder") {
      if (!newStakeholder.fullName.trim()) {
        toast.error("Please enter a name");
        return;
      }
      if (!projectId) {
        toast.error("No project selected");
        return;
      }
      createStakeholderMutation.mutate({
        projectId,
        fullName: newStakeholder.fullName,
        position: newStakeholder.position || undefined,
        role: newStakeholder.role || undefined,
      });
    } else {
      if (!newValue.trim()) {
        toast.error("Please enter a value");
        return;
      }
      const input = { value: newValue, category };
      if (type === "status") createStatusMutation.mutate(input);
      else if (type === "priority") createPriorityMutation.mutate(input);
      else if (type === "type") createTypeMutation.mutate(input);
      else createCategoryMutation.mutate(input);
    }
  };

  const isPending = type === "status" ? createStatusMutation.isPending :
                    type === "priority" ? createPriorityMutation.isPending :
                    type === "type" ? createTypeMutation.isPending :
                    type === "category" ? createCategoryMutation.isPending :
                    createStakeholderMutation.isPending;

  return (
    <div className="flex gap-1">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder={placeholder || `Select ${type}`} />
        </SelectTrigger>
        <SelectContent>
          {type === "stakeholder" ? (
            (options as any[])?.map((stakeholder: any) => (
              <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>{stakeholder.fullName}</SelectItem>
            ))
          ) : (
            (options as any[])?.map((opt: any) => (
              <SelectItem key={opt.id} value={opt.value}>{opt.value}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={() => setCreateDialogOpen(true)}
        title={`Add new ${type}`}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
            <DialogDescription>
              {type === "stakeholder" 
                ? "Add a new stakeholder to use as owner" 
                : `Create a new ${type} option`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {type === "stakeholder" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name *</label>
                  <Input
                    placeholder="Enter full name"
                    value={newStakeholder.fullName}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    placeholder="Enter position"
                    value={newStakeholder.position}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Input
                    placeholder="Enter role"
                    value={newStakeholder.role}
                    onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">{type.charAt(0).toUpperCase() + type.slice(1)} Value *</label>
                <Input
                  placeholder={`Enter ${type} value`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
