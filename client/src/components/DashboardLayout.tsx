import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  BookMarked,
  FolderOpen,
  Scroll,
  LayoutGrid,
  Zap,
  Flame,
  Target,
  Clock,
  Ticket,
  Network,
  Radio,
  UserCog,
  Gauge,
  FolderTree,
  GripVertical,
  MoreHorizontal,
  Pencil,
  ChevronRight,
  RotateCcw,
  EyeOff,
  Eye,
  FolderPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Bug,
  ClipboardList,
  Puzzle,
  ListChecks,
  FolderKanban,
  Headset,
  IterationCw,
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
import { NotificationBell } from "./NotificationBell";
import { Search } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
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
      { icon: TrendingUp, label: "EVM Dashboard", path: "/evm" },
      { icon: Puzzle, label: "Features", path: "/features" },
      { icon: ClipboardList, label: "PM Plan", path: "/pm-plan" },
      { icon: Radio, label: "Communication Plan", path: "/communication-plan" },
      { icon: Network, label: "RBS & Resources", path: "/resources" },
      { icon: Users, label: "Stakeholder Management", path: "/stakeholder-management" },
    ],
  },
  {
    label: "EXECUTION",
    items: [
      { icon: CheckSquare, label: "Tasks", path: "/tasks" },
      { icon: AlertCircle, label: "Issues", path: "/issues" },
      { icon: GitPullRequest, label: "Change Requests", path: "/change-requests" },
      { icon: MessageSquare, label: "Meetings & Decisions", path: "/meetings" },
      { icon: ListChecks, label: "Action Items", path: "/action-items" },
      { icon: Clock, label: "Time Tracking", path: "/time-tracking" },
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
      { icon: ClipboardList, label: "Test Plans", path: "/test-plans" },
      { icon: Bug, label: "Defects", path: "/defects" },
      { icon: Layers, label: "Traceability Matrix", path: "/traceability" },
      { icon: Crosshair, label: "Scope Coverage", path: "/scope-coverage" },
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

const SIDEBAR_WIDTH_KEY      = "sidebar-width";
const SECTION_ORDERS_KEY     = "sidebar-section-orders";
const SECTION_NAMES_KEY      = "sidebar-section-names";
const HIDDEN_SECTIONS_KEY    = "sidebar-hidden-sections";
const MOVED_ITEMS_KEY        = "sidebar-moved-items";
const CUSTOM_SECTIONS_KEY      = "sidebar-custom-sections";
const COLLAPSED_SECTIONS_KEY   = "sidebar-collapsed-sections";
const SECTION_ORDER_LIST_KEY   = "sidebar-section-order-list";
const MAX_CUSTOM_SECTIONS      = 3;
// ─── App Mode Switcher ───────────────────────────────────────────────────────
type AppMode = "project" | "operations" | "agile";
const APP_MODE_KEY = "pm-ssot-app-mode";
const APP_MODES: Array<{ key: AppMode; label: string; Icon: React.ElementType; accent: string }> = [
  { key: "project",    label: "Project",    Icon: FolderKanban, accent: "#3b82f6" },
  { key: "operations", label: "Operations", Icon: Headset,      accent: "#10b981" },
  { key: "agile",      label: "Agile",      Icon: IterationCw,  accent: "#8b5cf6" },
];
const OPS_SECTIONS: SidebarSection[] = [
  {
    label: "SERVICE DESK",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",     path: "/operations" },
      { icon: Ticket,          label: "SLA Tickets",   path: "/sla-tickets" },
      { icon: Flame,           label: "Escalations",   path: "/escalations" },
      { icon: BookOpen,        label: "Knowledge Base", path: "/knowledge-base" },
    ],
  },
];
const AGILE_SECTIONS: SidebarSection[] = [
  {
    label: "AGILE / SCRUM",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",  path: "/agile" },
      { icon: ListChecks,      label: "Backlog",    path: "/user-stories" },
      { icon: Zap,             label: "Sprints",    path: "/sprints" },
      { icon: LayoutGrid,      label: "Board",      path: "/sprints?tab=board" },
      { icon: TrendingUp,      label: "Burndown",   path: "/sprints?tab=burndown" },
    ],
  },
];
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_PREFIX = "__section__:";
const EMPTY_PREFIX   = "__empty__:";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH     = 200;
const MAX_WIDTH     = 480;

type CustomSectionDef = { id: string; label: string };

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
  isDraggingActive,
}: {
  item: SidebarItem;
  isActive: boolean;
  badgeCount?: number;
  onNavigate: (path: string) => void;
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
      {/* Expanded layout: drag handle + menu button */}
      <div className={`group-data-[collapsible=icon]:hidden flex items-center group/item w-full rounded-md transition-all duration-150 ${
        isDragging ? "shadow-lg ring-2 ring-primary/40 bg-background" : ""
      }`}>
        {/* Drag handle — always visible at low opacity, full on hover */}
        <span
          {...attributes}
          {...listeners}
          title="Drag to reorder or move to another section"
          className={`flex items-center justify-center w-7 h-9 shrink-0 cursor-grab active:cursor-grabbing transition-all duration-150 select-none rounded ${
            isDragging
              ? "text-primary bg-primary/10"
              : isDraggingActive
              ? "text-muted-foreground/50 group-hover/item:text-muted-foreground"
              : "text-muted-foreground/35 hover:text-muted-foreground hover:bg-accent"
          }`}
        >
          <GripVertical className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <SidebarMenuButton
            isActive={isActive}
            onClick={() => onNavigate(item.path)}
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
      </div>
      {/* Collapsed icon-only layout: centered icon with tooltip */}
      <div className="hidden group-data-[collapsible=icon]:flex justify-center">
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => onNavigate(item.path)}
          tooltip={item.label}
          className="h-8 w-8 p-0 flex items-center justify-center transition-all"
        >
          <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
        </SidebarMenuButton>
      </div>
    </SidebarMenuItem>
  );
}

// ─── Sortable section wrapper ─────────────────────────────────────────────────
function SortableSection({
  sectionId,
  children,
}: {
  sectionId: string;
  children: (handle: { attributes: Record<string, unknown>; listeners: Record<string, unknown> | undefined }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${SECTION_PREFIX}${sectionId}`,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes: attributes as unknown as Record<string, unknown>, listeners: listeners as unknown as Record<string, unknown> | undefined })}
    </div>
  );
}

// ─── Empty section drop zone ───────────────────────────────────────────────────
function EmptyDropZone({ sectionLabel }: { sectionLabel: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${EMPTY_PREFIX}${sectionLabel}` });
  return (
    <div
      ref={setNodeRef}
      className={`mx-1 my-1 h-8 rounded-md border-2 border-dashed flex items-center justify-center text-[10px] select-none transition-colors ${
        isOver
          ? "border-primary/50 text-primary/60 bg-primary/5"
          : "border-muted-foreground/15 text-muted-foreground/25"
      }`}
    >
      Drop tiles here
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

  // ─── App Mode state ──────────────────────────────────────────────────────
  const [appMode, setAppMode] = useState<AppMode>(() => {
    const saved = localStorage.getItem(APP_MODE_KEY);
    if (saved === "project" || saved === "operations" || saved === "agile") return saved;
    return "project";
  });
  function switchMode(mode: AppMode) {
    setAppMode(mode);
    localStorage.setItem(APP_MODE_KEY, mode);
  }
  // Auto-detect mode from current route
  useEffect(() => {
    if (location.startsWith("/operations") || location.startsWith("/sla-tickets") || location.startsWith("/escalations")) {
      if (appMode !== "operations") switchMode("operations");
    } else if (location.startsWith("/agile") || location.startsWith("/sprints") || location.startsWith("/user-stories")) {
      if (appMode !== "agile") switchMode("agile");
    }
    // Note: we don't auto-switch back to project to avoid jarring UX
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
  const activeMode = APP_MODES.find(m => m.key === appMode)!;

  // ─── Section customisation state ────────────────────────────────────────
  const [sectionOrders, setSectionOrders] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_ORDERS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [sectionNames, setSectionNames] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_NAMES_KEY) ?? "{}"); } catch { return {}; }
  });
  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_SECTIONS_KEY) ?? "[]"); } catch { return []; }
  });
  // movedItems: path → sectionLabel — tracks items dragged to a different section
  const [movedItems, setMovedItems] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(MOVED_ITEMS_KEY) ?? "{}"); } catch { return {}; }
  });
  // Custom user-created sections (max 3)
  const [customSections, setCustomSections] = useState<CustomSectionDef[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_SECTIONS_KEY) ?? "[]"); } catch { return []; }
  });
  // Collapsed sections (by section label/id)
  const [collapsedSections, setCollapsedSections] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(COLLAPSED_SECTIONS_KEY) ?? "[]"); } catch { return []; }
  });
  const [sectionOrderList, setSectionOrderList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(SECTION_ORDER_LIST_KEY) ?? "[]"); } catch { return []; }
  });
  const [renamingSection, setRenamingSection] = useState<string | null>(null);
  const [sectionRenameValue, setSectionRenameValue] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overSectionLabel, setOverSectionLabel] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(SECTION_ORDERS_KEY, JSON.stringify(sectionOrders)); }, [sectionOrders]);
  useEffect(() => { localStorage.setItem(SECTION_NAMES_KEY, JSON.stringify(sectionNames)); }, [sectionNames]);
  useEffect(() => { localStorage.setItem(HIDDEN_SECTIONS_KEY, JSON.stringify(hiddenSections)); }, [hiddenSections]);
  useEffect(() => { localStorage.setItem(MOVED_ITEMS_KEY, JSON.stringify(movedItems)); }, [movedItems]);
  useEffect(() => { localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(customSections)); }, [customSections]);
  useEffect(() => { localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(collapsedSections)); }, [collapsedSections]);
  useEffect(() => { localStorage.setItem(SECTION_ORDER_LIST_KEY, JSON.stringify(sectionOrderList)); }, [sectionOrderList]);

  const { data: badgeCounts } = trpc.sidebarBadges.counts.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId, refetchInterval: 60_000 }
  );
  const currentProject = projects?.find(p => p.id === currentProjectId);

  // ── Stale project guard: if the stored project ID no longer exists, clear it ──
  useEffect(() => {
    if (projects && projects.length >= 0 && currentProjectId !== null) {
      const exists = projects.some((p: any) => p.id === currentProjectId);
      if (!exists) {
        setCurrentProjectId(null);
      }
    }
  }, [projects, currentProjectId]);

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

  // ─── Sections with custom order + cross-section membership ──────────────
  const builtInSectionsWithOrder = SIDEBAR_SECTIONS
    .filter(section => !hiddenSections.includes(section.label))
    .map(section => {
      // Items originally in this section that haven't been moved elsewhere
      const originalItems = section.items.filter(item => {
        const movedTo = movedItems[item.path];
        return !movedTo || movedTo === section.label;
      });
      // Items moved from other sections into this one
      const migratedItems = SIDEBAR_SECTIONS
        .filter(s => s.label !== section.label)
        .flatMap(s => s.items)
        .filter(item => movedItems[item.path] === section.label);
      const allItems = [...originalItems, ...migratedItems];

      const order = sectionOrders[section.label];
      const displayLabel = sectionNames[section.label] ?? section.label;
      if (!order) return { ...section, items: allItems, displayLabel, isCustom: false };

      const ordered = order
        .filter(p => allItems.some(i => i.path === p))
        .map(p => allItems.find(i => i.path === p)!)
        .filter(Boolean);
      const unordered = allItems.filter(i => !order.includes(i.path));
      return { ...section, items: [...ordered, ...unordered], displayLabel, isCustom: false };
    });

  // Custom sections: items are those with movedItems[path] === custom section id
  const customSectionsWithOrder = customSections
    .filter(cs => !hiddenSections.includes(cs.id))
    .map(cs => {
      const allItems = ALL_ITEMS.filter(item => movedItems[item.path] === cs.id);
      const order = sectionOrders[cs.id];
      const displayLabel = sectionNames[cs.id] ?? cs.label;
      if (!order) return { label: cs.id, items: allItems, displayLabel, isCustom: true };
      const ordered = order
        .filter(p => allItems.some(i => i.path === p))
        .map(p => allItems.find(i => i.path === p)!)
        .filter(Boolean);
      const unordered = allItems.filter(i => !order.includes(i.path));
      return { label: cs.id, items: [...ordered, ...unordered], displayLabel, isCustom: true };
    });

  const sectionsWithOrder = (() => {
    // When in Operations or Agile mode, show the mode-specific nav instead
    if (appMode === "operations") {
      return OPS_SECTIONS.map(s => ({ ...s, displayLabel: s.label, isCustom: false }));
    }
    if (appMode === "agile") {
      return AGILE_SECTIONS.map(s => ({ ...s, displayLabel: s.label, isCustom: false }));
    }
    // Default Project mode
    const all = [...builtInSectionsWithOrder, ...customSectionsWithOrder];
    if (!sectionOrderList.length) return all;
    const ordered = sectionOrderList
      .map(label => all.find(s => s.label === label))
      .filter((s): s is typeof all[0] => Boolean(s));
    const unordered = all.filter(s => !sectionOrderList.includes(s.label));
    return [...ordered, ...unordered];
  })();

  // Helper: add a new custom section
  const handleAddCustomSection = () => {
    if (customSections.length >= MAX_CUSTOM_SECTIONS) return;
    const num = customSections.length + 1;
    const id = `CUSTOM_SECTION_${Date.now()}`;
    const label = `Custom Section ${num}`;
    setCustomSections(prev => [...prev, { id, label }]);
    setSectionNames(prev => ({ ...prev, [id]: label }));
  };

  // Helper: delete a custom section (return its items to original sections)
  const handleDeleteCustomSection = (sectionId: string) => {
    setCustomSections(prev => prev.filter(cs => cs.id !== sectionId));
    setMovedItems(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(path => { if (next[path] === sectionId) delete next[path]; });
      return next;
    });
    setSectionNames(prev => { const n = { ...prev }; delete n[sectionId]; return n; });
    setSectionOrders(prev => { const n = { ...prev }; delete n[sectionId]; return n; });
    setHiddenSections(prev => prev.filter(s => s !== sectionId));
  };

  const activeMenuItem = ALL_ITEMS.find(item => item.path === location);
  const draggingItem = activeDragId ? findItem(activeDragId) : null;

  // ─── DnD ────────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(event.active.id as string);
    setOverSectionLabel(null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) { setOverSectionLabel(null); return; }
    const overId = String(over.id);
    if (overId.startsWith(SECTION_PREFIX)) {
      setOverSectionLabel(overId.slice(SECTION_PREFIX.length));
      return;
    }
    if (overId.startsWith(EMPTY_PREFIX)) {
      setOverSectionLabel(overId.slice(EMPTY_PREFIX.length));
      return;
    }
    const target = sectionsWithOrder.find(s => s.items.some(i => i.path === overId));
    setOverSectionLabel(target?.label ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    setOverSectionLabel(null);
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId   = over.id as string;

    // ── Section reordering ──────────────────────────────────────────────────
    if (activeId.startsWith(SECTION_PREFIX)) {
      if (overId.startsWith(SECTION_PREFIX)) {
        const activeSectionId = activeId.slice(SECTION_PREFIX.length);
        const overSectionId   = overId.slice(SECTION_PREFIX.length);
        const labels = sectionsWithOrder.map(s => s.label);
        const oldIdx = labels.indexOf(activeSectionId);
        const newIdx = labels.indexOf(overSectionId);
        if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
          setSectionOrderList(arrayMove(labels, oldIdx, newIdx));
        }
      }
      return;
    }

    // ── Item dropped onto empty drop zone ───────────────────────────────────
    if (overId.startsWith(EMPTY_PREFIX)) {
      const targetLabel = overId.slice(EMPTY_PREFIX.length);
      const sourceSection = sectionsWithOrder.find(s => s.items.some(i => i.path === activeId));
      if (!sourceSection || sourceSection.label === targetLabel) return;
      setMovedItems(prev => ({ ...prev, [activeId]: targetLabel }));
      const srcOrder = (sectionOrders[sourceSection.label] ?? sourceSection.items.map(i => i.path))
        .filter(p => p !== activeId);
      setSectionOrders(prev => ({
        ...prev,
        [sourceSection.label]: srcOrder,
        [targetLabel]: [activeId],
      }));
      return;
    }

    // ── Item dropped onto a section header → move to that section ───────────
    if (overId.startsWith(SECTION_PREFIX)) {
      const targetLabel = overId.slice(SECTION_PREFIX.length);
      const sourceSection = sectionsWithOrder.find(s => s.items.some(i => i.path === activeId));
      if (!sourceSection || sourceSection.label === targetLabel) return;
      setMovedItems(prev => ({ ...prev, [activeId]: targetLabel }));
      const srcOrder = (sectionOrders[sourceSection.label] ?? sourceSection.items.map(i => i.path))
        .filter(p => p !== activeId);
      const tgtSection = sectionsWithOrder.find(s => s.label === targetLabel);
      const tgtOrder = sectionOrders[targetLabel] ?? tgtSection?.items.map(i => i.path) ?? [];
      setSectionOrders(prev => ({
        ...prev,
        [sourceSection.label]: srcOrder,
        [targetLabel]: [...tgtOrder, activeId],
      }));
      return;
    }

    // ── Item reorder within / move between sections ──────────────────────────
    const sourceSection = sectionsWithOrder.find(s => s.items.some(i => i.path === activeId));
    const targetSection = sectionsWithOrder.find(s => s.items.some(i => i.path === overId));
    if (!sourceSection || !targetSection) return;

    if (sourceSection.label === targetSection.label) {
      // Reorder within same section
      const oldIndex = sourceSection.items.findIndex(i => i.path === activeId);
      const newIndex = sourceSection.items.findIndex(i => i.path === overId);
      if (oldIndex === newIndex) return;
      const newOrder = arrayMove(sourceSection.items.map(i => i.path), oldIndex, newIndex);
      setSectionOrders(prev => ({ ...prev, [sourceSection.label]: newOrder }));
    } else {
      // Move item to a different section
      setMovedItems(prev => ({ ...prev, [activeId]: targetSection.label }));
      const srcOrder = (sectionOrders[sourceSection.label] ?? sourceSection.items.map(i => i.path))
        .filter(p => p !== activeId);
      const tgtItems = targetSection.items.map(i => i.path).filter(p => p !== activeId);
      const tgtIdx = tgtItems.indexOf(overId);
      const newTgtOrder = tgtIdx >= 0
        ? [...tgtItems.slice(0, tgtIdx + 1), activeId, ...tgtItems.slice(tgtIdx + 1)]
        : [...tgtItems, activeId];
      setSectionOrders(prev => ({
        ...prev,
        [sourceSection.label]: srcOrder,
        [targetSection.label]: newTgtOrder,
      }));
    }
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

  // Derived: which section does the dragged item currently live in?
  const isDraggingSection = (activeDragId?.startsWith(SECTION_PREFIX)) ?? false;
  const draggingSourceLabel = (!isDraggingSection && activeDragId)
    ? sectionsWithOrder.find(s => s.items.some(i => i.path === activeDragId))?.label
    : null;
  const isCrossSectionDrag = !isDraggingSection && overSectionLabel && overSectionLabel !== draggingSourceLabel;
  const draggingSection = isDraggingSection && activeDragId
    ? sectionsWithOrder.find(s => s.label === activeDragId.slice(SECTION_PREFIX.length))
    : null;

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
              <div className="flex items-center gap-3 px-2 transition-all w-full overflow-hidden group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                <button
                  onClick={toggleSidebar}
                  className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  aria-label="Toggle navigation"
                >
                  <PanelLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                {/* Expanded state — hidden via CSS when sidebar is icon-collapsed */}
                <div className="flex items-center gap-2 min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  {(currentProject as any)?.logoUrl && (
                    <img src={(currentProject as any).logoUrl} alt="Project logo" className="h-6 w-6 object-contain rounded shrink-0" />
                  )}
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
              </div>
            </SidebarHeader>

            <SidebarContent className="gap-0 overflow-y-auto group-data-[collapsible=icon]:hidden">
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

              {/* App Mode Switcher */}
              <div className="px-2 py-2 group-data-[collapsible=icon]:hidden">
                <div
                  className="flex rounded-lg overflow-hidden border border-border/50"
                  style={{ borderColor: activeMode.accent + "55" }}
                >
                  {APP_MODES.map((mode) => {
                    const isActive = appMode === mode.key;
                    return (
                      <button
                        key={mode.key}
                        onClick={() => switchMode(mode.key)}
                        className="flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold tracking-wide transition-all"
                        style={isActive
                          ? { background: mode.accent + "22", color: mode.accent, borderBottom: `2px solid ${mode.accent}` }
                          : { color: "var(--muted-foreground)", borderBottom: "2px solid transparent" }
                        }
                        title={mode.label}
                      >
                        <mode.Icon className="h-3.5 w-3.5" />
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Icon-collapsed mode: single icon showing active mode */}
              <div className="hidden group-data-[collapsible=icon]:flex justify-center px-2 py-2">
                <button
                  onClick={() => switchMode(appMode === "project" ? "operations" : appMode === "operations" ? "agile" : "project")}
                  title={`Mode: ${activeMode.label} (click to cycle)`}
                  className="h-8 w-8 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: activeMode.accent, background: activeMode.accent + "22" }}
                >
                  <activeMode.Icon className="h-4 w-4" />
                </button>
              </div>

              {/* Drag mode hint banner */}
              {activeDragId && !isCollapsed && (
                <div className={`mx-2 mb-1 px-3 py-1.5 rounded-md flex items-center gap-2 group-data-[collapsible=icon]:hidden transition-colors ${
                  isCrossSectionDrag
                    ? "bg-primary/15 border border-primary/30"
                    : "bg-primary/10 border border-primary/20"
                }`}>
                  <GripVertical className="h-3 w-3 text-primary/60 shrink-0" />
                  <span className="text-[10px] text-primary/70 font-medium">
                    {isDraggingSection
                      ? "Drag to reorder sections"
                      : isCrossSectionDrag
                      ? `Move to ${sectionNames[overSectionLabel!] ?? overSectionLabel}`
                      : "Drag to reorder or move to another section"}
                  </span>
                </div>
              )}

              {/* PMP Sections */}
              <SortableContext items={sectionsWithOrder.map(s => `${SECTION_PREFIX}${s.label}`)} strategy={verticalListSortingStrategy}>
              {sectionsWithOrder.map((section) => {
                const isSectionCollapsed = collapsedSections.includes(section.label);
                const toggleCollapse = () => setCollapsedSections(prev =>
                  prev.includes(section.label)
                    ? prev.filter(s => s !== section.label)
                    : [...prev, section.label]
                );
                return (
                <SortableSection key={section.label} sectionId={section.label}>
                {({ attributes: sectionDragAttrs, listeners: sectionDragListeners }) => (
                <div className="group/section">
                  <div className="px-3 pt-3 pb-0.5 group-data-[collapsible=icon]:hidden flex items-center gap-1 group/sectionhdr">
                    {/* Section reorder drag handle — always visible at low opacity */}
                    <span
                      {...(sectionDragAttrs as React.HTMLAttributes<HTMLSpanElement>)}
                      {...(sectionDragListeners as React.HTMLAttributes<HTMLSpanElement>)}
                      title="Drag to reorder section"
                      className="opacity-40 group-hover/sectionhdr:opacity-100 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-all shrink-0 select-none flex items-center px-0.5 py-1 rounded hover:bg-accent"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
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
                      <button
                        className="flex-1 min-w-0 flex items-center gap-1 group/collapsetoggle text-left"
                        onClick={toggleCollapse}
                        title={isSectionCollapsed ? "Expand section" : "Collapse section"}
                      >
                        <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none truncate">
                          {section.displayLabel}
                          {!section.isCustom && sectionNames[section.label] && (
                            <span className="ml-1 normal-case font-normal text-muted-foreground/30 not-uppercase tracking-normal">
                              ({section.label})
                            </span>
                          )}
                        </span>
                        {isSectionCollapsed
                          ? <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover/collapsetoggle:text-muted-foreground shrink-0 transition-colors" />
                          : <ChevronDown className="h-3 w-3 text-muted-foreground/20 group-hover/collapsetoggle:text-muted-foreground/50 shrink-0 transition-colors" />
                        }
                      </button>
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
                        {!section.isCustom && sectionNames[section.label] && (
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => setSectionNames(prev => { const n = { ...prev }; delete n[section.label]; return n; })}
                          >
                            <RotateCcw className="mr-2 h-3 w-3" /> Revert to standard
                          </DropdownMenuItem>
                        )}
                        {section.items.some(i => movedItems[i.path] === section.label) && (
                          <DropdownMenuItem
                            className="text-xs"
                            onClick={() => {
                              // Return all migrated items to their original homes
                              setMovedItems(prev => {
                                const next = { ...prev };
                                section.items.forEach(i => {
                                  const orig = SIDEBAR_SECTIONS.find(s => s.items.some(si => si.path === i.path));
                                  if (orig && orig.label !== section.label) delete next[i.path];
                                });
                                return next;
                              });
                            }}
                          >
                            <ChevronRight className="mr-2 h-3 w-3" /> Return moved items
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {section.isCustom ? (
                          <DropdownMenuItem
                            className="text-xs text-destructive focus:text-destructive"
                            onClick={() => handleDeleteCustomSection(section.label)}
                          >
                            <Trash2 className="mr-2 h-3 w-3" /> Delete section
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="text-xs text-destructive focus:text-destructive"
                            onClick={() => setHiddenSections(prev => [...prev, section.label])}
                          >
                            <EyeOff className="mr-2 h-3 w-3" /> Hide section
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {!isSectionCollapsed && (
                    <>
                      {/* Section drop highlight when dragging cross-section */}
                      {activeDragId && isCrossSectionDrag && overSectionLabel === section.label && (
                        <div className="mx-3 mb-1 h-0.5 rounded-full bg-primary/40 group-data-[collapsible=icon]:hidden" />
                      )}

                      {section.items.length === 0 ? (
                        /* Empty section: show a drop zone so tiles can be dragged in */
                        <SidebarMenu className="px-2 pb-1">
                          <EmptyDropZone sectionLabel={section.label} />
                        </SidebarMenu>
                      ) : (
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
                                isDraggingActive={!!activeDragId}
                              />
                            ))}
                          </SidebarMenu>
                        </SortableContext>
                      )}
                    </>
                  )}
                  <div className="mx-4 border-t border-border/30 group-data-[collapsible=icon]:hidden" />
                </div>
                )}
                </SortableSection>
                );
              })}
              </SortableContext>

              {/* Add new custom section button */}
              {!isCollapsed && customSections.length < MAX_CUSTOM_SECTIONS && (
                <div className="px-3 py-1 group-data-[collapsible=icon]:hidden">
                  <button
                    onClick={handleAddCustomSection}
                    className="w-full flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-colors border border-dashed border-muted-foreground/20 hover:border-primary/30"
                    title={`Add custom section (${customSections.length}/${MAX_CUSTOM_SECTIONS} used)`}
                  >
                    <FolderPlus className="h-3 w-3" />
                    <span>Add section ({MAX_CUSTOM_SECTIONS - customSections.length} remaining)</span>
                  </button>
                </div>
              )}

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
                      className="hidden" id="sidebar-file-upload"
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
              {/* Collapsed: Settings button only */}
              <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-1 border-t pt-2">
                <button
                  onClick={() => setLocation("/settings")}
                  title="Settings"
                  className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <SettingsIcon className="h-4 w-4" />
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
          {draggingSection ? (
            <div className="flex items-center gap-2 rounded-lg px-3 h-7 bg-background border-2 border-primary/40 shadow-xl text-[10px] font-semibold uppercase tracking-wider text-primary cursor-grabbing select-none" style={{ minWidth: 140 }}>
              <GripVertical className="h-3 w-3 shrink-0" />
              <span className="flex-1 truncate">{draggingSection.displayLabel}</span>
            </div>
          ) : draggingItem ? (
            <div className="flex items-center gap-2 rounded-lg px-3 h-9 bg-background border-2 border-primary/40 shadow-xl text-sm font-medium cursor-grabbing select-none" style={{ minWidth: 160 }}>
              <draggingItem.icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 truncate">{draggingItem.label}</span>
              {isCrossSectionDrag && overSectionLabel && (
                <span className="text-[10px] text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                  → {sectionNames[overSectionLabel] ?? overSectionLabel}
                </span>
              )}
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
