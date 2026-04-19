import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network, FolderKanban, Layers, Package } from "lucide-react";

interface Portfolio {
  id: number;
  name: string;
  description?: string | null;
}
interface Program {
  id: number;
  name: string;
  description?: string | null;
  portfolioId?: number | null;
}
interface Project {
  id: number;
  name: string;
  status?: string | null;
  programId?: number | null;
  portfolioId?: number | null;
}

interface Props {
  portfolios: Portfolio[];
  programs: Program[];
  projects: Project[];
}

const STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-700 border-green-200",
  Planning: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold": "bg-yellow-100 text-yellow-700 border-yellow-200",
  Completed: "bg-gray-100 text-gray-600 border-gray-200",
  Cancelled: "bg-red-100 text-red-600 border-red-200",
};

export default function SystemLandscapeDiagram({ portfolios, programs, projects }: Props) {
  // Group programs by portfolio, and projects by program/portfolio
  const tree = useMemo(() => {
    const portfolioMap = new Map(portfolios.map(p => [p.id, { ...p, programs: [] as typeof programs, directProjects: [] as typeof projects }]));
    const programMap = new Map(programs.map(p => [p.id, { ...p, projects: [] as typeof projects }]));
    const unassignedPrograms: typeof programs = [];
    const unassignedProjects: typeof projects = [];

    for (const prog of programs) {
      if (prog.portfolioId && portfolioMap.has(prog.portfolioId)) {
        portfolioMap.get(prog.portfolioId)!.programs.push(prog);
      } else {
        unassignedPrograms.push(prog);
      }
    }

    for (const proj of projects) {
      if (proj.programId && programMap.has(proj.programId)) {
        programMap.get(proj.programId)!.projects.push(proj);
      } else if (proj.portfolioId && portfolioMap.has(proj.portfolioId)) {
        portfolioMap.get(proj.portfolioId)!.directProjects.push(proj);
      } else {
        unassignedProjects.push(proj);
      }
    }

    return { portfolioMap, programMap, unassignedPrograms, unassignedProjects };
  }, [portfolios, programs, projects]);

  const totalProjects = projects.length;
  const assignedProjects = projects.filter(p => p.programId || p.portfolioId).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Layers className="h-5 w-5 text-violet-600" />
            <div>
              <div className="text-2xl font-bold text-violet-700">{portfolios.length}</div>
              <div className="text-xs text-violet-600">Portfolios</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Network className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-700">{programs.length}</div>
              <div className="text-xs text-blue-600">Programs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-indigo-200 bg-indigo-50">
          <CardContent className="p-4 flex items-center gap-3">
            <FolderKanban className="h-5 w-5 text-indigo-600" />
            <div>
              <div className="text-2xl font-bold text-indigo-700">{totalProjects}</div>
              <div className="text-xs text-indigo-600">Projects</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-4 flex items-center gap-3">
            <Package className="h-5 w-5 text-gray-500" />
            <div>
              <div className="text-2xl font-bold text-gray-600">{totalProjects - assignedProjects}</div>
              <div className="text-xs text-gray-500">Unassigned</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hierarchy tree */}
      <div className="space-y-4">
        {/* Portfolio nodes */}
        {Array.from(tree.portfolioMap.values()).map((portfolio) => (
          <Card key={portfolio.id} className="border-violet-200">
            <CardHeader className="py-3 px-4 bg-violet-50 rounded-t-lg">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-600" />
                <span className="text-violet-700 font-semibold">{portfolio.name}</span>
                <Badge className="text-[10px] bg-violet-100 text-violet-700 ml-auto">Portfolio</Badge>
              </CardTitle>
              {portfolio.description && <p className="text-xs text-muted-foreground mt-0.5">{portfolio.description}</p>}
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {/* Programs under this portfolio */}
              {portfolio.programs.map((prog) => {
                const progData = tree.programMap.get(prog.id);
                return (
                  <div key={prog.id} className="ml-4 border-l-2 border-blue-200 pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Network className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">{prog.name}</span>
                      <Badge className="text-[10px] bg-blue-100 text-blue-700">Program</Badge>
                    </div>
                    {/* Projects under this program */}
                    {progData && progData.projects.length > 0 && (
                      <div className="ml-4 grid grid-cols-2 gap-2">
                        {progData.projects.map((proj) => (
                          <div key={proj.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <FolderKanban className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span className="text-xs font-medium text-indigo-700 truncate">{proj.name}</span>
                            {proj.status && (
                              <Badge className={`text-[9px] ml-auto shrink-0 ${STATUS_COLORS[proj.status] ?? "bg-gray-100 text-gray-600"}`}>{proj.status}</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {progData && progData.projects.length === 0 && (
                      <p className="text-xs text-muted-foreground ml-4 italic">No projects assigned</p>
                    )}
                  </div>
                );
              })}

              {/* Direct projects under portfolio (no program) */}
              {portfolio.directProjects.length > 0 && (
                <div className="ml-4 border-l-2 border-gray-200 pl-4">
                  <div className="text-xs text-muted-foreground mb-2">Direct Projects</div>
                  <div className="grid grid-cols-2 gap-2">
                    {portfolio.directProjects.map((proj) => (
                      <div key={proj.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                        <FolderKanban className="h-3 w-3 text-gray-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-700 truncate">{proj.name}</span>
                        {proj.status && (
                          <Badge className={`text-[9px] ml-auto shrink-0 ${STATUS_COLORS[proj.status] ?? "bg-gray-100 text-gray-600"}`}>{proj.status}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolio.programs.length === 0 && portfolio.directProjects.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No programs or projects assigned to this portfolio</p>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Unassigned programs */}
        {tree.unassignedPrograms.length > 0 && (
          <Card className="border-dashed border-blue-200">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Network className="h-4 w-4" />
                Programs (No Portfolio)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {tree.unassignedPrograms.map((prog) => {
                const progData = tree.programMap.get(prog.id);
                return (
                  <div key={prog.id} className="border-l-2 border-blue-200 pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Network className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-sm font-medium text-blue-700">{prog.name}</span>
                    </div>
                    {progData && progData.projects.length > 0 && (
                      <div className="ml-4 grid grid-cols-2 gap-2">
                        {progData.projects.map((proj) => (
                          <div key={proj.id} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <FolderKanban className="h-3 w-3 text-indigo-500 shrink-0" />
                            <span className="text-xs font-medium text-indigo-700 truncate">{proj.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Unassigned projects */}
        {tree.unassignedProjects.length > 0 && (
          <Card className="border-dashed border-gray-200">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <FolderKanban className="h-4 w-4" />
                Projects (Unassigned)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {tree.unassignedProjects.map((proj) => (
                  <div key={proj.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <FolderKanban className="h-3 w-3 text-gray-500 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 truncate">{proj.name}</span>
                    {proj.status && (
                      <Badge className={`text-[9px] ml-auto shrink-0 ${STATUS_COLORS[proj.status] ?? "bg-gray-100 text-gray-600"}`}>{proj.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {portfolios.length === 0 && programs.length === 0 && projects.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Network className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No portfolios, programs or projects yet.</p>
            <p className="text-xs mt-1">Create portfolios and programs to see the hierarchy here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
