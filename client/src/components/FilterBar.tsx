import { useEffect, useState } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface FilterDef {
  key: string;
  label: string;
  type: "text" | "select" | "multi-select";
  options?: { value: string; label: string }[];
}

interface FilterBarProps {
  filters: FilterDef[];
  onChange?: (filters: Record<string, string | string[]>) => void;
  className?: string;
}

function parseSearch(search: string): Record<string, string> {
  const params = new URLSearchParams(search);
  const out: Record<string, string> = {};
  params.forEach((val, key) => {
    out[key] = val;
  });
  return out;
}

function buildSearch(values: Record<string, string | string[]>): string {
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(values)) {
    if (Array.isArray(val)) {
      if (val.length > 0) params.set(key, val.join(","));
    } else if (val) {
      params.set(key, val);
    }
  }
  const str = params.toString();
  return str ? `?${str}` : "";
}

export function FilterBar({ filters, onChange, className }: FilterBarProps) {
  const searchStr = useSearch();
  const [, navigate] = useLocation();
  const parsed = parseSearch(searchStr);

  // Local state mirrors URL params
  const [values, setValues] = useState<Record<string, string | string[]>>(() => {
    const init: Record<string, string | string[]> = {};
    for (const f of filters) {
      const raw = parsed[f.key] ?? "";
      if (f.type === "multi-select") {
        init[f.key] = raw ? raw.split(",") : [];
      } else {
        init[f.key] = raw;
      }
    }
    return init;
  });

  // Sync URL -> state when URL changes externally
  useEffect(() => {
    const next: Record<string, string | string[]> = {};
    for (const f of filters) {
      const raw = parsed[f.key] ?? "";
      next[f.key] = f.type === "multi-select" ? (raw ? raw.split(",") : []) : raw;
    }
    setValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchStr]);

  function updateValue(key: string, val: string | string[]) {
    const next = { ...values, [key]: val };
    setValues(next);
    navigate(window.location.pathname + buildSearch(next), { replace: true });
    onChange?.(next);
  }

  function toggleMulti(key: string, option: string) {
    const current = (values[key] as string[]) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    updateValue(key, next);
  }

  function clearAll() {
    const empty: Record<string, string | string[]> = {};
    for (const f of filters) {
      empty[f.key] = f.type === "multi-select" ? [] : "";
    }
    setValues(empty);
    navigate(window.location.pathname, { replace: true });
    onChange?.(empty);
  }

  const hasAnyFilter = filters.some((f) => {
    const v = values[f.key];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {filters.map((filter) => {
        if (filter.type === "text") {
          return (
            <div key={filter.key} className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={filter.label}
                value={(values[filter.key] as string) ?? ""}
                onChange={(e) => updateValue(filter.key, e.target.value)}
                className="pl-8 h-8 text-sm w-48"
              />
            </div>
          );
        }

        if (filter.type === "select") {
          const current = (values[filter.key] as string) ?? "";
          const selectedOpt = filter.options?.find((o) => o.value === current);
          return (
            <Popover key={filter.key}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-sm font-normal"
                >
                  {selectedOpt ? selectedOpt.label : filter.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-44 p-1" align="start">
                <button
                  className="flex items-center gap-2 px-2 py-1.5 w-full text-sm rounded hover:bg-accent"
                  onClick={() => updateValue(filter.key, "")}
                >
                  <span className="text-muted-foreground italic">Any</span>
                </button>
                {filter.options?.map((opt) => (
                  <button
                    key={opt.value}
                    className="flex items-center gap-2 px-2 py-1.5 w-full text-sm rounded hover:bg-accent"
                    onClick={() => updateValue(filter.key, opt.value)}
                  >
                    <Check
                      className={cn(
                        "h-3.5 w-3.5",
                        current === opt.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {opt.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          );
        }

        if (filter.type === "multi-select") {
          const current = (values[filter.key] as string[]) ?? [];
          return (
            <Popover key={filter.key}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 text-sm font-normal"
                >
                  {filter.label}
                  {current.length > 0 && (
                    <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-primary text-primary-foreground">
                      {current.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                {filter.options?.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                  >
                    <Checkbox
                      checked={current.includes(opt.value)}
                      onCheckedChange={() => toggleMulti(filter.key, opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          );
        }

        return null;
      })}

      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-sm text-muted-foreground hover:text-foreground gap-1"
          onClick={clearAll}
        >
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
