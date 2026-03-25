/**
 * RegistrySelect — A Select dropdown backed by the dropdownRegistry system,
 * with an inline management popover for adding, editing, and removing options.
 *
 * Usage:
 *   <RegistrySelect
 *     projectId={projectId}
 *     domain="scope_items"
 *     fieldKey="status"
 *     value={form.status}
 *     onValueChange={(v) => setForm(p => ({ ...p, status: v }))}
 *     placeholder="Select status"
 *   />
 */
import React, { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings2, Plus, Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface RegistrySelectProps {
  projectId: number;
  domain: string;
  fieldKey: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  /** Allow empty/none selection */
  allowNone?: boolean;
  noneLabel?: string;
  className?: string;
  triggerClassName?: string;
  /** Size variant */
  size?: "sm" | "default";
  disabled?: boolean;
}

export function RegistrySelect({
  projectId,
  domain,
  fieldKey,
  value,
  onValueChange,
  placeholder,
  allowNone = false,
  noneLabel = "— None —",
  className,
  triggerClassName,
  size = "default",
  disabled,
}: RegistrySelectProps) {
  const utils = trpc.useUtils();
  const [manageOpen, setManageOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editColor, setEditColor] = useState("#6b7280");

  const { data: options = [], isLoading } = trpc.dropdownRegistry.list.useQuery(
    { projectId, domain, fieldKey },
    { enabled: !!projectId }
  );

  const addMut = trpc.dropdownRegistry.add.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownRegistry.list.invalidate({ projectId, domain, fieldKey });
      setNewLabel("");
      setNewColor("#6b7280");
      setAdding(false);
      if (data?.value) onValueChange(data.value);
      toast.success("Option added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMut = trpc.dropdownRegistry.update.useMutation({
    onSuccess: () => {
      utils.dropdownRegistry.list.invalidate({ projectId, domain, fieldKey });
      setEditingId(null);
      toast.success("Option updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMut = trpc.dropdownRegistry.delete.useMutation({
    onSuccess: (_, vars) => {
      utils.dropdownRegistry.list.invalidate({ projectId, domain, fieldKey });
      // If the deleted option was selected, clear selection
      const deleted = (options as any[]).find((o: any) => o.id === vars.id);
      if (deleted && deleted.value === value) onValueChange("");
      toast.success("Option removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function handleAdd() {
    if (!newLabel.trim()) { toast.error("Please enter a label"); return; }
    addMut.mutate({ projectId, domain, fieldKey, value: newLabel.trim(), color: newColor, sortOrder: (options as any[]).length });
  }

  function handleSaveEdit(id: number) {
    if (!editLabel.trim()) { toast.error("Label cannot be empty"); return; }
    updateMut.mutate({ id, value: editLabel.trim(), color: editColor });
  }

  function startEdit(opt: any) {
    setEditingId(opt.id);
    setEditLabel(opt.value);
    setEditColor(opt.color ?? "#6b7280");
    setAdding(false);
  }

  const smTrigger = size === "sm" ? "h-7 text-xs mt-0.5" : "";

  return (
    <div className={cn("flex gap-1 items-center", className)}>
      <Select value={value || (allowNone ? "__none__" : value)} onValueChange={(v) => onValueChange(v === "__none__" ? "" : v)} disabled={disabled}>
        <SelectTrigger className={cn("flex-1", smTrigger, triggerClassName)}>
          <SelectValue placeholder={placeholder ?? `Select ${fieldKey}`} />
        </SelectTrigger>
        <SelectContent>
          {allowNone && <SelectItem value="__none__">{noneLabel}</SelectItem>}
          {isLoading ? (
            <SelectItem value="__loading__" disabled>Loading…</SelectItem>
          ) : (options as any[]).filter((o: any) => o.isActive !== false).map((opt: any) => (
            <SelectItem key={opt.id} value={opt.value}>
              <span className="flex items-center gap-1.5">
                {opt.color && (
                  <span className="w-2 h-2 rounded-full shrink-0 inline-block" style={{ background: opt.color }} />
                )}
                {opt.value}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Manage button */}
      <Popover open={manageOpen} onOpenChange={setManageOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn("shrink-0 text-muted-foreground hover:text-foreground", size === "sm" ? "h-7 w-7" : "h-9 w-9")}
            title={`Manage ${fieldKey} options`}
            onClick={(e) => e.stopPropagation()}
          >
            <Settings2 className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3" side="right" align="start">
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-1 border-b">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Manage {fieldKey.replace(/_/g, " ")} options
              </p>
            </div>

            {/* Existing options */}
            <div className="space-y-1 max-h-52 overflow-y-auto">
              {(options as any[]).map((opt: any) => (
                <div key={opt.id} className="rounded border bg-muted/20">
                  {editingId === opt.id ? (
                    <div className="p-2 space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="h-7 w-7 rounded border cursor-pointer p-0.5 shrink-0"
                          title="Pick color"
                        />
                        <Input
                          className="h-7 text-xs flex-1"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(opt.id)}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-1 justify-end">
                        <Button size="sm" className="h-6 text-xs px-2" onClick={() => handleSaveEdit(opt.id)} disabled={updateMut.isPending}>
                          <Check className="w-3 h-3 mr-0.5" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => setEditingId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      {opt.color && (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: opt.color }} />
                      )}
                      <span className="flex-1 text-xs truncate">{opt.value}</span>
                      <button
                        className="p-0.5 text-muted-foreground hover:text-foreground rounded"
                        onClick={() => startEdit(opt)}
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        className="p-0.5 text-muted-foreground hover:text-destructive rounded"
                        onClick={() => {
                          if (confirm(`Remove "${opt.value}"?`)) deleteMut.mutate({ id: opt.id });
                        }}
                        title="Delete"
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {(options as any[]).length === 0 && !adding && (
                <p className="text-xs text-muted-foreground text-center py-3">No options yet. Add one below.</p>
              )}
            </div>

            {/* Add new */}
            {adding ? (
              <div className="space-y-1.5 pt-1 border-t">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">New option</p>
                <div className="flex gap-1.5">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="h-7 w-7 rounded border cursor-pointer p-0.5 shrink-0"
                    title="Pick color"
                  />
                  <Input
                    className="h-7 text-xs flex-1"
                    placeholder="Option label"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    autoFocus
                  />
                </div>
                <div className="flex gap-1 justify-end">
                  <Button size="sm" className="h-6 text-xs px-2" onClick={handleAdd} disabled={addMut.isPending}>
                    <Plus className="w-3 h-3 mr-0.5" /> Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => { setAdding(false); setNewLabel(""); }}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-7 text-xs border-dashed"
                onClick={() => { setAdding(true); setEditingId(null); }}
              >
                <Plus className="w-3 h-3 mr-1" /> Add Option
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
