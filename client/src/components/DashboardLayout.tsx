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
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { ThemeSelector } from "./ThemeSelector";
import { GlobalSearch } from "./GlobalSearch";
import { Search } from "lucide-react";

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
  const activeMenuItem = SIDEBAR_SECTIONS.flatMap(s => s.items).find(item => item.path === location);
  const isMobile = useIsMobile();
  const [uploading, setUploading] = useState(false);
  const { currentProjectId, setCurrentProjectId } = useProject();
  const { data: projects } = trpc.projects.list.useQuery();

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

          <SidebarContent className="gap-0 overflow-y-auto">
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
            <div className="hidden group-data-[collapsible=icon]:flex justify-center px-2 py-1">
              <button
                onClick={() => setSearchOpen(true)}
                title="Search (⌘K)"
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.label}>
                <div className="px-4 pt-3 pb-0.5 group-data-[collapsible=icon]:hidden">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 select-none">
                    {section.label}
                  </span>
                </div>
                <SidebarMenu className="px-2 pb-1">
                  {section.items.map((item) => {
                    const isActive = location === item.path;
                    const badgeCount =
                      item.path === "/tasks" ? badgeCounts?.tasks :
                      item.path === "/issues" ? badgeCounts?.issues :
                      item.path === "/dependencies" ? badgeCounts?.dependencies :
                      item.path === "/risk-register" ? badgeCounts?.risks :
                      undefined;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => setLocation(item.path)}
                          tooltip={item.label}
                          className="h-8 transition-all font-normal text-sm"
                        >
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
                  })}
                </SidebarMenu>
                <div className="mx-4 border-t border-border/30 group-data-[collapsible=icon]:hidden" />
              </div>
            ))}
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
              <ThemeSelector />
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
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

