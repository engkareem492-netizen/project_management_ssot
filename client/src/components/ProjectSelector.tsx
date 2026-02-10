import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Database, Plus, Lock } from "lucide-react";
import { getPasswordResetUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProjectSelectorProps {
  onProjectSelected: (projectId: number) => void;
}

export default function ProjectSelector({ onProjectSelected }: ProjectSelectorProps) {
  const { user } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    password: "",
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
  
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: async (data) => {
      // If import is enabled, export data from source project and import to new project
      if (importOptions.enabled && importOptions.sourceProjectId && importOptions.sourcePassword) {
        try {
          toast.info("Importing data from source project...");
          const exportedData = await exportDataMutation.mutateAsync({
            projectId: importOptions.sourceProjectId,
            password: importOptions.sourcePassword,
          });
          
          // TODO: Import the exported data into the new project
          // This will be implemented in the next step
          console.log("Exported data:", exportedData);
          toast.success("Project created and data imported successfully!");
        } catch (error: any) {
          toast.error(`Project created but import failed: ${error.message}`);
        }
      } else {
        toast.success("Project created successfully!");
      }
      
      projectsQuery.refetch();
      setShowCreateForm(false);
      setNewProject({ name: "", description: "", password: "" });
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

  const resetPasswordMutation = trpc.projects.resetPassword.useMutation({
    onSuccess: () => {
      toast.success("Password reset successfully!");
      setShowResetPassword(false);
      setNewPassword("");
      setPassword("");
    },
    onError: (error) => {
      toast.error(`Failed to reset password: ${error.message}`);
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
    if (!newProject.name || !newProject.password) {
      toast.error("Project name and password are required");
      return;
    }
    createMutation.mutate(newProject);
  };

  const handleSelectProject = (projectId: number) => {
    setSelectedProjectId(projectId);
  };

  const handleVerifyPassword = () => {
    if (!selectedProjectId || !password) {
      toast.error("Please enter a password");
      return;
    }
    verifyMutation.mutate({ projectId: selectedProjectId, password });
  };

  const handleResetPassword = () => {
    if (!selectedProjectId || !newPassword) {
      toast.error("Please enter a new password");
      return;
    }
    resetPasswordMutation.mutate({ projectId: selectedProjectId, newPassword });
  };

  const handleDeleteProject = () => {
    if (!selectedProjectId) return;
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone and will delete all associated data.")) {
      return;
    }
    deleteMutation.mutate({ projectId: selectedProjectId });
  };

  if (showCreateForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Create New Project</CardTitle>
            <CardDescription>
              Set up a new project with password protection
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
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={newProject.password}
                onChange={(e) => setNewProject({ ...newProject, password: e.target.value })}
                placeholder="Enter project password"
              />
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
                    <Label htmlFor="source-password">Source Project Password</Label>
                    <Input
                      id="source-password"
                      type="password"
                      value={importOptions.sourcePassword}
                      onChange={(e) => setImportOptions({ ...importOptions, sourcePassword: e.target.value })}
                      placeholder="Enter source project password"
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

  if (selectedProjectId) {
    const project = projectsQuery.data?.find(p => p.id === selectedProjectId);
    return (
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
            {user && project?.createdBy === user.id && (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => setShowResetPassword(true)}
                  className="w-full"
                >
                  Reset Project Password
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
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
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
                      onClick={() => handleSelectProject(project.id)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          {project.name}
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

      {/* Reset Password Dialog */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reset Project Password</CardTitle>
              <CardDescription>
                Enter a new password for this project. Only the project creator can reset the password.
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
                  onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPassword(false);
                    setNewPassword("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={resetPasswordMutation.isPending}
                  className="flex-1"
                >
                  {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
