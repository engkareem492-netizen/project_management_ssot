import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { BarChart2, AlertTriangle, CheckSquare, Bug, Calendar, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

// RAG status styling
function RAGDot({ status }: { status?: string | null }) {
  const color =
    status === "Green"
      ? "bg-green-500"
      : status === "Amber"
      ? "bg-amber-400"
      : status === "Red"
      ? "bg-red-500"
      : "bg-gray-300";
  return <span className={cn("inline-block w-2.5 h-2.5 rounded-full flex-shrink-0", color)} />;
}

// Placeholder sparkline data — TODO: wire to real trend data
const SPARKLINE_DATA = [
  { v: 40 },
  { v: 45 },
  { v: 50 },
  { v: 48 },
  { v: 60 },
];

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
    ? new Date(charter.projectEndDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function handleViewProject() {
    setCurrentProjectId(project.id);
    navigate("/dashboard");
  }

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <RAGDot status={charter?.ragStatus} />
            <h3 className="text-base font-bold text-gray-900 dark:text-zinc-100 truncate">
              {project.name}
            </h3>
          </div>
          {charter?.ragStatus && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] flex-shrink-0",
                charter.ragStatus === "Green" && "border-green-400 text-green-600",
                charter.ragStatus === "Amber" && "border-amber-400 text-amber-600",
                charter.ragStatus === "Red" && "border-red-400 text-red-600"
              )}
            >
              {charter.ragStatus}
            </Badge>
          )}
        </div>
        {project.description && (
          <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
            {project.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col gap-3">
        {/* KPI row */}
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

        {/* Sparkline — task completion trend */}
        {/* TODO: wire to real trend data when endpoint is available */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0">Trend</span>
          <div style={{ width: 120, height: 40 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={SPARKLINE_DATA}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {endDate ? (
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
              <Calendar className="w-3 h-3" />
              <span>Due {endDate}</span>
            </div>
          ) : (
            <span />
          )}
          <Button size="sm" variant="default" onClick={handleViewProject} className="text-xs h-7 px-3">
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Portfolio() {
  const projectsQuery = trpc.projects.list.useQuery();
  const projects = projectsQuery.data ?? [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-500" />
          Portfolio Overview
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {projects.length} project{projects.length !== 1 ? "s" : ""} in portfolio
        </p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <BarChart2 className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">{projects.length}</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Total Projects</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <CheckSquare className="w-4 h-4 text-blue-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">—</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Total Open Tasks</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <Bug className="w-4 h-4 text-orange-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">—</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Total Open Issues</span>
        </div>
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-4 flex flex-col items-center">
          <AlertTriangle className="w-4 h-4 text-red-500 mb-1" />
          <span className="text-2xl font-bold text-gray-800 dark:text-zinc-100">—</span>
          <span className="text-xs text-gray-400 dark:text-zinc-500">Total High Risks</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="programs">By Program</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {projectsQuery.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-64 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-3" />
              <p className="text-gray-500 dark:text-zinc-400 font-medium">No projects found</p>
              <p className="text-sm text-gray-400 dark:text-zinc-500 mt-1">
                Create a project to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs" className="mt-4">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Layers className="w-8 h-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                Program grouping coming soon
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
