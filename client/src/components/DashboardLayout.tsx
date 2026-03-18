import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  LogOut,
  PanelLeft,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  Link2,
  Package,
  FileCheck,
  Settings as SettingsIcon,
  Calendar,
  Upload,
  Download,
  Database,
  Palette,
  BookOpen,
  AlertTriangle,
  GitPullRequest,
  MessageSquare,
  FlaskConical,
  BarChart2,
  Layers,
  FileBarChart,
  DollarSign,
  CalendarRange,
  Crosshair,
  Flag,
  ShieldAlert,
  ListChecks,
  BookMarked,
  FolderOpen,
  Scroll,
  LayoutGrid,
  Zap,
  Target,
  Clock,
  Ticket,
  Network,
  Radio,
  UserCog,
  Gauge,
  FolderTree,
  Folder,
  FolderPlus,
  GripVertical,
  MoreHorizontal,
  Trash2,
  Pencil,
  X,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  EyeOff,
  Eye,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { ThemeSelector } from "./ThemeSelector";
import { GlobalSearch } from "./GlobalSearch";
import { Search } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SidebarItem = { icon: React.ElementType; label: string; path: string };
type SidebarSection = { label: string; color?: string; items: SidebarItem[] };
type CustomFolder = { id: string; name: string; paths: string[]; collapsed: boolean };

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: LayoutGrid, label: "Portfolio", path: "/portfolio" },
      { icon: Target, label: "Goals & OKRs", path: "/goals" },
    ],
  },
  {
    label: "INITIATION",
    items: [
      { icon: Scroll, label: "Project Charter", path: "/charter" },
      { icon: UserCog, label: "Team Charter", path: "/team-charter" },
      { icon: Users, label: "Stakeholder Register", path: "/stakeholders" },
    ],
  },
  {
    label: "PLANNING",
    items: [
      { icon: FolderTree, label: "WBS", path: "/wbs" },
      { icon: Crosshair, label: "Scope Items", path: "/scope" },
      { icon: FileText, label: "Requirements", path: "/requirements" },
      { icon: Flag, label: "Milestones", path: "/milestones" },
      { icon: BarChart2, label: "Gantt Chart", path: "/gantt" },
      { icon: AlertTriangle, label: "Risk Register", path: "/risk-register" },
      { icon: DollarSign, label: "Budget", path: "/budget" },
      { icon: Radio, label: "Communication Plan", path: "/communication-plan" },
      { icon: Network, label: "RBS & Resources", path: "/resources" },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { icon: CheckSquare, label: "Tasks", path: "/tasks" },
      { icon: Zap, label: "Sprints", path: "/sprints" },
      { icon: AlertCircle, label: "Issues", path: "/issues" },
      { icon: GitPullRequest, label: "Change Requests", path: "/change-requests" },
      { icon: MessageSquare, label: "Meetings & Decisions", path: "/meetings" },
      { icon: ListChecks, label: "Action Items", path: "/action-items" },
      { icon: Clock, label: "Time Tracking", path: "/time-tracking" },
      { icon: Ticket, label: "SLA Tickets", path: "/sla-tickets" },
    ],
  },
  {
    label: "MONITORING & CONTROL",
    items: [
      { icon: Network, label: "Engagement Plan", path: "/engagement-plan" },
      { icon: ShieldAlert, label: "RAID Log", path: "/raid-log" },
      { icon: Package, label: "Deliverables", path: "/deliverables" },
      { icon: Link2, label: "Dependencies", path: "/dependencies" },
      { icon: FileCheck, label: "Assumptions", path: "/assumptions" },
      { icon: FlaskConical, label: "Test Cases", path: "/test-cases" },
      { icon: Layers, label: "Traceability Matrix", path: "/traceability" },
      { icon: FileBarChart, label: "Periodic Report", path: "/periodic-report" },
      { icon: CalendarRange, label: "Calendar", path: "/calendar" },
      { icon: Calendar, label: "Today", path: "/today" },
    ],
  },
  {
    label: "OPA",
    items: [
      { icon: FolderOpen, label: "Document Library", path: "/documents" },
      { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
      { icon: BookMarked, label: "Lessons Learned", path: "/lessons-learned" },
      { icon: Gauge, label: "EEF", path: "/eef" },
    ],
  },
  {
    label: "CONFIGURATION",
    items: [
      { icon: SettingsIcon, label: "Settings", path: "/settings" },
    ],
  },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const CUSTOM_FOLDERS_KEY = "sidebar-custom-folders";
const SECTION_ORDERS_KEY = "sidebar-section-orders";
const SECTION_NAMES_KEY = "sidebar-section-names";
const HIDDEN_SECTIONS_KEY = "sidebar-hidden-sections";
const DEFAULT_WIDTH = 280;

const FOLDER_COLORS = [
  { bg: "bg-amber-500/8",   border: "border-amber-500/25",  borderL: "border-l-amber-500",   icon: "text-amber-500",   badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  { bg: "bg-blue-500/8",    border: "border-blue-500/25",   borderL: "border-l-blue-500",    icon: "text-blue-500",    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  { bg: "bg-emerald-500/8", border: "border-emerald-500/25",borderL: "border-l-emerald-500", icon: "text-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { bg: "bg-violet-500/8",  border: "border-violet-500/25", borderL: "border-l-violet-500",  icon: "text-violet-500",  badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { bg: "bg-rose-500/8",    border: "border-rose-500/25",   borderL: "border-l-rose-500",    icon: "text-rose-500",    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
] as const;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

// All items flat lookup
const ALL_ITEMS: SidebarItem[] = SIDEBAR_SECTIONS.flatMap(s => s.items);
function findItem(path: string): SidebarItem | undefined {
  return ALL_ITEMS.find(i => i.path === path);
}

// ─── Sortable nav item ────────────────────────────────────────────────────────
function SortableNavItem({
  item,
  isActive,
  badgeCount,
  onNavigate,
  onAddToFolder,
  folders,
  onRemoveFromFolder,
  inFolderId,
  isDraggingActive,
}: {
  item: SidebarItem;
  isActive: boolean;
  badgeCount?: number;
  onNavigate: (path: string) => void;
  onAddToFolder: (path: string, folderId: string) => void;
  folders: CustomFolder[];
  onRemoveFromFolder?: (path: string, folderId: string) => void;
  inFolderId?: string;
  isDraggingActive?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <div className={`flex items-center group/item w-full rounded-md transition-all duration-150 ${
        isDragging ? "shadow-lg ring-2 ring-primary/40 bg-background" : ""
      }`}>
        {/* Drag handle — always visible at low opacity, prominent on hover/drag-active */}
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder or drop into a folder"
          className={`flex items-center justify-center w-5 h-8 shrink-0 cursor-grab active:cursor-grabbing transition-all duration-150 select-none ${
            isDragging
              ? "text-primary"
              : isDraggingActive
              ? "text-muted-foreground/60 group-hover/item:text-muted-foreground"
              : "text-muted-foreground/20 group-hover/item:text-muted-foreground/70"
          }`}
        >
          <GripVertical className="h-3 w-3" />
        </span>
        <div className="flex-1 min-w-0">
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => onNavigate(item.path)}
            tooltip={item.label}
            className="h-8 transition-all font-normal text-sm w-full"
          >
            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
            <span className="flex-1 truncate">{item.label}</span>
            {badgeCount != null && badgeCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground">
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </SidebarMenuButton>
        </div>
        {/* Context menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`items-center justify-center w-5 h-8 shrink-0 rounded hover:bg-accent transition-colors ${
              isDraggingActive
                ? "hidden"
                : "hidden group-hover/item:flex text-muted-foreground/40 hover:text-muted-foreground"
            }`}>
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {folders.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-xs">
                  <FolderPlus className="mr-2 h-3 w-3" /> Add to folder
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {folders.map(f => (
                    <DropdownMenuItem
                      key={f.id}
                      className="text-xs"
                      onClick={() => onAddToFolder(item.path, f.id)}
                    >
                      <Folder className="mr-2 h-3 w-3 text-amber-500" />{f.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            {inFolderId && onRemoveFromFolder && (
              <>
                {folders.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className="text-xs text-destructive focus:text-destructive"
                  onClick={() => onRemoveFromFolder(item.path, inFolderId)}
                >
                  <X className="mr-2 h-3 w-3" /> Remove from folder
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </SidebarMenuItem>
  );
}

// ─── Droppable custom folder ──────────────────────────────────────────────────
function DroppableFolder({
  folder,
  items,
  isActive: activeLocation,
  badgeCounts,
  onNavigate,
  onAddToFolder,
  allFolders,
  onRemoveFromFolder,
  onRenameFolder,
  onDeleteFolder,
  isCollapsed: sidebarCollapsed,
  isDraggingActive,
  colorIndex,
}: {
  folder: CustomFolder;
  items: SidebarItem[];
  isActive: string;
  badgeCounts: any;
  onNavigate: (path: string) => void;
  onAddToFolder: (path: string, folderId: string) => void;
  allFolders: CustomFolder[];
  onRemoveFromFolder: (path: string, folderId: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  isCollapsed: boolean;
  isDraggingActive: boolean;
  colorIndex?: number;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `folder-${folder.id}` });
  const [folderCollapsed, setFolderCollapsed] = useState(folder.collapsed);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);

  const colors = FOLDER_COLORS[(colorIndex ?? 0) % FOLDER_COLORS.length];

  // Auto-expand when user hovers over a collapsed folder during drag
  useEffect(() => {
    if (!isOver || !folderCollapsed) return;
    const t = setTimeout(() => setFolderCollapsed(false), 500);
    return () => clearTimeout(t);
  }, [isOver, folderCollapsed]);

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg mx-1 mb-2 border-l-2 border transition-all duration-200 overflow-hidden group-data-[collapsible=icon]:hidden ${
        isOver
          ? "bg-primary/8 border-primary/30 border-l-primary shadow-md"
          : isDraggingActive
          ? `${colors.bg} ${colors.border} ${colors.borderL} ring-1 ring-dashed ring-border/60`
          : `${colors.bg} ${colors.border} ${colors.borderL}`
      }`}
    >
      {/* Folder header */}
      <div className="px-2 pt-2 pb-1.5 group/folder">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFolderCollapsed(p => !p)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left rounded transition-colors py-0.5"
          >
            {isOver ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className={`h-4 w-4 shrink-0 transition-colors ${colors.icon}`} />
            )}
            {renaming ? (
              <form
                onSubmit={e => { e.preventDefault(); onRenameFolder(folder.id, renameValue.trim() || folder.name); setRenaming(false); }}
                className="flex-1 min-w-0"
                onClick={e => e.stopPropagation()}
              >
                <Input
                  className="h-5 text-xs px-1 py-0"
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  autoFocus
                  onBlur={() => { onRenameFolder(folder.id, renameValue.trim() || folder.name); setRenaming(false); }}
                />
              </form>
            ) : (
              <span className={`text-xs font-medium truncate flex-1 transition-colors ${
                isOver ? "text-primary" : "text-foreground/75"
              }`}>
                {folder.name}
              </span>
            )}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              {items.length > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  isOver ? "bg-primary/20 text-primary" : colors.badge
                }`}>
                  {items.length}
                </span>
              )}
              {folderCollapsed ? (
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground/40" />
              )}
            </div>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 group-hover/folder:opacity-100 h-6 w-6 flex items-center justify-center rounded hover:bg-accent/70 text-muted-foreground transition-all shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem className="text-xs" onClick={() => { setRenameValue(folder.name); setRenaming(true); }}>
                <Pencil className="mr-2 h-3 w-3" /> Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-xs text-destructive focus:text-destructive"
                onClick={() => onDeleteFolder(folder.id)}
              >
                <Trash2 className="mr-2 h-3 w-3" /> Delete folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Drop zone indicator */}
        {isDraggingActive && (
          <div className={`mt-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all duration-200 ${
            isOver
              ? "h-9 bg-primary/10 border-2 border-primary/40 border-dashed"
              : "h-7 bg-muted/20 border border-dashed border-border/40"
          }`}>
            {isOver ? (
              <>
                <FolderPlus className="h-3.5 w-3.5 text-primary/70" />
                <span className="text-[10px] text-primary font-semibold">Release to add to "{folder.name}"</span>
              </>
            ) : (
              <>
                <FolderPlus className="h-3 w-3 text-muted-foreground/25" />
                <span className="text-[9px] text-muted-foreground/40">Drop here</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Items */}
      {!folderCollapsed && !sidebarCollapsed && (
        <SortableContext items={items.map(i => i.path)} strategy={verticalListSortingStrategy}>
          <SidebarMenu className="px-2 pb-2">
            {items.map(item => (
              <SortableNavItem
                key={item.path}
                item={item}
                isActive={activeLocation === item.path}
                badgeCount={
                  item.path === "/tasks" ? badgeCounts?.tasks :
                  item.path === "/issues" ? badgeCounts?.issues :
                  item.path === "/dependencies" ? badgeCounts?.dependencies :
                  item.path === "/risk-register" ? badgeCounts?.risks :
                  undefined
                }
                onNavigate={onNavigate}
                onAddToFolder={onAddToFolder}
                folders={allFolders.filter(f => f.id !== folder.id)}
                onRemoveFromFolder={onRemoveFromFolder}
                inFolderId={folder.id}
                isDraggingActive={isDraggingActive}
              />
            ))}
          </SidebarMenu>
        </SortableContext>
      )}
      {!folderCollapsed && items.length === 0 && !sidebarCollapsed && !isDraggingActive && (
        <div className="mx-3 mb-3 rounded-md border border-dashed border-border/40 px-3 py-2.5 text-[10px] text-muted-foreground/40 text-center">
          Empty — drag items here
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [themeDialogOpen, setThemeDialogOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { data: projects } = trpc.projects.list.useQuery();

  // ─── Custom folder state ────────────────────────────────────────────────
  const [customFolders, setCustomFolders] = useState<CustomFolder[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_FOLDERS_KEY) ?? "[]"); } catch { return []; }
  });
  const [sectionOrders, setSectionOrders] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_ORDERS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [sectionNames, setSectionNames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_NAMES_KEY) ?? "{}"); } catch { return {}; }
  });
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_SECTIONS_KEY) ?? "[]"); } catch { return []; }
  });
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [sectionRenameValue, setSectionRenameValue] = useState("");
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Persist folders
  useEffect(() => {
    localStorage.setItem(CUSTOM_FOLDERS_KEY, JSON.stringify(customFolders));
  }, [customFolders]);
  // Persist section orders
  useEffect(() => {
    localStorage.setItem(SECTION_ORDERS_KEY, JSON.stringify(sectionOrders));
  }, [sectionOrders]);
  // Persist section names
  useEffect(() => {
    localStorage.setItem(SECTION_NAMES_KEY, JSON.stringify(sectionNames));
  }, [sectionNames]);
  // Persist hidden sections
  useEffect(() => {
    localStorage.setItem(HIDDEN_SECTIONS_KEY, JSON.stringify(hiddenSections));
  }, [hiddenSections]);

  const { data: badgeCounts } = trpc.sidebarBadges.counts.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId, refetchInterval: 60_000 }
  );
  const currentProject = projects?.find(p => p.id === currentProjectId);

  const importMutation = trpc.excel.import.useMutation({
    onSuccess: (data) => {
      setUploading(false);
      toast.success(`Import successful! Imported ${data.imported.requirements} requirements, ${data.imported.tasks} tasks, ${data.imported.issues} issues`);
      setLocation("/requirements");
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setUploading(false);
    },
  });

  const exportQuery = trpc.excel.export.useQuery(undefined, { enabled: false });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!currentProjectId) { toast.error('No project selected'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      importMutation.mutate({ projectId: currentProjectId, base64Data: base64Data.split(',')[1] });
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (result.data) {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.base64Data}`;
      link.download = result.data.filename;
      link.click();
      toast.success('Excel file exported successfully');
    }
  };

  const handleSwitchProject = () => { setCurrentProjectId(null); setLocation("/"); };

  // ─── Folder helpers ──────────────────────────────────────────────────────
  const folderPaths = customFolders.flatMap(f => f.paths);

  function addToFolder(path: string, folderId: string) {
    setCustomFolders(prev => prev.map(f =>
      f.id === folderId
        ? { ...f, paths: f.paths.includes(path) ? f.paths : [...f.paths, path] }
        : { ...f, paths: f.paths.filter(p => p !== path) } // remove from other folders
    ));
  }

  function removeFromFolder(path: string, folderId: string) {
    setCustomFolders(prev => prev.map(f =>
      f.id === folderId ? { ...f, paths: f.paths.filter(p => p !== path) } : f
    ));
  }

  function renameFolder(id: string, name: string) {
    setCustomFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
  }

  function deleteFolder(id: string) {
    setCustomFolders(prev => prev.filter(f => f.id !== id));
  }

  function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    const id = `folder-${Date.now()}`;
    setCustomFolders(prev => [...prev, { id, name, paths: [], collapsed: false }]);
    setNewFolderName("");
    setShowFolderDialog(false);
  }

  // ─── Sections with custom order (hidden sections excluded) ──────────────
  const sectionsWithOrder = SIDEBAR_SECTIONS
    .filter(section => !hiddenSections.includes(section.label))
    .map(section => {
      const filteredItems = section.items.filter(item => !folderPaths.includes(item.path));
      const order = sectionOrders[section.label];
      if (!order) return { ...section, items: filteredItems, displayLabel: sectionNames[section.label] ?? section.label };
      const ordered = order
        .filter(p => filteredItems.some(i => i.path === p))
        .map(p => filteredItems.find(i => i.path === p)!)
        .filter(Boolean);
      const unordered = filteredItems.filter(i => !order.includes(i.path));
      return { ...section, items: [...ordered, ...unordered], displayLabel: sectionNames[section.label] ?? section.label };
    });

  const activeMenuItem = ALL_ITEMS.find(item => item.path === location);
  const draggingItem = activeDragId ? findItem(activeDragId) : null;

  // ─── DnD ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setDragOverFolderId(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (over?.id && String(over.id).startsWith("folder-")) {
      setDragOverFolderId(String(over.id).replace("folder-", ""));
    } else {
      setDragOverFolderId(null);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    setDragOverFolderId(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Dropped directly on a folder droppable zone
    if (overId.startsWith("folder-")) {
      const folderId = overId.replace("folder-", "");
      addToFolder(activeId, folderId);
      return;
    }

    // Dropped on an item that lives inside a folder → move to that folder
    const targetFolder = customFolders.find(f => f.paths.includes(overId));
    const sourceFolder = customFolders.find(f => f.paths.includes(activeId));

    if (targetFolder && targetFolder.id !== sourceFolder?.id) {
      // Cross-folder or section→folder move
      addToFolder(activeId, targetFolder.id);
      return;
    }

    // Reorder within a custom folder
    if (sourceFolder && targetFolder && sourceFolder.id === targetFolder.id) {
      const oldIndex = sourceFolder.paths.indexOf(activeId);
      const newIndex = sourceFolder.paths.indexOf(overId);
      if (oldIndex === newIndex) return;
      const newPaths = arrayMove(sourceFolder.paths, oldIndex, newIndex);
      setCustomFolders(prev => prev.map(f =>
        f.id === sourceFolder.id ? { ...f, paths: newPaths } : f
      ));
      return;
    }

    // Reorder within a PMP section
    const section = sectionsWithOrder.find(s => s.items.some(i => i.path === activeId));
    if (!section) return;
    const inSameSection = section.items.some(i => i.path === overId);
    if (!inSameSection) return;

    const oldIndex = section.items.findIndex(i => i.path === activeId);
    const newIndex = section.items.findIndex(i => i.path === overId);
    if (oldIndex === newIndex) return;

    const newOrder = arrayMove(section.items.map(i => i.path), oldIndex, newIndex);
    setSectionOrders(prev => ({ ...prev, [section.label]: newOrder }));
  }

  // ─── Resize ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="relative" ref={sidebarRef}>
          <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
            <SidebarHeader className="h-16 justify-center">
              <div className="flex items-center gap-3 px-2 transition-all w-full">
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                {!isCollapsed ? (
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-semibold tracking-tight truncate">
                      {currentProject?.name || "Navigation"}
                    </span>
                    <button
                      onClick={handleSwitchProject}
                      className="ml-auto h-7 px-2 text-xs hover:bg-accent rounded transition-colors flex items-center gap-1 shrink-0"
                      title="Switch Project"
                    >
                      <Database className="h-3 w-3" />
                      Switch
                    </button>
                  </div>
                ) : null}
              </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 overflow-y-auto">
              {/* Global Search */}
              <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border border-border/50"
                >
                  <Search className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 text-left">Search...</span>
                  <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                  </kbd>
                </button>
              </div>
              <div className="hidden group-data-[collapsible=icon]:flex justify-center px-2 py-1">
                <button
                  onClick={() => setSearchOpen(true)}
                  title="Search (⌘K)"
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>

              {/* Drag mode hint banner */}
              {activeDragId && !isCollapsed && (
                <div className="mx-2 mb-1 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/20 flex items-center gap-2 group-data-[collapsible=icon]:hidden">
                  <GripVertical className="h-3 w-3 text-primary/60 shrink-0" />
                  <span className="text-[10px] text-primary/70 font-medium">
                    {customFolders.length > 0 ? "Drop on a folder below, or reorder within a section" : "Reorder within a section"}
                  </span>
                </div>
              )}

              {/* Custom Folders */}
              {customFolders.map((folder, idx) => {
                const folderItems = folder.paths.map(p => findItem(p)).filter(Boolean) as SidebarItem[];
                return (
                  <DroppableFolder
                    key={folder.id}
                    folder={folder}
                    items={folderItems}
                    isActive={location}
                    badgeCounts={badgeCounts}
                    onNavigate={setLocation}
                    onAddToFolder={addToFolder}
                    allFolders={customFolders}
                    onRemoveFromFolder={removeFromFolder}
                    onRenameFolder={renameFolder}
                    onDeleteFolder={deleteFolder}
                    isCollapsed={isCollapsed}
                    isDraggingActive={!!activeDragId}
                    colorIndex={idx}
                  />
                );
              })}

              {/* New Folder button */}
              {!isCollapsed && (
                <div className="px-3 py-1 group-data-[collapsible=icon]:hidden">
                  <button
                    onClick={() => setShowFolderDialog(true)}
                    className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-muted-foreground/50 hover:text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <FolderPlus className="h-3 w-3" />
                    <span>New folder</span>
                  </button>
                </div>
              )}

              {/* PMP Sections */}
              {sectionsWithOrder.map((section) => (
                <div key={section.label} className="group/section">
                  <div className="px-3 pt-3 pb-0.5 group-data-[collapsible=icon]:hidden flex items-center gap-1 group/sectionhdr">
                    {renamingSection === section.label ? (
                      <form
                        className="flex-1 min-w-0"
                        onSubmit={e => {
                          e.preventDefault();
                          const v = sectionRenameValue.trim();
                          if (v) setSectionNames(prev => ({ ...prev, [section.label]: v }));
                          else setSectionNames(prev => { const n = { ...prev }; delete n[section.label]; return n; });
                          setRenamingSection(null);
                        }}
                      >
                        <Input
                          className="h-5 text-[10px] px-1.5 py-0 uppercase font-semibold tracking-wider"
                          value={sectionRenameValue}
                          onChange={e => setSectionRenameValue(e.target.value)}
                          autoFocus
                          onBlur={() => {
                            const v = sectionRenameValue.trim();
                            if (v) setSectionNames(prev => ({ ...prev, [section.label]: v }));
                            else setSectionNames(prev => { const n = { ...prev }; delete n[section.label]; return n; });
                            setRenamingSection(null);
                          }}
                          onKeyDown={e => { if (e.key === "Escape") setRenamingSection(null); }}
                        />
                      </form>
                    ) : (
                      <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none truncate">
                        {section.displayLabel}
                        {sectionNames[section.label] && (
                          <span className="ml-1 normal-case font-normal text-muted-foreground/30 not-uppercase tracking-normal">
                            ({section.label})
                          </span>
                        )}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover/sectionhdr:opacity-100 h-5 w-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground/40 hover:text-muted-foreground transition-all shrink-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="text-xs"
                          onClick={() => { setSectionRenameValue(sectionNames[section.label] ?? section.label); setRenamingSection(section.label); }}
                        >
                          <Pencil className="mr-2 h-3 w-3" /> Rename
                        </DropdownMenuItem>
                        {sectionNames[section.label] && (
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => setSectionNames(prev => { const n = { ...prev }; delete n[section.label]; return n; })}
                          >
                            <RotateCcw className="mr-2 h-3 w-3" /> Revert to standard
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs text-destructive focus:text-destructive"
                          onClick={() => setHiddenSections(prev => [...prev, section.label])}
                        >
                          <EyeOff className="mr-2 h-3 w-3" /> Hide section
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <SortableContext items={section.items.map(i => i.path)} strategy={verticalListSortingStrategy}>
                    <SidebarMenu className="px-2 pb-1">
                      {section.items.map((item) => (
                        <SortableNavItem
                          key={item.path}
                          item={item}
                          isActive={location === item.path}
                          badgeCount={
                            item.path === "/tasks" ? badgeCounts?.tasks :
                            item.path === "/issues" ? badgeCounts?.issues :
                            item.path === "/dependencies" ? badgeCounts?.dependencies :
                            item.path === "/risk-register" ? badgeCounts?.risks :
                            undefined
                          }
                          onNavigate={setLocation}
                          onAddToFolder={addToFolder}
                          folders={customFolders}
                          isDraggingActive={!!activeDragId}
                        />
                      ))}
                    </SidebarMenu>
                  </SortableContext>
                  <div className="mx-4 border-t border-border/30 group-data-[collapsible=icon]:hidden" />
                </div>
              ))}

              {/* Restore hidden sections */}
              {hiddenSections.length > 0 && !isCollapsed && (
                <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
                  <button
                    onClick={() => setHiddenSections([])}
                    className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{hiddenSections.length} hidden section{hiddenSections.length > 1 ? "s" : ""} — restore all</span>
                  </button>
                </div>
              )}
            </SidebarContent>

            <SidebarFooter className="p-3 gap-2">
              <div className="border-t pt-2 group-data-[collapsible=icon]:hidden">
                <div className="flex gap-1 px-1">
                  <div className="flex-1">
                    <input
                      type="file" accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                      className="hidden" id="sidebar-file-upload" disabled={uploading}
                    />
                    <label
                      htmlFor="sidebar-file-upload"
                      className="cursor-pointer w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Upload className="h-3.5 w-3.5 shrink-0" />
                      <span>{uploading ? "Importing..." : "Import Excel"}</span>
                    </label>
                  </div>
                  <button
                    onClick={handleExport}
                    disabled={exportQuery.isLoading}
                    className="flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 shrink-0" />
                    <span>{exportQuery.isLoading ? "Exporting..." : "Export Excel"}</span>
                  </button>
                </div>
              </div>
              <div className="hidden group-data-[collapsible=icon]:flex flex-col gap-1 border-t pt-2">
                <label htmlFor="sidebar-file-upload-icon" title="Import Excel" className="cursor-pointer flex items-center justify-center h-8 w-8 mx-auto rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" id="sidebar-file-upload-icon" disabled={uploading} />
                  <Upload className="h-4 w-4" />
                </label>
                <button onClick={handleExport} disabled={exportQuery.isLoading} title="Export Excel" className="flex items-center justify-center h-8 w-8 mx-auto rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50">
                  <Download className="h-4 w-4" />
                </button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="h-9 w-9 border shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-1.5">{user?.email || "-"}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleSwitchProject} className="cursor-pointer">
                    <Database className="mr-2 h-4 w-4" /><span>Switch Project</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setThemeDialogOpen(true)} className="cursor-pointer">
                    <Palette className="mr-2 h-4 w-4" /><span>Theme</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /><span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
          <div
            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
            onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
            style={{ zIndex: 50 }}
          />
        </div>

        {/* Drag overlay */}
        <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
          {draggingItem ? (
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 bg-background border-2 border-primary/40 shadow-xl text-sm font-medium cursor-grabbing select-none" style={{ minWidth: 160 }}>
              <draggingItem.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate">{draggingItem.label}</span>
              {dragOverFolderId && (() => {
                const f = customFolders.find(f => f.id === dragOverFolderId);
                return f ? (
                  <span className="flex items-center gap-1 text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full">
                    <Folder className="h-2.5 w-2.5" />{f.name}
                  </span>
                ) : null;
              })()}
            </div>
          ) : null}
        </DragOverlay>

        <SidebarInset>
          {isMobile && (
            <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
                <span className="tracking-tight text-foreground">{activeMenuItem?.label ?? "Menu"}</span>
              </div>
              <div className="flex items-center gap-2"><ThemeSelector /></div>
            </div>
          )}
          <main className="flex-1 p-4">{children}</main>
        </SidebarInset>
      </DndContext>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* New Folder Dialog */}
      <Dialog open={showFolderDialog} onOpenChange={setShowFolderDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4" /> New Folder
            </DialogTitle>
            <DialogDescription>
              Create a custom folder to organise your navigation items.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Folder name"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createFolder(); }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowFolderDialog(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Settings Dialog */}
      <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Theme Settings</DialogTitle>
            <DialogDescription>Choose your preferred color theme for the application</DialogDescription>
          </DialogHeader>
          <div className="py-4"><ThemeSelector /></div>
        </DialogContent>
      </Dialog>
    </>
  );
}
