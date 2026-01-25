import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Settings as SettingsIcon, Save, Plus, Edit, Trash2, Hash, AlertCircle } from "lucide-react";

interface IdConfigEdit {
  prefix: string;
  startNumber: number;
  minNumber: number;
  maxNumber: number;
  padLength: number;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("id-config");
  const [optionsTab, setOptionsTab] = useState("status");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [optionFormData, setOptionFormData] = useState({ name: "" });

  // ID Config queries and state
  const { data: idConfigs, isLoading: idConfigsLoading } = trpc.idConfig.list.useQuery();
  const updateConfig = trpc.idConfig.update.useMutation();
  const utils = trpc.useUtils();
  const [editingConfigs, setEditingConfigs] = useState<Record<string, IdConfigEdit>>({});

  // Dropdown options queries
  const { data: statusOptions, refetch: refetchStatus } = trpc.dropdownOptions.status.getAll.useQuery();
  const { data: priorityOptions, refetch: refetchPriority } = trpc.dropdownOptions.priority.getAll.useQuery();
  const { data: typeOptions, refetch: refetchType } = trpc.dropdownOptions.type.getAll.useQuery();
  const { data: categoryOptions, refetch: refetchCategory } = trpc.dropdownOptions.category.getAll.useQuery();

  // Dropdown options mutations
  const createStatusMutation = trpc.dropdownOptions.status.create.useMutation({
    onSuccess: () => {
      toast.success("Status option created successfully");
      refetchStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateStatusMutation = trpc.dropdownOptions.status.update.useMutation({
    onSuccess: () => {
      toast.success("Status option updated successfully");
      refetchStatus();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteStatusMutation = trpc.dropdownOptions.status.delete.useMutation({
    onSuccess: () => {
      toast.success("Status option deleted successfully");
      refetchStatus();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createPriorityMutation = trpc.dropdownOptions.priority.create.useMutation({
    onSuccess: () => {
      toast.success("Priority option created successfully");
      refetchPriority();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updatePriorityMutation = trpc.dropdownOptions.priority.update.useMutation({
    onSuccess: () => {
      toast.success("Priority option updated successfully");
      refetchPriority();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deletePriorityMutation = trpc.dropdownOptions.priority.delete.useMutation({
    onSuccess: () => {
      toast.success("Priority option deleted successfully");
      refetchPriority();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createTypeMutation = trpc.dropdownOptions.type.create.useMutation({
    onSuccess: () => {
      toast.success("Type option created successfully");
      refetchType();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateTypeMutation = trpc.dropdownOptions.type.update.useMutation({
    onSuccess: () => {
      toast.success("Type option updated successfully");
      refetchType();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteTypeMutation = trpc.dropdownOptions.type.delete.useMutation({
    onSuccess: () => {
      toast.success("Type option deleted successfully");
      refetchType();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  const createCategoryMutation = trpc.dropdownOptions.category.create.useMutation({
    onSuccess: () => {
      toast.success("Category option created successfully");
      refetchCategory();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to create: ${error.message}`),
  });

  const updateCategoryMutation = trpc.dropdownOptions.category.update.useMutation({
    onSuccess: () => {
      toast.success("Category option updated successfully");
      refetchCategory();
      setEditDialogOpen(false);
      resetOptionForm();
    },
    onError: (error) => toast.error(`Failed to update: ${error.message}`),
  });

  const deleteCategoryMutation = trpc.dropdownOptions.category.delete.useMutation({
    onSuccess: () => {
      toast.success("Category option deleted successfully");
      refetchCategory();
      setDeleteDialogOpen(false);
    },
    onError: (error) => toast.error(`Failed to delete: ${error.message}`),
  });

  // ID Config functions
  const handleSaveIdConfig = async (entityType: string) => {
    const config = editingConfigs[entityType];
    if (!config) return;

    // Validate number range
    if (config.minNumber >= config.maxNumber) {
      toast.error("Minimum number must be less than maximum number");
      return;
    }

    if (config.startNumber < config.minNumber || config.startNumber > config.maxNumber) {
      toast.error(`Start number must be between ${config.minNumber} and ${config.maxNumber}`);
      return;
    }

    if (config.padLength < 1 || config.padLength > 10) {
      toast.error("Padding length must be between 1 and 10");
      return;
    }

    try {
      await updateConfig.mutateAsync({
        entityType,
        prefix: config.prefix,
        startNumber: config.startNumber,
        minNumber: config.minNumber,
        maxNumber: config.maxNumber,
        padLength: config.padLength,
      });
      
      await utils.idConfig.list.invalidate();
      toast.success(`Updated ${entityType} configuration successfully`);
      
      setEditingConfigs(prev => {
        const newState = { ...prev };
        delete newState[entityType];
        return newState;
      });
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  const getEditingConfig = (entityType: string, currentConfig: any): IdConfigEdit => {
    return editingConfigs[entityType] || {
      prefix: currentConfig.prefix,
      startNumber: currentConfig.currentNumber + 1,
      minNumber: currentConfig.minNumber || 1,
      maxNumber: currentConfig.maxNumber || 9999,
      padLength: currentConfig.padLength || 4,
    };
  };

  const updateEditingConfig = (entityType: string, field: string, value: string | number) => {
    const currentConfig = idConfigs?.find(c => c.entityType === entityType);
    setEditingConfigs(prev => ({
      ...prev,
      [entityType]: {
        ...getEditingConfig(entityType, currentConfig),
        [field]: value,
      },
    }));
  };

  const getNextIdPreview = (config: any) => {
    const editingConfig = getEditingConfig(config.entityType, config);
    const nextNumber = config.currentNumber + 1;
    const padLength = editingConfig.padLength || 4;
    return `${editingConfig.prefix}${String(nextNumber).padStart(padLength, '0')}`;
  };

  const getRangeUsagePercent = (config: any) => {
    const min = config.minNumber || 1;
    const max = config.maxNumber || 9999;
    const current = config.currentNumber || 0;
    const range = max - min + 1;
    const used = current - min + 1;
    return Math.min(100, Math.max(0, (used / range) * 100));
  };

  // Dropdown options functions
  const resetOptionForm = () => {
    setOptionFormData({ name: "" });
    setEditingItem(null);
  };

  const handleCreateOption = () => {
    if (!optionFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    switch (optionsTab) {
      case "status":
        createStatusMutation.mutate({ value: optionFormData.name });
        break;
      case "priority":
        createPriorityMutation.mutate({ value: optionFormData.name });
        break;
      case "type":
        createTypeMutation.mutate({ value: optionFormData.name });
        break;
      case "category":
        createCategoryMutation.mutate({ value: optionFormData.name });
        break;
    }
  };

  const handleUpdateOption = () => {
    if (!editingItem || !optionFormData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    switch (optionsTab) {
      case "status":
        updateStatusMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "priority":
        updatePriorityMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "type":
        updateTypeMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
      case "category":
        updateCategoryMutation.mutate({ id: editingItem.id, value: optionFormData.name });
        break;
    }
  };

  const handleDeleteOption = () => {
    if (!deletingItem) return;

    switch (optionsTab) {
      case "status":
        deleteStatusMutation.mutate({ id: deletingItem.id });
        break;
      case "priority":
        deletePriorityMutation.mutate({ id: deletingItem.id });
        break;
      case "type":
        deleteTypeMutation.mutate({ id: deletingItem.id });
        break;
      case "category":
        deleteCategoryMutation.mutate({ id: deletingItem.id });
        break;
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setOptionFormData({
      name: item.value || item.name,
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetOptionForm();
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (item: any) => {
    setDeletingItem(item);
    setDeleteDialogOpen(true);
  };

  const renderOptionsTable = (options: any[] | undefined, type: string) => {
    if (!options) return <div className="text-center py-8">Loading...</div>;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Usage Count</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                No {type} options configured. Click "Add New" to create one.
              </TableCell>
            </TableRow>
          ) : (
            options.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-medium">{option.value}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{option.usageCount || 0}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(option)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openDeleteDialog(option)}
                      disabled={(option.usageCount || 0) > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    );
  };

  if (idConfigsLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-6">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Configure ID formats, number ranges, and manage dropdown options for the entire system
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="id-config">ID Configuration</TabsTrigger>
          <TabsTrigger value="dropdown-options">Dropdown Options</TabsTrigger>
        </TabsList>

        {/* ID Configuration Tab */}
        <TabsContent value="id-config" className="space-y-6">
          <div className="bg-muted/50 border rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Hash className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold">ID Number Range Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the prefix, number range (min/max), and padding for auto-generated IDs. 
                  The system will generate IDs like PREFIX + padded number (e.g., REQ-0001).
                </p>
              </div>
            </div>
          </div>

          {idConfigs?.map((config) => {
            const editing = getEditingConfig(config.entityType, config);
            const hasChanges = editingConfigs[config.entityType] !== undefined;
            const usagePercent = getRangeUsagePercent(config);
            const isNearLimit = usagePercent > 80;

            return (
              <Card key={config.id} className={isNearLimit ? "border-destructive" : ""}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.entityType}
                        {isNearLimit && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Near Limit
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Next ID: <span className="font-mono font-bold text-primary">{getNextIdPreview(config)}</span>
                        {' '} | Current: <span className="font-mono">{config.currentNumber}</span>
                        {' '} | Range: <span className="font-mono">{config.minNumber || 1} - {config.maxNumber || 9999}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">Usage</div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isNearLimit ? 'bg-destructive' : 'bg-primary'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{usagePercent.toFixed(1)}%</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label htmlFor={`prefix-${config.id}`}>Prefix</Label>
                      <Input
                        id={`prefix-${config.id}`}
                        value={editing.prefix}
                        onChange={(e) => updateEditingConfig(config.entityType, 'prefix', e.target.value)}
                        placeholder="REQ-"
                        className="font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">e.g., REQ-, TASK-</p>
                    </div>

                    <div>
                      <Label htmlFor={`min-${config.id}`}>Min Number</Label>
                      <Input
                        id={`min-${config.id}`}
                        type="number"
                        value={editing.minNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'minNumber', parseInt(e.target.value) || 1)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Starting range</p>
                    </div>

                    <div>
                      <Label htmlFor={`max-${config.id}`}>Max Number</Label>
                      <Input
                        id={`max-${config.id}`}
                        type="number"
                        value={editing.maxNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'maxNumber', parseInt(e.target.value) || 9999)}
                        min="1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Ending range</p>
                    </div>

                    <div>
                      <Label htmlFor={`pad-${config.id}`}>Pad Length</Label>
                      <Input
                        id={`pad-${config.id}`}
                        type="number"
                        value={editing.padLength}
                        onChange={(e) => updateEditingConfig(config.entityType, 'padLength', parseInt(e.target.value) || 4)}
                        min="1"
                        max="10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Zero padding</p>
                    </div>

                    <div>
                      <Label htmlFor={`start-${config.id}`}>Reset To</Label>
                      <Input
                        id={`start-${config.id}`}
                        type="number"
                        value={editing.startNumber}
                        onChange={(e) => updateEditingConfig(config.entityType, 'startNumber', parseInt(e.target.value) || 1)}
                        min={editing.minNumber}
                        max={editing.maxNumber}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Next ID number</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Preview: <span className="font-mono font-bold">{editing.prefix}{String(editing.startNumber).padStart(editing.padLength, '0')}</span>
                    </div>
                    {hasChanges && (
                      <Button onClick={() => handleSaveIdConfig(config.entityType)} disabled={updateConfig.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Dropdown Options Tab */}
        <TabsContent value="dropdown-options" className="space-y-4">
          <Tabs value={optionsTab} onValueChange={setOptionsTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="priority">Priority</TabsTrigger>
              <TabsTrigger value="type">Type</TabsTrigger>
              <TabsTrigger value="category">Category</TabsTrigger>
            </TabsList>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Status Options</CardTitle>
                      <CardDescription>Manage status values for requirements, tasks, and issues</CardDescription>
                    </div>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderOptionsTable(statusOptions, "status")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="priority">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Priority Options</CardTitle>
                      <CardDescription>Manage priority levels for requirements and tasks</CardDescription>
                    </div>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderOptionsTable(priorityOptions, "priority")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="type">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Type Options</CardTitle>
                      <CardDescription>Manage type classifications for requirements</CardDescription>
                    </div>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderOptionsTable(typeOptions, "type")}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="category">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Category Options</CardTitle>
                      <CardDescription>Manage category classifications for requirements</CardDescription>
                    </div>
                    <Button onClick={openCreateDialog}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderOptionsTable(categoryOptions, "category")}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Option" : "Create New Option"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the option value below" : "Enter the new option value"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="option-name">Name</Label>
              <Input
                id="option-name"
                value={optionFormData.name}
                onChange={(e) => setOptionFormData({ ...optionFormData, name: e.target.value })}
                placeholder="Enter option name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingItem ? handleUpdateOption : handleCreateOption}>
              {editingItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the option
              "{deletingItem?.value || deletingItem?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOption}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
