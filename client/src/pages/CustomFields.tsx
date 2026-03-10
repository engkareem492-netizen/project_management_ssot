import { useState } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil, Trash2, GripVertical, Type, Hash, Calendar, List, CheckSquare, Link, Mail, AlignLeft, Star } from "lucide-react";
import { toast } from "sonner";

const ENTITY_TYPES = [
  { value: "task", label: "Tasks" },
  { value: "issue", label: "Issues" },
  { value: "risk", label: "Risks" },
  { value: "requirement", label: "Requirements" },
  { value: "stakeholder", label: "Stakeholders" },
  { value: "deliverable", label: "Deliverables" },
  { value: "milestone", label: "Milestones" },
  { value: "action_item", label: "Action Items" },
  { value: "change_request", label: "Change Requests" },
] as const;

const FIELD_TYPES = [
  { value: "text", label: "Short Text", icon: Type },
  { value: "textarea", label: "Long Text", icon: AlignLeft },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "select", label: "Single Select", icon: List },
  { value: "multi_select", label: "Multi Select", icon: List },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare },
  { value: "url", label: "URL", icon: Link },
  { value: "email", label: "Email", icon: Mail },
  { value: "rating", label: "Rating (1-5)", icon: Star },
] as const;

type EntityType = typeof ENTITY_TYPES[number]["value"];
type FieldType = typeof FIELD_TYPES[number]["value"];

interface FieldDef {
  id: number;
  entityType: EntityType;
  fieldKey: string;
  label: string;
  fieldType: FieldType;
  options: string[] | null;
  required: boolean | null;
  sortOrder: number | null;
}

const FIELD_TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-100 text-blue-700",
  textarea: "bg-blue-100 text-blue-700",
  number: "bg-purple-100 text-purple-700",
  date: "bg-green-100 text-green-700",
  select: "bg-orange-100 text-orange-700",
  multi_select: "bg-orange-100 text-orange-700",
  checkbox: "bg-pink-100 text-pink-700",
  url: "bg-cyan-100 text-cyan-700",
  email: "bg-cyan-100 text-cyan-700",
  rating: "bg-yellow-100 text-yellow-700",
};

export default function CustomFields() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [activeEntity, setActiveEntity] = useState<EntityType>("task");
  const [showCreate, setShowCreate] = useState(false);
  const [editingField, setEditingField] = useState<FieldDef | null>(null);
  const [optionInput, setOptionInput] = useState("");

  // Form state
  const [form, setForm] = useState({
    label: "",
    fieldKey: "",
    fieldType: "text" as FieldType,
    options: [] as string[],
    required: false,
  });

  const utils = trpc.useUtils();

  const { data: fields = [], isLoading } = trpc.customFields.listDefs.useQuery(
    { projectId, entityType: activeEntity },
    { enabled: projectId > 0 }
  );

  const createMutation = trpc.customFields.createDef.useMutation({
    onSuccess: () => {
      utils.customFields.listDefs.invalidate();
      setShowCreate(false);
      resetForm();
      toast.success("Custom field created");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.customFields.updateDef.useMutation({
    onSuccess: () => {
      utils.customFields.listDefs.invalidate();
      setEditingField(null);
      resetForm();
      toast.success("Custom field updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.customFields.deleteDef.useMutation({
    onSuccess: () => {
      utils.customFields.listDefs.invalidate();
      toast.success("Custom field deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  function resetForm() {
    setForm({ label: "", fieldKey: "", fieldType: "text", options: [], required: false });
    setOptionInput("");
  }

  function openEdit(field: FieldDef) {
    setEditingField(field);
    setForm({
      label: field.label,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      options: field.options ?? [],
      required: field.required ?? false,
    });
  }

  function autoKey(label: string) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function handleLabelChange(val: string) {
    setForm(f => ({ ...f, label: val, fieldKey: autoKey(val) }));
  }

  function addOption() {
    if (!optionInput.trim()) return;
    setForm(f => ({ ...f, options: [...f.options, optionInput.trim()] }));
    setOptionInput("");
  }

  function removeOption(idx: number) {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  }

  function handleCreate() {
    if (!form.label.trim()) return toast.error("Label is required");
    createMutation.mutate({
      projectId,
      entityType: activeEntity,
      fieldKey: form.fieldKey || autoKey(form.label),
      label: form.label,
      fieldType: form.fieldType,
      options: ["select", "multi_select"].includes(form.fieldType) ? form.options : undefined,
      required: form.required,
      sortOrder: fields.length,
    });
  }

  function handleUpdate() {
    if (!editingField) return;
    updateMutation.mutate({
      id: editingField.id,
      label: form.label,
      fieldType: form.fieldType,
      options: ["select", "multi_select"].includes(form.fieldType) ? form.options : undefined,
      required: form.required,
    });
  }

  const needsOptions = ["select", "multi_select"].includes(form.fieldType);
  const activeEntityLabel = ENTITY_TYPES.find(e => e.value === activeEntity)?.label ?? "";

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add custom fields to any entity type to capture project-specific data.
          Fields appear in the detail dialogs of each module.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Entity type sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {ENTITY_TYPES.map(et => (
            <button
              key={et.value}
              onClick={() => setActiveEntity(et.value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeEntity === et.value
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {et.label}
            </button>
          ))}
        </div>

        {/* Field list */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{activeEntityLabel} Fields</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {fields.length} custom field{fields.length !== 1 ? "s" : ""} defined
                  </CardDescription>
                </div>
                <Button size="sm" onClick={() => { resetForm(); setShowCreate(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Add Field
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
              ) : fields.length === 0 ? (
                <div className="py-12 text-center">
                  <Type className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">No custom fields yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add fields to capture extra data on {activeEntityLabel.toLowerCase()}.
                  </p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => { resetForm(); setShowCreate(true); }}>
                    <Plus className="w-4 h-4 mr-1" /> Add First Field
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {(fields as FieldDef[]).map((field) => {
                    const ft = FIELD_TYPES.find(f => f.value === field.fieldType);
                    const Icon = ft?.icon ?? Type;
                    return (
                      <div key={field.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 group">
                        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{field.label}</span>
                            {field.required && (
                              <span className="text-xs text-red-500 font-medium">Required</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground font-mono">{field.fieldKey}</span>
                            <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${FIELD_TYPE_COLORS[field.fieldType] ?? ""}`}>
                              {ft?.label ?? field.fieldType}
                            </Badge>
                            {field.options && field.options.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {field.options.length} option{field.options.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(field)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Delete field "${field.label}"? All stored values will be lost.`)) {
                                deleteMutation.mutate({ id: field.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={showCreate || !!editingField} onOpenChange={(open) => {
        if (!open) { setShowCreate(false); setEditingField(null); resetForm(); }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Custom Field" : `New Field for ${activeEntityLabel}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Label *</Label>
              <Input
                value={form.label}
                onChange={e => handleLabelChange(e.target.value)}
                placeholder="e.g. Budget Code"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Field Key</Label>
              <Input
                value={form.fieldKey}
                onChange={e => setForm(f => ({ ...f, fieldKey: e.target.value }))}
                placeholder="auto-generated from label"
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Used as the internal identifier. Cannot be changed after creation.</p>
            </div>
            <div>
              <Label>Field Type</Label>
              <Select value={form.fieldType} onValueChange={(v) => setForm(f => ({ ...f, fieldType: v as FieldType }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsOptions && (
              <div>
                <Label>Options</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={optionInput}
                    onChange={e => setOptionInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addOption()}
                    placeholder="Add option…"
                  />
                  <Button type="button" variant="outline" onClick={addOption}>Add</Button>
                </div>
                {form.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.options.map((opt, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 pr-1">
                        {opt}
                        <button onClick={() => removeOption(i)} className="ml-0.5 hover:text-red-500">×</button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Required</Label>
                <p className="text-xs text-muted-foreground">Mark this field as mandatory</p>
              </div>
              <Switch checked={form.required} onCheckedChange={v => setForm(f => ({ ...f, required: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setEditingField(null); resetForm(); }}>Cancel</Button>
            <Button
              onClick={editingField ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingField ? "Save Changes" : "Create Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
