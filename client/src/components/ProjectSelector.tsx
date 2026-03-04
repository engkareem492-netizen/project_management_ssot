import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Database, Plus, Lock, Unlock, LogOut, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { getPasswordResetUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProjectSelectorProps {
  onProjectSelected: (projectId: number) => void;
}

export default function ProjectSelector({ onProjectSelected }: ProjectSelectorProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [password, setPassword] = useState("");

  // Password management modal state
  const [showManagePassword, setShowManagePassword] = useState(false);
  const [manageMode, setManageMode] = useState<"set" | "change" | "remove">("set");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    password: "",
    usePassword: false,
  });

  const [importOptions, setImportOptions] = useState({
    enabled: false,
    sourceProjectId: null as number | null,
    sourcePassword: "",
    entities: {
      stakeholders: false,
      requirements: false,
      tasks: false,
      issues: false,
      deliverables: false,
      dependencies: false,
      assumptions: false,
      taskGroups: false,
      issueGroups: false,
      issueTypes: false,
      taskTypes: false,
      deliverableTypes: false,
      classOptions: false,
    },
  });

  const projectsQuery = trpc.projects.list.useQuery();
  const exportDataMutation = trpc.projects.exportData.useMutation();
  const importDataMutation = trpc.projects.importData.useMutation();

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: async (data) => {
      if (importOptions.enabled && importOptions.sourceProjectId) {
        try {
          toast.info("Importing data from source project...");
          const exportedData = await exportDataMutation.mutateAsync({
            projectId: importOptions.sourceProjectId,
            password: importOptions.sourcePassword || undefined,
          });
          await importDataMutation.mutateAsync({
            targetProjectId: data.id,
            sourceData: exportedData,
            selectedEntities: importOptions.entities,
          });
          toast.success("Project created and data imported successfully!");
        } catch (error: any) {
          toast.error(`Project created but import failed: ${error.message}`);
        }
      } else {
        toast.success("Project created successfully!");
      }

      projectsQuery.refetch();
      setShowCreateForm(false);
      setNewProject({ name: "", description: "", password: "", usePassword: false });
      setImportOptions({
        enabled: false,
        sourceProjectId: null,
        sourcePassword: "",
        entities: {
          stakeholders: false,
          requirements: false,
          tasks: false,
          issues: false,
          deliverables: false,
          dependencies: false,
          assumptions: false,
          taskGroups: false,
          issueGroups: false,
          issueTypes: false,
          taskTypes: false,
          deliverableTypes: false,
          classOptions: false,
        },
      });
      onProjectSelected(data.id);
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
    },
  });

  const verifyMutation = trpc.projects.verify.useMutation({
    onSuccess: (data) => {
      if (data.valid && selectedProjectId) {
        toast.success("Access granted!");
        onProjectSelected(selectedProjectId);
      } else {
        toast.error("Invalid password");
      }
    },
    onError: (error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });

  const setPasswordMutation = trpc.projects.setPassword.useMutation({
    onSuccess: (data) => {
      if (data.hasPassword) {
        toast.success("Password set successfully!");
      } else {
        toast.success("Password removed. Project is now open access.");
      }
      projectsQuery.refetch();
      setShowManagePassword(false);
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast.error(`Failed to update password: ${error.message}`);
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted successfully!");
      projectsQuery.refetch();
      setSelectedProjectId(null);
      setPassword("");
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });

  const handleCreateProject = () => {
    if (!newProject.name) {
      toast.error("Project name is required");
      return;
    }
    if (newProject.usePassword && !newProject.password) {
      toast.error("Please enter a password or disable password protection");
      return;
    }
    createMutation.mutate({
      name: newProject.name,
      description: newProject.description || undefined,
      password: newProject.usePassword ? newProject.password : undefined,
    });
  };

  const handleSelectProject = (project: any) => {
    if (!project.hasPassword) {
      // No password — open directly
      onProjectSelected(project.id);
    } else {
      // Has password — show password entry
      setSelectedProjectId(project.id);
    }
  };

  const handleVerifyPassword = () => {
    if (!selectedProjectId || !password) {
      toast.error("Please enter a password");
      return;
    }
    verifyMutation.mutate({ projectId: selectedProjectId, password });
  };

  const handleManagePassword = () => {
    if (!newPassword) {
      toast.error("Please enter a password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    setPasswordMutation.mutate({ projectId: selectedProjectId!, newPassword });
  };

  const handleRemovePassword = () => {
    if (!confirm("Are you sure you want to remove the password? Anyone will be able to access this project.")) return;
    setPasswordMutation.mutate({ projectId: selectedProjectId!, newPassword: null });
  };

  const handleDeleteProject = () => {
    if (!selectedProjectId) return;
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all associated data.")) {
      return;
    }
    deleteMutation.mutate({ projectId: selectedProjectId });
  };

  // ─── Create Project Form ───────────────────────────────────────────────────
  if (showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Set up a new project workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                placeholder="Enter project name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                placeholder="Enter project description"
                rows={3}
              />
            </div>

            {/* Password toggle */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {newProject.usePassword ? (
                    <Lock className="w-4 h-4 text-primary" />
                  ) : (
                    <Unlock className="w-4 h-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="use-password" className="cursor-pointer font-medium">
                    Password Protection
                  </Label>
                </div>
                <Switch
                  id="use-password"
                  checked={newProject.usePassword}
                  onCheckedChange={(checked) =>
                    setNewProject({ ...newProject, usePassword: checked, password: "" })
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {newProject.usePassword
                  ? "Users must enter a password to access this project."
                  : "Anyone with access to this app can open this project directly."}
              </p>
              {newProject.usePassword && (
                <div className="space-y-2 pt-1">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newProject.password}
                    onChange={(e) => setNewProject({ ...newProject, password: e.target.value })}
                    placeholder="Enter project password"
                  />
                </div>
              )}
            </div>

            {/* Import from existing project */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="import-enabled"
                  checked={importOptions.enabled}
                  onChange={(e) => setImportOptions({ ...importOptions, enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="import-enabled" className="cursor-pointer">
                  Import data from existing project
                </Label>
              </div>

              {importOptions.enabled && (
                <div className="space-y-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="source-project">Source Project</Label>
                    <select
                      id="source-project"
                      value={importOptions.sourceProjectId || ""}
                      onChange={(e) => setImportOptions({ ...importOptions, sourceProjectId: Number(e.target.value) })}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Select a project</option>
                      {projectsQuery.data?.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source-password">Source Project Password (if any)</Label>
                    <Input
                      id="source-password"
                      type="password"
                      value={importOptions.sourcePassword}
                      onChange={(e) => setImportOptions({ ...importOptions, sourcePassword: e.target.value })}
                      placeholder="Leave blank if no password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select data to import:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(importOptions.entities).map((entity) => (
                        <div key={entity} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`import-${entity}`}
                            checked={importOptions.entities[entity as keyof typeof importOptions.entities]}
                            onChange={(e) => setImportOptions({
                              ...importOptions,
                              entities: {
                                ...importOptions.entities,
                                [entity]: e.target.checked,
                              },
                            })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor={`import-${entity}`} className="cursor-pointer text-sm capitalize">
                            {entity.replace(/([A-Z])/g, ' $1').trim()}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={createMutation.isPending}
                className="flex-1"
              >
                {createMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Password Entry Screen (for password-protected projects) ──────────────
  if (selectedProjectId) {
    const project = projectsQuery.data?.find(p => p.id === selectedProjectId);
    const isCreator = user && project?.createdBy === user.id;

    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle className="text-2xl">{project?.name}</CardTitle>
              <CardDescription>
                {project?.description || "Enter password to access this project"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter project password"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyPassword()}
                  autoFocus
                />
                <div className="text-right">
                  <a
                    href={getPasswordResetUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProjectId(null);
                    setPassword("");
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleVerifyPassword}
                  disabled={verifyMutation.isPending}
                  className="flex-1"
                >
                  {verifyMutation.isPending ? "Verifying..." : "Access Project"}
                </Button>
              </div>

              {/* Creator-only actions */}
              {isCreator && (
                <div className="border-t pt-4 mt-4 space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManageMode("change");
                      setShowManagePassword(true);
                    }}
                    className="w-full"
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRemovePassword}
                    disabled={setPasswordMutation.isPending}
                    className="w-full text-orange-600 hover:text-orange-700"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Remove Password (Open Access)
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteProject}
                    disabled={deleteMutation.isPending}
                    className="w-full"
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete Project"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Change Password Dialog */}
        {showManagePassword && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Change Project Password</CardTitle>
                <CardDescription>
                  Enter a new password for <strong>{project?.name}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    onKeyDown={(e) => e.key === "Enter" && handleManagePassword()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManagePassword(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleManagePassword}
                    disabled={setPasswordMutation.isPending}
                    className="flex-1"
                  >
                    {setPasswordMutation.isPending ? "Saving..." : "Save Password"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </>
    );
  }

  // ─── Project List ──────────────────────────────────────────────────────────
  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center relative">
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="absolute top-4 right-4"
                title="Switch Account"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Switch Account
              </Button>
            )}
            <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Select a Project</CardTitle>
            <CardDescription>
              Choose an existing project or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            {projectsQuery.isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading projects...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 mb-6">
                  {projectsQuery.data?.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleSelectProject(project)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {project.hasPassword ? (
                            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600 shrink-0" />
                          )}
                          {project.name}
                          <Badge
                            variant={project.hasPassword ? "secondary" : "outline"}
                            className={`ml-auto text-xs ${!project.hasPassword ? "text-green-700 border-green-300" : ""}`}
                          >
                            {project.hasPassword ? "Password Protected" : "Open Access"}
                          </Badge>
                        </CardTitle>
                        {project.description && (
                          <CardDescription className="text-sm">
                            {project.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                  {(!projectsQuery.data || projectsQuery.data.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No projects found. Create your first project!
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
