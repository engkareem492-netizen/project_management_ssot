import { useState, useEffect } from "react";
import { AlignJustify, LayoutList, StretchVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type Density = "compact" | "comfortable" | "spacious";

interface RowDensityToggleProps {
  storageKey: string;
  onChange?: (density: Density) => void;
}

const DENSITY_OPTIONS: { value: Density; label: string; icon: React.ReactNode }[] = [
  { value: "compact", label: "Compact", icon: <AlignJustify className="h-4 w-4" /> },
  { value: "comfortable", label: "Comfortable", icon: <LayoutList className="h-4 w-4" /> },
  { value: "spacious", label: "Spacious", icon: <StretchVertical className="h-4 w-4" /> },
];

const ROW_CLASS_MAP: Record<Density, string> = {
  compact: "py-1",
  comfortable: "py-2",
  spacious: "py-4",
};

function loadDensity(storageKey: string): Density {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === "compact" || stored === "comfortable" || stored === "spacious") {
      return stored;
    }
  } catch {
    // ignore
  }
  return "comfortable";
}

export function useRowDensity(storageKey: string) {
  const [density, setDensity] = useState<Density>(() => loadDensity(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, density);
    } catch {
      // ignore
    }
  }, [density, storageKey]);

  return {
    density,
    setDensity,
    rowClassName: ROW_CLASS_MAP[density],
  };
}

export function RowDensityToggle({ storageKey, onChange }: RowDensityToggleProps) {
  const { density, setDensity } = useRowDensity(storageKey);

  function handleChange(val: Density) {
    setDensity(val);
    onChange?.(val);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center border rounded-md overflow-hidden">
        {DENSITY_OPTIONS.map((opt) => (
          <Tooltip key={opt.value}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 rounded-none border-0",
                  density === opt.value
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleChange(opt.value)}
                aria-pressed={density === opt.value}
                aria-label={opt.label}
              >
                {opt.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{opt.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
