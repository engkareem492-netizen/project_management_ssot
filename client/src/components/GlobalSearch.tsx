import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  CheckSquare,
  AlertCircle,
  Link2,
  FileCheck,
  Users,
  Package,
  BookOpen,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface SearchResult {
  id: number;
  module: string;
  code: string;
  title: string;
  status?: string;
  path: string;
}

const MODULE_ICONS: Record<string, React.ElementType> = {
  requirements: FileText,
  tasks: CheckSquare,
  issues: AlertCircle,
  dependencies: Link2,
  assumptions: FileCheck,
  stakeholders: Users,
  deliverables: Package,
  knowledgeBase: BookOpen,
  risks: AlertTriangle,
};

const MODULE_COLORS: Record<string, string> = {
  requirements: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  tasks: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  issues: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  dependencies: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  assumptions: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  stakeholders: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  deliverables: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  knowledgeBase: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  risks: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const { currentProjectId } = useProject();
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const { data: results, isLoading } = trpc.search.global.useQuery(
    { projectId: currentProjectId!, query: debouncedQuery },
    { enabled: !!currentProjectId && debouncedQuery.length >= 2 }
  );

  const allResults: SearchResult[] = results || [];

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setLocation(result.path);
      onOpenChange(false);
    },
    [setLocation, onOpenChange]
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      handleSelect(allResults[selectedIndex]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search requirements, tasks, issues, risks..."
            className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
          />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {debouncedQuery.length < 2 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          ) : allResults.length === 0 && !isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No results found for &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            <div className="py-1">
              {allResults.map((result, index) => {
                const Icon = MODULE_ICONS[result.module] || FileText;
                const colorClass = MODULE_COLORS[result.module] || "";
                return (
                  <button
                    key={`${result.module}-${result.id}`}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors ${
                      index === selectedIndex ? "bg-accent" : ""
                    }`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground shrink-0">
                          {result.code}
                        </span>
                        <span className="text-sm truncate">{result.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.status && (
                        <span className="text-xs text-muted-foreground">{result.status}</span>
                      )}
                      <Badge variant="secondary" className={`text-xs px-1.5 py-0 ${colorClass}`}>
                        {result.module === "knowledgeBase" ? "KB" : result.module.charAt(0).toUpperCase() + result.module.slice(1, 4)}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">Esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
