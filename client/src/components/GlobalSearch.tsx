import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, CheckSquare, AlertTriangle, AlertCircle, BookOpen, Link2, Shield } from "lucide-react";
import { useLocation } from "wouter";

const ENTITY_ICONS: Record<string, any> = {
  requirement: FileText,
  task: CheckSquare,
  issue: AlertCircle,
  risk: Shield,
  knowledgeBase: BookOpen,
  assumption: AlertTriangle,
  dependency: Link2,
};

const ENTITY_COLORS: Record<string, string> = {
  requirement: "bg-blue-100 text-blue-800",
  task: "bg-green-100 text-green-800",
  issue: "bg-red-100 text-red-800",
  risk: "bg-orange-100 text-orange-800",
  knowledgeBase: "bg-purple-100 text-purple-800",
  assumption: "bg-yellow-100 text-yellow-800",
  dependency: "bg-gray-100 text-gray-800",
};

const ENTITY_ROUTES: Record<string, string> = {
  requirement: "/requirements",
  task: "/tasks",
  issue: "/issues",
  risk: "/risk-register",
  knowledgeBase: "/knowledge-base",
  assumption: "/assumptions",
  dependency: "/dependencies",
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { currentProjectId } = useProject();
  const [, setLocation] = useLocation();

  const { data: results } = trpc.search.global.useQuery(
    { projectId: currentProjectId!, query, limitPerType: 5 },
    { enabled: !!currentProjectId && query.length >= 2 }
  );

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = useCallback((result: any) => {
    const route = ENTITY_ROUTES[result.entityType];
    if (route) {
      setLocation(route);
    }
    setOpen(false);
  }, [setLocation]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  // Group results by entity type
  const grouped = results?.reduce((acc, r) => {
    if (!acc[r.entityType]) acc[r.entityType] = [];
    acc[r.entityType].push(r);
    return acc;
  }, {} as Record<string, typeof results>) || {};

  let flatIndex = -1;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-200 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="hidden sm:inline-flex ml-auto items-center gap-0.5 rounded border bg-white px-1.5 text-[10px] font-medium text-gray-400">
          <span className="text-xs">{navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'}</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 max-w-lg gap-0 overflow-hidden">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 text-gray-400 mr-2" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder="Search requirements, tasks, issues, risks..."
              className="border-0 focus-visible:ring-0 h-12 text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto">
            {query.length < 2 ? (
              <p className="text-sm text-gray-500 text-center py-8">Type at least 2 characters to search</p>
            ) : !results || results.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No results found</p>
            ) : (
              Object.entries(grouped).map(([type, items]) => {
                const Icon = ENTITY_ICONS[type] || FileText;
                return (
                  <div key={type}>
                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 capitalize">
                      {type === 'knowledgeBase' ? 'Knowledge Base' : type + 's'}
                    </div>
                    {items!.map((r) => {
                      flatIndex++;
                      const idx = flatIndex;
                      return (
                        <button
                          key={`${r.entityType}-${r.entityId}`}
                          className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 ${selectedIndex === idx ? 'bg-gray-100' : ''}`}
                          onClick={() => handleSelect(r)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${ENTITY_COLORS[type] || ''}`}>
                                {r.idCode}
                              </Badge>
                              <span className="text-sm text-gray-900 truncate">{r.title}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t px-3 py-2 flex items-center gap-3 text-xs text-gray-400">
            <span><kbd className="px-1 py-0.5 rounded border bg-gray-50">↑↓</kbd> Navigate</span>
            <span><kbd className="px-1 py-0.5 rounded border bg-gray-50">Enter</kbd> Select</span>
            <span><kbd className="px-1 py-0.5 rounded border bg-gray-50">Esc</kbd> Close</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
