import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save, BookOpen, CheckCircle2 } from "lucide-react";

// ─── Section definitions ────────────────────────────────────────────────────
type FieldDef = { key: string; label: string; type?: "text" | "textarea"; placeholder?: string };
type SectionDef = {
  key: string;
  label: string;
  shortLabel: string;
  description: string;
  fields: FieldDef[];
};

const SECTIONS: SectionDef[] = [
  {
    key: "scope_mgmt",
    label: "Scope Management Plan",
    shortLabel: "Scope",
    description: "How scope will be defined, validated, and controlled throughout the project.",
    fields: [
      { key: "scopeDefinitionProcess", label: "Scope Definition Process", type: "textarea", placeholder: "Describe how project scope will be defined and documented..." },
      { key: "wbsDevelopmentApproach", label: "WBS Development Approach", type: "textarea", placeholder: "Describe how the WBS will be created and maintained..." },
      { key: "scopeBaselineApproval", label: "Scope Baseline Approval", type: "textarea", placeholder: "Who approves the scope baseline and under what conditions..." },
      { key: "scopeChangeControl", label: "Scope Change Control Process", type: "textarea", placeholder: "How scope changes will be requested, evaluated, and approved..." },
      { key: "scopeValidation", label: "Scope Validation Process", type: "textarea", placeholder: "How deliverables will be formally accepted by stakeholders..." },
    ],
  },
  {
    key: "schedule_mgmt",
    label: "Schedule Management Plan",
    shortLabel: "Schedule",
    description: "How the project schedule will be developed, monitored, and controlled.",
    fields: [
      { key: "schedulingMethodology", label: "Scheduling Methodology", type: "text", placeholder: "e.g. Critical Path Method (CPM), Agile Sprints, Rolling Wave" },
      { key: "schedulingTool", label: "Scheduling Tool", type: "text", placeholder: "e.g. MS Project, Primavera P6, Jira" },
      { key: "activityDurationEstimation", label: "Activity Duration Estimation Method", type: "textarea", placeholder: "Describe estimation approach (analogous, parametric, three-point PERT)..." },
      { key: "scheduleBaseline", label: "Schedule Baseline Approval", type: "textarea", placeholder: "Who approves the schedule baseline and under what conditions..." },
      { key: "scheduleVarianceThreshold", label: "Schedule Variance Threshold", type: "text", placeholder: "e.g. SPI < 0.8 triggers corrective action" },
      { key: "scheduleReporting", label: "Schedule Reporting Frequency", type: "text", placeholder: "e.g. Weekly progress reports, monthly schedule review" },
    ],
  },
  {
    key: "cost_mgmt",
    label: "Cost Management Plan",
    shortLabel: "Cost",
    description: "How project costs will be estimated, budgeted, and controlled.",
    fields: [
      { key: "estimationApproach", label: "Cost Estimation Approach", type: "textarea", placeholder: "Describe estimation method (bottom-up, analogous, parametric)..." },
      { key: "budgetingProcess", label: "Budgeting Process", type: "textarea", placeholder: "How cost estimates are aggregated into the cost baseline..." },
      { key: "currency", label: "Project Currency", type: "text", placeholder: "e.g. USD, SAR, EUR" },
      { key: "contingencyReserve", label: "Contingency Reserve Policy", type: "textarea", placeholder: "How contingency reserve is calculated and managed..." },
      { key: "managementReserve", label: "Management Reserve Policy", type: "textarea", placeholder: "How management reserve is accessed and controlled..." },
      { key: "costVarianceThreshold", label: "Cost Variance Threshold", type: "text", placeholder: "e.g. CPI < 0.8 triggers corrective action" },
      { key: "evmApproach", label: "Earned Value Management Approach", type: "textarea", placeholder: "Describe how EVM will be applied (PV, EV, AC, SPI, CPI)..." },
    ],
  },
  {
    key: "quality_mgmt",
    label: "Quality Management Plan",
    shortLabel: "Quality",
    description: "How quality requirements will be planned, managed, and controlled.",
    fields: [
      { key: "qualityStandards", label: "Quality Standards & Regulations", type: "textarea", placeholder: "List applicable quality standards (ISO 9001, PMBOK, industry-specific)..." },
      { key: "qualityMetrics", label: "Quality Metrics", type: "textarea", placeholder: "Define measurable quality criteria for deliverables..." },
      { key: "qualityAssurance", label: "Quality Assurance Activities", type: "textarea", placeholder: "Describe quality audits, process reviews, and improvement activities..." },
      { key: "qualityControl", label: "Quality Control Activities", type: "textarea", placeholder: "Describe inspections, testing, and defect tracking processes..." },
      { key: "defectManagement", label: "Defect Management Process", type: "textarea", placeholder: "How defects are identified, tracked, and resolved..." },
    ],
  },
  {
    key: "resource_mgmt",
    label: "Resource Management Plan",
    shortLabel: "Resource",
    description: "How project team and physical resources will be acquired, managed, and released.",
    fields: [
      { key: "resourceAcquisition", label: "Resource Acquisition Strategy", type: "textarea", placeholder: "How team members and physical resources will be obtained..." },
      { key: "teamDevelopment", label: "Team Development Approach", type: "textarea", placeholder: "Training, team-building, and performance improvement activities..." },
      { key: "teamManagement", label: "Team Management Approach", type: "textarea", placeholder: "How team performance will be tracked and managed..." },
      { key: "resourceRelease", label: "Resource Release Plan", type: "textarea", placeholder: "When and how resources will be released at project end..." },
      { key: "conflictResolution", label: "Conflict Resolution Process", type: "textarea", placeholder: "How team conflicts will be identified and resolved..." },
    ],
  },
  {
    key: "comms_mgmt",
    label: "Communications Management Plan",
    shortLabel: "Comms",
    description: "How project information will be planned, distributed, and monitored.",
    fields: [
      { key: "communicationRequirements", label: "Stakeholder Communication Requirements", type: "textarea", placeholder: "What information each stakeholder group needs and when..." },
      { key: "communicationMethods", label: "Communication Methods & Technology", type: "textarea", placeholder: "Email, meetings, dashboards, reports — describe each channel..." },
      { key: "communicationFrequency", label: "Communication Frequency & Schedule", type: "textarea", placeholder: "Daily standups, weekly reports, monthly steering committee..." },
      { key: "escalationProcess", label: "Escalation Process", type: "textarea", placeholder: "How issues are escalated through the communication hierarchy..." },
      { key: "meetingGuidelines", label: "Meeting Guidelines", type: "textarea", placeholder: "Meeting cadence, agenda requirements, minutes distribution..." },
    ],
  },
  {
    key: "risk_mgmt",
    label: "Risk Management Plan",
    shortLabel: "Risk",
    description: "How risk management activities will be structured and performed.",
    fields: [
      { key: "riskMethodology", label: "Risk Management Methodology", type: "textarea", placeholder: "Overall approach to risk identification, analysis, and response..." },
      { key: "riskRolesResponsibilities", label: "Roles & Responsibilities", type: "textarea", placeholder: "Who is responsible for risk management activities..." },
      { key: "riskBudget", label: "Risk Budget", type: "text", placeholder: "Budget allocated for risk management activities and contingency..." },
      { key: "riskTiming", label: "Risk Management Timing", type: "textarea", placeholder: "When risk reviews will occur throughout the project lifecycle..." },
      { key: "riskCategories", label: "Risk Categories", type: "textarea", placeholder: "Technical, external, organisational, project management risks..." },
      { key: "probabilityImpactMatrix", label: "Probability & Impact Matrix", type: "textarea", placeholder: "Define probability and impact scales (e.g. 1-5) and thresholds..." },
      { key: "riskAppetite", label: "Risk Appetite & Tolerance", type: "textarea", placeholder: "Organisation's risk appetite and acceptable risk thresholds..." },
    ],
  },
  {
    key: "procurement_mgmt",
    label: "Procurement Management Plan",
    shortLabel: "Procurement",
    description: "How procurement decisions will be made and contracts managed.",
    fields: [
      { key: "procurementApproach", label: "Procurement Approach", type: "textarea", placeholder: "Make-or-buy decisions, procurement strategy..." },
      { key: "contractTypes", label: "Contract Types to be Used", type: "textarea", placeholder: "FFP, CPFF, T&M — describe when each type will be used..." },
      { key: "vendorSelectionCriteria", label: "Vendor Selection Criteria", type: "textarea", placeholder: "Evaluation criteria for selecting vendors and contractors..." },
      { key: "contractManagement", label: "Contract Management Process", type: "textarea", placeholder: "How contracts will be administered and monitored..." },
      { key: "procurementClosure", label: "Procurement Closure Process", type: "textarea", placeholder: "How procurements will be formally closed..." },
    ],
  },
  {
    key: "stakeholder_mgmt",
    label: "Stakeholder Engagement Plan",
    shortLabel: "Stakeholder",
    description: "How stakeholders will be engaged throughout the project lifecycle.",
    fields: [
      { key: "engagementStrategy", label: "Overall Engagement Strategy", type: "textarea", placeholder: "High-level approach to stakeholder engagement..." },
      { key: "keyStakeholderNeeds", label: "Key Stakeholder Needs & Expectations", type: "textarea", placeholder: "What each key stakeholder group needs from the project..." },
      { key: "engagementActivities", label: "Engagement Activities", type: "textarea", placeholder: "Workshops, reviews, demos, steering committee meetings..." },
      { key: "resistanceManagement", label: "Managing Resistance", type: "textarea", placeholder: "How stakeholder resistance will be identified and addressed..." },
      { key: "engagementMonitoring", label: "Engagement Monitoring", type: "textarea", placeholder: "How stakeholder engagement levels will be tracked and improved..." },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────────────
export default function PMPlan() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: planData, isLoading, refetch } = trpc.pmPlan.getAll.useQuery(
    { projectId },
    { enabled }
  );

  const upsert = trpc.pmPlan.upsertSection.useMutation({
    onSuccess: () => { toast.success("Section saved"); refetch(); },
    onError: () => toast.error("Failed to save section"),
  });

  // Local form state: sectionKey → fieldKey → value
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Sync from server data
  useEffect(() => {
    if (planData) {
      setForms(planData as Record<string, Record<string, string>>);
    }
  }, [planData]);

  const setField = (sectionKey: string, fieldKey: string, value: string) => {
    setForms(prev => ({
      ...prev,
      [sectionKey]: { ...(prev[sectionKey] ?? {}), [fieldKey]: value },
    }));
  };

  const handleSave = (sectionKey: string) => {
    upsert.mutate({
      projectId,
      sectionKey,
      content: forms[sectionKey] ?? {},
    });
    setEditingSection(null);
  };

  const getSectionCompletion = (section: SectionDef): number => {
    const data = (planData as any)?.[section.key] ?? {};
    const filled = section.fields.filter(f => data[f.key]?.trim()).length;
    return Math.round((filled / section.fields.length) * 100);
  };

  const totalCompletion = Math.round(
    SECTIONS.reduce((sum, s) => sum + getSectionCompletion(s), 0) / SECTIONS.length
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Project Management Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Integrated plan covering all 9 subsidiary management plans per PMBOK standards.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{totalCompletion}%</div>
          <div className="text-xs text-muted-foreground">Overall Completion</div>
          <div className="w-32 bg-muted rounded-full h-2 mt-1">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${totalCompletion}%` }}
            />
          </div>
        </div>
      </div>

      {/* Completion overview cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {SECTIONS.map(section => {
          const pct = getSectionCompletion(section);
          return (
            <div
              key={section.key}
              className="bg-card border rounded-lg p-2 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <div className={`text-lg font-bold ${pct === 100 ? "text-green-500" : pct > 0 ? "text-amber-500" : "text-muted-foreground"}`}>
                {pct}%
              </div>
              <div className="text-xs text-muted-foreground leading-tight">{section.shortLabel}</div>
              {pct === 100 && <CheckCircle2 className="w-3 h-3 text-green-500 mx-auto mt-1" />}
            </div>
          );
        })}
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue={SECTIONS[0].key}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          {SECTIONS.map(section => {
            const pct = getSectionCompletion(section);
            return (
              <TabsTrigger key={section.key} value={section.key} className="text-xs">
                {section.shortLabel}
                {pct === 100 && <CheckCircle2 className="w-3 h-3 text-green-500 ml-1" />}
                {pct > 0 && pct < 100 && (
                  <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">{pct}%</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {SECTIONS.map(section => {
          const isEditing = editingSection === section.key;
          const data = (planData as any)?.[section.key] ?? {};
          const formData = forms[section.key] ?? {};

          return (
            <TabsContent key={section.key} value={section.key}>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{section.label}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setForms(prev => ({ ...prev, [section.key]: data }));
                              setEditingSection(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(section.key)}
                            disabled={upsert.isPending}
                          >
                            {upsert.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            ) : (
                              <Save className="w-4 h-4 mr-1" />
                            )}
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setForms(prev => ({ ...prev, [section.key]: { ...data } }));
                            setEditingSection(section.key);
                          }}
                        >
                          Edit Section
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.fields.map(field => (
                    <div key={field.key} className="space-y-1">
                      <Label className="text-sm font-medium">{field.label}</Label>
                      {isEditing ? (
                        field.type === "textarea" ? (
                          <Textarea
                            rows={3}
                            placeholder={field.placeholder}
                            value={formData[field.key] ?? ""}
                            onChange={e => setField(section.key, field.key, e.target.value)}
                          />
                        ) : (
                          <Input
                            placeholder={field.placeholder}
                            value={formData[field.key] ?? ""}
                            onChange={e => setField(section.key, field.key, e.target.value)}
                          />
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[1.5rem] leading-relaxed">
                          {data[field.key] || (
                            <span className="italic text-muted-foreground/60">Not defined yet.</span>
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
