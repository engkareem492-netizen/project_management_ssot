import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle, Clock, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Today() {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskStatus, setEditingTaskStatus] = useState("");
  const [editingRequirementId, setEditingRequirementId] = useState<number | null>(null);
  const [editingRequirementStatus, setEditingRequirementStatus] = useState("");

  const utils = trpc.useUtils();
  const { data: tasks, isLoading: tasksLoading } = trpc.tasks.list.useQuery();
  const { data: requirements, isLoading: requirementsLoading } = trpc.requirements.list.useQuery();
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

  // Categorize tasks
  const tasksToday = useMemo(() => {
    return tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() === today.getTime();
    }) || [];
  }, [tasks, today]);

  const tasksOverdue = useMemo(() => {
    return tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() < today.getTime() && t.currentStatus !== "Completed";
    }) || [];
  }, [tasks, today]);

  const tasksUpcoming = useMemo(() => {
    return tasks?.filter(t => {
      const dueDate = parseDate(t.dueDate);
      return dueDate && dueDate.getTime() > today.getTime() && dueDate.getTime() <= sevenDaysLater.getTime();
    }) || [];
  }, [tasks, today, sevenDaysLater]);

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
                      <div className="flex items-center gap-2">
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
                      <div className="flex items-center gap-2">
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
                <Card key={task.id} className="p-4 bg-amber-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
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
    </div>
  );
}
