import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Edit, Trash2, FileText, AlertTriangle, ShieldAlert, Grid3X3, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";
import { ImportExportToolbar } from "@/components/ImportExportToolbar";
import { formatDate } from "@/lib/dateUtils";
import { EmptyState } from "@/components/EmptyState";

export default function RiskRegister() {

  const { currentProjectId } = useProject();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  
  // Inline creation dialogs
  const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false);
  const [isCreateStatusDialogOpen, setIsCreateStatusDialogOpen] = useState(false);
  const [isCreateStrategyDialogOpen, setIsCreateStrategyDialogOpen] = useState(false);
  const [isCreateTaskGroupDialogOpen, setIsCreateTaskGroupDialogOpen] = useState(false);
  const [isCreateStakeholderDialogOpen, setIsCreateStakeholderDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newTaskGroupName, setNewTaskGroupName] = useState("");
  const [newStakeholder, setNewStakeholder] = useState({ fullName: "", email: "", position: "", role: "", job: "", phone: "" });
  const [formData, setFormData] = useState({
    title: "",
    riskTypeId: undefined as number | undefined,
    riskOwnerId: undefined as number | undefined,
    riskStatusId: undefined as number | undefined,
    identifiedOn: new Date().toISOString().split("T")[0],
    impact: 1,
    probability: 1,
    residualImpact: undefined as number | undefined,
    residualProbability: undefined as number | undefined,
    contingencyPlanId: undefined as number | undefined,
    responseStrategyId: undefined as number | undefined,
  });

  const utils = trpc.useUtils();

  // Queries
  const { data: risks = [], isLoading } = trpc.risks.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: riskTypes = [] } = trpc.risks.types.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: riskStatuses = [] } = trpc.risks.status.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: responseStrategies = [] } = trpc.risks.strategy.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: taskGroups = [] } = trpc.dropdownOptions.taskGroups.getAll.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Mutations
  const createRisk = trpc.risks.create.useMutation({
    onSuccess: () => {
      utils.risks.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Risk created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating risk: ${error.message}`);
    },
  });

  const updateRisk = trpc.risks.update.useMutation({
    onSuccess: () => {
      utils.risks.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedRisk(null);
      toast.success("Risk updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating risk: ${error.message}`);
    },
  });

  const deleteRisk = trpc.risks.delete.useMutation({
    onSuccess: () => {
      utils.risks.list.invalidate();
      toast.success("Risk deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting risk: ${error.message}`);
    },
  });

  // Inline creation mutations
  const createRiskType = trpc.risks.types.create.useMutation({
    onSuccess: (data: any) => {
      utils.risks.types.list.invalidate();
      setFormData({ ...formData, riskTypeId: data.insertId });
      setIsCreateTypeDialogOpen(false);
      setNewTypeName("");
      toast.success("Risk type created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating risk type: ${error.message}`);
    },
  });

  const createRiskStatus = trpc.risks.status.create.useMutation({
    onSuccess: (data: any) => {
      utils.risks.status.list.invalidate();
      setFormData({ ...formData, riskStatusId: data.insertId });
      setIsCreateStatusDialogOpen(false);
      setNewStatusName("");
      toast.success("Risk status created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating risk status: ${error.message}`);
    },
  });

  const createResponseStrategy = trpc.risks.strategy.create.useMutation({
    onSuccess: (data: any) => {
      utils.risks.strategy.list.invalidate();
      setFormData({ ...formData, responseStrategyId: data.insertId });
      setIsCreateStrategyDialogOpen(false);
      setNewStrategyName("");
      toast.success("Response strategy created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating response strategy: ${error.message}`);
    },
  });

  const createTaskGroupMutation = trpc.dropdownOptions.taskGroups.create.useMutation({
    onSuccess: (data: any) => {
      utils.dropdownOptions.taskGroups.getAll.invalidate();
      if (data?.id) setFormData((prev: any) => ({ ...prev, contingencyPlanId: data.id }));
      setIsCreateTaskGroupDialogOpen(false);
      setNewTaskGroupName("");
      toast.success("Task group created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating task group: ${error.message}`);
    },
  });

  const createStakeholderMutation = trpc.stakeholders.create.useMutation({
    onSuccess: (data: any) => {
      utils.stakeholders.list.invalidate();
      const newId = data?.id ?? data?.insertId;
      if (newId) setFormData((prev: any) => ({ ...prev, riskOwnerId: Number(newId) }));
      setIsCreateStakeholderDialogOpen(false);
      setNewStakeholder({ fullName: "", email: "", position: "", role: "", job: "", phone: "" });
      toast.success("Stakeholder created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating stakeholder: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      riskTypeId: undefined,
      riskOwnerId: undefined,
      riskStatusId: undefined,
      identifiedOn: new Date().toISOString().split("T")[0],
      impact: 1,
      probability: 1,
      residualImpact: undefined,
      residualProbability: undefined,
      contingencyPlanId: undefined,
      responseStrategyId: undefined,
    });
  };

  const handleCreate = () => {
    if (!currentProjectId) return;
    createRisk.mutate({
      projectId: currentProjectId,
      ...formData,
    });
  };

  const handleEdit = (risk: any) => {
    setSelectedRisk(risk);
    setFormData({
      title: risk.title,
      riskTypeId: risk.riskTypeId || undefined,
      riskOwnerId: risk.riskOwnerId || undefined,
      riskStatusId: risk.riskStatusId || undefined,
      identifiedOn: risk.identifiedOn ? new Date(risk.identifiedOn).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
      impact: risk.impact,
      probability: risk.probability,
      residualImpact: risk.residualImpact || undefined,
      residualProbability: risk.residualProbability || undefined,
      contingencyPlanId: risk.contingencyPlanId || undefined,
      responseStrategyId: risk.responseStrategyId || undefined,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedRisk) return;
    updateRisk.mutate({
      id: selectedRisk.id,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this risk?")) {
      deleteRisk.mutate({ id });
    }
  };

  const calculateScore = (impact: number, probability: number) => impact * probability;

  if (!currentProjectId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a project to view the Risk Register
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-gray-500" />
            Risk Register
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage project risks and mitigation strategies</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-red-700 border-red-300">{risks?.length || 0} Risks</Badge>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="bg-gray-900 hover:bg-gray-800 text-white gap-2">
                <Plus className="h-4 w-4" />
                Add Risk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Risk</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Risk Title *</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Describe the risk..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="riskType">Risk Type</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.riskTypeId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, riskTypeId: value === "none" ? undefined : parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {riskTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateTypeDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="riskStatus">Risk Status</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.riskStatusId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, riskStatusId: value === "none" ? undefined : parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {riskStatuses.map((status) => (
                          <SelectItem key={status.id} value={status.id.toString()}>
                            {status.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateStatusDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="riskOwner">Risk Owner</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.riskOwnerId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, riskOwnerId: value === "none" ? undefined : parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {stakeholders.map((stakeholder) => (
                          <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>
                            {stakeholder.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateStakeholderDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="identifiedOn">Identified On</Label>
                  <Input
                    id="identifiedOn"
                    type="date"
                    value={formData.identifiedOn}
                    onChange={(e) => setFormData({ ...formData, identifiedOn: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="impact">Impact (1-5) *</Label>
                  <Input
                    id="impact"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.impact}
                    onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="probability">Probability (1-5) *</Label>
                  <Input
                    id="probability"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  Calculated Score: {calculateScore(formData.impact, formData.probability)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="residualImpact">Residual Impact (1-5)</Label>
                  <Input
                    id="residualImpact"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.residualImpact || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        residualImpact: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="residualProbability">Residual Probability (1-5)</Label>
                  <Input
                    id="residualProbability"
                    type="number"
                    min="1"
                    max="5"
                    value={formData.residualProbability || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        residualProbability: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              {formData.residualImpact && formData.residualProbability && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm font-medium">
                    Residual Score: {calculateScore(formData.residualImpact, formData.residualProbability)}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contingencyPlan">Contingency Plan (Task Group)</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.contingencyPlanId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, contingencyPlanId: value === "none" ? undefined : parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {taskGroups.map((group: any) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateTaskGroupDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="responseStrategy">Response Strategy</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.responseStrategyId?.toString() || "none"}
                      onValueChange={(value) =>
                        setFormData({ ...formData, responseStrategyId: value === "none" ? undefined : parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {responseStrategies.map((strategy) => (
                          <SelectItem key={strategy.id} value={strategy.id.toString()}>
                            {strategy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCreateStrategyDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.title || createRisk.isPending}>
                  Create Risk
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {currentProjectId && (
          <ImportExportToolbar
            module="risks"
            projectId={currentProjectId}
            onImportSuccess={() => {}}
          />
        )}
        </div>
      </div>

      <Tabs defaultValue="table">
        <TabsList className="mb-4">
          <TabsTrigger value="table"><FileText className="w-3.5 h-3.5 mr-1.5" />Risk Table</TabsTrigger>
          <TabsTrigger value="heatmap"><Grid3X3 className="w-3.5 h-3.5 mr-1.5" />Heat Map</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap">
          <RiskHeatMap risks={risks ?? []} />
        </TabsContent>

        <TabsContent value="table">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by ID, title, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {riskStatuses.map((s) => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-9 text-muted-foreground"
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
              >
                <X className="w-3.5 h-3.5 mr-1" />Clear
              </Button>
            )}
          </div>
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Loading risks...</p>
          </CardContent>
        </Card>
      ) : risks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={ShieldAlert}
              title="No risks found"
              description="Click Add Risk to register a new risk for this project."
              actionLabel="Add Risk"
              onAction={() => setIsCreateDialogOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Risks ({risks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Probability</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Residual Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risks.filter((risk) => {
                  const riskOwner = stakeholders.find((s) => s.id === risk.riskOwnerId);
                  const riskStatus = riskStatuses.find((s) => s.id === risk.riskStatusId);
                  const matchesSearch = !searchTerm ||
                    risk.riskId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    risk.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    riskOwner?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === "all" || riskStatus?.name === statusFilter;
                  return matchesSearch && matchesStatus;
                }).map((risk) => {
                  const riskType = riskTypes.find((t) => t.id === risk.riskTypeId);
                  const riskOwner = stakeholders.find((s) => s.id === risk.riskOwnerId);
                  const riskStatus = riskStatuses.find((s) => s.id === risk.riskStatusId);

                  return (
                    <TableRow key={risk.id}>
                      <TableCell className="font-medium">{risk.riskId}</TableCell>
                      <TableCell className="max-w-xs truncate">{risk.title}</TableCell>
                      <TableCell>{riskType?.name || "-"}</TableCell>
                      <TableCell>{riskOwner?.fullName || "-"}</TableCell>
                      <TableCell>{riskStatus?.name || "-"}</TableCell>
                      <TableCell>{risk.impact}</TableCell>
                      <TableCell>{risk.probability}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{risk.score}</span>
                      </TableCell>
                      <TableCell>
                        {risk.residualScore ? (
                          <span className="font-semibold">{risk.residualScore}</span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRisk(risk);
                              setIsAnalysisDialogOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(risk)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(risk.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog - Same structure as Create Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Risk</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div>
              <Label htmlFor="edit-title">Risk Title *</Label>
              <Textarea
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Describe the risk..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Risk Type</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.riskTypeId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, riskTypeId: value === "none" ? undefined : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {riskTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateTypeDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Risk Status</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.riskStatusId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, riskStatusId: value === "none" ? undefined : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {riskStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateStatusDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Risk Owner</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.riskOwnerId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, riskOwnerId: value === "none" ? undefined : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {stakeholders.map((stakeholder) => (
                        <SelectItem key={stakeholder.id} value={stakeholder.id.toString()}>
                          {stakeholder.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateStakeholderDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Identified On</Label>
                <Input
                  type="date"
                  value={formData.identifiedOn}
                  onChange={(e) => setFormData({ ...formData, identifiedOn: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Impact (1-5) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label>Probability (1-5) *</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">
                Calculated Score: {calculateScore(formData.impact, formData.probability)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contingency Plan (Task Group)</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.contingencyPlanId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, contingencyPlanId: value === "none" ? undefined : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {taskGroups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateTaskGroupDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Response Strategy</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.responseStrategyId?.toString() || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, responseStrategyId: value === "none" ? undefined : parseInt(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {responseStrategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id.toString()}>
                          {strategy.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreateStrategyDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.title || updateRisk.isPending}>
                Update Risk
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Analysis Dialog */}
      <RiskAnalysisDialog
        risk={selectedRisk}
        isOpen={isAnalysisDialogOpen}
        onClose={() => {
          setIsAnalysisDialogOpen(false);
          setSelectedRisk(null);
        }}
        taskGroups={taskGroups}
      />

      {/* Inline Creation Dialogs */}
      <Dialog open={isCreateTypeDialogOpen} onOpenChange={setIsCreateTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Risk Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTypeName">Type Name</Label>
              <Input
                id="newTypeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="Enter risk type name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateTypeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentProjectId && newTypeName.trim()) {
                    createRiskType.mutate({
                      projectId: currentProjectId,
                      name: newTypeName.trim(),
                    });
                  }
                }}
                disabled={!newTypeName.trim() || createRiskType.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateStatusDialogOpen} onOpenChange={setIsCreateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Risk Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newStatusName">Status Name</Label>
              <Input
                id="newStatusName"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Enter risk status name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentProjectId && newStatusName.trim()) {
                    createRiskStatus.mutate({
                      projectId: currentProjectId,
                      name: newStatusName.trim(),
                    });
                  }
                }}
                disabled={!newStatusName.trim() || createRiskStatus.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateStrategyDialogOpen} onOpenChange={setIsCreateStrategyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Response Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newStrategyName">Strategy Name</Label>
              <Input
                id="newStrategyName"
                value={newStrategyName}
                onChange={(e) => setNewStrategyName(e.target.value)}
                placeholder="Enter response strategy name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateStrategyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentProjectId && newStrategyName.trim()) {
                    createResponseStrategy.mutate({
                      projectId: currentProjectId,
                      name: newStrategyName.trim(),
                    });
                  }
                }}
                disabled={!newStrategyName.trim() || createResponseStrategy.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Task Group inline dialog */}
      <Dialog open={isCreateTaskGroupDialogOpen} onOpenChange={setIsCreateTaskGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTaskGroupName">Task Group Name</Label>
              <Input
                id="newTaskGroupName"
                value={newTaskGroupName}
                onChange={(e) => setNewTaskGroupName(e.target.value)}
                placeholder="Enter task group name..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateTaskGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentProjectId && newTaskGroupName.trim()) {
                    createTaskGroupMutation.mutate({
                      projectId: currentProjectId,
                      name: newTaskGroupName.trim(),
                    });
                  }
                }}
                disabled={!newTaskGroupName.trim() || createTaskGroupMutation.isPending}
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Stakeholder / Risk Owner inline dialog */}
      <Dialog open={isCreateStakeholderDialogOpen} onOpenChange={setIsCreateStakeholderDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Stakeholder / Risk Owner</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sh-fullName">Full Name *</Label>
              <Input
                id="sh-fullName"
                value={newStakeholder.fullName}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, fullName: e.target.value })}
                placeholder="Enter full name..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sh-email">Email</Label>
                <Input
                  id="sh-email"
                  type="email"
                  value={newStakeholder.email}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label htmlFor="sh-phone">Phone</Label>
                <Input
                  id="sh-phone"
                  value={newStakeholder.phone}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sh-position">Position</Label>
                <Input
                  id="sh-position"
                  value={newStakeholder.position}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, position: e.target.value })}
                  placeholder="e.g. Project Sponsor"
                />
              </div>
              <div>
                <Label htmlFor="sh-role">Role</Label>
                <Input
                  id="sh-role"
                  value={newStakeholder.role}
                  onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })}
                  placeholder="e.g. Decision Maker"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="sh-job">Job Title</Label>
              <Input
                id="sh-job"
                value={newStakeholder.job}
                onChange={(e) => setNewStakeholder({ ...newStakeholder, job: e.target.value })}
                placeholder="e.g. Chief Risk Officer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateStakeholderDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentProjectId && newStakeholder.fullName.trim()) {
                    createStakeholderMutation.mutate({
                      projectId: currentProjectId,
                      fullName: newStakeholder.fullName.trim(),
                      email: newStakeholder.email.trim() || undefined,
                      position: newStakeholder.position.trim() || undefined,
                      role: newStakeholder.role.trim() || undefined,
                      job: newStakeholder.job.trim() || undefined,
                      phone: newStakeholder.phone.trim() || undefined,
                    });
                  }
                }}
                disabled={!newStakeholder.fullName.trim() || createStakeholderMutation.isPending}
              >
                {createStakeholderMutation.isPending ? "Creating..." : "Create Stakeholder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Risk Analysis Dialog Component
function RiskAnalysisDialog({
  risk,
  isOpen,
  onClose,
  taskGroups,
}: {
  risk: any;
  isOpen: boolean;
  onClose: () => void;
  taskGroups: any[];
}) {

  const [analysisFormData, setAnalysisFormData] = useState({
    causeLevel: 1,
    cause: "",
    consequences: "",
    trigger: "",
    mitigationPlanId: undefined as number | undefined,
  });

  const utils = trpc.useUtils();

  const { data: analysisEntries = [] } = trpc.risks.analysis.list.useQuery(
    { riskId: risk?.id || 0 },
    { enabled: !!risk }
  );

  const createAnalysis = trpc.risks.analysis.create.useMutation({
    onSuccess: () => {
      utils.risks.analysis.list.invalidate();
      resetAnalysisForm();
      toast.success("Analysis entry created successfully");
    },
    onError: (error) => {
      toast.error(`Error creating analysis: ${error.message}`);
    },
  });

  const deleteAnalysis = trpc.risks.analysis.delete.useMutation({
    onSuccess: () => {
      utils.risks.analysis.list.invalidate();
      toast.success("Analysis entry deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting analysis: ${error.message}`);
    },
  });

  const resetAnalysisForm = () => {
    setAnalysisFormData({
      causeLevel: 1,
      cause: "",
      consequences: "",
      trigger: "",
      mitigationPlanId: undefined,
    });
  };

  const handleCreateAnalysis = () => {
    if (!risk) return;
    createAnalysis.mutate({
      riskId: risk.id,
      ...analysisFormData,
    });
  };

  if (!risk) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Risk Analysis - {risk.riskId}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add Analysis Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cause Level</Label>
                  <Input
                    type="number"
                    min="1"
                    value={analysisFormData.causeLevel}
                    onChange={(e) =>
                      setAnalysisFormData({ ...analysisFormData, causeLevel: parseInt(e.target.value) })
                    }
                  />
                </div>

                <div>
                  <Label>Mitigation Plan (Task Group)</Label>
                  <Select
                    value={analysisFormData.mitigationPlanId?.toString() || "none"}
                    onValueChange={(value) =>
                      setAnalysisFormData({
                        ...analysisFormData,
                        mitigationPlanId: value === "none" ? undefined : parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {taskGroups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Cause</Label>
                <Textarea
                  value={analysisFormData.cause}
                  onChange={(e) => setAnalysisFormData({ ...analysisFormData, cause: e.target.value })}
                  placeholder="Describe the cause..."
                />
              </div>

              <div>
                <Label>Consequences</Label>
                <Textarea
                  value={analysisFormData.consequences}
                  onChange={(e) => setAnalysisFormData({ ...analysisFormData, consequences: e.target.value })}
                  placeholder="Describe the consequences..."
                />
              </div>

              <div>
                <Label>Trigger</Label>
                <Textarea
                  value={analysisFormData.trigger}
                  onChange={(e) => setAnalysisFormData({ ...analysisFormData, trigger: e.target.value })}
                  placeholder="Describe the trigger..."
                />
              </div>

              <Button
                onClick={handleCreateAnalysis}
                disabled={
                  !analysisFormData.cause ||
                  !analysisFormData.consequences ||
                  !analysisFormData.trigger ||
                  createAnalysis.isPending
                }
              >
                Add Entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Entries ({analysisEntries.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisEntries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No analysis entries yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Cause</TableHead>
                      <TableHead>Consequences</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Mitigation Plan</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analysisEntries.map((entry) => {
                      const mitigationPlan = taskGroups.find((g) => g.id === entry.mitigationPlanId);

                      return (
                        <TableRow key={entry.id}>
                          <TableCell>{entry.causeLevel}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.cause}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.consequences}</TableCell>
                          <TableCell className="max-w-xs truncate">{entry.trigger}</TableCell>
                          <TableCell>{mitigationPlan?.name || "-"}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this analysis entry?")) {
                                  deleteAnalysis.mutate({ id: entry.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Risk Heat Map Component ──────────────────────────────────────────────────
function RiskHeatMap({ risks }: { risks: Array<{ id: number; riskId: string; title: string; impact: number | null; probability: number | null; score: number | null }> }) {
  const [selectedCell, setSelectedCell] = useState<{ impact: number; prob: number } | null>(null);

  const cellMap = useMemo(() => {
    const m: Record<string, typeof risks> = {};
    risks.forEach(r => {
      const imp = r.impact ?? 1;
      const prob = r.probability ?? 1;
      const key = `${imp}-${prob}`;
      if (!m[key]) m[key] = [];
      m[key].push(r);
    });
    return m;
  }, [risks]);

  function getCellColor(impact: number, prob: number) {
    const score = impact * prob;
    if (score >= 20) return "bg-red-500 hover:bg-red-400 text-white";
    if (score >= 12) return "bg-orange-400 hover:bg-orange-300 text-white";
    if (score >= 6) return "bg-yellow-400 hover:bg-yellow-300 text-gray-800";
    return "bg-green-300 hover:bg-green-200 text-gray-800";
  }

  function getCellLabel(score: number) {
    if (score >= 20) return "Critical";
    if (score >= 12) return "High";
    if (score >= 6) return "Medium";
    return "Low";
  }

  const selectedRisks = selectedCell
    ? (cellMap[`${selectedCell.impact}-${selectedCell.prob}`] ?? [])
    : [];

  const levels = [5, 4, 3, 2, 1];
  const probs = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center">
        {[
          { label: "Critical (≥20)", color: "bg-red-500" },
          { label: "High (12–19)", color: "bg-orange-400" },
          { label: "Medium (6–11)", color: "bg-yellow-400" },
          { label: "Low (<6)", color: "bg-green-300" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded ${l.color}`} />
            <span className="text-sm text-muted-foreground">{l.label}</span>
          </div>
        ))}
        <span className="text-xs text-muted-foreground ml-auto">Click a cell to see risks</span>
      </div>

      <div className="flex gap-6 flex-wrap items-start">
        <div className="overflow-x-auto">
          <div className="inline-block">
            <div className="flex">
              <div className="w-10 flex items-center justify-center">
                <span className="text-xs font-semibold text-muted-foreground -rotate-90 whitespace-nowrap">Impact</span>
              </div>
              <div>
                <div className="flex gap-1 mb-1">
                  {probs.map(p => (
                    <div key={p} className="w-20 h-6 flex items-center justify-center text-xs font-semibold text-muted-foreground">{p}</div>
                  ))}
                </div>
                <div className="text-center text-xs font-semibold text-muted-foreground mb-2">Probability →</div>
                {levels.map(impact => (
                  <div key={impact} className="flex gap-1 mb-1 items-center">
                    <span className="w-5 text-xs font-semibold text-muted-foreground text-right mr-1">{impact}</span>
                    {probs.map(prob => {
                      const key = `${impact}-${prob}`;
                      const cellRisks = cellMap[key] ?? [];
                      const score = impact * prob;
                      const isSelected = selectedCell?.impact === impact && selectedCell?.prob === prob;
                      return (
                        <button
                          key={prob}
                          onClick={() => setSelectedCell(isSelected ? null : { impact, prob })}
                          className={`w-20 h-16 rounded-lg flex flex-col items-center justify-center gap-0.5 border-2 transition-all ${getCellColor(impact, prob)} ${isSelected ? "ring-2 ring-offset-2 ring-gray-800 border-gray-800" : "border-transparent"}`}
                          title={`Impact ${impact} × Probability ${prob} = ${score} (${getCellLabel(score)})`}
                        >
                          <span className="text-lg font-bold leading-none">{score}</span>
                          {cellRisks.length > 0 && (
                            <span className="text-[10px] font-semibold bg-white/30 rounded px-1">
                              {cellRisks.length} risk{cellRisks.length !== 1 ? "s" : ""}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {selectedCell && (
          <div className="flex-1 min-w-[240px]">
            <div className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-sm">
                  I={selectedCell.impact} × P={selectedCell.prob} → Score {selectedCell.impact * selectedCell.prob}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {getCellLabel(selectedCell.impact * selectedCell.prob)}
                </Badge>
              </div>
              {selectedRisks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No risks in this cell.</p>
              ) : (
                <div className="space-y-2">
                  {selectedRisks.map(r => (
                    <div key={r.id} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/40 border">
                      <span className="font-mono font-bold text-xs text-muted-foreground shrink-0">{r.riskId}</span>
                      <span className="text-sm">{r.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical (≥20)", color: "text-red-600", bg: "bg-red-50 border-red-200", count: risks.filter(r => (r.score ?? 0) >= 20).length },
          { label: "High (12–19)", color: "text-orange-600", bg: "bg-orange-50 border-orange-200", count: risks.filter(r => { const s = r.score ?? 0; return s >= 12 && s < 20; }).length },
          { label: "Medium (6–11)", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", count: risks.filter(r => { const s = r.score ?? 0; return s >= 6 && s < 12; }).length },
          { label: "Low (<6)", color: "text-green-600", bg: "bg-green-50 border-green-200", count: risks.filter(r => (r.score ?? 0) < 6).length },
        ].map(item => (
          <div key={item.label} className={`rounded-xl border p-3 text-center ${item.bg}`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
