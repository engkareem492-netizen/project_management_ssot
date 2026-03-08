import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

const MODULE_COLORS: Record<string, string> = {
  requirements: "bg-blue-100 text-blue-700",
  tasks: "bg-indigo-100 text-indigo-700",
  issues: "bg-red-100 text-red-700",
  risks: "bg-orange-100 text-orange-700",
  dependencies: "bg-purple-100 text-purple-700",
  assumptions: "bg-yellow-100 text-yellow-700",
  stakeholders: "bg-green-100 text-green-700",
  deliverables: "bg-teal-100 text-teal-700",
  knowledgeBase: "bg-gray-100 text-gray-700",
};

const MODULE_LABELS: Record<string, string> = {
  requirements: "Requirement",
  tasks: "Task",
  issues: "Issue",
  risks: "Risk",
  dependencies: "Dependency",
  assumptions: "Assumption",
  stakeholders: "Stakeholder",
  deliverables: "Deliverable",
  knowledgeBase: "Knowledge Base",
};

interface SearchResult {
  id: number;
  module: string;
  code: string;
  title: string;
  status?: string;
  path: string;
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { currentProjectId } = useProject();
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setQuery("");
      setDebouncedQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const enabled = !!currentProjectId && debouncedQuery.length >= 2;

  const { data: results = [], isFetching } = trpc.search.global.useQuery(
    { projectId: currentProjectId!, query: debouncedQuery },
    { enabled }
  );

  // Group results by module
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.module]) acc[r.module] = [];
    acc[r.module].push(r);
    return acc;
  }, {});

  // Flat list for keyboard navigation
  const flatResults = results;

  // Reset active index when results change
  useEffect(() => setActiveIndex(0), [results.length]);

  function handleSelect(result: SearchResult) {
    navigate(result.path);
    onClose();
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const selected = flatResults[activeIndex];
        if (selected) handleSelect(selected);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [flatResults, activeIndex]
  );

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const showResults = debouncedQuery.length >= 2;
  const showEmpty = showResults && !isFetching && results.length === 0;

  let flatIdx = 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden" aria-describedby={undefined}>
        {/* Search input */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search requirements, tasks, issues, risks..."
            className="border-0 shadow-none focus-visible:ring-0 h-8 p-0 text-base"
          />
          {isFetching && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          <kbd className="shrink-0 text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {/* Results area */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {!showResults && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search...
            </div>
          )}

          {showEmpty && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No results found for "{debouncedQuery}"
            </div>
          )}

          {showResults && !showEmpty && Object.entries(grouped).map(([module, items]) => (
            <div key={module}>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-gray-50 border-b border-gray-100">
                {MODULE_LABELS[module] ?? module}
              </div>
              {items.map((result) => {
                const idx = flatIdx++;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={`${module}-${result.id}`}
                    data-idx={idx}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-gray-50 transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <Badge className={`text-xs shrink-0 ${MODULE_COLORS[module] ?? "bg-gray-100 text-gray-700"}`}>
                      {result.code}
                    </Badge>
                    <span className="flex-1 text-sm truncate">{result.title}</span>
                    {result.status && (
                      <Badge variant="outline" className="text-xs shrink-0">{result.status}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground shrink-0">{MODULE_LABELS[module]}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-gray-100 flex items-center gap-4 text-xs text-muted-foreground bg-gray-50">
          <span><kbd className="bg-gray-200 px-1 py-0.5 rounded mr-1">↑↓</kbd>navigate</span>
          <span><kbd className="bg-gray-200 px-1 py-0.5 rounded mr-1">↵</kbd>open</span>
          <span><kbd className="bg-gray-200 px-1 py-0.5 rounded mr-1">ESC</kbd>close</span>
          {showResults && results.length > 0 && (
            <span className="ml-auto">{results.length} result{results.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useSearchShortcut() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
