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

  const tasksOverdue = useMemo(() => {
    const filtered = tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() < today.getTime() && t.currentStatus !== "Completed";
    }) || [];
    return applyFilters(filtered);
  }, [tasks, today, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  const tasksUpcoming = useMemo(() => {
    const filtered = tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() > today.getTime() && dueDate.getTime() <= sevenDaysLater.getTime();
    }) || [];
    return applyFilters(filtered);
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

    // Find issues linked to filtered tasks
    const relatedIssues = issues?.filter((issue) => {
      if (issue.taskId && relatedIssueTaskCodes.has(issue.taskId)) return true;
      if (issue.requirementId && relatedRequirementCodes.has(issue.requirementId)) return true;
      return false;
    }) || [];

    // Find risks linked to filtered tasks
    const relatedRisks = risks?.filter((risk) => {
      if ((risk as any).taskId) {
        const task = filteredTasks.find((t) => t.id === (risk as any).taskId);
        if (task) return true;
      }
      return false;
    }) || [];

    // Find requirements linked to filtered tasks
    const relatedRequirements = requirements?.filter((req) => {
      return relatedRequirementCodes.has(req.idCode);
    }) || [];

    // Find deliverables linked to filtered tasks
    const relatedDeliverables = deliverables?.filter((del) => {
      return relatedDeliverableIds.has(del.id);
    }) || [];

    // Add task nodes (only filtered tasks)
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

    // Add only related requirement nodes
    relatedRequirements.forEach((req) => {
      nodes.push({
        id: `requirement-${req.id}`,
        type: 'requirement',
        title: req.idCode || `Req ${req.id}`,
        description: req.description || undefined,
        status: req.status || undefined,
        priority: req.priority || undefined,
      });
    });

    // Add only related issue nodes
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

    // Add only related deliverable nodes
    relatedDeliverables.forEach((del) => {
      nodes.push({
        id: `deliverable-${del.id}`,
        type: 'deliverable',
        title: del.deliverableId || `Del ${del.id}`,
        description: del.description || undefined,
        status: del.status || undefined,
      });
    });

    // Add only related risk nodes
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
  }, [tasks, requirements, issues, deliverables, risks, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

  const relationshipEdges: EntityEdge[] = useMemo(() => {
    const edges: EntityEdge[] = [];

    // Apply filters to get filtered tasks
    const filteredTasks = applyFilters(tasks || []);

    // Task -> Requirement connections (only for filtered tasks)
    filteredTasks.forEach((task) => {
      if (task.requirementId) {
        // requirementId is stored as string (idCode), find by idCode
        const req = requirements?.find((r) => r.idCode === task.requirementId);
        if (req) {
          edges.push({
            from: `task-${task.id}`,
            to: `requirement-${req.id}`,
            label: 'implements',
          });
        }
      }
    });

    // Task -> Deliverable connections (only for filtered tasks)
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

    // Issue -> Requirement connections
    issues?.forEach((issue) => {
      if (issue.requirementId) {
        // requirementId is stored as string (idCode), find by idCode
        const req = requirements?.find((r) => r.idCode === issue.requirementId);
        if (req) {
          edges.push({
            from: `issue-${issue.id}`,
            to: `requirement-${req.id}`,
            label: 'affects',
          });
        }
      }
    });

    // Issue -> Task connections (only if task is in filtered list)
    issues?.forEach((issue) => {
      if (issue.taskId) {
        // taskId is stored as string (taskId code), find by taskId in filtered tasks
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

    // Risk -> Task connections (only if task is in filtered list)
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

    // Deliverable -> Requirement connections
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

    return edges;
  }, [tasks, requirements, issues, deliverables, risks, filterResponsible, filterStatus, filterPriority, filterTaskCode]);

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
            Items scheduled for {today.toLocaleDateString()}
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
                        {task.assignDate && ` • Assigned: ${task.assignDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusColor(task.currentStatus)}>
                        {task.currentStatus || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskStatusUpdate(task.id)}
                      >
                        {editingTaskId === task.id ? 'Update' : 'Change Status'}
                      </Button>
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
                        ETD: {task.dueDate || 'No date'} • Responsible: {task.responsible || 'Unassigned'}
                        {task.assignDate && ` • Assigned: ${task.assignDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">
                        {task.currentStatus || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskStatusUpdate(task.id)}
                      >
                        {editingTaskId === task.id ? 'Update' : 'Change Status'}
                      </Button>
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
              {totalUpcoming} items due in the next week
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
                        ETD: {task.dueDate || 'No date'} • Responsible: {task.responsible || 'Unassigned'}
                        {task.assignDate && ` • Assigned: ${task.assignDate}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {task.currentStatus || 'N/A'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTaskStatusUpdate(task.id)}
                      >
                        {editingTaskId === task.id ? 'Update' : 'Change Status'}
                      </Button>
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
          <CardTitle className="text-lg">Relationship Map</CardTitle>
          <CardDescription>Visual representation of connections between Tasks, Requirements, Issues, Risks, and Deliverables</CardDescription>
        </CardHeader>
        <CardContent className="h-[600px]">
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
