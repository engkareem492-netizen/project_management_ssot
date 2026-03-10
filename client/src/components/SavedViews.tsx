/**
 * SavedViews — reusable filter-preset component.
 *
 * Usage:
 *   const [filters, setFilters] = useState<TaskFilters>({ status: "all", ... });
 *   <SavedViews storageKey="tasks-views" currentFilters={filters} onApply={setFilters} />
 *
 * Presets are stored in localStorage under `storageKey`.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookmarkPlus, ChevronDown, Trash2, Check, Bookmark } from "lucide-react";
import { toast } from "sonner";

export type SavedView<T> = {
  id: string;
  name: string;
  filters: T;
  createdAt: number;
};

interface SavedViewsProps<T extends object> {
  storageKey: string;
  currentFilters: T;
  onApply: (filters: T) => void;
  /** Optional label describing what "active" means, e.g. "Overdue Tasks" */
  activeViewName?: string;
}

export function SavedViews<T extends object>({
  storageKey,
  currentFilters,
  onApply,
  activeViewName,
}: SavedViewsProps<T>) {
  const [views, setViews] = useState<SavedView<T>[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState("");

  function persist(updated: SavedView<T>[]) {
    setViews(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function handleSave() {
    if (!saveName.trim()) return toast.error("Please enter a view name");
    const newView: SavedView<T> = {
      id: crypto.randomUUID(),
      name: saveName.trim(),
      filters: { ...currentFilters },
      createdAt: Date.now(),
    };
    persist([...views, newView]);
    setActiveViewId(newView.id);
    setSaveName("");
    setShowSaveDialog(false);
    toast.success(`View "${newView.name}" saved`);
  }

  function handleApply(view: SavedView<T>) {
    onApply(view.filters);
    setActiveViewId(view.id);
  }

  function handleDelete(id: string) {
    const updated = views.filter(v => v.id !== id);
    persist(updated);
    if (activeViewId === id) setActiveViewId(null);
    toast.success("View deleted");
  }

  const activeView = views.find(v => v.id === activeViewId);

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Active view badge */}
        {activeView && (
          <Badge variant="secondary" className="gap-1 text-xs font-normal px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200">
            <Bookmark className="w-3 h-3" />
            {activeView.name}
          </Badge>
        )}
        {activeViewName && !activeView && (
          <Badge variant="secondary" className="text-xs font-normal px-2 py-0.5">
            {activeViewName}
          </Badge>
        )}

        {/* Saved views dropdown */}
        {views.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs px-2">
                <Bookmark className="w-3.5 h-3.5" />
                Views
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Saved Views</div>
              <DropdownMenuSeparator />
              {views.map(view => (
                <DropdownMenuItem
                  key={view.id}
                  className="flex items-center justify-between group pr-1"
                  onSelect={() => handleApply(view)}
                >
                  <span className="flex items-center gap-2 truncate">
                    {activeViewId === view.id && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    <span className="truncate">{view.name}</span>
                  </span>
                  <button
                    className="ml-2 p-0.5 rounded hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); handleDelete(view.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setShowSaveDialog(true)}>
                <BookmarkPlus className="w-3.5 h-3.5 mr-2" />
                Save current view…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Save button when no views exist yet */}
        {views.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 text-xs px-2"
            onClick={() => setShowSaveDialog(true)}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Save view
          </Button>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSave()}
              placeholder="e.g. My Open Tasks, High Priority Issues…"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save View</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
