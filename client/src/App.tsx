import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import Home from "./pages/Home";
import Requirements from "./pages/Requirements";
import Tasks from "./pages/Tasks";
import Issues from "./pages/Issues";
import Dependencies from "./pages/Dependencies";
import Assumptions from "./pages/Assumptions";
import ActionLog from "./pages/ActionLog";
import Relationships from "./pages/Relationships";
import Stakeholders from "./pages/Stakeholders";
import Deliverables from "./pages/Deliverables";
import Today from "./pages/Today";
import Settings from "./pages/Settings";
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/requirements"}>
        <DashboardLayout>
          <Requirements />
        </DashboardLayout>
      </Route>
      <Route path={"/tasks"}>
        <DashboardLayout>
          <Tasks />
        </DashboardLayout>
      </Route>
      <Route path={"/issues"}>
        <DashboardLayout>
          <Issues />
        </DashboardLayout>
      </Route>
      <Route path={"/dependencies"}>
        <DashboardLayout>
          <Dependencies />
        </DashboardLayout>
      </Route>
      <Route path={"/assumptions"}>
        <DashboardLayout>
          <Assumptions />
        </DashboardLayout>
      </Route>
      <Route path={"/stakeholders"}>
        <DashboardLayout>
          <Stakeholders />
        </DashboardLayout>
      </Route>
      <Route path={"/deliverables"}>
        <DashboardLayout>
          <Deliverables />
        </DashboardLayout>
      </Route>
      <Route path={"/today"}>
        <DashboardLayout>
          <Today />
        </DashboardLayout>
      </Route>
      <Route path={"/settings"}>
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      <Route path={"/action-log"}>
        <DashboardLayout>
          <ActionLog />
        </DashboardLayout>
      </Route>
       <Route path={"/relationships"}>
        <DashboardLayout>
          <Relationships />
        </DashboardLayout>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ProjectProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ProjectProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
