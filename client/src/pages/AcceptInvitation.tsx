import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function AcceptInvitation() {
  const [location, setLocation] = useLocation();
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [projectId, setProjectId] = useState<number | null>(null);

  const acceptInvitationMutation = trpc.collaboration.acceptInvitation.useMutation({
    onSuccess: (data) => {
      setStatus("success");
      setMessage(data.message);
      setProjectId(data.projectId);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message);
    },
  });

  useEffect(() => {
    // Extract token from URL query params
    const params = new URLSearchParams(location.split("?")[1] || "");
    const tokenParam = params.get("token");

    if (!tokenParam) {
      setStatus("error");
      setMessage("Invalid invitation link - no token provided");
      return;
    }

    setToken(tokenParam);

    // Automatically accept the invitation
    acceptInvitationMutation.mutate({ token: tokenParam });
  }, [location]);

  const handleGoToProject = () => {
    if (projectId) {
      setLocation(`/?project=${projectId}`);
    }
  };

  const handleGoToLogin = () => {
    setLocation("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Project Invitation</CardTitle>
          <CardDescription>
            {status === "loading" && "Processing your invitation..."}
            {status === "success" && "Invitation accepted!"}
            {status === "error" && "Invitation failed"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Please wait...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-center text-sm">{message}</p>
              <Button onClick={handleGoToProject} className="w-full">
                Go to Project
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-center text-sm text-red-500">{message}</p>
              <div className="flex flex-col gap-2 w-full">
                <Button onClick={handleGoToLogin} variant="outline" className="w-full">
                  Go to Login
                </Button>
                <Button onClick={() => setLocation("/")} variant="ghost" className="w-full">
                  Go to Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
