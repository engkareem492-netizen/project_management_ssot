import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Settings, Trash2, Edit, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KnowledgeBase() {
  const { currentProjectId } = useProject();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [typeId, setTypeId] = useState<string>("");
  const [componentId, setComponentId] = useState<string>("");

  // Configuration states
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeParent, setNewTypeParent] = useState<string>("");
  const [newComponentName, setNewComponentName] = useState("");
  const [codePrefix, setCodePrefix] = useState("");

  const utils = trpc.useUtils();

  // Queries
  const { data: entries = [], isLoading } = trpc.knowledgeBase.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: types = [] } = trpc.knowledgeBase.types.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: components = [] } = trpc.knowledgeBase.components.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: config } = trpc.knowledgeBase.codeConfig.get.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Mutations
  const createMutation = trpc.knowledgeBase.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      toast.success("Knowledge base entry created");
      resetForm();
      setCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to create entry: ${error.message}`);
    },
  });

  const updateMutation = trpc.knowledgeBase.update.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      toast.success("Knowledge base entry updated");
      resetForm();
      setEditingEntry(null);
    },
    onError: (error) => {
      toast.error(`Failed to update entry: ${error.message}`);
    },
  });

  const deleteMutation = trpc.knowledgeBase.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.list.invalidate();
      toast.success("Knowledge base entry deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete entry: ${error.message}`);
    },
  });

  const createTypeMutation = trpc.knowledgeBase.types.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.types.list.invalidate();
      toast.success("Type created");
      setNewTypeName("");
      setNewTypeParent("");
    },
  });

  const deleteTypeMutation = trpc.knowledgeBase.types.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.types.list.invalidate();
      toast.success("Type deleted");
    },
  });

  const createComponentMutation = trpc.knowledgeBase.components.create.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.components.list.invalidate();
      toast.success("Component created");
      setNewComponentName("");
    },
  });

  const deleteComponentMutation = trpc.knowledgeBase.components.delete.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.components.list.invalidate();
      toast.success("Component deleted");
    },
  });

  const updateCodeConfigMutation = trpc.knowledgeBase.codeConfig.update.useMutation({
    onSuccess: () => {
      utils.knowledgeBase.codeConfig.get.invalidate();
      toast.success("Code prefix updated");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTypeId("");
    setComponentId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProjectId) return;

    const data = {
      projectId: currentProjectId,
      title,
      description,
      typeId: typeId ? parseInt(typeId) : undefined,
      componentId: componentId ? parseInt(componentId) : undefined,
    };

    if (editingEntry) {
      updateMutation.mutate({ ...data, id: editingEntry.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setDescription(entry.description || "");
    setTypeId(entry.typeId?.toString() || "");
    setComponentId(entry.componentId?.toString() || "");
    setCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleCreateType = () => {
    if (!currentProjectId || !newTypeName) return;
    createTypeMutation.mutate({
      projectId: currentProjectId,
      name: newTypeName,
      parentTypeId: newTypeParent ? parseInt(newTypeParent) : undefined,
    });
  };

  const handleCreateComponent = () => {
    if (!currentProjectId || !newComponentName) return;
    createComponentMutation.mutate({
      projectId: currentProjectId,
      name: newComponentName,
    });
  };

  const handleUpdateCodePrefix = () => {
    if (!currentProjectId || !codePrefix) return;
    updateCodeConfigMutation.mutate({
      projectId: currentProjectId,
      prefix: codePrefix,
    });
  };

  // Get type name by ID
  const getTypeName = (id: number | null) => {
    if (!id) return "—";
    const type = types.find((t) => t.id === id);
    return type?.name || "—";
  };

  // Get component name by ID
  const getComponentName = (id: number | null) => {
    if (!id) return "—";
    const component = components.find((c) => c.id === id);
    return component?.name || "—";
  };

  // Get child types for hierarchical display
  const getChildTypes = (parentId: number | null) => {
    return types.filter((t) => t.parentTypeId === parentId);
  };

  if (!currentProjectId) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Please select a project first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your project's knowledge base with configurable codes, types, and components
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setCodePrefix(config?.prefix || "KB")}>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Knowledge Base Configuration</DialogTitle>
                <DialogDescription>
                  Manage types, components, and code prefix for your knowledge base
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="types" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="types">Types</TabsTrigger>
                  <TabsTrigger value="components">Components</TabsTrigger>
                  <TabsTrigger value="code">Code Prefix</TabsTrigger>
                </TabsList>

                <TabsContent value="types" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add New Type</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type name"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                      />
                      <Select value={newTypeParent} onValueChange={setNewTypeParent}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Parent type (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No parent</SelectItem>
                          {types.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleCreateType}>Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Existing Types</Label>
                    <div className="space-y-1">
                      {types.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No types yet</p>
                      ) : (
                        types.map((type) => (
                          <div
                            key={type.id}
                            className="flex items-center justify-between p-2 rounded border"
                          >
                            <span>
                              {type.name}
                              {type.parentTypeId && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  (child of {getTypeName(type.parentTypeId)})
                                </span>
                              )}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTypeMutation.mutate({ id: type.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="components" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Add New Component</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Component name"
                        value={newComponentName}
                        onChange={(e) => setNewComponentName(e.target.value)}
                      />
                      <Button onClick={handleCreateComponent}>Add</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Existing Components</Label>
                    <div className="space-y-1">
                      {components.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No components yet</p>
                      ) : (
                        components.map((component) => (
                          <div
                            key={component.id}
                            className="flex items-center justify-between p-2 rounded border"
                          >
                            <span>{component.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteComponentMutation.mutate({ id: component.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="code" className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code Prefix</Label>
                    <p className="text-sm text-muted-foreground">
                      This prefix will be used for all knowledge base entry codes (e.g., KB-001)
                    </p>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., KB"
                        value={codePrefix}
                        onChange={(e) => setCodePrefix(e.target.value)}
                        maxLength={10}
                      />
                      <Button onClick={handleUpdateCodePrefix}>Update</Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Dialog
            open={createDialogOpen}
            onOpenChange={(open) => {
              setCreateDialogOpen(open);
              if (!open) {
                setEditingEntry(null);
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingEntry ? "Edit Entry" : "Create New Entry"}</DialogTitle>
                <DialogDescription>
                  {editingEntry
                    ? "Update the knowledge base entry details"
                    : "Add a new entry to your knowledge base"}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={typeId} onValueChange={setTypeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No type</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.name}
                          {type.parentTypeId && ` (${getTypeName(type.parentTypeId)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="component">Component</Label>
                  <Select value={componentId} onValueChange={setComponentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No component</SelectItem>
                      {components.map((component) => (
                        <SelectItem key={component.id} value={component.id.toString()}>
                          {component.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setCreateDialogOpen(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingEntry ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No entries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first knowledge base entry to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground">
                        {entry.code}
                      </span>
                      <span>{entry.title}</span>
                    </CardTitle>
                    <CardDescription className="flex gap-4">
                      <span>Type: {getTypeName(entry.typeId)}</span>
                      <span>Component: {getComponentName(entry.componentId)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {entry.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {entry.description}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
