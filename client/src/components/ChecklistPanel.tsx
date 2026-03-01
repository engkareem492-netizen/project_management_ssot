import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckSquare, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

interface ChecklistPanelProps {
  taskId: number;
}

export function ChecklistPanel({ taskId }: ChecklistPanelProps) {
  const [newItemTitle, setNewItemTitle] = useState("");

  const { data: items, refetch } = trpc.checklists.list.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  const { data: progress } = trpc.checklists.progress.useQuery(
    { taskId },
    { enabled: !!taskId }
  );

  const createMutation = trpc.checklists.create.useMutation({
    onSuccess: () => {
      setNewItemTitle("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.checklists.update.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.checklists.delete.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!newItemTitle.trim()) return;
    createMutation.mutate({
      taskId,
      title: newItemTitle.trim(),
      sortOrder: (items?.length || 0),
    });
  };

  const handleToggle = (item: any) => {
    updateMutation.mutate({
      id: item.id,
      isCompleted: !item.isCompleted,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-gray-500" />
          <h4 className="text-sm font-medium text-gray-900">Checklist</h4>
        </div>
        {progress && progress.total > 0 && (
          <span className="text-xs text-gray-500">
            {progress.completed}/{progress.total} ({progress.percentage}%)
          </span>
        )}
      </div>

      {progress && progress.total > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      )}

      <div className="space-y-1">
        {items?.map((item) => (
          <div key={item.id} className="flex items-center gap-2 py-1 group">
            <GripVertical className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab" />
            <Checkbox
              checked={item.isCompleted}
              onCheckedChange={() => handleToggle(item)}
            />
            <span className={`text-sm flex-1 ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>
              {item.title}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500"
              onClick={() => deleteMutation.mutate({ id: item.id })}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newItemTitle}
          onChange={(e) => setNewItemTitle(e.target.value)}
          placeholder="Add checklist item..."
          className="text-sm h-8"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
        />
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={!newItemTitle.trim() || createMutation.isPending} className="h-8">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
