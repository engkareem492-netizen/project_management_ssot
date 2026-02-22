import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, GitBranch, FileText, CheckSquare, AlertCircle, Users, ExternalLink, Filter, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Relationships() {
  const { currentProjectId } = useProject();
  const { data: relationships, isLoading } = trpc.relationships.getAll.useQuery(
    { projectId: currentProjectId || undefined },
    { enabled: !!currentProjectId }
  );
  const { data: stakeholders } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: deliverables } = trpc.deliverables.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );

  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [showRequirementDialog, setShowRequirementDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  
  // Column widths state
  const [columnWidths, setColumnWidths] = useState({ requirement: 25, task: 35, issue: 35 });
  
  // Filter states
  const [requirementOwnerFilter, setRequirementOwnerFilter] = useState<string>("ALL");
  const [taskResponsibleFilter, setTaskResponsibleFilter] = useState<string>("ALL");
  const [issueOwnerFilter, setIssueOwnerFilter] = useState<string>("ALL");

  // Flatten relationships into table rows
  const tableRows: any[] = [];
  relationships?.forEach((rel) => {
    if (rel.tasks.length === 0 && rel.issues.length === 0) {
      // Requirement with no tasks or issues
      tableRows.push({
        requirement: rel.requirement,
        task: null,
        issue: null,
      });
    } else {
      // Create rows for each task-issue combination
      const maxLength = Math.max(rel.tasks.length, rel.issues.length);
      for (let i = 0; i < maxLength; i++) {
        tableRows.push({
          requirement: rel.requirement, // Repeat requirement in all rows
          task: rel.tasks[i] || null,
          issue: rel.issues[i] || null,
        });
      }
    }
  });

  // Apply filters
  const filteredRows = tableRows.filter((row) => {
    if (requirementOwnerFilter !== "ALL" && row.requirement && row.requirement.owner !== requirementOwnerFilter) {
      return false;
    }
    if (taskResponsibleFilter !== "ALL" && row.task && row.task.responsible !== taskResponsibleFilter) {
      return false;
    }
    if (issueOwnerFilter !== "ALL" && row.issue && row.issue.owner !== issueOwnerFilter) {
      return false;
    }
    return true;
  });

  // Get unique stakeholder names for filters
  const uniqueRequirementOwners = Array.from(new Set(
    relationships?.flatMap(r => r.requirement.owner).filter(Boolean) || []
  )).sort();
  const uniqueTaskResponsibles = Array.from(new Set(
    relationships?.flatMap(r => r.tasks.map(t => t.responsible)).filter(Boolean) || []
  )).sort();
  const uniqueIssueOwners = Array.from(new Set(
    relationships?.flatMap(r => r.issues.map(i => i.owner)).filter(Boolean) || []
  )).sort();

  const handleRequirementClick = (req: any) => {
    setSelectedRequirement(req);
    setShowRequirementDialog(true);
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDialog(true);
  };

  const handleIssueClick = (issue: any) => {
    setSelectedIssue(issue);
    setShowIssueDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Entity Relationships
          </CardTitle>
          <CardDescription>
            Table view of requirements linked to tasks and issues. Click on any entity to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Filters:</Label>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Req. Owner:</Label>
              <Select value={requirementOwnerFilter} onValueChange={setRequirementOwnerFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {uniqueRequirementOwners.map((owner) => (
                    <SelectItem key={owner as string} value={owner as string}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {requirementOwnerFilter !== "ALL" && (
                <Button size="sm" variant="ghost" onClick={() => setRequirementOwnerFilter("ALL")} className="h-6 w-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Task Responsible:</Label>
              <Select value={taskResponsibleFilter} onValueChange={setTaskResponsibleFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {uniqueTaskResponsibles.map((responsible) => (
                    <SelectItem key={responsible as string} value={responsible as string}>{responsible}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {taskResponsibleFilter !== "ALL" && (
                <Button size="sm" variant="ghost" onClick={() => setTaskResponsibleFilter("ALL")} className="h-6 w-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Issue Owner:</Label>
              <Select value={issueOwnerFilter} onValueChange={setIssueOwnerFilter}>
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  {uniqueIssueOwners.map((owner) => (
                    <SelectItem key={owner as string} value={owner as string}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {issueOwnerFilter !== "ALL" && (
                <Button size="sm" variant="ghost" onClick={() => setIssueOwnerFilter("ALL")} className="h-6 w-6 p-0">
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {tableRows.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Requirement</TableHead>
                    <TableHead className="w-[35%]">Task</TableHead>
                    <TableHead className="w-[35%]">Issue</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, index) => (
                    <TableRow key={index} className="hover:bg-muted/50">
                      <TableCell>
                        {row.requirement && (
                          <Button
                            variant="ghost"
                            className="h-auto p-2 w-full justify-start text-left"
                            onClick={() => handleRequirementClick(row.requirement)}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                <span className="font-mono font-semibold text-sm">{row.requirement.idCode}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {row.requirement.description}
                              </p>
                              {row.requirement.owner && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Owner:</span> {row.requirement.owner}
                                </p>
                              )}
                              {row.requirement.deliverableId && deliverables && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Deliverable:</span> {deliverables.find(d => d.id === row.requirement.deliverableId)?.deliverableId || `DL-${row.requirement.deliverableId}`}
                                </p>
                              )}
                            </div>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.task && (
                          <Button
                            variant="ghost"
                            className="h-auto p-2 w-full justify-start text-left"
                            onClick={() => handleTaskClick(row.task)}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2">
                                <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="font-mono font-semibold text-sm">{row.task.taskId}</span>
                                <Badge variant="outline" className="text-xs">{row.task.currentStatus}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {row.task.description}
                              </p>
                              {row.task.responsible && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Responsible:</span> {row.task.responsible}
                                </p>
                              )}
                              {row.task.deliverableId && deliverables && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Deliverable:</span> {deliverables.find(d => d.id === row.task.deliverableId)?.deliverableId || `DL-${row.task.deliverableId}`}
                                </p>
                              )}
                            </div>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.issue && (
                          <Button
                            variant="ghost"
                            className="h-auto p-2 w-full justify-start text-left"
                            onClick={() => handleIssueClick(row.issue)}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                <span className="font-mono font-semibold text-sm">{row.issue.issueId}</span>
                                <Badge variant="destructive" className="text-xs">{row.issue.priority}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {row.issue.description}
                              </p>
                              {row.issue.owner && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Owner:</span> {row.issue.owner}
                                </p>
                              )}
                              {row.issue.deliverableId && deliverables && (
                                <p className="text-xs text-muted-foreground">
                                  <span className="font-medium">Deliverable:</span> {deliverables.find(d => d.id === row.issue.deliverableId)?.deliverableId || `DL-${row.issue.deliverableId}`}
                                </p>
                              )}
                            </div>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No relationships found.</p>
              <p className="text-sm mt-2">
                Import data and ensure requirements have linked tasks or issues.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Relationship Summary</CardTitle>
          <CardDescription>
            Overview of entity connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold">
                  {relationships?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Requirements with Links
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckSquare className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold">
                  {relationships?.reduce((sum, rel) => sum + rel.tasks.length, 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Linked Tasks
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold">
                  {relationships?.reduce((sum, rel) => sum + rel.issues.length, 0) || 0}
                </div>
                <div className="text-sm text-muted-foreground">
                  Linked Issues
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Requirement Details Dialog */}
      <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Requirement Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">ID Code</Label>
                  <p className="font-mono font-semibold">{selectedRequirement.idCode}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Priority</Label>
                  <Badge>{selectedRequirement.priority || 'N/A'}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Description</Label>
                <p className="text-sm">{selectedRequirement.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Type</Label>
                  <p className="text-sm">{selectedRequirement.type || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Category</Label>
                  <p className="text-sm">{selectedRequirement.category || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Owner</Label>
                  <p className="text-sm">{selectedRequirement.owner || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Creation Date</Label>
                  <p className="text-sm">{selectedRequirement.creationDate || 'N/A'}</p>
                </div>
              </div>
              {selectedRequirement.sourceType && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase">Source Type</Label>
                    <p className="text-sm">{selectedRequirement.sourceType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase">External Source</Label>
                    <p className="text-sm">{selectedRequirement.refSource || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-green-600" />
              Task Details
            </DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Task ID</Label>
                  <p className="font-mono font-semibold">{selectedTask.taskId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                  <Badge>{selectedTask.currentStatus || 'N/A'}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Description</Label>
                <p className="text-sm">{selectedTask.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Priority</Label>
                  <p className="text-sm">{selectedTask.priority || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Due Date</Label>
                  <p className="text-sm">{selectedTask.dueDate || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  RACI Assignment
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground uppercase">Responsible</Label>
                    <p className="text-sm font-medium">{selectedTask.responsible || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground uppercase">Accountable</Label>
                    <p className="text-sm font-medium">{selectedTask.accountable || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground uppercase">Consulted</Label>
                    <p className="text-sm font-medium">{selectedTask.consulted || 'N/A'}</p>
                  </div>
                  <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                    <Label className="text-xs text-muted-foreground uppercase">Informed</Label>
                    <p className="text-sm font-medium">{selectedTask.informed || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Issue Details Dialog */}
      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Issue Details
            </DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Issue ID</Label>
                  <p className="font-mono font-semibold">{selectedIssue.issueId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Status</Label>
                  <Badge>{selectedIssue.status || 'N/A'}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground uppercase">Description</Label>
                <p className="text-sm">{selectedIssue.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Priority</Label>
                  <Badge variant="destructive">{selectedIssue.priority || 'N/A'}</Badge>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Type</Label>
                  <p className="text-sm">{selectedIssue.type || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Class</Label>
                  <p className="text-sm">{selectedIssue.class || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Owner</Label>
                  <p className="text-sm">{selectedIssue.owner || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground uppercase">Open Date</Label>
                  <p className="text-sm">{selectedIssue.openDate || 'N/A'}</p>
                </div>
              </div>
              {selectedIssue.sourceType && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase">Source Type</Label>
                    <p className="text-sm">{selectedIssue.sourceType}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase">External Source</Label>
                    <p className="text-sm">{selectedIssue.refSource || 'N/A'}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
