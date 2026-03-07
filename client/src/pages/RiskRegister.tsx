import { useState, useEffect } from "react";
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
import { Plus, Edit, Trash2, FileText, AlertTriangle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useProject } from "@/contexts/ProjectContext";

export default function RiskRegister() {

  const { currentProjectId } = useProject();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  
  // Inline creation dialogs
  const [isCreateTypeDialogOpen, setIsCreateTypeDialogOpen] = useState(false);
  const [isCreateStatusDialogOpen, setIsCreateStatusDialogOpen] = useState(false);
  const [isCreateStrategyDialogOpen, setIsCreateStrategyDialogOpen] = useState(false);
  const [isCreateTaskGroupDialogOpen, setIsCreateTaskGroupDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newTaskGroupName, setNewTaskGroupName] = useState("");
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
        </div>
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
            <p className="text-center text-muted-foreground">
              No risks found. Click "Add Risk" to create one.
            </p>
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
                {risks.map((risk) => {
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
