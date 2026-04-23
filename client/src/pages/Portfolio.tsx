import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  BarChart2, AlertTriangle, CheckSquare, Bug, Calendar, Layers,
  FolderKanban, BookOpen, Plus, Pencil, Trash2, Link, ChevronRight,
  Users, ArrowRight, Network,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import SystemLandscapeDiagram from "@/components/SystemLandscapeDiagram";

// ─── RAG dot ─────────────────────────────────────────────────────────────────
function RAGDot({ status }: { status?: string | null }) {
  const color =
    status === "Green" ? "bg-green-500"
      : status === "Amber" ? "bg-amber-400"
      : status === "Red" ? "bg-red-500"
      : "bg-gray-300";
  return <span className={cn("inline-block w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />;
}

const SPARKLINE_DATA = [{ v: 40 }, { v: 45 }, { v: 50 }, { v: 48 }, { v: 60 }];

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project }: { project: { id: number; name: string; description?: string | null } }) {
  const [, navigate] = useLocation();
  const { setCurrentProjectId } = useProject();

  const tasksQuery = trpc.tasks.list.useQuery({ projectId: project.id });
  const issuesQuery = trpc.issues.list.useQuery({ projectId: project.id });
  const risksQuery = trpc.risks.list.useQuery({ projectId: project.id });
  const charterQuery = trpc.charter.get.useQuery({ projectId: project.id });

  const tasks = tasksQuery.data ?? [];
  const issues = issuesQuery.data ?? [];
  const risks = risksQuery.data ?? [];
  const charter = charterQuery.data;

  const openTasks = tasks.filter(
    (t: any) => t.status && !["Done", "Completed", "Closed", "Cancelled"].includes(t.status)
  ).length;
  const openIssues = issues.filter(
    (i: any) => i.status && !["Closed", "Resolved", "Cancelled"].includes(i.status)
  ).length;
  const highRisks = risks.filter((r: any) => (r.score ?? 0) >= 12).length;

  const endDate = charter?.projectEndDate
    ? new Date(charter.projectEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <RAGDot status={charter?.ragStatus} />
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 truncate">{project.name}</h3>
          </div>
          {charter?.ragStatus && (
            <Badge variant="outline" className={cn("text-[10px] flex-shrink-0",
              charter.ragStatus === "Green" && "border-green-400 text-green-600",
              charter.ragStatus === "Amber" && "border-amber-400 text-amber-600",
              charter.ragStatus === "Red" && "border-red-400 text-red-600"
            )}>{charter.ragStatus}</Badge>
          )}
        </div>
        {project.description && (
          <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-0.5">{project.description}</p>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800 p-2">
            <CheckSquare className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
            <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">{openTasks}</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">Open Tasks</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800 p-2">
            <Bug className="w-3.5 h-3.5 text-orange-500 mb-0.5" />
            <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">{openIssues}</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">Open Issues</span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800 p-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 mb-0.5" />
            <span className="text-lg font-bold text-gray-800 dark:text-zinc-100">{highRisks}</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">High Risks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0">Trend</span>
          <div style={{ width: 120, height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPARKLINE_DATA}>
                <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto pt-1">
          {endDate ? (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
              <Calendar className="w-3 h-3" />
              <span>Due {endDate}</span>
            </div>
          ) : <span />}
          <Button size="sm" variant="default" onClick={() => { setCurrentProjectId(project.id); navigate("/dashboard"); }} className="text-xs h-7 px-3">
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Link Project Dialog ──────────────────────────────────────────────────────
function LinkProjectDialog({
  open, onClose, targetType, targetId, targetName,
}: {
  open: boolean;
  onClose: () => void;
  targetType: "program" | "portfolio";
  targetId: number;
  targetName: string;
}) {
  const utils = trpc.useUtils();
  const projectsQuery = trpc.projects.list.useQuery();
  const projects = projectsQuery.data ?? [];

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      utils.portfolios.getSummary.invalidate();
      utils.portfolios.getProjects.invalidate();
      utils.programs.getProjects.invalidate();
      toast.success("Project linked successfully");
      onClose();
    },
  });

  // Filter out already-linked projects
  const unlinked = projects.filter((p: any) => {
    if (targetType === "program") return p.programId !== targetId;
    return p.portfolioId !== targetId;
  });

  function handleLink(projectId: number) {
    const payload: any = { projectId };
    if (targetType === "program") payload.programId = targetId;
    else payload.portfolioId = targetId;
    updateProject.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-4 h-4 text-blue-500" />
            Link Project to {targetType === "program" ? "Program" : "Portfolio"}: {targetName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto py-2">
          {unlinked.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">All projects already linked.</p>
          )}
          {unlinked.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-zinc-700 p-2.5">
              <span className="text-sm text-gray-800 dark:text-zinc-100 font-medium">{p.name}</span>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleLink(p.id)}
                disabled={updateProject.isPending}>
                <Link className="w-3 h-3 mr-1" /> Link
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create/Edit Portfolio Dialog ─────────────────────────────────────────────
function PortfolioDialog({
  open, onClose, portfolio,
}: {
  open: boolean;
  onClose: () => void;
  portfolio?: { id: number; name: string; description?: string | null } | null;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(portfolio?.name ?? "");
  const [desc, setDesc] = useState(portfolio?.description ?? "");

  const create = trpc.portfolios.create.useMutation({
    onSuccess: () => { utils.portfolios.list.invalidate(); toast.success("Portfolio created"); onClose(); },
  });
  const update = trpc.portfolios.update.useMutation({
    onSuccess: () => { utils.portfolios.list.invalidate(); toast.success("Portfolio updated"); onClose(); },
  });

  function handleSave() {
    if (!name.trim()) return;
    if (portfolio) update.mutate({ id: portfolio.id, name: name.trim(), description: desc || null });
    else create.mutate({ name: name.trim(), description: desc || null });
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{portfolio ? "Edit Portfolio" : "New Portfolio"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Portfolio name" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            {portfolio ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create/Edit Program Dialog ───────────────────────────────────────────────
function ProgramDialog({
  open, onClose, program, portfolios,
}: {
  open: boolean;
  onClose: () => void;
  program?: { id: number; name: string; description?: string | null; portfolioId?: number | null } | null;
  portfolios: Array<{ id: number; name: string }>;
}) {
  const utils = trpc.useUtils();
  const [name, setName] = useState(program?.name ?? "");
  const [desc, setDesc] = useState(program?.description ?? "");
  const [portfolioId, setPortfolioId] = useState<string>(program?.portfolioId?.toString() ?? "none");

  const create = trpc.programs.create.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      utils.portfolios.getSummary.invalidate();
      utils.portfolios.getPrograms.invalidate();
      toast.success("Program created");
      onClose();
    },
  });
  const update = trpc.programs.update.useMutation({
    onSuccess: () => {
      utils.programs.list.invalidate();
      utils.portfolios.getSummary.invalidate();
      utils.portfolios.getPrograms.invalidate();
      toast.success("Program updated");
      onClose();
    },
  });

  function handleSave() {
    if (!name.trim()) return;
    const pid = portfolioId !== "none" ? parseInt(portfolioId) : null;
    if (program) update.mutate({ id: program.id, name: name.trim(), description: desc || null, portfolioId: pid });
    else create.mutate({ name: name.trim(), description: desc || null, portfolioId: pid });
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{program ? "Edit Program" : "New Program"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Program name" />
          </div>
          <div className="space-y-1">
            <Label>Portfolio (optional)</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger>
                <SelectValue placeholder="Select portfolio..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={isPending || !name.trim()}>
            {program ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Program Section ──────────────────────────────────────────────────────────
function ProgramSection({
  program, onEdit, onDelete, allProjects,
}: {
  program: { id: number; name: string; description?: string | null; portfolioId?: number | null };
  onEdit: () => void;
  onDelete: () => void;
  allProjects: Array<{ id: number; name: string; programId?: number | null; portfolioId?: number | null }>;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const utils = trpc.useUtils();

  const programProjects = allProjects.filter((p) => p.programId === program.id);

  const updateProject = trpc.projects.update.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      utils.programs.getProjects.invalidate();
      utils.portfolios.getSummary.invalidate();
      toast.success("Project unlinked");
    },
  });

  function handleUnlink(projectId: number) {
    updateProject.mutate({ projectId, programId: null });
  }

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <span className="font-semibold text-gray-800 dark:text-zinc-100">{program.name}</span>
          <Badge variant="secondary" className="text-xs">{programProjects.length} project{programProjects.length !== 1 ? "s" : ""}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLinkOpen(true)}>
            <Link className="w-3 h-3 mr-1" /> Link Project
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Projects */}
      {programProjects.length === 0 ? (
        <div className="px-4 py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
          No projects linked to this program yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
          {programProjects.map((p) => (
            <div key={p.id} className="relative group">
              <ProjectCard project={p} />
              <button
                onClick={() => handleUnlink(p.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-600 rounded p-0.5 text-red-400 hover:text-red-600"
                title="Unlink from program"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <LinkProjectDialog
        open={linkOpen} onClose={() => setLinkOpen(false)}
        targetType="program" targetId={program.id} targetName={program.name}
      />
    </div>
  );
}

// ─── Portfolio Section ────────────────────────────────────────────────────────
function PortfolioSection({
  portfolio, allProjects, allPrograms, onEditPortfolio, onDeletePortfolio, onEditProgram, onDeleteProgram,
}: {
  portfolio: { id: number; name: string; description?: string | null };
  allProjects: Array<{ id: number; name: string; programId?: number | null; portfolioId?: number | null }>;
  allPrograms: Array<{ id: number; name: string; description?: string | null; portfolioId?: number | null }>;
  onEditPortfolio: () => void;
  onDeletePortfolio: () => void;
  onEditProgram: (p: any) => void;
  onDeleteProgram: (id: number) => void;
}) {
  const [linkProjOpen, setLinkProjOpen] = useState(false);

  const portfolioPrograms = allPrograms.filter((pg) => pg.portfolioId === portfolio.id);
  const directProjects = allProjects.filter(
    (p) => p.portfolioId === portfolio.id && !p.programId
  );
  const totalProjects = allProjects.filter((p) => p.portfolioId === portfolio.id).length;

  return (
    <div className="border-2 border-blue-100 dark:border-blue-900/40 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900 dark:text-zinc-100 text-lg">{portfolio.name}</span>
          {portfolio.description && (
            <span className="text-xs text-gray-400 dark:text-zinc-500 hidden sm:inline">— {portfolio.description}</span>
          )}
          <Badge className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs border-0">
            {totalProjects} project{totalProjects !== 1 ? "s" : ""}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {portfolioPrograms.length} program{portfolioPrograms.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setLinkProjOpen(true)}>
            <Link className="w-3 h-3 mr-1" /> Link Project
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEditPortfolio}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={onDeletePortfolio}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Programs under this portfolio */}
        {portfolioPrograms.map((prog) => (
          <ProgramSection
            key={prog.id}
            program={prog}
            allProjects={allProjects}
            onEdit={() => onEditProgram(prog)}
            onDelete={() => onDeleteProgram(prog.id)}
          />
        ))}

        {/* Direct projects (linked to portfolio but no program) */}
        {directProjects.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 font-medium mb-2 uppercase tracking-wide">
              Direct Portfolio Projects (no program)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {directProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
            </div>
          </div>
        )}

        {portfolioPrograms.length === 0 && directProjects.length === 0 && (
          <div className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
            No programs or projects linked to this portfolio yet.
          </div>
        )}
      </div>

      <LinkProjectDialog
        open={linkProjOpen} onClose={() => setLinkProjOpen(false)}
        targetType="portfolio" targetId={portfolio.id} targetName={portfolio.name}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Portfolio() {
  const utils = trpc.useUtils();

  const projectsQuery = trpc.projects.list.useQuery();
  const portfoliosQuery = trpc.portfolios.list.useQuery();
  const programsQuery = trpc.programs.list.useQuery();

  const projects = (projectsQuery.data ?? []) as Array<{
    id: number; name: string; description?: string | null;
    programId?: number | null; portfolioId?: number | null;
  }>;
  const portfolios = portfoliosQuery.data ?? [];
  const programs = programsQuery.data ?? [];

  // Dialogs
  const [portfolioDialog, setPortfolioDialog] = useState<{
    open: boolean; portfolio?: { id: number; name: string; description?: string | null } | null;
  }>({ open: false });

  const [programDialog, setProgramDialog] = useState<{
    open: boolean; program?: { id: number; name: string; description?: string | null; portfolioId?: number | null } | null;
  }>({ open: false });

  // Delete mutations
  const deletePortfolio = trpc.portfolios.delete.useMutation({
    onSuccess: () => { utils.portfolios.list.invalidate(); utils.projects.list.invalidate(); toast.success("Portfolio deleted"); },
  });
  const deleteProgram = trpc.programs.delete.useMutation({
    onSuccess: () => { utils.programs.list.invalidate(); utils.projects.list.invalidate(); toast.success("Program deleted"); },
  });

  const unlinkedProjects = projects.filter((p) => !p.programId && !p.portfolioId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-500" />
            Portfolio Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""} ·{" "}
            {portfolios.length} portfolio{portfolios.length !== 1 ? "s" : ""} ·{" "}
            {programs.length} program{programs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setProgramDialog({ open: true })}>
            <Plus className="w-4 h-4 mr-1" /> New Program
          </Button>
          <Button size="sm" onClick={() => setPortfolioDialog({ open: true })}>
            <Plus className="w-4 h-4 mr-1" /> New Portfolio
          </Button>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <BarChart2 className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{projects.length}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Total Projects</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <FolderKanban className="w-4 h-4 text-indigo-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{portfolios.length}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Portfolios</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <BookOpen className="w-4 h-4 text-green-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{programs.length}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Programs</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <Users className="w-4 h-4 text-amber-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{unlinkedProjects.length}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Unlinked Projects</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="hierarchy">
        <TabsList>
          <TabsTrigger value="hierarchy">Portfolio Hierarchy</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="landscape" className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5" />System Landscape
          </TabsTrigger>
        </TabsList>

        {/* ── Portfolio Hierarchy ─────────────────────────────────────────────── */}
        <TabsContent value="hierarchy" className="mt-4 space-y-4">
          {portfoliosQuery.isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => <div key={n} className="h-40 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
            </div>
          ) : portfolios.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderKanban className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 font-medium">No portfolios yet</p>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
                Create a portfolio and link programs and projects to it.
              </p>
              <Button size="sm" className="mt-4" onClick={() => setPortfolioDialog({ open: true })}>
                <Plus className="w-4 h-4 mr-1" /> Create Portfolio
              </Button>
            </div>
          ) : (
            portfolios.map((pf: any) => (
              <PortfolioSection
                key={pf.id}
                portfolio={pf}
                allProjects={projects}
                allPrograms={programs}
                onEditPortfolio={() => setPortfolioDialog({ open: true, portfolio: pf })}
                onDeletePortfolio={() => deletePortfolio.mutate({ id: pf.id })}
                onEditProgram={(pg) => setProgramDialog({ open: true, program: pg })}
                onDeleteProgram={(id) => deleteProgram.mutate({ id })}
              />
            ))
          )}

          {/* Unlinked projects */}
          {unlinkedProjects.length > 0 && (
            <div className="border border-dashed border-gray-300 dark:border-zinc-600 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400 mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" /> Unlinked Projects
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unlinkedProjects.map((p) => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Programs ───────────────────────────────────────────────────────── */}
        <TabsContent value="programs" className="mt-4 space-y-3">
          {programsQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => <div key={n} className="h-28 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)}
            </div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 font-medium">No programs yet</p>
              <Button size="sm" className="mt-4" onClick={() => setProgramDialog({ open: true })}>
                <Plus className="w-4 h-4 mr-1" /> Create Program
              </Button>
            </div>
          ) : (
            programs.map((pg: any) => {
              const pf = portfolios.find((p: any) => p.id === pg.portfolioId);
              return (
                <ProgramSection
                  key={pg.id}
                  program={pg}
                  allProjects={projects}
                  onEdit={() => setProgramDialog({ open: true, program: pg })}
                  onDelete={() => deleteProgram.mutate({ id: pg.id })}
                />
              );
            })
          )}
        </TabsContent>

        {/* ── All Projects ───────────────────────────────────────────────────── */}
        <TabsContent value="all" className="mt-4">
          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 font-medium">No projects found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((p) => (
                <div key={p.id} className="relative">
                  <ProjectCard project={p} />
                  {/* Hierarchy breadcrumb */}
                  {(p.portfolioId || p.programId) && (
                    <div className="absolute top-1 left-2 flex items-center gap-1 text-[9px] text-gray-400 dark:text-zinc-500">
                      {p.portfolioId && (
                        <>
                          <FolderKanban className="w-2.5 h-2.5" />
                          <span>{portfolios.find((pf: any) => pf.id === p.portfolioId)?.name}</span>
                        </>
                      )}
                      {p.programId && (
                        <>
                          {p.portfolioId && <ChevronRight className="w-2.5 h-2.5" />}
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{programs.find((pg: any) => pg.id === p.programId)?.name}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        {/* ── System Landscape ─────────────────────────────────────────────── */}
        <TabsContent value="landscape" className="mt-0">
          <div className="rounded-xl overflow-hidden border border-white/10" style={{ height: "calc(100vh - 220px)", minHeight: 520 }}>
            <SystemLandscapeDiagram
              portfolios={portfolios as any[]}
              programs={programs as any[]}
              projects={projects}
              onLinkCreated={() => {
                utils.projects.list.invalidate();
                utils.programs.list.invalidate();
                utils.portfolios.list.invalidate();
              }}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <PortfolioDialog
        open={portfolioDialog.open}
        onClose={() => setPortfolioDialog({ open: false })}
        portfolio={portfolioDialog.portfolio}
      />
      <ProgramDialog
        open={programDialog.open}
        onClose={() => setProgramDialog({ open: false })}
        program={programDialog.program}
        portfolios={portfolios}
      />
    </div>
  );
}
