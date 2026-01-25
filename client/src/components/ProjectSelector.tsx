import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Database, Plus, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ProjectSelectorProps {
  onProjectSelected: (projectId: number) => void;
}

export default function ProjectSelector({ onProjectSelected }: ProjectSelectorProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    password: "",
  });

  const projectsQuery = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success("Project created successfully!");
      projectsQuery.refetch();
      setShowCreateForm(false);
      setNewProject({ name: "", description: "", password: "" });
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
  );
}
