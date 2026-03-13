import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  History,
  Map,
  Package,
  FileCheck,
  Settings as SettingsIcon,
  Calendar,
  Upload,
  Download,
  FileSpreadsheet,
  ChevronRight,
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
  Sliders,
  Layers2,
  ClipboardList,
  RefreshCw,
  Bug,
  HelpCircle,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { ThemeSelector } from "./ThemeSelector";
import { GlobalSearch } from "./GlobalSearch";
import { NotificationBell } from "./NotificationBell";
import { Search } from "lucide-react";

type SubMenuItem = { icon: React.ElementType; label: string; path: string };
type MenuItem = { icon: React.ElementType; label: string; path: string; children?: SubMenuItem[] };

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  {
    icon: Scroll,
    label: "Planning",
    path: "__planning__",
    children: [
      { icon: Scroll, label: "Project Charter", path: "/charter" },
      { icon: ClipboardList, label: "PM Plan", path: "/pm-plan" },
      { icon: Layers2, label: "WBS Builder", path: "/wbs" },
      { icon: Crosshair, label: "Scope Items", path: "/scope" },
    ],
  },
  { icon: Flag, label: "Milestones", path: "/milestones" },
  {
    icon: CheckSquare,
    label: "Tasks",
    path: "__tasks__",
    children: [
      { icon: CheckSquare, label: "Task List", path: "/tasks" },
      { icon: Calendar, label: "Today", path: "/today" },
      { icon: BarChart2, label: "Gantt Chart", path: "/gantt" },
    ],
  },
  {
    icon: ShieldAlert,
    label: "RAID",
    path: "__raid__",
    children: [
      { icon: FileText, label: "Requirements", path: "/requirements" },
      { icon: AlertCircle, label: "Issues", path: "/issues" },
      { icon: FileCheck, label: "Assumptions", path: "/assumptions" },
      { icon: Link2, label: "Dependencies", path: "/dependencies" },
      { icon: ShieldAlert, label: "RAID Log", path: "/raid-log" },
    ],
  },
  {
    icon: Users,
    label: "Team",
    path: "__team__",
    children: [
      { icon: Users, label: "Stakeholders", path: "/stakeholders" },
      { icon: Map, label: "Engagement Map", path: "/relationships" },
      { icon: BarChart2, label: "Workload", path: "/resources" },
    ],
  },
  { icon: Package, label: "Deliverables", path: "/deliverables" },
  { icon: AlertTriangle, label: "Risk Register", path: "/risk-register" },
  { icon: GitPullRequest, label: "Change Requests", path: "/change-requests" },
  { icon: MessageSquare, label: "Meetings & Decisions", path: "/meetings" },
  { icon: CalendarRange, label: "Calendar", path: "/calendar" },
  {
    icon: DollarSign,
    label: "Budget",
    path: "__budget__",
    children: [
      { icon: DollarSign, label: "Budget Overview", path: "/budget" },
      { icon: BarChart2, label: "EVM Dashboard", path: "/evm" },
      { icon: RefreshCw, label: "Currency Settings", path: "/currency-settings" },
    ],
  },
  { icon: FlaskConical, label: "Test Cases", path: "/test-cases" },
  {
    icon: BookOpen,
    label: "Requirements Mgmt",
    path: "__reqmgmt__",
    children: [
      { icon: Layers, label: "Features", path: "/features" },
      { icon: BookOpen, label: "User Stories", path: "/user-stories" },
      { icon: ClipboardList, label: "Test Plans", path: "/test-plans" },
      { icon: Bug, label: "Defects", path: "/defects" },
      { icon: Layers, label: "Req Traceability", path: "/req-traceability" },
      { icon: HelpCircle, label: "Concept Guide", path: "/concept-guide" },
    ],
  },
  { icon: Layers, label: "Traceability Matrix", path: "/traceability" },
  {
    icon: FolderOpen,
    label: "OPA",
    path: "__opa__",
    children: [
      { icon: FolderOpen, label: "Document Library", path: "/documents" },
      { icon: BookOpen, label: "Knowledge Base", path: "/knowledge-base" },
      { icon: BookMarked, label: "Lessons Learned", path: "/lessons-learned" },
      { icon: Sliders, label: "EEF", path: "/eef" },
    ],
  },
  { icon: FileBarChart, label: "Periodic Report", path: "/periodic-report" },
  { icon: SettingsIcon, label: "Settings", path: "/settings" },
];

const SIDEBAR_ORDER_KEY = "sidebar-order";
const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

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
    return <DashboardLayoutSkeleton />
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
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
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
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
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
  const activeMenuItem = menuItems.find(item =>
    item.path === location || item.children?.some(c => c.path === location)
  );
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const [excelMenuOpen, setExcelMenuOpen] = useState(false);
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { data: projects } = trpc.projects.list.useQuery();

  // Sortable menu items
  const [orderedItems, setOrderedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_ORDER_KEY);
      if (saved) {
        const paths: string[] = JSON.parse(saved);
        const sorted = paths
          .map((p) => menuItems.find((m) => m.path === p))
          .filter(Boolean) as typeof menuItems;
        // Add any new items not in saved order
        const missing = menuItems.filter((m) => !paths.includes(m.path));
        return [...sorted, ...missing];
      }
    } catch {}
    return menuItems;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((i) => i.path === active.id);
        const newIndex = items.findIndex((i) => i.path === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        localStorage.setItem(SIDEBAR_ORDER_KEY, JSON.stringify(newOrder.map((i) => i.path)));
        return newOrder;
      });
    }
  };

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

  const exportQuery = trpc.excel.export.useQuery(undefined, {
    enabled: false,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const base64 = base64Data.split(',')[1];
      
      importMutation.mutate({ projectId: currentProjectId, base64Data: base64 });
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

  const handleSwitchProject = () => {
    setCurrentProjectId(null);
    setLocation("/");
  };

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
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
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
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

          <SidebarContent className="gap-0">
            {/* Global Search Button */}
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
            {/* Collapsed search icon */}
            <div className="hidden group-data-[collapsible=icon]:flex justify-center px-2 py-1">
              <button
                onClick={() => setSearchOpen(true)}
                title="Search (⌘K)"
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orderedItems.map((i) => i.path)}
                strategy={verticalListSortingStrategy}
              >
                <SidebarMenu className="px-2 py-1">
                  {orderedItems.map(item => {
                    const isActive = item.children
                      ? item.children.some(c => c.path === location)
                      : location === item.path;
                    const badgeCount =
                      item.path === "/tasks" ? badgeCounts?.tasks :
                      item.path === "/issues" ? badgeCounts?.issues :
                      item.path === "/dependencies" ? badgeCounts?.dependencies :
                      item.path === "/risk-register" ? badgeCounts?.risks :
                      undefined;
                    return (
                      <SortableSidebarItem
                        key={item.path}
                        item={item}
                        isActive={isActive}
                        badgeCount={badgeCount}
                        isCollapsed={isCollapsed}
                        currentLocation={location}
                        navigate={setLocation}
                        onClick={() => !item.children && setLocation(item.path)}
                      />
                    );
                  })}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          </SidebarContent>

          <SidebarFooter className="p-3 gap-2">
            {/* Excel Import/Export - in footer to avoid overlap with nav items */}
            <div className="border-t pt-2 group-data-[collapsible=icon]:hidden">
              <div className="flex gap-1 px-1">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                    className="hidden"
                    id="sidebar-file-upload"
                    disabled={uploading}
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
            {/* Collapsed icon-only Excel buttons */}
            <div className="hidden group-data-[collapsible=icon]:flex flex-col gap-1 border-t pt-2">
              <label htmlFor="sidebar-file-upload-icon" title="Import Excel" className="cursor-pointer flex items-center justify-center h-8 w-8 mx-auto rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="sidebar-file-upload-icon"
                  disabled={uploading}
                />
                <Upload className="h-4 w-4" />
              </label>
              <button
                onClick={handleExport}
                disabled={exportQuery.isLoading}
                title="Export Excel"
                className="flex items-center justify-center h-8 w-8 mx-auto rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
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
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleSwitchProject}
                  className="cursor-pointer"
                >
                  <Database className="mr-2 h-4 w-4" />
                  <span>Switch Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemeDialogOpen(true)}
                  className="cursor-pointer"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  <span>Theme</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeSelector />
            </div>
          </div>
        )}
        <main className="flex-1 p-4 min-w-0 max-w-full overflow-x-hidden">{children}</main>
      </SidebarInset>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Theme Settings Dialog */}
      <Dialog open={themeDialogOpen} onOpenChange={setThemeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Theme Settings</DialogTitle>
            <DialogDescription>
              Choose your preferred color theme for the application
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ThemeSelector />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Sortable Sidebar Item ────────────────────────────────────────────────────
type SortableSidebarItemProps = {
  item: MenuItem;
  isActive: boolean;
  badgeCount?: number;
  isCollapsed: boolean;
  currentLocation: string;
  navigate: (path: string) => void;
  onClick: () => void;
};

function SortableSidebarItem({ item, isActive, badgeCount, isCollapsed, currentLocation, navigate, onClick }: SortableSidebarItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.path });

  const hasChildren = !!(item.children && item.children.length > 0);
  const isChildActive = hasChildren && item.children!.some(c => c.path === currentLocation);
  const [groupOpen, setGroupOpen] = useState(() => isChildActive);

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const dragHandle = (
    <span
      {...listeners}
      className="hidden group-hover/item:flex group-data-[collapsible=icon]:hidden items-center cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground shrink-0 -ml-1 mr-0.5"
      onClick={(e) => e.stopPropagation()}
      title="Drag to reorder"
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="3" cy="2.5" r="1.2" />
        <circle cx="7" cy="2.5" r="1.2" />
        <circle cx="3" cy="7" r="1.2" />
        <circle cx="7" cy="7" r="1.2" />
        <circle cx="3" cy="11.5" r="1.2" />
        <circle cx="7" cy="11.5" r="1.2" />
      </svg>
    </span>
  );

  if (hasChildren) {
    return (
      <SidebarMenuItem ref={setNodeRef} style={style}>
        <SidebarMenuButton
          isActive={isChildActive}
          onClick={() => isCollapsed ? navigate(item.children![0].path) : setGroupOpen(o => !o)}
          tooltip={item.label}
          className="h-8 transition-all font-normal text-sm group/item"
          {...attributes}
        >
          {dragHandle}
          <item.icon className={`h-4 w-4 shrink-0 ${isChildActive ? "text-primary" : ""}`} />
          <span className="flex-1">{item.label}</span>
          <ChevronRight
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden ${groupOpen ? "rotate-90" : ""}`}
          />
        </SidebarMenuButton>
        {groupOpen && !isCollapsed && (
          <SidebarMenuSub>
            {item.children!.map(child => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton
                  isActive={currentLocation === child.path}
                  onClick={() => navigate(child.path)}
                  className="h-7 text-sm"
                >
                  <child.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onClick}
        tooltip={item.label}
        className="h-8 transition-all font-normal text-sm group/item"
        {...attributes}
      >
        {dragHandle}
        <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
        <span className="flex-1">{item.label}</span>
        {badgeCount != null && badgeCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[10px] font-semibold bg-destructive text-destructive-foreground">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
