import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ColumnDef {
  key: string;
  label: string;
}

interface ColumnVisibilityToggleProps {
  columns: ColumnDef[];
  storageKey: string;
}

function loadVisibility(
  columns: ColumnDef[],
  storageKey: string
): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, boolean>;
      // Ensure all columns have an entry (default true for new columns)
      const result: Record<string, boolean> = {};
      for (const col of columns) {
        result[col.key] = parsed[col.key] ?? true;
      }
      return result;
    }
  } catch {
    // ignore
  }
  const defaults: Record<string, boolean> = {};
  for (const col of columns) {
    defaults[col.key] = true;
  }
  return defaults;
}

export function useColumnVisibility(columns: ColumnDef[], storageKey: string) {
  const [visible, setVisible] = useState<Record<string, boolean>>(() =>
    loadVisibility(columns, storageKey)
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(visible));
    } catch {
      // ignore
    }
  }, [visible, storageKey]);

  function toggle(key: string) {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function isVisible(key: string): boolean {
    return visible[key] ?? true;
  }

  return { visible, toggle, isVisible };
}

export function ColumnVisibilityToggle({
  columns,
  storageKey,
}: ColumnVisibilityToggleProps) {
  const { visible, toggle } = useColumnVisibility(columns, storageKey);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-sm font-normal"
          title="Toggle column visibility"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Columns</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
          Toggle columns
        </p>
        <div className="space-y-0.5">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
            >
              <Checkbox
                checked={visible[col.key] ?? true}
                onCheckedChange={() => toggle(col.key)}
              />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
