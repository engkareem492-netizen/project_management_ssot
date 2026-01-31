import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useProject } from "@/contexts/ProjectContext";
import ProjectSelector from "@/components/ProjectSelector";
import DashboardLayout from "@/components/DashboardLayout";
import Today from "./Today";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { currentProjectId, setCurrentProjectId } = useProject();
  const [demoMode, setDemoMode] = useState(() => {
    return localStorage.getItem('pm-ssot-demo-mode') === 'true';
  });

  const enableDemoMode = () => {
    localStorage.setItem('pm-ssot-demo-mode', 'true');
    setDemoMode(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow access if authenticated OR in demo mode
  if (!isAuthenticated && !demoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Database className="w-12 h-12 mx-auto mb-4 text-primary" />
            <CardTitle className="text-2xl">Project Management SSOT</CardTitle>
            <CardDescription>
              Single Source of Truth for your project requirements, tasks, and issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              className="w-full"
              size="lg"
            >
              Sign In to Continue
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button 
              onClick={enableDemoMode} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              Continue as Demo User
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Demo mode allows you to test all features without authentication
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show project selector if no project is selected
  if (!currentProjectId) {
    return <ProjectSelector onProjectSelected={setCurrentProjectId} />;
  }

  // Show Today Dashboard as the main screen
  return (
    <DashboardLayout>
      <Today />
    </DashboardLayout>
  );
}
