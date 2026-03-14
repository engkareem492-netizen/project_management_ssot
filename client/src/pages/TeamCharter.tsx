import { useState, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Target,
  Crosshair,
  TrendingUp,
  Star,
  CheckSquare,
  ShieldOff,
  Calendar,
  MessageSquare,
  Save,
  FileDown,
} from "lucide-react";

type CharterFields = {
  mission: string;
  scopeAndBoundaries: string;
  metricsOfSuccess: string;
  coreValues: string;
  groundRules: string;
  restrictedViolations: string;
  teamActivities: string;
  internalCommunicationPlan: string;
};

const EMPTY_CHARTER: CharterFields = {
  mission: "",
  scopeAndBoundaries: "",
  metricsOfSuccess: "",
  coreValues: "",
  groundRules: "",
  restrictedViolations: "",
  teamActivities: "",
  internalCommunicationPlan: "",
};

const SECTIONS = [
  {
    key: "mission" as const,
    label: "Mission",
    icon: Target,
    description: "What is the team's purpose and why does it exist?",
  },
  {
    key: "scopeAndBoundaries" as const,
    label: "Scope & Boundaries",
    icon: Crosshair,
    description: "What is in scope and out of scope for this team?",
  },
  {
    key: "metricsOfSuccess" as const,
    label: "Metrics of Success",
    icon: TrendingUp,
    description: "How will we measure the team's success?",
  },
  {
    key: "coreValues" as const,
    label: "Core Values",
    icon: Star,
    description: "What values guide how we work together?",
  },
  {
    key: "groundRules" as const,
    label: "Ground Rules",
    icon: CheckSquare,
    description: "What behaviors do we agree to uphold?",
  },
  {
    key: "restrictedViolations" as const,
    label: "Restricted Violations",
    icon: ShieldOff,
    description: "What behaviors are unacceptable and will not be tolerated?",
  },
  {
    key: "teamActivities" as const,
    label: "Team Activities",
    icon: Calendar,
    description: "What regular activities, ceremonies, or rituals does the team do?",
  },
  {
    key: "internalCommunicationPlan" as const,
    label: "Internal Communication Plan",
    icon: MessageSquare,
    description: "How do we communicate internally (tools, channels, frequency)?",
  },
] as const;

export default function TeamCharter() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: charterData, refetch } = trpc.teamCharter.get.useQuery(
    { projectId },
    { enabled }
  );

  const upsert = trpc.teamCharter.upsert.useMutation({
    onSuccess: () => {
      toast.success("Charter saved");
      setIsDirty(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 3000);
      refetch();
    },
    onError: () => toast.error("Failed to save charter"),
  });

  const [charter, setCharter] = useState<CharterFields>(EMPTY_CHARTER);
  const [isDirty, setIsDirty] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (charterData) {
      setCharter({
        mission: (charterData as any).mission ?? "",
        scopeAndBoundaries: (charterData as any).scopeAndBoundaries ?? "",
        metricsOfSuccess: (charterData as any).metricsOfSuccess ?? "",
        coreValues: (charterData as any).coreValues ?? "",
        groundRules: (charterData as any).groundRules ?? "",
        restrictedViolations: (charterData as any).restrictedViolations ?? "",
        teamActivities: (charterData as any).teamActivities ?? "",
        internalCommunicationPlan: (charterData as any).internalCommunicationPlan ?? "",
      });
      setIsDirty(false);
    }
  }, [charterData]);

  const handleChange = (field: keyof CharterFields, value: string) => {
    setCharter((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setJustSaved(false);
  };

  const handleSave = () => {
    upsert.mutate({
      projectId,
      mission: charter.mission || undefined,
      scopeAndBoundaries: charter.scopeAndBoundaries || undefined,
      metricsOfSuccess: charter.metricsOfSuccess || undefined,
      coreValues: charter.coreValues || undefined,
      groundRules: charter.groundRules || undefined,
      restrictedViolations: charter.restrictedViolations || undefined,
      teamActivities: charter.teamActivities || undefined,
      internalCommunicationPlan: charter.internalCommunicationPlan || undefined,
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (!currentProjectId) {
    return (
      <div className="p-6 text-muted-foreground">
        Select a project to view the team charter.
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          body > *:not(#team-charter-root) {
            display: none !important;
          }
          #team-charter-root {
            display: block !important;
          }
          .print-hide {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
          #team-charter-print-title {
            display: block !important;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1.5rem;
            text-align: center;
          }
          textarea {
            border: 1px solid #ccc !important;
            resize: none !important;
          }
          .charter-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 1rem !important;
          }
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @media screen {
          #team-charter-print-title {
            display: none;
          }
        }
      `}</style>

      <div id="team-charter-root" className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Print title — visible only when printing */}
        <div id="team-charter-print-title">Team Charter</div>

        {/* Header */}
        <div className="flex items-start justify-between print-hide">
          <div>
            <h1 className="text-2xl font-bold">Team Charter</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Define team purpose, values, and working agreements
            </p>
          </div>
          <div className="flex items-center gap-3">
            {justSaved && (
              <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50">
                Saved
              </Badge>
            )}
            {isDirty && !justSaved && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50">
                Unsaved changes
              </Badge>
            )}
            <Button
              variant="outline"
              onClick={handleExportPDF}
              className="flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              onClick={handleSave}
              disabled={upsert.isPending || !isDirty}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {upsert.isPending ? "Saving..." : "Save Charter"}
            </Button>
          </div>
        </div>

        {/* Sections grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 charter-grid">
          {SECTIONS.map(({ key, label, icon: Icon, description }) => (
            <Card key={key} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  {label}
                </CardTitle>
                <CardDescription className="text-xs">{description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Textarea
                  rows={6}
                  placeholder={`${description}`}
                  value={charter[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="resize-none w-full min-h-[144px]"
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom save row */}
        <div className="flex items-center justify-end gap-3 pt-2 print-hide">
          {justSaved && (
            <Badge variant="outline" className="text-green-600 border-green-400 bg-green-50">
              Saved
            </Badge>
          )}
          {isDirty && !justSaved && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-400 bg-yellow-50">
              Unsaved changes
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={upsert.isPending || !isDirty}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {upsert.isPending ? "Saving..." : "Save Charter"}
          </Button>
        </div>
      </div>
    </>
  );
}
