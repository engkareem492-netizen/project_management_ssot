import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
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
import KnowledgeBase from "./pages/KnowledgeBase";
import RiskRegister from "./pages/RiskRegister";
import ChangeRequests from "./pages/ChangeRequests";
import Meetings from "./pages/Meetings";
import TestCases from "./pages/TestCases";
import GanttChart from "./pages/GanttChart";
import TraceabilityMatrix from "./pages/TraceabilityMatrix";
import PeriodicReport from "./pages/PeriodicReport";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Decisions from "./pages/Decisions";
import CalendarPage from "./pages/Calendar";
import Budget from "./pages/Budget";
import Resources from "./pages/Resources";
import ScopeItems from "./pages/ScopeItems";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AcceptInvitation from "./pages/AcceptInvitation";
import JoinProject from "./pages/JoinProject";
import ProjectCharter from "./pages/ProjectCharter";
import PMPlan from "./pages/PMPlan";
import WBSBuilder from "./pages/WBSBuilder";
import EEFPage from "./pages/EEF";
import CurrencySettings from "./pages/CurrencySettings";
import Milestones from "./pages/Milestones";
import RaidLog from "./pages/RaidLog";
// ActionItems merged into Tasks - redirects to /tasks
import LessonsLearned from "./pages/LessonsLearned";
import DocumentLibrary from "./pages/DocumentLibrary";
import CustomFields from "./pages/CustomFields";

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/forgot-password"} component={ForgotPassword} />
      <Route path={"/reset-password"} component={ResetPassword} />
      <Route path={"/accept-invitation"} component={AcceptInvitation} />
      <Route path={"/join-project/:projectId"} component={JoinProject} />
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
      <Route path={"/knowledge-base"}>
        <DashboardLayout>
          <KnowledgeBase />
        </DashboardLayout>
      </Route>
      <Route path={"/risk-register"}>
        <DashboardLayout>
          <RiskRegister />
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
      <Route path={"/change-requests"}>
        <DashboardLayout>
          <ChangeRequests />
        </DashboardLayout>
      </Route>
      <Route path={"/meetings"}>
        <DashboardLayout>
          <Meetings />
        </DashboardLayout>
      </Route>
      <Route path={"/test-cases"}>
        <DashboardLayout>
          <TestCases />
        </DashboardLayout>
      </Route>
      <Route path={"/gantt"}>
        <DashboardLayout>
          <GanttChart />
        </DashboardLayout>
      </Route>
      <Route path={"/traceability"}>
        <DashboardLayout>
          <TraceabilityMatrix />
        </DashboardLayout>
      </Route>
      <Route path={"/weekly-report"}>
        <DashboardLayout>
          <PeriodicReport />
        </DashboardLayout>
      </Route>
      <Route path={"/periodic-report"}>
        <DashboardLayout>
          <PeriodicReport />
        </DashboardLayout>
      </Route>
      <Route path={"/dashboard"}>
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      <Route path={"/decisions"}>
        <DashboardLayout>
          <Decisions />
        </DashboardLayout>
      </Route>
      <Route path={"/calendar"}>
        <DashboardLayout>
          <CalendarPage />
        </DashboardLayout>
      </Route>
      <Route path={"/budget"}>
        <DashboardLayout>
          <Budget />
        </DashboardLayout>
      </Route>
      <Route path={"/resources"}>
        <DashboardLayout>
          <Resources />
        </DashboardLayout>
      </Route>
      <Route path={"/scope"}>
        <DashboardLayout>
          <ScopeItems />
        </DashboardLayout>
      </Route>
      <Route path={"/charter"}>
        <DashboardLayout>
          <ProjectCharter />
        </DashboardLayout>
      </Route>
      <Route path={"/pm-plan"}>
        <DashboardLayout>
          <PMPlan />
        </DashboardLayout>
      </Route>
      <Route path="/wbs">
        <DashboardLayout>
          <WBSBuilder />
        </DashboardLayout>
      </Route>
      <Route path="/eef">
        <DashboardLayout>
          <EEFPage />
        </DashboardLayout>
      </Route>
      <Route path="/currency-settings">
        <DashboardLayout>
          <CurrencySettings />
        </DashboardLayout>
      </Route>
      <Route path={"/milestones"}>
        <DashboardLayout>
          <Milestones />
        </DashboardLayout>
      </Route>
      <Route path={"/raid-log"}>
        <DashboardLayout>
          <RaidLog />
        </DashboardLayout>
      </Route>
      <Route path={"/action-items"}>
        <Redirect to="/tasks" />
      </Route>
      <Route path={"/lessons-learned"}>
        <DashboardLayout>
          <LessonsLearned />
        </DashboardLayout>
      </Route>
      <Route path={"/custom-fields"}>
        <DashboardLayout>
          <CustomFields />
        </DashboardLayout>
      </Route>
      <Route path={"/documents"}>
        <DashboardLayout>
          <DocumentLibrary />
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
      <ThemeProvider defaultTheme="dark" switchable={true}>
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
