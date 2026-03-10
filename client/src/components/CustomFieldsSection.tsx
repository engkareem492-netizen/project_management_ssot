/**
 * CustomFieldsSection
 * Renders all custom field definitions for a given entity type and allows
 * reading / writing their values.
 *
 * Usage (read-only):
 *   <CustomFieldsSection projectId={1} entityType="task" entityId="T-0001" readOnly />
 *
 * Usage (editable):
 *   <CustomFieldsSection projectId={1} entityType="task" entityId="T-0001" />
 */

import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { toast } from "sonner";

interface Props {
  projectId: number;
  entityType: string;
  entityId: string;
  readOnly?: boolean;
}

export function CustomFieldsSection({ projectId, entityType, entityId, readOnly = false }: Props) {
  const { data: defs = [] } = trpc.customFields.listDefs.useQuery(
    { projectId, entityType: entityType as any },
    { enabled: !!projectId }
  );

  const { data: values = [], refetch: refetchValues } = trpc.customFields.getValues.useQuery(
    { projectId, entityType, entityId },
    { enabled: !!projectId && !!entityId }
  );

  const upsertMutation = trpc.customFields.upsertValue.useMutation({
    onSuccess: () => refetchValues(),
    onError: (e) => toast.error(`Failed to save: ${e.message}`),
  });

  if (!defs.length) return null;

  const getValue = (fieldDefId: number): string => {
    const found = values.find((v: any) => v.fieldDefId === fieldDefId);
    return found?.value ?? '';
  };

  const handleChange = (fieldDefId: number, value: string | null) => {
    if (readOnly) return;
    upsertMutation.mutate({ projectId, fieldDefId, entityType, entityId, value });
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold border-b pb-2 text-muted-foreground uppercase tracking-wide">
        Custom Fields
      </h4>
      <div className="grid grid-cols-2 gap-4">
        {defs.map((def: any) => {
          const currentValue = getValue(def.id);
          return (
            <div key={def.id} className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                {def.label}
                {def.required && <span className="text-red-500 ml-0.5">*</span>}
              </Label>

              {readOnly ? (
                <ReadOnlyField def={def} value={currentValue} />
              ) : (
                <EditableField
                  def={def}
                  value={currentValue}
                  onChange={(v) => handleChange(def.id, v)}
                  isPending={upsertMutation.isPending}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReadOnlyField({ def, value }: { def: any; value: string }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;

  switch (def.fieldType) {
    case 'checkbox':
      return <span className="text-sm">{value === 'true' ? '✓ Yes' : '✗ No'}</span>;
    case 'rating': {
      const rating = parseInt(value) || 0;
      return (
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`w-4 h-4 ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
          ))}
        </div>
      );
    }
    case 'multi_select': {
      const items = value.split(',').filter(Boolean);
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">{item.trim()}</Badge>
          ))}
        </div>
      );
    }
    case 'url':
      return <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate block">{value}</a>;
    case 'email':
      return <a href={`mailto:${value}`} className="text-sm text-primary underline">{value}</a>;
    default:
      return <span className="text-sm">{value}</span>;
  }
}

function EditableField({
  def,
  value,
  onChange,
  isPending,
}: {
  def: any;
  value: string;
  onChange: (v: string | null) => void;
  isPending: boolean;
}) {
  const options: string[] = def.options ?? [];

  switch (def.fieldType) {
    case 'text':
    case 'url':
    case 'email':
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isPending}
          className="h-8 text-sm"
          type={def.fieldType === 'email' ? 'email' : def.fieldType === 'url' ? 'url' : 'text'}
        />
      );
    case 'textarea':
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isPending}
          rows={2}
          className="text-sm"
        />
      );
    case 'number':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isPending}
          className="h-8 text-sm"
        />
      );
    case 'date':
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isPending}
          className="h-8 text-sm"
        />
      );
    case 'select':
      return (
        <Select value={value || ''} onValueChange={(v) => onChange(v || null)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none_">— None —</SelectItem>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'multi_select': {
      const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
      return (
        <div className="space-y-1">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`ms-${def.id}-${opt}`}
                checked={selected.includes(opt)}
                onCheckedChange={(checked) => {
                  const next = checked
                    ? [...selected, opt]
                    : selected.filter((s) => s !== opt);
                  onChange(next.join(',') || null);
                }}
                disabled={isPending}
              />
              <Label htmlFor={`ms-${def.id}-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
        </div>
      );
    }
    case 'checkbox':
      return (
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={`cb-${def.id}`}
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? 'true' : 'false')}
            disabled={isPending}
          />
          <Label htmlFor={`cb-${def.id}`} className="text-sm cursor-pointer">Yes</Label>
        </div>
      );
    case 'rating': {
      const rating = parseInt(value) || 0;
      return (
        <div className="flex gap-1 pt-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n === rating ? null : String(n))}
              disabled={isPending}
              className="focus:outline-none"
            >
              <Star className={`w-5 h-5 transition-colors ${n <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-yellow-300'}`} />
            </button>
          ))}
        </div>
      );
    }
    default:
      return (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={isPending}
          className="h-8 text-sm"
        />
      );
  }
}
