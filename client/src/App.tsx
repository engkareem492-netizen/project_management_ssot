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
import UserStories from "./pages/UserStories";
import ScopeCoverage from "./pages/ScopeCoverage";
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
import EEF from "./pages/EEF";
import Portfolio from "./pages/Portfolio";
import Sprints from "./pages/Sprints";
import Goals from "./pages/Goals";
import TimeTracking from "./pages/TimeTracking";
import SlaTickets from "./pages/SlaTickets";
import EngagementPlan from "./pages/EngagementPlan";
import CommunicationPlan from "./pages/CommunicationPlan";
import TeamCharter from "./pages/TeamCharter";
import WBS from "./pages/WBS";
import StakeholderManagement from "./pages/StakeholderManagement";
import EVM from "./pages/EVM";
import Features from "./pages/Features";
import TestPlans from "./pages/TestPlans";
import Defects from "./pages/Defects";
import CustomFields from "./pages/CustomFields";
import ConceptGuidePage from "./pages/ConceptGuide";
import ReqTraceability from "./pages/ReqTraceability";
import BusinessCase from "./pages/BusinessCase";
import ClosingReport from "./pages/ClosingReport";
import Escalations from "./pages/Escalations";
import OperationsDashboard from "./pages/OperationsDashboard";
import AgileDashboard from "./pages/AgileDashboard";
const FeaturesPage = Features;
const UserStoriesPage = UserStories;
const TestPlansPage = TestPlans;
const DefectsPage = Defects;

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
      <Route path={"/user-stories"}>
        <DashboardLayout>
          <UserStories />
        </DashboardLayout>
      </Route>
      <Route path={"/scope-coverage"}>
        <DashboardLayout>
          <ScopeCoverage />
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
      <Route path="/evm">
        <DashboardLayout>
          <EVM />
        </DashboardLayout>
      </Route>
      <Route path="/features">
        <DashboardLayout>
          <FeaturesPage />
        </DashboardLayout>
      </Route>
      <Route path="/user-stories">
        <DashboardLayout>
          <UserStoriesPage />
        </DashboardLayout>
      </Route>
      <Route path="/test-plans">
        <DashboardLayout>
          <TestPlansPage />
        </DashboardLayout>
      </Route>
      <Route path="/defects">
        <DashboardLayout>
          <DefectsPage />
        </DashboardLayout>
      </Route>
      <Route path="/concept-guide">
        <DashboardLayout>
          <ConceptGuidePage />
        </DashboardLayout>
      </Route>
      <Route path="/req-traceability">
        <DashboardLayout>
          <ReqTraceability />
        </DashboardLayout>
      </Route>
      <Route path={"/documents"}>
        <DashboardLayout>
          <DocumentLibrary />
        </DashboardLayout>
      </Route>
      <Route path={"/eef"}>
        <DashboardLayout>
          <EEF />
        </DashboardLayout>
      </Route>
      <Route path={"/portfolio"}>
        <DashboardLayout>
          <Portfolio />
        </DashboardLayout>
      </Route>
      <Route path={"/sprints"}>
        <DashboardLayout>
          <Sprints />
        </DashboardLayout>
      </Route>
      <Route path={"/goals"}>
        <DashboardLayout>
          <Goals />
        </DashboardLayout>
      </Route>
      <Route path={"/time-tracking"}>
        <DashboardLayout>
          <TimeTracking />
        </DashboardLayout>
      </Route>
      <Route path={"/sla-tickets"}>
        <DashboardLayout>
          <SlaTickets />
        </DashboardLayout>
      </Route>
      <Route path={"/engagement-plan"}>
        <DashboardLayout>
          <EngagementPlan />
        </DashboardLayout>
      </Route>
      <Route path={"/communication-plan"}>
        <DashboardLayout>
          <CommunicationPlan />
        </DashboardLayout>
      </Route>
      <Route path={"/team-charter"}>
        <DashboardLayout>
          <TeamCharter />
        </DashboardLayout>
      </Route>
      <Route path={"/wbs"}>
        <WBS />
      </Route>
      <Route path={"/evm"}>
        <DashboardLayout><EVM /></DashboardLayout>
      </Route>
      <Route path={"/pm-plan"}>
        <DashboardLayout><PMPlan /></DashboardLayout>
      </Route>
      <Route path={"/features"}>
        <DashboardLayout><Features /></DashboardLayout>
      </Route>
      <Route path={"/test-plans"}>
        <DashboardLayout><TestPlans /></DashboardLayout>
      </Route>
      <Route path={"/defects"}>
        <DashboardLayout><Defects /></DashboardLayout>
      </Route>
      <Route path="/escalations">
        <Escalations />
      </Route>
      <Route path="/operations">
        <DashboardLayout>
          <OperationsDashboard />
        </DashboardLayout>
      </Route>
      <Route path="/agile">
        <DashboardLayout>
          <AgileDashboard />
        </DashboardLayout>
      </Route>
      <Route path={"/stakeholder-management"}>
        <DashboardLayout>
          <StakeholderManagement />
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
