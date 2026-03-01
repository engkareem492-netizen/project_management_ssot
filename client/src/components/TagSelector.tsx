import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tag, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface TagSelectorProps {
  entityType: string;
  entityId: number;
  projectId: number;
}

export function TagSelector({ entityType, entityId, projectId }: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6B7280");

  const { data: projectTags, refetch: refetchProject } = trpc.tags.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const { data: entityTagsList, refetch: refetchEntity } = trpc.tags.getForEntity.useQuery(
    { entityType, entityId },
    { enabled: !!entityId }
  );

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      setNewTagName("");
      refetchProject();
      toast.success("Tag created");
    },
    onError: (e) => toast.error(e.message),
  });

  const addMutation = trpc.tags.addToEntity.useMutation({
    onSuccess: () => {
      refetchEntity();
    },
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = trpc.tags.removeFromEntity.useMutation({
    onSuccess: () => {
      refetchEntity();
    },
    onError: (e) => toast.error(e.message),
  });

  const entityTagIds = new Set(entityTagsList?.map(t => t.id) || []);
  const availableTags = projectTags?.filter(t => !entityTagIds.has(t.id)) || [];

  const PRESET_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280", "#0EA5E9"];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Tag className="h-3.5 w-3.5 text-gray-500" />
        {entityTagsList?.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="text-xs flex items-center gap-1 cursor-default"
            style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
          >
            {tag.name}
            <X
              className="h-3 w-3 cursor-pointer hover:opacity-70"
              onClick={() => removeMutation.mutate({ tagId: tag.id, entityType, entityId })}
            />
          </Badge>
        ))}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-500">
              <Plus className="h-3 w-3 mr-1" /> Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-2">
              {availableTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500 px-1">Existing tags</p>
                  {availableTags.map((tag) => (
                    <button
                      key={tag.id}
                      className="w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100 flex items-center gap-2"
                      onClick={() => {
                        addMutation.mutate({ tagId: tag.id, entityType, entityId });
                        setOpen(false);
                      }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="border-t pt-2 space-y-2">
                <p className="text-xs font-medium text-gray-500 px-1">Create new tag</p>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Tag name"
                  className="h-7 text-xs"
                />
                <div className="flex gap-1 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`w-5 h-5 rounded-full border-2 ${newTagColor === c ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewTagColor(c)}
                    />
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full h-7 text-xs"
                  disabled={!newTagName.trim()}
                  onClick={() => {
                    createTagMutation.mutate({ projectId, name: newTagName.trim(), color: newTagColor });
                  }}
                >
                  Create Tag
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
