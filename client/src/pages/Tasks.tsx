import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { TasksByResponsibleChart } from "@/components/TasksByResponsibleChart";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Edit, History, Loader2, Plus, Trash2, Settings, Eye, Save, X, CheckSquare, Info, AlertCircle, Link2, GitBranch, RefreshCw, ArrowRight, ChevronDown, ChevronRight, ListTree, LayoutList, AlignJustify, Users, CalendarDays } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownOptionsManager } from "@/components/DropdownOptionsManager";
import { SelectWithCreate } from "@/components/SelectWithCreate";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";
import { KanbanBoard, KanbanItem, KanbanColumn } from "@/components/KanbanBoard";
import { LayoutGrid } from "lucide-react";
import { SavedViews } from "@/components/SavedViews";
import { TaskCalendar } from "@/components/TaskCalendar";

export default function Tasks() {
  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedEntityId, setSelectedEntityId] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsType, setSettingsType] = useState<"status" | "priority">("status");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [addStakeholderDialogOpen, setAddStakeholderDialogOpen] = useState(false);
  const [newStakeholder, setNewStakeholder] = useState({ fullName: '', position: '', role: '' });
  const [addTaskGroupDialogOpen, setAddTaskGroupDialogOpen] = useState(false);
  const [newTaskGroupName, setNewTaskGroupName] = useState('');
  const [addRequirementDialogOpen, setAddRequirementDialogOpen] = useState(false);
  const [addDeliverableDialogOpen, setAddDeliverableDialogOpen] = useState(false);
  const [newDeliverable, setNewDeliverable] = useState({ description: '', status: 'Pending', dueDate: '' });
  const [newRequirement, setNewRequirement] = useState<{
    description: string;
    taskGroup: string;
    issueGroup: string;
    ownerId: number | undefined;
    status: string;
    priority: string;
    type: string;
    category: string;
    sourceType: string;
    refSource: string;
    createdAt: string;
  }>({
    description: '',
    taskGroup: '',
    issueGroup: '',
    ownerId: undefined,
    status: 'Open',
    priority: 'Medium',
    type: '',
    category: '',
    sourceType: '',
    refSource: '',
    createdAt: new Date().toISOString().split('T')[0],
  });
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<any>(null);
  const [statusUpdateText, setStatusUpdateText] = useState('');
  const [requirementDetailDialogOpen, setRequirementDetailDialogOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any>(null);
  const [deliverableDetailDialogOpen, setDeliverableDetailDialogOpen] = useState(false);
  const [taskGroupDialogOpen, setTaskGroupDialogOpen] = useState(false);
  const [issueGroupDialogOpen, setIssueGroupDialogOpen] = useState(false);
  const [newTaskGroup, setNewTaskGroup] = useState({ name: '', description: '' });
  const [newIssueGroup, setNewIssueGroup] = useState({ name: '', description: '' });
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  const [linkRequirement, setLinkRequirement] = useState(false);
  const [addIssueDialogOpen, setAddIssueDialogOpen] = useState(false);
  const [selectedIssueToLink, setSelectedIssueToLink] = useState<string>('');
  const [editingIssueId, setEditingIssueId] = useState<number | null>(null);
  const [editIssueData, setEditIssueData] = useState<any>({});
  const [deletingIssueId, setDeletingIssueId] = useState<number | null>(null);
  const [deleteIssueDialogOpen, setDeleteIssueDialogOpen] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [responsibleFilter, setResponsibleFilter] = useState<string | null>(null);

  // Sub-task state
  const [subTaskDialogOpen, setSubTaskDialogOpen] = useState(false);
  const [parentTaskForSubTask, setParentTaskForSubTask] = useState<any>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [newSubTask, setNewSubTask] = useState({ description: '', status: 'Not Started', priority: 'Medium', dueDate: '' });

  // Follow-up task state
  const [followUpDialogOpen, setFollowUpDialogOpen] = useState(false);
  const [sourceTaskForFollowUp, setSourceTaskForFollowUp] = useState<any>(null);
  const [newFollowUp, setNewFollowUp] = useState({ description: '', status: 'Not Started', priority: 'Medium', dueDate: '', notes: '' });

  // Quick-log decision from task
  const [showQuickDecision, setShowQuickDecision] = useState(false);
  const [quickDecisionForm, setQuickDecisionForm] = useState({ title: '', description: '', decidedBy: '', impact: '', status: 'Open' as const });
  const [taskDetailTab, setTaskDetailTab] = useState('details');

  // View mode: 'normal' | 'compact' | 'kanban' | 'calendar'
  const [viewMode, setViewMode] = useState<'normal' | 'compact' | 'kanban' | 'calendar'>(() => {
    return (localStorage.getItem('tasks-view-mode') as 'normal' | 'compact' | 'kanban' | 'calendar') || 'normal';
  });
  const cycleViewMode = () => {
    setViewMode((prev) => {
      const order: Array<'normal' | 'compact' | 'kanban' | 'calendar'> = ['normal', 'compact', 'kanban', 'calendar'];
      const next = order[(order.indexOf(prev) + 1) % order.length];
      localStorage.setItem('tasks-view-mode', next);
      return next;
    });
  };
  const toggleViewMode = cycleViewMode;

  // Recurring task state
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [taskForRecurring, setTaskForRecurring] = useState<any>(null);
  const [recurringConfig, setRecurringConfig] = useState({ recurringType: 'weekly', recurringInterval: 1, recurringEndDate: '' });

  const [newIssue, setNewIssue] = useState({
    description: '',
    owner: '',
    status: 'Open',
    priority: 'Medium',
    issueGroup: '',
    type: '',
    class: '',
  });
  const [newTask, setNewTask] = useState<any>({
    taskGroup: '',
    description: '',
    responsibleId: undefined,
    accountableId: undefined,
    consultedId: undefined,
    informedId: undefined,
    ownerId: undefined,
    subjectId: undefined,
    status: 'Not Started',
    priority: 'Medium',
    requirementId: '',
    issueId: '',
    dueDate: '',
    assignDate: new Date().toISOString().split('T')[0],
    taskCategory: 'task' as 'task' | 'communication',
    recurringType: 'none' as string,
  });

  const [mainTab, setMainTab] = useState<'tasks' | 'communication'>('tasks');
  const { data: tasks, isLoading, refetch } = trpc.tasks.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const commTasks = (tasks || []).filter((t: any) => t.taskCategory === 'communication' || (t.taskId || '').startsWith('COMM-'));
  const regularTasks = (tasks || []).filter((t: any) => t.taskCategory !== 'communication' && !(t.taskId || '').startsWith('COMM-'));

  // Handle taskId query parameter from URL
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const taskId = urlParams.get('taskId');
      if (taskId) {
        const task = tasks.find(t => t.taskId === taskId);
        if (task) {
          handleViewDetails(task);
          // Clear the query parameter
          window.history.replaceState({}, '', '/tasks');
        }
      }
    }
  }, [tasks]);
  const { data: stakeholders } = trpc.stakeholders.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: requirements } = trpc.requirements.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: deliverables } = trpc.deliverables.list.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: allIssues } = trpc.issues.list.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: linkedIssues } = trpc.issues.getByEntity.useQuery(
    { entityType: "task", entityId: selectedTask?.taskId || "" },
    { enabled: viewDialogOpen && !!selectedTask?.taskId }
  );
  const { data: allDecisions } = trpc.meetings.listDecisions.useQuery({ projectId: currentProjectId! }, { enabled: !!currentProjectId });
  const { data: actionLogs } = trpc.actionLogs.getByEntity.useQuery(
    { entityType: "task", entityId: selectedEntityId },
    { enabled: historyDialogOpen && !!selectedEntityId }
  );
  const { data: taskGroups } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: issueGroups } = trpc.dropdownOptions.issueGroups.getAll.useQuery(
    { projectId: currentProjectId || 0 },
    { enabled: !!currentProjectId }
  );
  const { data: statusOptions } = trpc.dropdownOptions.status.getAll.useQuery();

  // Helper: check if a task's status is marked as "complete" in statusOptions
  const isTaskComplete = (task: any): boolean => {
    const statusVal = (task.status || task.currentStatus || '').toLowerCase();
    if (!statusOptions) return false;
    const match = statusOptions.find((s: any) => (s.value || '').toLowerCase() === statusVal);
    return match?.isComplete === true;
  };
  const { data: priorityOptions } = trpc.dropdownOptions.priority.getAll.useQuery();

  const utils = trpc.useUtils();

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created successfully`);
      setNewTask({ ...newTask, taskGroup: data.name });
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      setAddTaskGroupDialogOpen(false);
      setNewTaskGroupName('');
    },
    onError: (error) => {
      toast.error(`Failed to create task group: ${error.message}`);
    },
  });

  const createTaskGroupForRequirementMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task Group "${data.name}" created successfully`);
      setNewRequirement({ ...newRequirement, taskGroup: data.name });
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      setTaskGroupDialogOpen(false);
      setNewTaskGroup({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create task group: ${error.message}`);
    },
  });

  const createIssueGroupForRequirementMutation = trpc.dropdownOptions.issueGroups.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Issue Group "${data.name}" created successfully`);
      setNewRequirement({ ...newRequirement, issueGroup: data.name });
      utils.dropdownOptions.issueGroups.getAll.invalidate();
      setIssueGroupDialogOpen(false);
      setNewIssueGroup({ name: '', description: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create issue group: ${error.message}`);
    },
  });

  const createRequirementMutation = trpc.requirements.create.useMutation({
      onSuccess: (data) => {
      toast.success(`Requirement "${data.idCode}" created successfully`);
      setNewTask({ ...newTask, requirementId: data.idCode });
      utils.requirements.list.invalidate();
      setAddRequirementDialogOpen(false);
      setNewRequirement({
        description: '',
        taskGroup: '',
        issueGroup: '',
        ownerId: undefined,
        status: 'Open',
        priority: 'Medium',
        type: '',
        category: '',
        sourceType: '',
        refSource: '',
        createdAt: new Date().toISOString().split('T')[0],
      });
    },
    onError: (error) => {
      toast.error(`Failed to create requirement: ${error.message}`);
    },
  });

  const createDeliverableMutation = trpc.deliverables.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Deliverable "${data.deliverableId}" created successfully`);
      setNewTask({ ...newTask, deliverableId: data.id });
      utils.deliverables.list.invalidate();
      setAddDeliverableDialogOpen(false);
      setNewDeliverable({ description: '', status: 'Pending', dueDate: '' });
    },
    onError: (error) => {
      toast.error(`Failed to create deliverable: ${error.message}`);
    },
  });

  const createIssueMutation = trpc.issues.create.useMutation({
    onSuccess: async (data) => {
      toast.success(`Issue "${data.issueId}" created successfully`);
      
      // Link the newly created issue to the task
      if (selectedTask?.taskId && data.issueId) {
        // Find the issue by issueId to get its numeric ID
        await utils.issues.list.invalidate();
        const allIssuesData = await utils.issues.list.fetch({ projectId: currentProjectId! });
        const createdIssue = allIssuesData?.find(iss => iss.issueId === data.issueId);
        
        if (createdIssue) {
          await linkIssueMutation.mutateAsync({
            issueId: createdIssue.id,
            entityType: 'task',
            entityId: selectedTask.taskId,
          });
        }
      }
      
      setAddIssueDialogOpen(false);
      setNewIssue({
        description: '',
        owner: '',
        status: 'Open',
        priority: 'Medium',
        issueGroup: '',
        type: '',
        class: '',
      });
      utils.issues.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create issue: ${error.message}`);
    },
  });

  const linkIssueMutation = trpc.issues.addLink.useMutation({
    onSuccess: () => {
      toast.success('Issue linked successfully');
      setSelectedIssueToLink('');
      utils.issues.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Link failed: ${error.message}`);
    },
  });

  const updateIssueMutation = trpc.issues.update.useMutation({
    onSuccess: () => {
      toast.success('Issue updated successfully');
      setEditingIssueId(null);
      setEditIssueData({});
      utils.issues.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const deleteIssueMutation = trpc.issues.delete.useMutation({
    onSuccess: () => {
      toast.success('Issue deleted successfully');
      setDeleteIssueDialogOpen(false);
      setDeletingIssueId(null);
      utils.issues.getByEntity.invalidate();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const createDecisionFromTaskMutation = trpc.meetings.createDecision.useMutation({
    onSuccess: () => {
      toast.success('Decision logged and linked to task');
      utils.meetings.listDecisions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.tasks.update.useMutation({
    onSuccess: (data) => {
      toast.success('Task updated successfully');
      setEditingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  const createMutation = trpc.tasks.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Task ${data.taskId} created successfully`);
      setCreateDialogOpen(false);
      setLinkRequirement(false);
      setNewTask({
        taskGroup: '',
        description: '',
        responsible: '',
        accountable: '',
        consulted: '',
        informed: '',
        owner: '',
        status: 'Not Started',
        priority: 'Medium',
        requirementId: '',
        dueDate: '',
        assignDate: new Date().toISOString().split('T')[0],
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Create failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.tasks.delete.useMutation({
    onSuccess: () => {
      toast.success('Task deleted successfully');
      setDeleteDialogOpen(false);
      setDeletingId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.tasks.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} task(s) deleted`);
      setSelectedTaskIds([]);
      refetch();
    },
    onError: (error) => toast.error(`Bulk delete failed: ${error.message}`),
  });

  const bulkUpdateStatusMutation = trpc.tasks.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} task(s) updated`);
      setSelectedTaskIds([]);
      setBulkStatusDialogOpen(false);
      setBulkStatus("");
      refetch();
    },
    onError: (error) => toast.error(`Bulk update failed: ${error.message}`),
  });

  const handleToggleSelectTask = (id: number) => {
    setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSelectAllTasks = () => {
    if (!filteredTasks) return;
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map(t => t.id));
    }
  };

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Stakeholder ${data.fullName} created successfully`);
      setAddStakeholderDialogOpen(false);
      setNewStakeholder({ fullName: '', position: '', role: '' });
      // Refetch stakeholders to update dropdowns
      trpc.useUtils().stakeholders.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Failed to create stakeholder: ${error.message}`);
    },
  });

  // Sub-task mutation
  const createSubTaskMutation = trpc.tasks.createSubTask.useMutation({
    onSuccess: (data) => {
      toast.success(`Sub-task ${data.taskId} created`);
      setSubTaskDialogOpen(false);
      setNewSubTask({ description: '', status: 'Not Started', priority: 'Medium', dueDate: '' });
      refetch();
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  // Follow-up mutation
  const createFollowUpMutation = trpc.tasks.createFollowUp.useMutation({
    onSuccess: (data) => {
      toast.success(`Follow-up task ${data.taskId} created`);
      setFollowUpDialogOpen(false);
      setNewFollowUp({ description: '', status: 'Not Started', priority: 'Medium', dueDate: '', notes: '' });
      refetch();
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  // Recurring config mutation
  const setRecurringMutation = trpc.tasks.setRecurring.useMutation({
    onSuccess: () => {
      toast.success('Recurring schedule saved');
      setRecurringDialogOpen(false);
      refetch();
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`),
  });

  // Helpers
  const toggleExpand = (taskId: number) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const getSubTasks = (parentId: number) => tasks?.filter((t: any) => t.parentTaskId === parentId) || [];

  const filteredTasks = tasks?.filter(task => {
    // Exclude COMM- tasks from the main Tasks tab — they live in Communication Tasks tab
    if ((task.taskId || '').startsWith('COMM-') || task.taskCategory === 'communication') return false;
    const matchesSearch =
      task.taskId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.responsible?.toLowerCase().includes(searchTerm.toLowerCase());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const matchesResponsible = (() => {
      if (!responsibleFilter) return true;
      if (responsibleFilter === '__overdue__') {
        if (!task.dueDate) return false;
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const statusVal = (task.currentStatus || task.status || '').toLowerCase();
        const isComplete = statusOptions?.find((s: any) => (s.value || '').toLowerCase() === statusVal)?.isComplete;
        return due < today && !isComplete;
      }
      if (responsibleFilter === '__high_priority__') {
        return ['high', 'critical'].includes((task.priority || '').toLowerCase());
      }
      if (responsibleFilter === '__open__') {
        const statusVal = (task.currentStatus || task.status || '').toLowerCase();
        const isComplete = statusOptions?.find((s: any) => (s.value || '').toLowerCase() === statusVal)?.isComplete;
        return !isComplete;
      }
      if (responsibleFilter === '__my_tasks__') {
        // Filter by current user name if available
        return true; // fallback: show all
      }
      return (task.responsible || 'Unassigned') === responsibleFilter;
    })();
    return matchesSearch && matchesResponsible;
  });

  const getRequirementStatus = (requirementId: string | null) => {
    if (!requirementId || !requirements) return null;
    const req = requirements.find(r => r.idCode === requirementId);
    return req?.status || null;
  };

  const handleEdit = (task: any) => {
    setEditingId(task.id);
    setEditData({
      currentStatus: task.currentStatus || '',
      lastUpdate: task.lastUpdate || '',
      statusUpdate: task.statusUpdate || '',
    });
  };

  const handleSave = (task: any) => {
    updateMutation.mutate({
      id: task.id,
      taskId: task.taskId,
      data: editData,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleStatusUpdate = () => {
    if (!selectedTaskForStatus || !statusUpdateText.trim()) return;
    
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const updateText = `[${now}] ${statusUpdateText.trim()}`;
    
    updateMutation.mutate({
      id: selectedTaskForStatus.id,
      taskId: selectedTaskForStatus.taskId,
      data: {
        currentStatus: statusUpdateText.trim(),
        statusUpdate: updateText,
      },
    }, {
      onSuccess: () => {
        setStatusUpdateDialogOpen(false);
        setStatusUpdateText('');
        setSelectedTaskForStatus(null);
      },
    });
  };

  const showHistory = (taskId: string) => {
    setSelectedEntityId(taskId);
    setHistoryDialogOpen(true);
  };

  const handleCreate = () => {
    if (!currentProjectId) {
      toast.error('No project selected. Please select a project first.');
      return;
    }
    if (!newTask.description || !newTask.description.trim()) {
      toast.error('Description is required');
      return;
    }
    // Only include requirementId if linkRequirement checkbox is checked
    const taskData: any = {
      ...newTask,
      projectId: currentProjectId!,
      requirementId: linkRequirement && newTask.requirementId && newTask.requirementId !== "none" ? newTask.requirementId : undefined,
      dueDate: newTask.dueDate || undefined,
      // Preserve assignDate default value (today's date) if not changed
      assignDate: newTask.assignDate,
    };
    
    // Clean up empty strings and convert to undefined to prevent SQL errors
    Object.keys(taskData).forEach(key => {
      if (taskData[key] === '' || taskData[key] === 'none') {
        taskData[key] = undefined;
      }
    });
    
    createMutation.mutate(taskData);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleViewRequirementDetails = (requirementId: string | number) => {
    const requirement = requirements?.find(r => r.idCode === requirementId || r.id === requirementId);
    if (requirement) {
      setSelectedRequirement(requirement);
      setRequirementDetailDialogOpen(true);
    }
  };

  const handleViewDeliverableDetails = (deliverableId: number) => {
    const deliverable = deliverables?.find(d => d.id === deliverableId);
    if (deliverable) {
      setSelectedDeliverable(deliverable);
      setDeliverableDetailDialogOpen(true);
    }
  };

  const handleViewDetails = (task: any) => {
    setSelectedTask(task);
    setIsEditMode(false);
    setTaskDetailTab('details');
    setShowQuickDecision(false);
    setEditFormData({
      taskGroup: task.taskGroup || '',
      description: task.description || '',
      responsibleId: task.responsibleId,
      accountableId: task.accountableId,
      consultedId: task.consultedId,
      informedId: task.informedId,
      ownerId: task.ownerId,
      status: task.status || '',
      priority: task.priority || '',
      requirementId: task.requirementId || '',
      deliverableId: task.deliverableId ? task.deliverableId.toString() : '',
      issueId: task.issueId || '',
      dueDate: task.dueDate || '',
      assignDate: task.assignDate || '',
      newStatusUpdate: '',
      manHours: task.manHours != null ? parseFloat(task.manHours) : undefined,
    });
    setViewDialogOpen(true);
  };

  const handleEditDetails = (task: any) => {
    setSelectedTask(task);
    setIsEditMode(true);
    setEditFormData({
      taskGroup: task.taskGroup || '',
      description: task.description || '',
      responsibleId: task.responsibleId,
      accountableId: task.accountableId,
      consultedId: task.consultedId,
      informedId: task.informedId,
      ownerId: task.ownerId,
      status: task.status || '',
      priority: task.priority || '',
      requirementId: task.requirementId || '',
      deliverableId: task.deliverableId ? task.deliverableId.toString() : '',
      issueId: task.issueId || '',
      dueDate: task.dueDate || '',
      assignDate: task.assignDate || '',
      newStatusUpdate: '',
      manHours: task.manHours != null ? parseFloat(task.manHours) : undefined,
    });
    setViewDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTask) return;
    // Convert deliverableId from string to number (Select stores values as strings)
    const dataToSave = {
      ...editFormData,
      deliverableId: editFormData.deliverableId ? parseInt(editFormData.deliverableId) : undefined,
      // Handle new status update if provided
      ...(editFormData.newStatusUpdate?.trim() ? {
        currentStatus: editFormData.newStatusUpdate.trim(),
        statusUpdate: `[${new Date().toISOString().split('T')[0]}] ${editFormData.newStatusUpdate.trim()}`,
      } : {}),
    };
    // Remove the UI-only field before sending to server
    delete dataToSave.newStatusUpdate;
    updateMutation.mutate({
      id: selectedTask.id,
      taskId: selectedTask.taskId,
      data: dataToSave,
    }, {
      onSuccess: () => {
        setIsEditMode(false);
        setViewDialogOpen(false);
      }
    });
  };

  const confirmDelete = () => {
    if (deletingId) {
      deleteMutation.mutate({ id: deletingId });
    }
  };

  const handleEditIssue = (issue: any) => {
    setEditingIssueId(issue.id);
    setEditIssueData({
      status: issue.status || '',
      priority: issue.priority || '',
      deliverables1: issue.deliverables1 || '',
      d1Status: issue.d1Status || '',
      deliverables2: issue.deliverables2 || '',
      d2Status: issue.d2Status || '',
      lastUpdate: issue.lastUpdate || '',
      updateDate: issue.updateDate || '',
    });
  };

  const handleSaveIssue = (issue: any) => {
    updateIssueMutation.mutate({
      id: issue.id,
      issueId: issue.issueId,
      data: editIssueData,
    });
  };

  const handleCancelEditIssue = () => {
    setEditingIssueId(null);
    setEditIssueData({});
  };

  const handleDeleteIssue = (id: number) => {
    setDeletingIssueId(id);
    setDeleteIssueDialogOpen(true);
  };

  const confirmDeleteIssue = () => {
    if (deletingIssueId) {
      deleteIssueMutation.mutate({ id: deletingIssueId });
    }
  };

  const handleCreateStakeholder = () => {
    if (!newStakeholder.fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!currentProjectId) {
      toast.error('No project selected');
      return;
    }
    createStakeholderMutation.mutate({ ...newStakeholder, projectId: currentProjectId });
  };

  const getStatusColor = (status: string | null) => {
    if (!status) return "secondary";
    if (status === "Completed" || status === "Done") return "default";
    if (status === "In Progress") return "outline";
    return "secondary";
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return "secondary";
    if (priority === "Critical" || priority === "Very High") return "destructive";
    if (priority === "High") return "default";
    if (priority === "Medium") return "outline";
    return "secondary";
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
      {/* Dashboard Chart */}
      <TasksByResponsibleChart
        tasks={tasks || []}
        selectedResponsible={responsibleFilter}
        onResponsibleSelect={(name) => {
          setResponsibleFilter(prev => prev === name ? null : name);
        }}
      />

      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-gray-500" />
            Tasks Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">View, edit, and track changes to project tasks</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-blue-700 border-blue-300">{tasks?.length || 0} Tasks</Badge>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("status"); setSettingsOpen(true); }} className="border-blue-300 hover:bg-blue-50 text-blue-700">
            <Settings className="w-4 h-4 mr-1" />Status
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setSettingsType("priority"); setSettingsOpen(true); }} className="border-blue-300 hover:bg-blue-50 text-blue-700">
            <Settings className="w-4 h-4 mr-1" />Priority
          </Button>
          {currentProjectId && (
            <ImportExportToolbar
              module="tasks"
              projectId={currentProjectId}
              onImportSuccess={() => {}}
            />
          )}
        </div>
      </div>
      {/* Main Tab Bar */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden">
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${mainTab === 'tasks' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setMainTab('tasks')}
        >
          Tasks ({regularTasks.length})
        </button>
        <button
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${mainTab === 'communication' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          onClick={() => setMainTab('communication')}
        >
          Communication Tasks ({commTasks.length})
        </button>
      </div>

      {mainTab === 'communication' ? (
        <Card className="border-orange-100">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-orange-700">Communication Tasks</h2>
                <p className="text-sm text-gray-500">Tasks generated from the Communication Plan (COMM- prefix)</p>
              </div>
              <Button onClick={() => { setNewTask((p: any) => ({ ...p, taskCategory: 'communication' })); setCreateDialogOpen(true); }} className="bg-orange-600 hover:bg-orange-700">
                <Plus className="w-4 h-4 mr-2" />New COMM Task
              </Button>
            </div>
            {commTasks.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No communication tasks yet</p>
                <p className="text-sm mt-1">Tasks created from the Communication Plan will appear here</p>
              </div>
            ) : (
              <div className="rounded-md border border-orange-100 overflow-hidden">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="bg-orange-50">
                      <TableHead className="px-3 font-semibold text-orange-700">Task ID</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Description</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Subject</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Responsible</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Due Date</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Recurring</TableHead>
                      <TableHead className="px-3 font-semibold text-orange-700">Status</TableHead>
                      <TableHead className="px-3 text-right font-semibold text-orange-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commTasks.map((task: any) => (
                      <TableRow key={task.id} className="hover:bg-orange-50/50">
                        <TableCell className="px-3 py-2">
                          <span className="font-mono text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{task.taskId}</span>
                        </TableCell>
                        <TableCell className="px-3 py-2 max-w-xs truncate">{task.description}</TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-600">{task.subject || '—'}</TableCell>
                        <TableCell className="px-3 py-2 text-sm text-gray-600">{task.responsible || '—'}</TableCell>
                        <TableCell className="px-3 py-2 text-sm">{task.dueDate ? formatDate(task.dueDate) : '—'}</TableCell>
                        <TableCell className="px-3 py-2">
                          {task.recurringType && task.recurringType !== 'none' ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                              <RefreshCw className="w-3 h-3 mr-1" />{task.recurringType}
                            </Badge>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </TableCell>
                        <TableCell className="px-3 py-2">
                          <Badge variant="secondary" className="text-xs">{task.status || 'Not Started'}</Badge>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleViewDetails(task)}><Eye className="w-4 h-4" /></Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeletingId(task.id); setDeleteDialogOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
      <>
      <Card className="border-blue-100">
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by Task ID, description, or responsible..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleViewMode}
              title={`Switch to ${viewMode === 'normal' ? 'Compact' : viewMode === 'compact' ? 'Board' : viewMode === 'kanban' ? 'Calendar' : 'Normal'} View`}
            >
              {viewMode === 'normal' ? (
                <><AlignJustify className="w-4 h-4 mr-1" />Compact</>
              ) : viewMode === 'compact' ? (
                <><LayoutGrid className="w-4 h-4 mr-1" />Board</>
              ) : viewMode === 'kanban' ? (
                <><CalendarDays className="w-4 h-4 mr-1" />Calendar</>
              ) : (
                <><LayoutList className="w-4 h-4 mr-1" />Normal</>
              )}
            </Button>
          </div>

          {/* Quick filter chips + Saved Views row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {(['Overdue', 'High Priority', 'Open', 'My Tasks'] as const).map(chip => {
              const today = new Date();
              const isActive = (() => {
                if (chip === 'Overdue') return responsibleFilter === '__overdue__';
                if (chip === 'High Priority') return responsibleFilter === '__high_priority__';
                if (chip === 'Open') return responsibleFilter === '__open__';
                if (chip === 'My Tasks') return responsibleFilter === '__my_tasks__';
                return false;
              })();
              return (
                <button
                  key={chip}
                  onClick={() => {
                    const key = chip === 'Overdue' ? '__overdue__' : chip === 'High Priority' ? '__high_priority__' : chip === 'Open' ? '__open__' : '__my_tasks__';
                    setResponsibleFilter(isActive ? null : key);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isActive
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
            <div className="ml-auto">
              <SavedViews
                storageKey={`tasks-saved-views-${currentProjectId}`}
                currentFilters={{ search: searchTerm, responsible: responsibleFilter, viewMode }}
                onApply={(f: any) => {
                  if (f.search !== undefined) setSearchTerm(f.search);
                  if (f.responsible !== undefined) setResponsibleFilter(f.responsible);
                  if (f.viewMode !== undefined) setViewMode(f.viewMode);
                }}
              />
            </div>
          </div>

          {/* Responsible Filter Badge */}
          {responsibleFilter && !['__overdue__','__high_priority__','__open__','__my_tasks__'].includes(responsibleFilter) && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-muted-foreground">Filtered by responsible:</span>
              <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setResponsibleFilter(null)}>
                {responsibleFilter}
                <X className="w-3 h-3" />
              </Badge>
              <span className="text-xs text-muted-foreground">({filteredTasks?.length ?? 0} tasks) — click badge or chart bar to clear</span>
            </div>
          )}

          {/* Bulk Action Toolbar */}
          {selectedTaskIds.length > 0 && (
            <div className="flex items-center gap-3 mb-4 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
              <span className="text-sm font-medium text-primary">{selectedTaskIds.length} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setBulkStatusDialogOpen(true)}
                >
                  <CheckSquare className="w-4 h-4 mr-1" />
                  Update Status
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Delete ${selectedTaskIds.length} selected task(s)? This cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ ids: selectedTaskIds });
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete Selected
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedTaskIds([])}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className={viewMode === 'kanban' || viewMode === 'calendar' ? '' : 'rounded-md border border-primary/20 overflow-hidden'}>
            {viewMode === 'calendar' ? (
              /* ── CALENDAR VIEW ── */
              <TaskCalendar
                tasks={(filteredTasks ?? []) as any}
                onTaskClick={(t) => {
                  const task = tasks?.find((x: any) => x.id === t.id);
                  if (task) handleViewDetails(task);
                }}
              />
            ) : viewMode === 'kanban' ? (
              /* ── KANBAN BOARD VIEW ── */
              (() => {
                const kanbanColumns: KanbanColumn[] = (statusOptions && statusOptions.length > 0
                  ? statusOptions.filter((s: any) => s.value)
                  : [
                      { value: 'Not Started' }, { value: 'In Progress' },
                      { value: 'On Hold' }, { value: 'Completed' }, { value: 'Closed' },
                    ]
                ).map((s: any, idx: number) => {
                  const palette = [
                    { color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-700 dark:text-slate-200' },
                    { color: 'bg-blue-100 dark:bg-blue-900/50', text: 'text-blue-700 dark:text-blue-300' },
                    { color: 'bg-amber-100 dark:bg-amber-900/50', text: 'text-amber-700 dark:text-amber-300' },
                    { color: 'bg-green-100 dark:bg-green-900/50', text: 'text-green-700 dark:text-green-300' },
                    { color: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-700 dark:text-red-300' },
                    { color: 'bg-purple-100 dark:bg-purple-900/50', text: 'text-purple-700 dark:text-purple-300' },
                  ];
                  const p = palette[idx % palette.length];
                  return { id: s.value, label: s.value, color: p.color, textColor: p.text };
                });
                const kanbanItems: KanbanItem[] = (filteredTasks ?? []).map((t) => ({
                  ...t,
                  id: t.id,
                  columnId: t.status || kanbanColumns[0]?.id || 'Not Started',
                }));
                const priorityColor: Record<string, string> = {
                  Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                  High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                  Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                  Normal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                };
                return (
                  <KanbanBoard
                    columns={kanbanColumns}
                    items={kanbanItems}
                    isLoading={!tasks}
                    onMove={(itemId, newColumnId) => {
                      const task = tasks?.find((t) => t.id === itemId);
                      if (!task) return;
                      updateMutation.mutate({
                        id: task.id,
                        taskId: task.taskId,
                        data: { status: newColumnId },
                      });
                    }}
                    renderCard={(item) => {
                      const task = item as any;
                      const isOverdue = task.dueDate && !isTaskComplete(task) && new Date(task.dueDate) < new Date();
                      return (
                        <div
                          className="bg-card border border-border/60 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing select-none"
                          onClick={() => handleViewDetails(task)}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-mono text-primary font-semibold">{task.taskId}</span>
                            {task.priority && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${priorityColor[task.priority] || 'bg-muted text-muted-foreground'}`}>
                                {task.priority}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-snug mb-2 line-clamp-2">{task.description}</p>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            {task.taskGroup && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium truncate max-w-[100px]">
                                {task.taskGroup}
                              </span>
                            )}
                            <div className="flex items-center gap-1 ml-auto">
                              {task.responsible && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={task.responsible}>
                                  {task.responsible.split(' ')[0]}
                                </span>
                              )}
                              {task.dueDate && (
                                <span className={`text-[10px] font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
                                  {isOverdue ? '⚠ ' : ''}{formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }}
                  />
                );
              })()
            ) : viewMode === 'compact' ? (
              /* ── COMPACT VIEW: dense table with color-coded status, priority, due date ── */
              <Table className="w-full table-fixed text-sm">
                <colgroup>
                  <col className="w-10" />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '13%' }} />
                  <col />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '11%' }} />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-primary/5 hover:bg-primary/10">
                    <TableHead className="px-3">
                      <Checkbox
                        checked={filteredTasks && filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                        onCheckedChange={handleSelectAllTasks}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Task ID</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Group</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Description</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Responsible</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Priority</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Due Date</TableHead>
                    <TableHead className="px-3 font-semibold text-primary">Status</TableHead>
                    <TableHead className="px-3 text-right font-semibold text-primary">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks?.map((task) => {
                    const complete = isTaskComplete(task);
                    const isOverdue = task.dueDate && !complete && new Date(task.dueDate) < new Date();
                    const priorityColor: Record<string, string> = {
                      Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                      High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                      Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                      Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                    };
                    return (
                    <TableRow key={task.id} className={`hover:bg-primary/5 ${selectedTaskIds.includes(task.id) ? 'bg-primary/10' : ''} ${complete ? 'opacity-40' : ''}`}>
                      <TableCell className="w-10 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedTaskIds.includes(task.id)}
                          onCheckedChange={() => handleToggleSelectTask(task.id)}
                          aria-label={`Select task ${task.taskId}`}
                        />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-primary text-sm">{task.taskId}</span>
                          {task.parentTaskId && <span title="Sub-task"><GitBranch className="w-3 h-3 text-green-600 flex-shrink-0" /></span>}
                          {task.followUpOfId && <span title="Follow-up"><ArrowRight className="w-3 h-3 text-purple-600 flex-shrink-0" /></span>}
                          {task.recurringType && <span title={`Recurring: ${task.recurringType}`}><RefreshCw className="w-3 h-3 text-orange-500 flex-shrink-0" /></span>}
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 overflow-hidden">
                        {task.taskGroup ? (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-medium truncate max-w-full" title={task.taskGroup}>
                            {task.taskGroup}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="px-3 py-2 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                          <span className={`text-sm leading-snug truncate block min-w-0 ${complete ? 'line-through text-muted-foreground' : 'text-foreground'}`} title={task.description ?? undefined}>
                            {task.description}
                          </span>
                          {task.requirementId && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0 font-mono">{task.requirementId}</Badge>
                          )}
                        </div>
                        {task.currentStatus && task.currentStatus !== task.status && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate" title={task.currentStatus}>↳ {task.currentStatus}</p>
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 overflow-hidden">
                        <span className="text-sm truncate block" title={task.responsible || ''}>{task.responsible || <span className="text-muted-foreground">—</span>}</span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {task.priority ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor[task.priority] || 'bg-muted text-muted-foreground'}`}>
                            {task.priority}
                          </span>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">
                        <span className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                          {formatDate(task.dueDate) || <span className="text-muted-foreground">—</span>}
                        </span>
                        {isOverdue && <span className="block text-[10px] text-red-500 font-semibold">OVERDUE</span>}
                      </TableCell>
                      <TableCell className="px-3 py-2 overflow-hidden">
                        <Badge
                          className="text-xs px-2 py-0.5 whitespace-nowrap max-w-full truncate"
                          style={complete ? { background: '#22c55e22', color: '#16a34a', border: '1px solid #86efac' } : {}}
                        >
                          {task.status || 'No Status'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => { setSelectedTaskForStatus(task); setStatusUpdateText(''); setStatusUpdateDialogOpen(true); }} title="Update Status"><CheckSquare className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleViewDetails(task)} title="View Details"><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => handleEditDetails(task)} title="Edit"><Edit className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="destructive" className="h-7 w-7 p-0" onClick={() => handleDelete(task.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              /* ── DETAILS VIEW: card-style rows with full field grid ── */
              <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow className="bg-primary/5 hover:bg-primary/10">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredTasks && filteredTasks.length > 0 && selectedTaskIds.length === filteredTasks.length}
                      onCheckedChange={handleSelectAllTasks}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-primary w-auto">Task Details</TableHead>
                  <TableHead className="w-[220px] font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks?.map((task) => {
                  const complete = isTaskComplete(task);
                  const isOverdue = task.dueDate && !complete && new Date(task.dueDate) < new Date();
                  const priorityColor: Record<string, string> = {
                    Critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                    High: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                    Low: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                  };
                  return (
                  <TableRow key={task.id} className={`hover:bg-primary/5 ${selectedTaskIds.includes(task.id) ? 'bg-primary/10' : ''} ${complete ? 'opacity-40' : ''}`}>
                    <TableCell className="w-10 align-top pt-5" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedTaskIds.includes(task.id)}
                        onCheckedChange={() => handleToggleSelectTask(task.id)}
                        aria-label={`Select task ${task.taskId}`}
                      />
                    </TableCell>
                    <TableCell className="py-4 overflow-hidden">
                      <div className="space-y-3">
                        {/* Header row: ID + badges + description */}
                        <div className="flex items-start gap-3 flex-wrap">
                          <span className="font-mono font-bold text-primary text-base whitespace-nowrap">{task.taskId}</span>
                          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                            {task.taskGroup && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-medium whitespace-nowrap">
                                {task.taskGroup}
                              </span>
                            )}
                            {task.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityColor[task.priority] || 'bg-muted text-muted-foreground'}`}>
                                {task.priority}
                              </span>
                            )}
                            {task.parentTaskId && <Badge variant="outline" className="text-green-700 border-green-300 text-xs gap-1"><GitBranch className="w-3 h-3" />Sub-task</Badge>}
                            {task.followUpOfId && <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs gap-1"><ArrowRight className="w-3 h-3" />Follow-up</Badge>}
                            {task.recurringType && <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs gap-1"><RefreshCw className="w-3 h-3" />{task.recurringType}</Badge>}
                          </div>
                          <p className={`flex-1 text-sm leading-relaxed break-words min-w-0 font-medium ${complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.description || '-'}</p>
                        </div>

                        {/* Sub-task expand toggle */}
                        {getSubTasks(task.id).length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground" onClick={() => toggleExpand(task.id)}>
                              {expandedTasks.has(task.id) ? <ChevronDown className="w-3 h-3 mr-1" /> : <ChevronRight className="w-3 h-3 mr-1" />}
                              {getSubTasks(task.id).length} sub-task{getSubTasks(task.id).length > 1 ? 's' : ''}
                            </Button>
                          </div>
                        )}

                        {/* Details grid: 3 columns */}
                        <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm pl-4 border-l-2 border-muted">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Requirement</span>
                            {task.requirementId ? (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs font-mono">{task.requirementId}</Badge>
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => task.requirementId && handleViewRequirementDetails(task.requirementId)} title="View requirement details"><Info className="w-3 h-3" /></Button>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Deliverable</span>
                            {task.deliverableId ? (
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs font-mono">DL-{String(task.deliverableId).padStart(4, '0')}</Badge>
                                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={() => task.deliverableId && handleViewDeliverableDetails(task.deliverableId)} title="View deliverable details"><Info className="w-3 h-3" /></Button>
                              </div>
                            ) : <span className="text-muted-foreground">—</span>}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Responsible</span>
                            <span className="font-medium text-foreground">{task.responsible || <span className="text-muted-foreground">—</span>}</span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Due Date</span>
                            <span className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                              {formatDate(task.dueDate) || <span className="text-muted-foreground">—</span>}
                              {isOverdue && <span className="ml-1 text-[10px] font-bold text-red-500">OVERDUE</span>}
                            </span>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Task Status</span>
                            <Badge className="w-fit text-xs px-2">{task.status || 'No Status'}</Badge>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Last Status Update</span>
                            <span className="text-sm text-muted-foreground italic truncate" title={task.currentStatus || ''}>{task.currentStatus || '—'}</span>
                          </div>
                          {task.manHours && (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Man-Hours</span>
                              <span className="font-medium text-foreground">{task.manHours}h</span>
                            </div>
                          )}
                        </div>
                        {/* Expanded sub-tasks */}
                        {expandedTasks.has(task.id) && (
                          <>
                            {getSubTasks(task.id).map((sub: any) => (
                              <div key={sub.id} className="ml-6 mt-2 p-3 bg-muted/30 rounded border-l-4 border-green-300">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <GitBranch className="w-3 h-3 text-green-600" />
                                    <span className="font-semibold text-sm text-green-700">{sub.taskId}</span>
                                    <span className="text-sm">{sub.description}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{sub.status || sub.currentStatus || 'Not Started'}</Badge>
                                    <span className="text-xs text-muted-foreground">{formatDate(sub.dueDate)}</span>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleViewDetails(sub)} title="View sub-task">
                                      <Eye className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => handleDelete(sub.id)} title="Delete sub-task">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top py-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1 flex-wrap justify-end">
                          {editingId === task.id ? (
                            <>
                              <Button size="sm" onClick={() => handleSave(task)} disabled={updateMutation.isPending}>Save</Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>Cancel</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => { setSelectedTaskForStatus(task); setStatusUpdateText(''); setStatusUpdateDialogOpen(true); }} title="Update Status" className="h-8 w-8 p-0 hover:bg-primary/10"><CheckSquare className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleViewDetails(task)} title="View Details" className="h-8 w-8 p-0 hover:bg-primary/10"><Eye className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleEditDetails(task)} title="Edit" className="h-8 w-8 p-0 hover:bg-primary/10"><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => showHistory(task.taskId)} title="History" className="h-8 w-8 p-0 hover:bg-primary/10"><History className="w-4 h-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(task.id)} title="Delete" className="h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap justify-end mt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50" onClick={() => { setParentTaskForSubTask(task); setSubTaskDialogOpen(true); }} title="Add Sub-task"><GitBranch className="w-3 h-3 mr-1" />Sub-task</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-purple-300 text-purple-700 hover:bg-purple-50" onClick={() => { setSourceTaskForFollowUp(task); setFollowUpDialogOpen(true); }} title="Create Follow-up"><ArrowRight className="w-3 h-3 mr-1" />Follow-up</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-orange-300 text-orange-700 hover:bg-orange-50" onClick={() => { setTaskForRecurring(task); setRecurringConfig({ recurringType: task.recurringType || 'weekly', recurringInterval: task.recurringInterval || 1, recurringEndDate: task.recurringEndDate || '' }); setRecurringDialogOpen(true); }} title="Set Recurring"><RefreshCw className="w-3 h-3 mr-1" />Recurring</Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
              </Table>
            )}
          </div>
          {filteredTasks?.length === 0 && (
            <EmptyState
              icon={CheckSquare}
              title="No tasks found"
              description="Create a new task or import an Excel file to get started."
              actionLabel="Create Task"
              onAction={() => setCreateDialogOpen(true)}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change History - {selectedEntityId}</DialogTitle>
            <DialogDescription>
              Timeline of all changes made to this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionLogs?.map((log) => (
              <Card key={log.id}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    {new Date(log.changedAt).toLocaleString()}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(log.changedFields as Record<string, { oldValue: any; newValue: any }>).map(([field, change]) => (
                      <div key={field} className="grid grid-cols-3 gap-4 text-sm">
                        <div className="font-medium">{field}</div>
                        <div className="text-muted-foreground">
                          <span className="line-through">{change.oldValue || 'empty'}</span>
                        </div>
                        <div className="text-green-600 font-medium">
                          {change.newValue || 'empty'}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {actionLogs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No changes recorded yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the project. Task ID will be auto-generated (T-XXXX format).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Basic Information</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="taskGroup">Task Group</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.taskGroup}
                      onValueChange={(value) => setNewTask({ ...newTask, taskGroup: value })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select task group (optional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {taskGroups?.filter(g => g.name).map((group) => (
                          <SelectItem key={group.id} value={group.name!}>
                            {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddTaskGroupDialogOpen(true)}
                      title="Add new task group"
                      disabled={createTaskGroupMutation.isPending}
                    >
                      {createTaskGroupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Input
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description..."
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Checkbox
                      id="linkRequirement"
                      checked={linkRequirement}
                      onCheckedChange={(checked) => {
                        setLinkRequirement(checked as boolean);
                        if (!checked) {
                          setNewTask({ ...newTask, requirementId: '' });
                        }
                      }}
                    />
                    <Label htmlFor="linkRequirement" className="cursor-pointer">Link to Requirement</Label>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.requirementId}
                      onValueChange={(value) => setNewTask({ ...newTask, requirementId: value })}
                      disabled={!linkRequirement}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {requirements?.filter(r => r.idCode).map((req) => (
                          <SelectItem key={req.id} value={req.idCode!}>
                            {req.idCode} - {req.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddRequirementDialogOpen(true)}
                      title="Add new requirement"
                      disabled={!linkRequirement || createRequirementMutation.isPending}
                    >
                      {createRequirementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deliverableId">Deliverable</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newTask.deliverableId?.toString() || ''}
                      onValueChange={(value) => {
                        if (value === '' || value === 'none') {
                          setNewTask({ ...newTask, deliverableId: undefined });
                        } else {
                          const numValue = parseInt(value);
                          setNewTask({ ...newTask, deliverableId: isNaN(numValue) ? undefined : numValue });
                        }
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select deliverable..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deliverables?.map((del) => (
                          <SelectItem key={del.id} value={del.id.toString()}>
                            {del.deliverableId} - {del.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddDeliverableDialogOpen(true)}
                      title="Add new deliverable"
                      disabled={createDeliverableMutation.isPending}
                    >
                      {createDeliverableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="issueId">Issue</Label>
                  <Select
                    value={newTask.issueId}
                    onValueChange={(value) => setNewTask({ ...newTask, issueId: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select issue..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {allIssues?.filter(i => i.issueId).map((issue) => (
                        <SelectItem key={issue.id} value={issue.issueId!}>
                          {issue.issueId} - {issue.description?.substring(0, 50) || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* RACI Assignment Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">RACI Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsible (R)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.responsibleId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, responsibleId: value ? parseInt(value) : undefined })}
                    placeholder="Select responsible person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountable">Accountable (A)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.accountableId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, accountableId: value ? parseInt(value) : undefined })}
                    placeholder="Select accountable person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consulted">Consulted (C)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.consultedId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, consultedId: value ? parseInt(value) : undefined })}
                    placeholder="Select consulted person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="informed">Informed (I)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.informedId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, informedId: value ? parseInt(value) : undefined })}
                    placeholder="Select informed person..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
              </div>
            </div>

            {/* Subject & Task Category Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Subject & Category</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject (Stakeholder)</Label>
                  <SelectWithCreate
                    type="stakeholder"
                    value={newTask.subjectId?.toString() || ''}
                    onValueChange={(value) => setNewTask({ ...newTask, subjectId: value ? parseInt(value) : undefined })}
                    placeholder="Select subject stakeholder..."
                    projectId={currentProjectId || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Task Category</Label>
                  <Select
                    value={newTask.taskCategory}
                    onValueChange={(value) => setNewTask({ ...newTask, taskCategory: value as 'task' | 'communication' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="task">Regular Task (T-)</SelectItem>
                      <SelectItem value="communication">Communication Task (COMM-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recurring Schedule</Label>
                <Select
                  value={newTask.recurringType || 'none'}
                  onValueChange={(value) => {
                    // Auto-set default due date based on frequency
                    let defaultDue = newTask.dueDate;
                    if (value === 'daily') {
                      defaultDue = new Date().toISOString().split('T')[0];
                    } else if (value === 'weekly') {
                      // End of current week = Thursday (Saudi work week)
                      const d = new Date();
                      const day = d.getDay(); // 0=Sun,1=Mon,...,4=Thu,5=Fri,6=Sat
                      const daysUntilThu = (4 - day + 7) % 7 || 7;
                      d.setDate(d.getDate() + daysUntilThu);
                      defaultDue = d.toISOString().split('T')[0];
                    } else if (value === 'monthly') {
                      const d = new Date();
                      defaultDue = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
                    }
                    setNewTask({ ...newTask, recurringType: value, dueDate: defaultDue });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (one-time)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (one-time)</SelectItem>
                    <SelectItem value="daily">Daily (due: end of today)</SelectItem>
                    <SelectItem value="weekly">Weekly (due: end of week — Thursday)</SelectItem>
                    <SelectItem value="monthly">Monthly (due: end of month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Dates</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignDate">Start Date</Label>
                  <Input
                    id="assignDate"
                    type="date"
                    value={newTask.assignDate}
                    onChange={(e) => setNewTask({ ...newTask, assignDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date (ETD)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status & Priority Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold border-b pb-2">Status & Priority</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <SelectWithCreate
                    type="status"
                    value={newTask.status}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value })}
                    placeholder="Select status"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <SelectWithCreate
                    type="priority"
                    value={newTask.priority}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    placeholder="Select priority"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manHours">Active Man-Hours</Label>
                <Input
                  id="manHours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0.0"
                  value={newTask.manHours ?? ''}
                  onChange={(e) => setNewTask({ ...newTask, manHours: e.target.value ? parseFloat(e.target.value) : undefined })}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage {settingsType === 'status' ? 'Status' : 'Priority'} Options</DialogTitle>
            <DialogDescription>
              Add, edit, or delete {settingsType} options for tasks
            </DialogDescription>
          </DialogHeader>
          <DropdownOptionsManager type={settingsType} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Stakeholder Dialog */}
      <Dialog open={addStakeholderDialogOpen} onOpenChange={setAddStakeholderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Stakeholder</DialogTitle>
            <DialogDescription>
              Create a new stakeholder to use in dropdowns
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Enter full name..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={newStakeholder.position}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                placeholder="Enter position..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={newStakeholder.role}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                placeholder="Enter role..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStakeholderDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStakeholder} disabled={createStakeholderMutation.isPending}>
              {createStakeholderMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setIsEditMode(false); }}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl">
                <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded">{selectedTask?.taskId}</span>
                {isEditMode ? 'Edit Task' : 'Task Details'}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button onClick={handleSaveEdit} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
                      <Save className="w-4 h-4 mr-2" />
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => { setIsEditMode(true); setEditFormData((prev: any) => ({ ...prev, newStatusUpdate: '' })); }} variant="outline">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <DialogDescription>
              {isEditMode ? 'Edit the task details below' : 'View all details for this task'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={taskDetailTab} onValueChange={setTaskDetailTab} className="flex-1 flex flex-col overflow-hidden mt-2">
            <TabsList className="flex-shrink-0 mb-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="team">Team & Contacts</TabsTrigger>
              <TabsTrigger value="decisions">Decisions {allDecisions?.filter(d => d.taskId === selectedTask?.taskId).length ? `(${allDecisions.filter(d => d.taskId === selectedTask?.taskId).length})` : ""}</TabsTrigger>
              <TabsTrigger value="issues">Issues & Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Basic Information */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Task Group</Label>
                {isEditMode ? (
                  <Select value={editFormData.taskGroup} onValueChange={(v) => setEditFormData({...editFormData, taskGroup: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select task group" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskGroups?.filter(g => g.name).map((g) => (
                        <SelectItem key={g.id} value={g.name!}>{g.idCode ? `${g.idCode} - ${g.name}` : g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedTask?.taskGroup || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Requirement ID</Label>
                {isEditMode ? (
                  <div className="flex gap-2">
                    <Select
                      value={editFormData.requirementId || ''}
                      onValueChange={(value) => {
                        if (value === '' || value === 'none') {
                          setEditFormData({ ...editFormData, requirementId: undefined });
                        } else {
                          setEditFormData({ ...editFormData, requirementId: value });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select requirement..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {requirements?.filter(r => r.idCode).map((req) => (
                          <SelectItem key={req.id} value={req.idCode!}>
                            {req.idCode} - {req.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddRequirementDialogOpen(true)}
                      title="Add new requirement"
                      disabled={createRequirementMutation.isPending}
                      className="h-8 w-8"
                    >
                      {createRequirementMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                    </Button>
                  </div>
                ) : (
                  <p className="font-medium">{selectedTask?.requirementId || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Deliverable</Label>
                {isEditMode ? (
                  <div className="flex gap-2">
                    <Select
                      value={editFormData.deliverableId || ''}
                      onValueChange={(value) => {
                        if (value === '' || value === 'none') {
                          setEditFormData({ ...editFormData, deliverableId: undefined });
                        } else {
                          setEditFormData({ ...editFormData, deliverableId: value });
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select deliverable..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {deliverables?.map((del) => (
                          <SelectItem key={del.id} value={del.id.toString()}>
                            {del.deliverableId} - {del.description?.substring(0, 50) || 'No description'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setAddDeliverableDialogOpen(true)}
                      title="Add new deliverable"
                      className="h-8 w-8"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <p className="font-medium">
                    {selectedTask?.deliverableId
                      ? (deliverables?.find(d => d.id === selectedTask.deliverableId)?.deliverableId || '-') + ' - ' + (deliverables?.find(d => d.id === selectedTask.deliverableId)?.description?.substring(0, 50) || '')
                      : '-'}
                  </p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Issue</Label>
                {isEditMode ? (
                  <Select
                    value={editFormData.issueId || ''}
                    onValueChange={(value) => {
                      if (value === '' || value === 'none') {
                        setEditFormData({ ...editFormData, issueId: undefined });
                      } else {
                        setEditFormData({ ...editFormData, issueId: value });
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select issue..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {allIssues?.filter(i => i.issueId).map((issue) => (
                        <SelectItem key={issue.id} value={issue.issueId!}>
                          {issue.issueId} - {issue.description?.substring(0, 50) || 'No description'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="font-medium">{selectedTask?.issueId || '-'}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Status</Label>
                {isEditMode ? (
                  <Select value={editFormData.status} onValueChange={(v) => setEditFormData({...editFormData, status: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions?.filter(opt => opt.value).map((opt) => (
                        <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getStatusColor(selectedTask?.status)}>{selectedTask?.status || '-'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
                {isEditMode ? (
                  <Select value={editFormData.priority} onValueChange={(v) => setEditFormData({...editFormData, priority: v})}>
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions?.filter(opt => opt.value).map((opt) => (
                        <SelectItem key={opt.id} value={opt.value!}>{opt.value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getPriorityColor(selectedTask?.priority)}>{selectedTask?.priority || '-'}</Badge>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Start Date</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.assignDate} onChange={(e) => setEditFormData({...editFormData, assignDate: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{formatDate(selectedTask?.assignDate)}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Due Date (ETD)</Label>
                {isEditMode ? (
                  <Input type="date" value={editFormData.dueDate} onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})} className="h-8" />
                ) : (
                  <p className="font-medium">{formatDate(selectedTask?.dueDate)}</p>
                )}
              </div>
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Active Man-Hours</Label>
                {isEditMode ? (
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0.0"
                    value={editFormData.manHours ?? ''}
                    onChange={(e) => setEditFormData({...editFormData, manHours: e.target.value ? parseFloat(e.target.value) : undefined})}
                    className="h-8"
                  />
                ) : (
                  <p className="font-medium">
                    {selectedTask?.manHours != null ? `${selectedTask.manHours} hrs` : '—'}
                  </p>
                )}
              </div>
            </div>

            </TabsContent>

            {/* ── Team & Contacts Tab ─────────────────────────────────────────── */}
            <TabsContent value="team" className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* RACI Assignment */}
            <div className="pt-1">
              <h4 className="font-medium mb-3">RACI Assignment</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Responsible (R)</Label>
                  {isEditMode ? (
                    <SelectWithCreate
                      type="stakeholder"
                      value={editFormData.responsibleId?.toString() || ''}
                      onValueChange={(value) => setEditFormData({...editFormData, responsibleId: value ? parseInt(value) : undefined})}
                      placeholder="Select responsible person..."
                      projectId={currentProjectId || undefined}
                    />
                  ) : (
                    <p className="font-medium">{selectedTask?.responsible || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Accountable (A)</Label>
                  {isEditMode ? (
                    <SelectWithCreate
                      type="stakeholder"
                      value={editFormData.accountableId?.toString() || ''}
                      onValueChange={(value) => setEditFormData({...editFormData, accountableId: value ? parseInt(value) : undefined})}
                      placeholder="Select accountable person..."
                      projectId={currentProjectId || undefined}
                    />
                  ) : (
                    <p className="font-medium">{selectedTask?.accountable || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Consulted (C)</Label>
                  {isEditMode ? (
                    <SelectWithCreate
                      type="stakeholder"
                      value={editFormData.consultedId?.toString() || ''}
                      onValueChange={(value) => setEditFormData({...editFormData, consultedId: value ? parseInt(value) : undefined})}
                      placeholder="Select consulted person..."
                      projectId={currentProjectId || undefined}
                    />
                  ) : (
                    <p className="font-medium">{selectedTask?.consulted || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Informed (I)</Label>
                  {isEditMode ? (
                    <SelectWithCreate
                      type="stakeholder"
                      value={editFormData.informedId?.toString() || ''}
                      onValueChange={(value) => setEditFormData({...editFormData, informedId: value ? parseInt(value) : undefined})}
                      placeholder="Select informed person..."
                      projectId={currentProjectId || undefined}
                    />
                  ) : (
                    <p className="font-medium">{selectedTask?.informed || '-'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4">
              <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Description / Notes</Label>
                {isEditMode ? (
                  <Textarea value={editFormData.description} onChange={(e) => setEditFormData({...editFormData, description: e.target.value})} className="min-h-[80px]" />
                ) : (
                  <p className="font-medium whitespace-pre-wrap">{selectedTask?.description || '-'}</p>
                )}
              </div>
            </div>

            {/* Stakeholder Contact Cards */}
            {!isEditMode && (() => {
              const raciMap = [
                { label: 'Responsible (R)', name: selectedTask?.responsible, color: 'border-blue-300 bg-blue-50' },
                { label: 'Accountable (A)', name: selectedTask?.accountable, color: 'border-purple-300 bg-purple-50' },
                { label: 'Consulted (C)', name: selectedTask?.consulted, color: 'border-green-300 bg-green-50' },
                { label: 'Informed (I)', name: selectedTask?.informed, color: 'border-orange-300 bg-orange-50' },
              ].filter(r => r.name);
              if (raciMap.length === 0) return null;
              return (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Stakeholder Contact Cards
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {raciMap.map(({ label, name, color }) => {
                      const sh = stakeholders?.find(s => s.fullName === name || s.fullName?.toLowerCase() === name?.toLowerCase());
                      return (
                        <div key={label} className={`rounded-lg border p-3 min-w-0 overflow-hidden ${color}`}>
                          <div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>
                          <div className="font-semibold text-sm truncate">{name}</div>
                          {sh?.engagementStrategy && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/70 border text-[11px] font-medium truncate max-w-full">{sh.engagementStrategy}</span>
                          )}
                          {sh && (
                            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                              {sh.position && <div className="truncate">📋 {sh.position}</div>}
                              {sh.email && <div className="truncate">✉️ <a href={`mailto:${sh.email}`} className="text-blue-600 underline">{sh.email}</a></div>}
                              {sh.phone && <div className="truncate">📞 {sh.phone}</div>}
                              {sh.communicationFrequency && <div className="text-[11px] truncate">🔁 {sh.communicationFrequency}</div>}
                              {sh.communicationChannel && <div className="text-[11px] truncate">📡 {sh.communicationChannel}</div>}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
            </TabsContent>

            {/* ── Decisions Tab ───────────────────────────────────────────────── */}
            <TabsContent value="decisions" className="flex-1 overflow-y-auto space-y-4 pr-1">
            {(() => {
              const taskDecisions = allDecisions?.filter(d => d.taskId === selectedTask?.taskId) ?? [];
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-primary" /> Linked Decisions
                    </h4>
                    <Button size="sm" variant="outline" onClick={() => setShowQuickDecision(v => !v)}>
                      <Plus className="w-3 h-3 mr-1" /> Log Decision
                    </Button>
                  </div>

                  {showQuickDecision && (
                    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
                      <h5 className="text-sm font-semibold">Quick-Log Decision for this Task</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Decision Title *</Label>
                          <Input value={quickDecisionForm.title} onChange={e => setQuickDecisionForm(f => ({ ...f, title: e.target.value }))} placeholder="What was decided?" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea rows={2} value={quickDecisionForm.description} onChange={e => setQuickDecisionForm(f => ({ ...f, description: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Decided By</Label>
                          <Input value={quickDecisionForm.decidedBy} onChange={e => setQuickDecisionForm(f => ({ ...f, decidedBy: e.target.value }))} placeholder={selectedTask?.responsible || ''} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select value={quickDecisionForm.status} onValueChange={v => setQuickDecisionForm(f => ({ ...f, status: v as any }))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['Open','Implemented','Deferred','Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs">Impact</Label>
                          <Input value={quickDecisionForm.impact} onChange={e => setQuickDecisionForm(f => ({ ...f, impact: e.target.value }))} placeholder="Scope, timeline, budget..." />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setShowQuickDecision(false)}>Cancel</Button>
                        <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white"
                          disabled={!quickDecisionForm.title || createDecisionFromTaskMutation.isPending}
                          onClick={() => {
                            if (!quickDecisionForm.title) return;
                            createDecisionFromTaskMutation.mutate({
                              projectId: currentProjectId!,
                              title: quickDecisionForm.title,
                              description: quickDecisionForm.description,
                              decidedBy: quickDecisionForm.decidedBy || selectedTask?.responsible || '',
                              decisionDate: new Date().toISOString().split('T')[0],
                              status: quickDecisionForm.status as any,
                              impact: quickDecisionForm.impact,
                              taskId: selectedTask?.taskId,
                            });
                            setShowQuickDecision(false);
                            setQuickDecisionForm({ title: '', description: '', decidedBy: '', impact: '', status: 'Open' });
                          }}>
                          {createDecisionFromTaskMutation.isPending ? 'Saving...' : 'Log Decision'}
                        </Button>
                      </div>
                    </div>
                  )}

                  {taskDecisions.length === 0 && !showQuickDecision ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      No decisions linked to this task yet. Click "Log Decision" to add one.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {taskDecisions.map(d => {
                        const DECISION_STATUS_COLORS: Record<string, string> = {
                          Open: 'bg-blue-100 text-blue-700', Implemented: 'bg-green-100 text-green-700',
                          Deferred: 'bg-gray-100 text-gray-600', Cancelled: 'bg-red-100 text-red-600',
                        };
                        return (
                          <div key={d.id} className="rounded-lg border px-4 py-3 bg-white space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-indigo-700">{d.decisionId}</span>
                                <Badge className={`text-xs ${DECISION_STATUS_COLORS[d.status ?? 'Open'] ?? ''}`}>{d.status ?? 'Open'}</Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">{formatDate(d.decisionDate ? (d.decisionDate instanceof Date ? d.decisionDate.toISOString() : String(d.decisionDate)) : null)}</span>
                            </div>
                            <div className="font-medium text-sm">{d.title}</div>
                            {d.description && <div className="text-xs text-muted-foreground">{d.description}</div>}
                            {d.impact && <div className="text-xs"><span className="font-medium">Impact:</span> {d.impact}</div>}
                            {d.decidedBy && <div className="text-xs text-muted-foreground">Decided by: {d.decidedBy}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            </TabsContent>

            {/* ── Issues & Updates Tab ────────────────────────────────────────── */}
            <TabsContent value="issues" className="flex-1 overflow-y-auto space-y-4 pr-1">

            {/* Linked Issues Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Linked Issues
                </h4>
                <Button size="sm" onClick={() => setAddIssueDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Issue
                </Button>
              </div>
              {/* Link Existing Issue */}
              <div className="flex gap-2 mb-3">
                <Select
                  value={selectedIssueToLink}
                  onValueChange={setSelectedIssueToLink}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select issue to link..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allIssues?.filter(iss => 
                      !linkedIssues?.some(linked => linked.id === iss.id)
                    ).map((iss) => (
                      <SelectItem key={iss.id} value={iss.id.toString()}>
                        {iss.issueId} - {iss.description?.substring(0, 50) || 'No description'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={() => {
                    if (selectedIssueToLink && selectedTask?.taskId) {
                      linkIssueMutation.mutate({
                        issueId: parseInt(selectedIssueToLink),
                        entityType: 'task',
                        entityId: selectedTask.taskId,
                      });
                    }
                  }}
                  disabled={!selectedIssueToLink || linkIssueMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {linkIssueMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 mr-2" />
                      Link
                    </>
                  )}
                </Button>
              </div>
              {linkedIssues && linkedIssues.length > 0 ? (
                <div className="space-y-2">
                  {linkedIssues.map((issue) => (
                    <Card key={issue.id} className="p-3 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <span className="font-mono text-sm font-medium text-primary">{issue.issueId}</span>
                          {editingIssueId === issue.id ? (
                            <div className="mt-2 space-y-2">
                              <Textarea
                                value={editIssueData.description}
                                onChange={(e) => setEditIssueData({ ...editIssueData, description: e.target.value })}
                                className="text-sm"
                                rows={2}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  value={editIssueData.status}
                                  onChange={(e) => setEditIssueData({ ...editIssueData, status: e.target.value })}
                                  placeholder="Status"
                                  className="text-sm"
                                />
                                <Input
                                  value={editIssueData.priority}
                                  onChange={(e) => setEditIssueData({ ...editIssueData, priority: e.target.value })}
                                  placeholder="Priority"
                                  className="text-sm"
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-1">{issue.description || 'No description'}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {editingIssueId === issue.id ? (
                            <>
                              <Button size="sm" onClick={() => handleSaveIssue(issue)} disabled={updateIssueMutation.isPending}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancelEditIssue}>
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Badge variant="outline">{issue.status || 'N/A'}</Badge>
                              <Badge variant="outline">{issue.priority || 'N/A'}</Badge>
                              <Button size="sm" variant="ghost" onClick={() => handleEditIssue(issue)}>
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteIssue(issue.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground border border-dashed border-primary/20 rounded-lg">
                  No issues linked yet.
                </div>
              )}
            </div>

            {/* Status Updates */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Status Updates</h4>
              <div className="space-y-3">
                <div className="space-y-1 p-3 bg-muted/50 rounded-lg">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide">Current Status (Read-only)</Label>
                  <p className="font-medium whitespace-pre-wrap">{selectedTask?.currentStatus || 'No status updates yet'}</p>
                </div>
                {isEditMode && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">New Update</Label>
                    <Textarea
                      value={editFormData.newStatusUpdate || ''}
                      onChange={(e) => setEditFormData({...editFormData, newStatusUpdate: e.target.value})}
                      placeholder="Enter a new status update (will replace current status and be recorded in history)..."
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to keep current status unchanged</p>
                  </div>
                )}
              </div>
            </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Status Update Dialog */}
      <Dialog open={bulkStatusDialogOpen} onOpenChange={setBulkStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status for {selectedTaskIds.length} Task(s)</DialogTitle>
            <DialogDescription>Select a new status to apply to all selected tasks.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Status</Label>
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions?.filter((s: any) => s.value).map((s: any) => (
                  <SelectItem key={s.id} value={s.value}>{s.value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkStatusDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!bulkStatus) { toast.error('Please select a status'); return; }
                bulkUpdateStatusMutation.mutate({ ids: selectedTaskIds, status: bulkStatus });
              }}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending ? 'Updating...' : 'Apply Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Group Dialog */}
      <Dialog open={addTaskGroupDialogOpen} onOpenChange={setAddTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task Group</DialogTitle>
            <DialogDescription>
              Enter a name for the new task group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="taskGroupName" className="text-right">Name *</Label>
              <Input
                id="taskGroupName"
                value={newTaskGroupName}
                onChange={(e) => setNewTaskGroupName(e.target.value)}
                placeholder="Enter task group name..."
                className="col-span-3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTaskGroupName.trim() && currentProjectId) {
                    createTaskGroupMutation.mutate({ projectId: currentProjectId, name: newTaskGroupName.trim() });
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddTaskGroupDialogOpen(false);
              setNewTaskGroupName('');
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newTaskGroupName.trim() && currentProjectId) {
                  createTaskGroupMutation.mutate({ projectId: currentProjectId, name: newTaskGroupName.trim() });
                }
              }}
              disabled={!newTaskGroupName.trim() || !currentProjectId || createTaskGroupMutation.isPending}
            >
              {createTaskGroupMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Requirement Dialog */}
      <Dialog open={addRequirementDialogOpen} onOpenChange={setAddRequirementDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Requirement</DialogTitle>
            <DialogDescription>
              Create a new requirement to link with this task. ID will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>Task Group</Label>
              <div className="flex gap-2">
                <Select
                  value={newRequirement.taskGroup}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, taskGroup: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select task group" />
                  </SelectTrigger>
                  <SelectContent>
                    {taskGroups?.filter(g => g.name).map((group) => (
                      <SelectItem key={group.id} value={group.name!}>
                        {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setTaskGroupDialogOpen(true)}
                  title="Create new task group"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Issue Group</Label>
              <div className="flex gap-2">
                <Select
                  value={newRequirement.issueGroup}
                  onValueChange={(value) => setNewRequirement({ ...newRequirement, issueGroup: value })}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select issue group" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueGroups?.filter(g => g.name).map((group) => (
                      <SelectItem key={group.id} value={group.name!}>
                        {group.idCode ? `${group.idCode} - ${group.name}` : group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => setIssueGroupDialogOpen(true)}
                  title="Create new issue group"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Creation Date</Label>
              <Input
                type="date"
                value={newRequirement.createdAt}
                onChange={(e) => setNewRequirement({ ...newRequirement, createdAt: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <SelectWithCreate
                type="priority"
                value={newRequirement.priority}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, priority: value })}
                placeholder="Select priority"
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <SelectWithCreate
                type="type"
                value={newRequirement.type}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, type: value })}
                placeholder="Select type"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <SelectWithCreate
                type="category"
                value={newRequirement.category}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, category: value })}
                placeholder="Select category"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner (Stakeholder)</Label>
              <SelectWithCreate
                type="stakeholder"
                value={newRequirement.ownerId?.toString() || ''}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, ownerId: value ? parseInt(value) : undefined })}
                placeholder="Select owner"
                projectId={currentProjectId || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label>Source Type</Label>
              <Input
                value={newRequirement.sourceType}
                onChange={(e) => setNewRequirement({ ...newRequirement, sourceType: e.target.value })}
                placeholder="e.g., Internal, External, Customer"
              />
            </div>
            <div className="space-y-2">
              <Label>External Source</Label>
              <Input
                value={newRequirement.refSource}
                onChange={(e) => setNewRequirement({ ...newRequirement, refSource: e.target.value })}
                placeholder="Reference source URL or name"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <SelectWithCreate
                type="status"
                value={newRequirement.status}
                onValueChange={(value) => setNewRequirement({ ...newRequirement, status: value })}
                placeholder="Select status"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newRequirement.description}
                onChange={(e) => setNewRequirement({ ...newRequirement, description: e.target.value })}
                placeholder="Enter requirement description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddRequirementDialogOpen(false);
              setNewRequirement({
                description: '',
                taskGroup: '',
                issueGroup: '',
                ownerId: undefined,
                status: 'Open',
                priority: 'Medium',
                type: '',
                category: '',
                sourceType: '',
                refSource: '',
                createdAt: new Date().toISOString().split('T')[0],
              });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newRequirement.description.trim() && currentProjectId) {
                  createRequirementMutation.mutate({ 
                    projectId: currentProjectId, 
                    description: newRequirement.description.trim(),
                    taskGroup: newRequirement.taskGroup || undefined,
                    issueGroup: newRequirement.issueGroup || undefined,
                    ownerId: newRequirement.ownerId || undefined,
                    status: newRequirement.status || undefined,
                    priority: newRequirement.priority || undefined,
                    type: newRequirement.type || undefined,
                    category: newRequirement.category || undefined,
                    sourceType: newRequirement.sourceType || undefined,
                    refSource: newRequirement.refSource || undefined,
                  });
                }
              }}
              disabled={!newRequirement.description.trim() || !currentProjectId || createRequirementMutation.isPending}
            >
              {createRequirementMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deliverable Dialog */}
      <Dialog open={addDeliverableDialogOpen} onOpenChange={setAddDeliverableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deliverable</DialogTitle>
            <DialogDescription>
              Create a new deliverable to link with this task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newDeliverable.description}
                onChange={(e) => setNewDeliverable({ ...newDeliverable, description: e.target.value })}
                placeholder="Enter deliverable description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={newDeliverable.status}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, status: e.target.value })}
                  placeholder="e.g., Pending, In Progress, Completed"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={newDeliverable.dueDate}
                  onChange={(e) => setNewDeliverable({ ...newDeliverable, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDeliverableDialogOpen(false);
              setNewDeliverable({ description: '', status: 'Pending', dueDate: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newDeliverable.description.trim() && currentProjectId) {
                  createDeliverableMutation.mutate({
                    projectId: currentProjectId,
                    description: newDeliverable.description.trim(),
                    status: newDeliverable.status || 'Pending',
                    dueDate: newDeliverable.dueDate || undefined,
                  });
                }
              }}
              disabled={!newDeliverable.description.trim() || !currentProjectId || createDeliverableMutation.isPending}
            >
              {createDeliverableMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Issue Dialog */}
      <Dialog open={addIssueDialogOpen} onOpenChange={setAddIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Issue</DialogTitle>
            <DialogDescription>
              Create a new issue to link with this task.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={newIssue.description}
                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                placeholder="Enter issue description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Input
                  value={newIssue.status}
                  onChange={(e) => setNewIssue({ ...newIssue, status: e.target.value })}
                  placeholder="e.g., Open, In Progress, Resolved"
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Input
                  value={newIssue.priority}
                  onChange={(e) => setNewIssue({ ...newIssue, priority: e.target.value })}
                  placeholder="e.g., Low, Medium, High"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Issue Group</Label>
              <Input
                value={newIssue.issueGroup}
                onChange={(e) => setNewIssue({ ...newIssue, issueGroup: e.target.value })}
                placeholder="Enter issue group"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <SelectWithCreate
                  type="issueType"
                  value={newIssue.type}
                  onValueChange={(value) => setNewIssue({ ...newIssue, type: value })}
                  placeholder="Select type..."
                  projectId={currentProjectId!}
                />
              </div>
              <div className="space-y-2">
                <Label>Class</Label>
                <SelectWithCreate
                  type="class"
                  value={newIssue.class}
                  onValueChange={(value) => setNewIssue({ ...newIssue, class: value })}
                  placeholder="Select class..."
                  projectId={currentProjectId!}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddIssueDialogOpen(false);
              setNewIssue({
                description: '',
                owner: '',
                status: 'Open',
                priority: 'Medium',
                issueGroup: '',
                type: '',
                class: '',
              });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newIssue.description.trim() && currentProjectId) {
                  createIssueMutation.mutate({
                    projectId: currentProjectId,
                    description: newIssue.description.trim(),
                    status: newIssue.status || 'Open',
                    priority: newIssue.priority || 'Medium',
                    issueGroup: newIssue.issueGroup || undefined,
                    type: newIssue.type || undefined,
                    class: newIssue.class || undefined,
                    taskId: selectedTask?.taskId,
                  });
                }
              }}
              disabled={!newIssue.description.trim() || !currentProjectId || createIssueMutation.isPending}
            >
              {createIssueMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Issue Confirmation Dialog */}
      <AlertDialog open={deleteIssueDialogOpen} onOpenChange={setDeleteIssueDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the issue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteIssue} disabled={deleteIssueMutation.isPending}>
              {deleteIssueMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Task Group Creation Dialog (for Requirement) */}
      <Dialog open={taskGroupDialogOpen} onOpenChange={setTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task Group</DialogTitle>
            <DialogDescription>
              Add a new task group to categorize requirements and tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newTaskGroup.name}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, name: e.target.value })}
                placeholder="Enter task group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newTaskGroup.description}
                onChange={(e) => setNewTaskGroup({ ...newTaskGroup, description: e.target.value })}
                placeholder="Enter task group description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setTaskGroupDialogOpen(false);
              setNewTaskGroup({ name: '', description: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newTaskGroup.name.trim() && currentProjectId) {
                  createTaskGroupForRequirementMutation.mutate({
                    projectId: currentProjectId,
                    name: newTaskGroup.name.trim(),
                    description: newTaskGroup.description.trim() || undefined,
                  });
                }
              }}
              disabled={!newTaskGroup.name.trim() || !currentProjectId || createTaskGroupForRequirementMutation.isPending}
            >
              {createTaskGroupForRequirementMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Group Creation Dialog (for Requirement) */}
      <Dialog open={issueGroupDialogOpen} onOpenChange={setIssueGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Issue Group</DialogTitle>
            <DialogDescription>
              Add a new issue group to categorize requirements and issues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={newIssueGroup.name}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, name: e.target.value })}
                placeholder="Enter issue group name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newIssueGroup.description}
                onChange={(e) => setNewIssueGroup({ ...newIssueGroup, description: e.target.value })}
                placeholder="Enter issue group description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIssueGroupDialogOpen(false);
              setNewIssueGroup({ name: '', description: '' });
            }}>Cancel</Button>
            <Button
              onClick={() => {
                if (newIssueGroup.name.trim() && currentProjectId) {
                  createIssueGroupForRequirementMutation.mutate({
                    projectId: currentProjectId,
                    name: newIssueGroup.name.trim(),
                    description: newIssueGroup.description.trim() || undefined,
                  });
                }
              }}
              disabled={!newIssueGroup.name.trim() || !currentProjectId || createIssueGroupForRequirementMutation.isPending}
            >
              {createIssueGroupForRequirementMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Update the status for task {selectedTaskForStatus?.taskId}. The update will be recorded with a timestamp and saved to history.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="statusUpdate">Status Update *</Label>
              <Textarea
                id="statusUpdate"
                value={statusUpdateText}
                onChange={(e) => setStatusUpdateText(e.target.value)}
                placeholder="Enter status update..."
                className="min-h-[100px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey && statusUpdateText.trim()) {
                    // Ctrl+Enter to submit
                    handleStatusUpdate();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">Press Ctrl+Enter to submit</p>
            </div>
            <div className="text-sm text-muted-foreground">
              <div><strong>Current Status:</strong> {selectedTaskForStatus?.currentStatus || '-'}</div>
              {selectedTaskForStatus?.statusUpdate && (
                <div className="mt-2"><strong>Previous Update:</strong> {selectedTaskForStatus.statusUpdate}</div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setStatusUpdateDialogOpen(false);
              setStatusUpdateText('');
              setSelectedTaskForStatus(null);
            }}>Cancel</Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={!statusUpdateText.trim() || updateMutation.isPending}
            >
              {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Requirement Detail Dialog */}
      <Dialog open={requirementDetailDialogOpen} onOpenChange={setRequirementDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Requirement Details</DialogTitle>
            <DialogDescription>
              Full details for requirement {selectedRequirement?.idCode}
            </DialogDescription>
          </DialogHeader>
          {selectedRequirement && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Code</Label>
                  <p className="font-medium">{selectedRequirement.idCode}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge>{selectedRequirement.status || '-'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Priority</Label>
                  <Badge variant="outline">{selectedRequirement.priority || '-'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <p>{selectedRequirement.type || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <p>{selectedRequirement.category || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Owner</Label>
                  <p>{selectedRequirement.owner || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source Type</Label>
                  <p>{selectedRequirement.sourceType || '-'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ref Source</Label>
                  <p>{selectedRequirement.refSource || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedRequirement.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deliverable Detail Dialog */}
      <Dialog open={deliverableDetailDialogOpen} onOpenChange={setDeliverableDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deliverable Details</DialogTitle>
            <DialogDescription>
              Full details for deliverable DL-{String(selectedDeliverable?.id).padStart(4, '0')}
            </DialogDescription>
          </DialogHeader>
          {selectedDeliverable && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID</Label>
                  <p className="font-medium">DL-{String(selectedDeliverable.id).padStart(4, '0')}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge>{selectedDeliverable.status || '-'}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p>{selectedDeliverable.dueDate || '-'}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1">{selectedDeliverable.description || 'No description'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Sub-task Dialog ── */}
      <Dialog open={subTaskDialogOpen} onOpenChange={setSubTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GitBranch className="w-4 h-4 text-green-600" />Add Sub-task</DialogTitle>
            <DialogDescription>Create a child task under <strong>{parentTaskForSubTask?.taskId}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea value={newSubTask.description} onChange={e => setNewSubTask(p => ({ ...p, description: e.target.value }))} placeholder="Sub-task description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <select className="w-full border rounded p-2 text-sm bg-background" value={newSubTask.status} onChange={e => setNewSubTask(p => ({ ...p, status: e.target.value }))}>
                  {['Not Started','In Progress','Completed','On Hold','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select className="w-full border rounded p-2 text-sm bg-background" value={newSubTask.priority} onChange={e => setNewSubTask(p => ({ ...p, priority: e.target.value }))}>
                  {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={newSubTask.dueDate} onChange={e => setNewSubTask(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSubTaskDialogOpen(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={!newSubTask.description || createSubTaskMutation.isPending} onClick={() => {
              if (!parentTaskForSubTask || !currentProjectId) return;
              createSubTaskMutation.mutate({ projectId: currentProjectId, parentTaskId: parentTaskForSubTask.id, description: newSubTask.description, status: newSubTask.status, priority: newSubTask.priority, dueDate: newSubTask.dueDate || undefined });
            }}>
              {createSubTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Sub-task'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Follow-up Task Dialog ── */}
      <Dialog open={followUpDialogOpen} onOpenChange={setFollowUpDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-purple-600" />Create Follow-up Task</DialogTitle>
            <DialogDescription>Create a follow-up linked to <strong>{sourceTaskForFollowUp?.taskId}</strong></DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea value={newFollowUp.description} onChange={e => setNewFollowUp(p => ({ ...p, description: e.target.value }))} placeholder="Follow-up task description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <select className="w-full border rounded p-2 text-sm bg-background" value={newFollowUp.status} onChange={e => setNewFollowUp(p => ({ ...p, status: e.target.value }))}>
                  {['Not Started','In Progress','Completed','On Hold','Cancelled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Priority</Label>
                <select className="w-full border rounded p-2 text-sm bg-background" value={newFollowUp.priority} onChange={e => setNewFollowUp(p => ({ ...p, priority: e.target.value }))}>
                  {['Low','Medium','High','Critical'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Due Date</Label>
              <Input type="date" value={newFollowUp.dueDate} onChange={e => setNewFollowUp(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newFollowUp.notes} onChange={e => setNewFollowUp(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFollowUpDialogOpen(false)}>Cancel</Button>
            <Button className="bg-purple-600 hover:bg-purple-700" disabled={!newFollowUp.description || createFollowUpMutation.isPending} onClick={() => {
              if (!sourceTaskForFollowUp || !currentProjectId) return;
              createFollowUpMutation.mutate({ projectId: currentProjectId, followUpOfId: sourceTaskForFollowUp.id, description: newFollowUp.description, status: newFollowUp.status, priority: newFollowUp.priority, dueDate: newFollowUp.dueDate || undefined });
            }}>
              {createFollowUpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Follow-up'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Recurring Schedule Dialog ── */}
      <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-orange-600" />Set Recurring Schedule</DialogTitle>
            <DialogDescription>Configure how often <strong>{taskForRecurring?.taskId}</strong> repeats</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Repeat Type</Label>
              <select className="w-full border rounded p-2 text-sm bg-background" value={recurringConfig.recurringType} onChange={e => setRecurringConfig(p => ({ ...p, recurringType: e.target.value }))}>
                {['daily','weekly','monthly','custom'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <Label>Every (interval)</Label>
              <Input type="number" min={1} value={recurringConfig.recurringInterval} onChange={e => setRecurringConfig(p => ({ ...p, recurringInterval: parseInt(e.target.value) || 1 }))} />
              <p className="text-xs text-muted-foreground mt-1">e.g. every 2 weeks</p>
            </div>
            <div>
              <Label>End Date (optional)</Label>
              <Input type="date" value={recurringConfig.recurringEndDate} onChange={e => setRecurringConfig(p => ({ ...p, recurringEndDate: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => { if (taskForRecurring) setRecurringMutation.mutate({ id: taskForRecurring.id, recurringType: null }); setRecurringDialogOpen(false); }}>Remove Recurring</Button>
            <Button variant="outline" onClick={() => setRecurringDialogOpen(false)}>Cancel</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" disabled={setRecurringMutation.isPending} onClick={() => {
              if (!taskForRecurring) return;
              setRecurringMutation.mutate({ id: taskForRecurring.id, recurringType: recurringConfig.recurringType as any, recurringInterval: recurringConfig.recurringInterval, recurringEndDate: recurringConfig.recurringEndDate || null });
            }}>
              {setRecurringMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
