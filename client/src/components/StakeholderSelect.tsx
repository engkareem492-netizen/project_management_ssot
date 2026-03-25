import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Stakeholder {
  id: number;
  fullName: string;
}

interface StakeholderSelectProps {
  stakeholders: Stakeholder[];
  value: string;
  onValueChange: (name: string) => void;
  placeholder?: string;
  projectId?: number;
  className?: string;
}

/**
 * Single-select stakeholder dropdown that stores the fullName as value.
 * Includes inline "Create Stakeholder" when projectId is provided.
 */
export function StakeholderSelect({
  stakeholders,
  value,
  onValueChange,
  placeholder = "Select stakeholder...",
  projectId,
  className,
}: StakeholderSelectProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: "", position: "", role: "" });
  const utils = trpc.useUtils();

  const createMut = trpc.stakeholders.create.useMutation({
    onSuccess: (data: any) => {
      utils.stakeholders.list.invalidate();
      onValueChange(data.fullName);
      setCreateOpen(false);
      setNewStakeholder({ fullName: "", position: "", role: "" });
      toast.success("Stakeholder created");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="flex gap-1">
      <Select
        value={value || "__none__"}
        onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)}
      >
        <SelectTrigger className={`flex-1 ${className ?? ""}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">— None —</SelectItem>
          {stakeholders.map((s) => (
            <SelectItem key={s.id} value={s.fullName}>
              {s.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {projectId && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setCreateOpen(true)}
          title="Create new stakeholder"
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Full name..."
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                value={newStakeholder.position}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                placeholder="e.g. Project Manager"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={newStakeholder.role}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                placeholder="e.g. Sponsor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newStakeholder.fullName.trim() || createMut.isPending}
              onClick={() =>
                createMut.mutate({
                  projectId: projectId!,
                  fullName: newStakeholder.fullName,
                  position: newStakeholder.position || undefined,
                  role: newStakeholder.role || undefined,
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StakeholderMultiSelectProps {
  stakeholders: Stakeholder[];
  value: string[];
  onValueChange: (names: string[]) => void;
  projectId?: number;
}

/**
 * Multi-select stakeholder picker that stores an array of fullNames.
 * Shows a scrollable checklist + selected badges.
 * Includes inline "Create Stakeholder" when projectId is provided.
 */
export function StakeholderMultiSelect({
  stakeholders,
  value,
  onValueChange,
  projectId,
}: StakeholderMultiSelectProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: "", position: "", role: "" });
  const utils = trpc.useUtils();

  const createMut = trpc.stakeholders.create.useMutation({
    onSuccess: (data: any) => {
      utils.stakeholders.list.invalidate();
      onValueChange([...value, data.fullName]);
      setCreateOpen(false);
      setNewStakeholder({ fullName: "", position: "", role: "" });
      toast.success("Stakeholder created and added");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggle = (name: string) => {
    if (value.includes(name)) {
      onValueChange(value.filter((n) => n !== name));
    } else {
      onValueChange([...value, name]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-0.5">
        {stakeholders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No stakeholders yet
          </p>
        ) : (
          stakeholders.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-1 py-1 rounded"
            >
              <input
                type="checkbox"
                checked={value.includes(s.fullName)}
                onChange={() => toggle(s.fullName)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm">{s.fullName}</span>
            </label>
          ))
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full"
          >
            {name}
            <button
              type="button"
              onClick={() => toggle(name)}
              className="hover:text-blue-600 ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {projectId && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-6 text-xs"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            New Stakeholder
          </Button>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Full Name *</Label>
              <Input
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Full name..."
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                value={newStakeholder.position}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                placeholder="e.g. Project Manager"
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input
                value={newStakeholder.role}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                placeholder="e.g. Sponsor"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!newStakeholder.fullName.trim() || createMut.isPending}
              onClick={() =>
                createMut.mutate({
                  projectId: projectId!,
                  fullName: newStakeholder.fullName,
                  position: newStakeholder.position || undefined,
                  role: newStakeholder.role || undefined,
                })
              }
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
