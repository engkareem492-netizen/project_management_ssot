import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface QuickAddRowProps {
  columns: number;
  entityLabel: string;
  fields: {
    key: string;
    label: string;
    type: "text" | "select";
    options?: { value: string; label: string }[];
    defaultValue?: string;
  }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  disabled?: boolean;
}

function buildDefaults(
  fields: QuickAddRowProps["fields"]
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const f of fields) {
    defaults[f.key] = f.defaultValue ?? "";
  }
  return defaults;
}

export function QuickAddRow({
  columns,
  entityLabel,
  fields,
  onSubmit,
  disabled = false,
}: QuickAddRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>(
    buildDefaults(fields)
  );
  const [submitting, setSubmitting] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => firstInputRef.current?.focus(), 50);
    }
  }, [expanded]);

  function handleExpand() {
    if (!disabled) setExpanded(true);
  }

  function handleCancel() {
    setExpanded(false);
    setFormData(buildDefaults(fields));
  }

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset fields but stay expanded for quick multi-add
      setFormData(buildDefaults(fields));
      setTimeout(() => firstInputRef.current?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  function setField(key: string, val: string) {
    setFormData((prev) => ({ ...prev, [key]: val }));
  }

  if (!expanded) {
    return (
      <tr>
        <td colSpan={columns} className="px-3 py-1">
          <button
            type="button"
            onClick={handleExpand}
            disabled={disabled}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5 group-hover:text-primary transition-colors" />
            <span>Add {entityLabel}</span>
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={columns} className="px-3 py-2">
        <AnimatePresence>
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 flex-wrap"
            onKeyDown={handleKeyDown}
          >
            {fields.map((field, idx) => {
              if (field.type === "select") {
                return (
                  <div key={field.key} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {field.label}:
                    </span>
                    <Select
                      value={formData[field.key]}
                      onValueChange={(val) => setField(field.key, val)}
                    >
                      <SelectTrigger className="h-7 text-sm min-w-[120px]">
                        <SelectValue placeholder={field.label} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              }
              return (
                <div key={field.key} className="flex items-center gap-1 flex-1 min-w-[160px]">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {field.label}:
                  </span>
                  <Input
                    ref={idx === 0 ? firstInputRef : undefined}
                    className="h-7 text-sm"
                    placeholder={field.label}
                    value={formData[field.key]}
                    onChange={(e) => setField(field.key, e.target.value)}
                  />
                </div>
              );
            })}
            <div className="flex items-center gap-1 ml-auto">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={handleSubmit}
                disabled={submitting}
                title="Add (Enter)"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={handleCancel}
                title="Cancel (Escape)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </td>
    </tr>
  );
}
