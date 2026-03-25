import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { RelationshipMap, EntityNode, EntityEdge } from "@/components/RelationshipMap";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Clock, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";

// Statuses that mean the task is done and should not appear as overdue
// DONE_STATUSES is now derived from statusOptions DB (see below), kept as fallback
const FALLBACK_DONE_STATUSES = new Set(["Completed", "Closed", "Solved", "Done", "Cancelled", "Approved", "Passed"]);

export default function Today() {
  const { currentProjectId } = useProject();
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);  const [editingTaskStatus, setEditingTaskStatus] = useState("");
  const [editingRequirementId, setEditingRequirementId] = useState<number | null>(null);
  const [editingRequirementStatus, setEditingRequirementStatus] = useState("");
  
  // Filtering and grouping state
  const [filterResponsible, setFilterResponsible] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterTaskCode, setFilterTaskCode] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("none");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: requirements, isLoading: requirementsLoading } = trpc.requirements.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: issues } = trpc.issues.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: deliverables } = trpc.deliverables.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: risks } = trpc.risks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: testCasesData } = trpc.testCases.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: statusOptions } = trpc.dropdownOptions.status.getAll.useQuery();

  const updateTaskMutation = trpc.tasks.update.useMutation({
    onSuccess: () => {
      toast.success("Task status updated");
      setEditingTaskId(null);
      utils.tasks.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const updateRequirementMutation = trpc.requirements.update.useMutation({
    onSuccess: () => {
      toast.success("Requirement status updated");
      setEditingRequirementId(null);
      utils.requirements.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get tomorrow's date
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get 7 days from today
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

  // Helper function to parse date string
  const parseDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Apply filters to tasks
  const applyFilters = (taskList: any[]) => {
    return taskList.filter(t => {
      if (filterResponsible !== "all" && t.responsible !== filterResponsible) return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      if (filterPriority !== "all" && t.priority !== filterPriority) return false;
      if (filterTaskCode !== "all" && t.taskId !== filterTaskCode) return false;
      return true;
    });
  };

  // Get unique values for filters
  const uniqueResponsibles = useMemo(() => {
    const responsibles = tasks?.map(t => t.responsible).filter((r): r is string => Boolean(r)) || [];
    return Array.from(new Set(responsibles));
  }, [tasks]);

  const uniqueStatuses = useMemo(() => {
    const statuses = tasks?.map(t => t.status).filter((s): s is string => Boolean(s)) || [];
    return Array.from(new Set(statuses));
  }, [tasks]);

  const uniquePriorities = useMemo(() => {
    const priorities = tasks?.map(t => t.priority).filter((p): p is string => Boolean(p)) || [];
    return Array.from(new Set(priorities));
  }, [tasks]);

  const uniqueTaskCodes = useMemo(() => {
    const codes = tasks?.map(t => t.taskId).filter((c): c is string => Boolean(c)) || [];
    return Array.from(new Set(codes)).sort();
  }, [tasks]);

  // Categorize tasks
  const tasksToday = useMemo(() => {
    const filtered = tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() === today.getTime();
    }) || [];
    return applyFilters(filtered);
  }, [tasks, today, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  // Build a set of statuses that count as "complete" from the DB, with fallback
  const doneStatusSet = useMemo(() => {
    if (statusOptions && statusOptions.length > 0) {
      const dbDone = new Set(statusOptions.filter((s: any) => s.isComplete).map((s: any) => s.value));
      return dbDone.size > 0 ? dbDone : FALLBACK_DONE_STATUSES;
    }
    return FALLBACK_DONE_STATUSES;
  }, [statusOptions]);

  const tasksOverdue = useMemo(() => {
    const filtered = tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() < today.getTime() && !doneStatusSet.has(t.currentStatus || "");
    }) || [];
    return applyFilters(filtered);
  }, [tasks, today, doneStatusSet, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  const tasksUpcoming = useMemo(() => {
    const filtered = tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() > today.getTime() && dueDate.getTime() <= sevenDaysLater.getTime();
    }) || [];
    const filteredResult = applyFilters(filtered);
    // Sort ascending by due date
    return filteredResult.sort((a, b) => {
      const da = parseDate(a.dueDate);
      const db = parseDate(b.dueDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da.getTime() - db.getTime();
    });
  }, [tasks, today, sevenDaysLater, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  // Categorize requirements
  const requirementsToday = useMemo(() => {
    return requirements?.filter(r => {
      const updateDate = parseDate(r.updateDate);
      return updateDate && updateDate.getTime() === today.getTime();
    }) || [];
  }, [requirements, today]);

  const requirementsOverdue = useMemo(() => {
    return requirements?.filter(r => {
      const updateDate = parseDate(r.updateDate);
      return updateDate && updateDate.getTime() < today.getTime() && r.status !== "Closed";
    }) || [];
  }, [requirements, today]);

  const requirementsUpcoming = useMemo(() => {
    return requirements?.filter(r => {
      const updateDate = parseDate(r.updateDate);
      return updateDate && updateDate.getTime() > today.getTime() && updateDate.getTime() <= sevenDaysLater.getTime();
    }) || [];
  }, [requirements, today, sevenDaysLater]);

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "Closed" || status === "Solved" || status === "Completed") return "default";
    if (status === "Pending" || status === "Open") return "outline";
    if (status === "In Progress") return "secondary";
    return "secondary";
  };

  const handleTaskStatusUpdate = (taskId: number) => {
    if (editingTaskId === taskId) {
      const task = tasks?.find(t => t.id === taskId);
      if (!task) return;
      updateTaskMutation.mutate({
        id: taskId,
        taskId: task.taskId,
        data: {
          currentStatus: editingTaskStatus,
        },
      });
    } else {
      const task = tasks?.find(t => t.id === taskId);
      if (task) {
        setEditingTaskId(taskId);
        setEditingTaskStatus(task.currentStatus || "");
      }
    }
  };

  const handleRequirementStatusUpdate = (requirementId: number) => {
    if (editingRequirementId === requirementId) {
      const req = requirements?.find(r => r.id === requirementId);
      if (!req) return;
      updateRequirementMutation.mutate({
        id: requirementId,
        idCode: req.idCode,
        data: {
          status: editingRequirementStatus,
        },
      });
    } else {
      const req = requirements?.find(r => r.id === requirementId);
      if (req) {
        setEditingRequirementId(requirementId);
        setEditingRequirementStatus(req.status || "");
      }
    }
  };

  // Helper: detect if a requirement is a User Story by its type field
  const isUserStory = (req: any) =>
    typeof req.type === 'string' && req.type.toLowerCase().includes('user story');

  // Build relationship graph nodes and edges
  const relationshipNodes: EntityNode[] = useMemo(() => {
    const nodes: EntityNode[] = [];

    // Apply filters to get filtered tasks
    const filteredTasks = applyFilters(tasks || []);

    // Collect IDs of related entities from filtered tasks
    const relatedRequirementCodes = new Set<string>();
    const relatedDeliverableIds = new Set<number>();
    const relatedIssueTaskCodes = new Set<string>();

    filteredTasks.forEach((task) => {
      if (task.requirementId) relatedRequirementCodes.add(task.requirementId);
      if (task.deliverableId) relatedDeliverableIds.add(task.deliverableId);
      if (task.taskId) relatedIssueTaskCodes.add(task.taskId);
    });

    // Include requirements linked from test cases too
    testCasesData?.forEach((tc) => {
      if (tc.requirementId) relatedRequirementCodes.add(tc.requirementId);
    });

    // Find issues linked to filtered tasks or requirements
    const relatedIssues = issues?.filter((issue) => {
      if (issue.taskId && relatedIssueTaskCodes.has(issue.taskId)) return true;
      if (issue.requirementId && relatedRequirementCodes.has(issue.requirementId)) return true;
      return false;
    }) || [];

    // Also include issues referenced by test cases as defects
    const defectIssueIds = new Set<string>();
    testCasesData?.forEach((tc) => {
      if (tc.defectId) defectIssueIds.add(tc.defectId);
    });
    const defectIssues = issues?.filter((issue) => defectIssueIds.has(issue.issueId)) || [];
    // Merge, avoiding duplicates
    const allRelatedIssueIds = new Set(relatedIssues.map((i) => i.id));
    defectIssues.forEach((issue) => {
      if (!allRelatedIssueIds.has(issue.id)) relatedIssues.push(issue);
    });

    // Find risks linked to filtered tasks
    const relatedRisks = risks?.filter((risk) => {
      if ((risk as any).taskId) {
        return filteredTasks.some((t) => t.id === (risk as any).taskId);
      }
      return false;
    }) || [];

    // Find requirements (and user stories) linked to filtered tasks or test cases
    const relatedRequirements = requirements?.filter((req) =>
      relatedRequirementCodes.has(req.idCode)
    ) || [];

    // Find deliverables linked to filtered tasks
    const relatedDeliverables = deliverables?.filter((del) =>
      relatedDeliverableIds.has(del.id)
    ) || [];

    // Find test cases linked to related requirements or filtered tasks
    const relatedReqCodes = new Set(relatedRequirements.map((r) => r.idCode));
    const relatedTestCases = testCasesData?.filter((tc) => {
      if (tc.requirementId && relatedReqCodes.has(tc.requirementId)) return true;
      return false;
    }) || [];

    // Add task nodes
    filteredTasks.forEach((task) => {
      nodes.push({
        id: `task-${task.id}`,
        type: 'task',
        title: task.taskId || `Task ${task.id}`,
        description: task.description || undefined,
        status: task.currentStatus || task.status,
        priority: task.priority || undefined,
      });
    });

    // Add requirement / user story nodes (split by type)
    relatedRequirements.forEach((req) => {
      nodes.push({
        id: `requirement-${req.id}`,
        type: (isUserStory(req) ? 'userStory' : 'requirement') as any,
        title: req.idCode || `Req ${req.id}`,
        description: req.description || undefined,
        status: req.status || undefined,
        priority: req.priority || undefined,
      });
    });

    // Add test case nodes
    relatedTestCases.forEach((tc) => {
      nodes.push({
        id: `testCase-${tc.id}`,
        type: 'testCase' as any,
        title: tc.testId || `TC ${tc.id}`,
        description: tc.title || tc.description || undefined,
        status: tc.status || undefined,
        priority: tc.priority || undefined,
      });
    });

    // Add issue / defect nodes
    relatedIssues.forEach((issue) => {
      nodes.push({
        id: `issue-${issue.id}`,
        type: 'issue',
        title: issue.issueId || `Issue ${issue.id}`,
        description: issue.description || undefined,
        status: issue.status || undefined,
        priority: issue.priority || undefined,
      });
    });

    // Add deliverable nodes
    relatedDeliverables.forEach((del) => {
      nodes.push({
        id: `deliverable-${del.id}`,
        type: 'deliverable',
        title: del.deliverableId || `Del ${del.id}`,
        description: del.description || undefined,
        status: del.status || undefined,
      });
    });

    // Add risk nodes
    relatedRisks.forEach((risk) => {
      nodes.push({
        id: `risk-${risk.id}`,
        type: 'risk',
        title: risk.riskId || `Risk ${risk.id}`,
        description: risk.title || undefined,
        status: `Impact: ${risk.impact}, Prob: ${risk.probability}`,
      });
    });

    return nodes;
  }, [tasks, requirements, issues, deliverables, risks, testCasesData, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  const relationshipEdges: EntityEdge[] = useMemo(() => {
    const edges: EntityEdge[] = [];

    // Apply filters to get filtered tasks
    const filteredTasks = applyFilters(tasks || []);

    // Build a set of requirement idCodes that are user stories
    const userStoryCodes = new Set(
      (requirements || []).filter(isUserStory).map((r) => r.idCode)
    );

    // Task -> Requirement / User Story
    filteredTasks.forEach((task) => {
      if (task.requirementId) {
        const req = requirements?.find((r) => r.idCode === task.requirementId);
        if (req) {
          edges.push({
            from: `task-${task.id}`,
            to: `requirement-${req.id}`,
            label: userStoryCodes.has(req.idCode) ? 'implements user story' : 'implements',
          });
        }
      }
    });

    // Task -> Deliverable
    filteredTasks.forEach((task) => {
      if (task.deliverableId) {
        const del = deliverables?.find((d) => d.id === task.deliverableId);
        if (del) {
          edges.push({
            from: `task-${task.id}`,
            to: `deliverable-${del.id}`,
            label: 'contributes to',
          });
        }
      }
    });

    // Issue -> Requirement
    issues?.forEach((issue) => {
      if (issue.requirementId) {
        const req = requirements?.find((r) => r.idCode === issue.requirementId);
        if (req) {
          // Only add if req node is in the graph
          const reqNodeId = `requirement-${req.id}`;
          if (relationshipNodes.some((n) => n.id === reqNodeId)) {
            edges.push({
              from: `issue-${issue.id}`,
              to: reqNodeId,
              label: 'affects',
            });
          }
        }
      }
    });

    // Issue -> Task (blocks)
    issues?.forEach((issue) => {
      if (issue.taskId) {
        const task = filteredTasks.find((t) => t.taskId === issue.taskId);
        if (task) {
          edges.push({
            from: `issue-${issue.id}`,
            to: `task-${task.id}`,
            label: 'blocks',
          });
        }
      }
    });

    // Risk -> Task (threatens)
    risks?.forEach((risk) => {
      if ((risk as any).taskId) {
        const task = filteredTasks.find((t) => t.id === (risk as any).taskId);
        if (task) {
          edges.push({
            from: `risk-${risk.id}`,
            to: `task-${task.id}`,
            label: 'threatens',
          });
        }
      }
    });

    // Deliverable -> Requirement (fulfills)
    deliverables?.forEach((del) => {
      if ((del as any).requirementId) {
        const req = requirements?.find((r) => r.id === (del as any).requirementId);
        if (req) {
          edges.push({
            from: `deliverable-${del.id}`,
            to: `requirement-${req.id}`,
            label: 'fulfills',
          });
        }
      }
    });

    // Test Case -> Requirement (validates)
    testCasesData?.forEach((tc) => {
      if (tc.requirementId) {
        const req = requirements?.find((r) => r.idCode === tc.requirementId);
        if (req) {
          const tcNodeId = `testCase-${tc.id}`;
          if (relationshipNodes.some((n) => n.id === tcNodeId)) {
            edges.push({
              from: tcNodeId,
              to: `requirement-${req.id}`,
              label: 'validates',
            });
          }
        }
      }
    });

    // Test Case -> Issue/Defect (found defect)
    testCasesData?.forEach((tc) => {
      if (tc.defectId) {
        const issue = issues?.find((i) => i.issueId === tc.defectId);
        if (issue) {
          const tcNodeId = `testCase-${tc.id}`;
          if (relationshipNodes.some((n) => n.id === tcNodeId)) {
            edges.push({
              from: tcNodeId,
              to: `issue-${issue.id}`,
              label: 'found defect',
            });
          }
        }
      }
    });

    return edges;
  }, [tasks, requirements, issues, deliverables, risks, testCasesData, relationshipNodes, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  // Handle node click to open entity details
  const handleNodeClick = (node: EntityNode) => {
    const [type, idStr] = node.id.split('-');
    const id = parseInt(idStr);

    // TODO: Open the appropriate detail dialog based on entity type
    // For now, just show a toast
    toast.info(`Clicked on ${type}: ${node.title}`);

    // You can navigate to the appropriate page or open a dialog here
    // Example: window.location.href = `/${type}s?id=${id}`;
  };

  if (tasksLoading || requirementsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalToday = tasksToday.length + requirementsToday.length;
  const totalOverdue = tasksOverdue.length + requirementsOverdue.length;
  const totalUpcoming = tasksUpcoming.length + requirementsUpcoming.length;

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-gray-500" />
            Today's Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track tasks due today, overdue items, and upcoming deadlines</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-amber-700 border-amber-300">{tasksToday.length + requirementsToday.length} Due Today</Badge>
          <Badge variant="outline" className="text-red-700 border-red-300">{tasksOverdue.length + requirementsOverdue.length} Overdue</Badge>
          <Badge variant="outline" className="text-blue-700 border-blue-300">{tasksUpcoming.length + requirementsUpcoming.length} Upcoming</Badge>
        </div>
      </div>
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter & Group Tasks</CardTitle>
          <CardDescription>Customize your view to track tasks more effectively</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Task Code</Label>
              <Select value={filterTaskCode} onValueChange={setFilterTaskCode}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueTaskCodes.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Responsible</Label>
              <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueResponsibles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueStatuses.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniquePriorities.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Group By</Label>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="responsible">Responsible</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(filterResponsible !== "all" || filterStatus !== "all" || filterPriority !== "all" || filterTaskCode !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setFilterResponsible("all");
                setFilterStatus("all");
                setFilterPriority("all");
                setFilterTaskCode("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Due Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalToday}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasksToday.length} tasks, {requirementsToday.length} requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalOverdue}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasksOverdue.length} tasks, {requirementsOverdue.length} requirements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Next 7 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalUpcoming}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasksUpcoming.length} tasks, {requirementsUpcoming.length} requirements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Due Today Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-500" />
            Due Today
          </CardTitle>
          <CardDescription>
            Items scheduled for {formatDate(today.toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalToday === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks or requirements due today. Great job!
            </div>
          ) : (
            <div className="space-y-3">
              {tasksToday.map((task) => (
                <Card key={task.id} className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => window.location.href = `/tasks?edit=${task.taskId}`}>
                        <span className="font-mono text-sm font-medium">{task.taskId}</span>
                        <span className="text-sm">{task.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Responsible: {task.responsible || 'Unassigned'}
                        {task.assignDate && ` • Assigned: ${formatDate(task.assignDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={task.currentStatus || ""}
                        onValueChange={(newStatus) => {
                          const taskData = tasks?.find(t => t.id === task.id);
                          if (taskData) {
                            updateTaskMutation.mutate({
                              id: task.id,
                              taskId: taskData.taskId,
                              data: {
                                currentStatus: newStatus,
                              },
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions?.map((status) => (
                            <SelectItem key={status.id} value={status.value}>
                              {status.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              {requirementsToday.map((req) => (
                <Card key={req.id} className="p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{req.idCode}</span>
                        <span className="text-sm">{req.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {req.owner || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(req.status)}>
                        {req.status || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequirementStatusUpdate(req.id)}
                      >
                        {editingRequirementId === req.id ? 'Update' : 'Change Status'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Overdue Section */}
      {totalOverdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Overdue Items
            </CardTitle>
            <CardDescription>
              {totalOverdue} items are past their due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksOverdue.map((task) => (
                <Card key={task.id} className="p-4 border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => window.location.href = `/tasks?edit=${task.taskId}`}>
                        <span className="font-mono text-sm font-medium">{task.taskId}</span>
                        <span className="text-sm">{task.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ETD: {formatDate(task.dueDate) || 'No date'} • Responsible: {task.responsible || 'Unassigned'}
                        {task.assignDate && ` • Assigned: ${formatDate(task.assignDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={task.currentStatus || ""}
                        onValueChange={(newStatus) => {
                          const taskData = tasks?.find(t => t.id === task.id);
                          if (taskData) {
                            updateTaskMutation.mutate({
                              id: task.id,
                              taskId: taskData.taskId,
                              data: {
                                currentStatus: newStatus,
                              },
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions?.map((status) => (
                            <SelectItem key={status.id} value={status.value}>
                              {status.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              {requirementsOverdue.map((req) => (
                <Card key={req.id} className="p-4 border-red-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{req.idCode}</span>
                        <span className="text-sm">{req.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {req.updateDate || 'No date'} • Owner: {req.owner || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {req.status || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequirementStatusUpdate(req.id)}
                      >
                        {editingRequirementId === req.id ? 'Update' : 'Change Status'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Section */}
      {totalUpcoming > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Upcoming (Next 7 Days)
            </CardTitle>
            <CardDescription>
              {totalUpcoming} items due in the next week — tasks sorted by due date
              {filterResponsible !== "all" && ` · Filtered by: ${filterResponsible}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tasksUpcoming.map((task) => (
                <Card key={task.id} className="p-4 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => window.location.href = `/tasks?edit=${task.taskId}`}>
                        <span className="font-mono text-sm font-medium">{task.taskId}</span>
                        <span className="text-sm">{task.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ETD: {formatDate(task.dueDate) || 'No date'} • Responsible: {task.responsible || 'Unassigned'}
                        {task.assignDate && ` • Assigned: ${formatDate(task.assignDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={task.currentStatus || ""}
                        onValueChange={(newStatus) => {
                          const taskData = tasks?.find(t => t.id === task.id);
                          if (taskData) {
                            updateTaskMutation.mutate({
                              id: task.id,
                              taskId: taskData.taskId,
                              data: {
                                currentStatus: newStatus,
                              },
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions?.map((status) => (
                            <SelectItem key={status.id} value={status.value}>
                              {status.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              ))}
              {requirementsUpcoming.map((req) => (
                <Card key={req.id} className="p-4 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{req.idCode}</span>
                        <span className="text-sm">{req.description || 'No description'}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {req.updateDate || 'No date'} • Owner: {req.owner || 'Unassigned'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {req.status || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequirementStatusUpdate(req.id)}
                      >
                        {editingRequirementId === req.id ? 'Update' : 'Change Status'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationship Map */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Requirement Flow Map</CardTitle>
          <CardDescription>
            End-to-end traceability flow: Requirements → User Stories → Tasks → Test Cases → Defects
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[700px]">
          <RelationshipMap
            nodes={relationshipNodes}
            edges={relationshipEdges}
            onNodeClick={handleNodeClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
