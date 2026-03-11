import { useState, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface InlineCellEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  type?: "text" | "select" | "textarea";
  options?: { value: string; label: string }[];
  displayRender?: (value: string) => React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function InlineCellEdit({
  value,
  onSave,
  type = "text",
  options = [],
  displayRender,
  className,
  disabled = false,
}: InlineCellEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const savedOnce = useRef(false);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [editing, value]);

  function handleClick() {
    if (!disabled && !editing) {
      setEditing(true);
    }
  }

  async function handleSave() {
    if (saving || savedOnce.current) return;
    savedOnce.current = true;
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
      savedOnce.current = false;
      setEditing(false);
    }
  }

  function handleCancel() {
    setDraft(value);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancel();
    } else if (e.key === "Enter" && type !== "textarea") {
      e.preventDefault();
      handleSave();
    }
  }

  function handleBlur() {
    if (draft !== value) {
      handleSave();
    } else {
      setEditing(false);
    }
  }

  if (saving) {
    return (
      <span className={cn("flex items-center gap-1 text-muted-foreground", className)}>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="text-sm">{draft}</span>
      </span>
    );
  }

  if (editing) {
    if (type === "select") {
      return (
        <Select
          value={draft}
          onValueChange={async (val) => {
            setDraft(val);
            setSaving(true);
            try {
              await onSave(val);
            } finally {
              setSaving(false);
              setEditing(false);
            }
          }}
          onOpenChange={(open) => {
            if (!open) setEditing(false);
          }}
        >
          <SelectTrigger className={cn("h-7 text-sm", className)} autoFocus>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (type === "textarea") {
      return (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn("text-sm min-h-[60px]", className)}
          rows={3}
        />
      );
    }

    return (
      <Input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn("h-7 text-sm", className)}
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={cn(
        "cursor-pointer inline-block min-w-[40px] rounded px-1 -mx-1 transition-colors",
        !disabled && "hover:underline hover:decoration-dashed hover:decoration-muted-foreground/50 hover:underline-offset-2",
        disabled && "cursor-default",
        className
      )}
    >
      {displayRender ? displayRender(value) : (value || <span className="text-muted-foreground text-sm italic">—</span>)}
    </span>
  );
}
