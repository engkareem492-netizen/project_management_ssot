import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function JoinProject() {
  const [, params] = useRoute("/join-project/:projectId");
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");

  const projectId = params?.projectId ? parseInt(params.projectId) : null;

  const joinProjectMutation = trpc.collaboration.joinProjectWithPassword.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      // Redirect to project
      setLocation(`/?project=${data.projectId}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      toast.error("Invalid project ID");
      return;
    }

    if (!password) {
      toast.error("Please enter the project password");
      return;
    }

    joinProjectMutation.mutate({
      projectId,
      password,
    });
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Invalid Project Link</CardTitle>
            <CardDescription>
              The project link you followed is invalid or malformed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join Project</CardTitle>
          <CardDescription>
            Enter the project password to gain access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Project Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter project password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={joinProjectMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={joinProjectMutation.isPending}
            >
              {joinProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Project"
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setLocation("/")}
            >
              Cancel
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
