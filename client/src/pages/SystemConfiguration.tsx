import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Trash2, Plus, Settings } from "lucide-react";
import { toast } from "sonner";

export default function SystemConfiguration() {
  const { currentProjectId } = useProject();
  const [activeTab, setActiveTab] = useState("id-config");

  if (!currentProjectId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please select a project to configure system settings.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          System Configuration
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure ID formats, number ranges, and manage dropdown options for the entire system
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="id-config">ID Configuration</TabsTrigger>
          <TabsTrigger value="dropdown-options">Dropdown Options</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
        </TabsList>

        <TabsContent value="id-config" className="space-y-4">
          <IDConfigurationTab projectId={currentProjectId} />
        </TabsContent>

        <TabsContent value="dropdown-options" className="space-y-4">
          <DropdownOptionsTab projectId={currentProjectId} />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Groups Management</CardTitle>
              <CardDescription>Manage user groups and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Customization</CardTitle>
              <CardDescription>Customize system colors and branding</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ID Configuration Tab Component
function IDConfigurationTab({ projectId }: { projectId: number }) {
  const utils = trpc.useUtils();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState<any>(null);
  const [formData, setFormData] = useState({
    prefix: "",
    minNumber: 1,
    maxNumber: 9999,
    padLength: 4,
  });

  const { data: idSequences = [], isLoading } = trpc.systemConfig.idConfig.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const updateSequence = trpc.systemConfig.idConfig.update.useMutation({
    onSuccess: () => {
      utils.systemConfig.idConfig.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedSequence(null);
      toast.success("ID configuration updated successfully");
    },
    onError: (error) => {
      toast.error(`Error updating configuration: ${error.message}`);
    },
  });

  const handleEdit = (sequence: any) => {
    setSelectedSequence(sequence);
    setFormData({
      prefix: sequence.prefix,
      minNumber: sequence.minNumber,
      maxNumber: sequence.maxNumber,
      padLength: sequence.padLength,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedSequence) return;
    updateSequence.mutate({
      entityType: selectedSequence.entityType,
      projectId,
      ...formData,
    });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle># ID Number Range Configuration</CardTitle>
          <CardDescription>
            Configure the prefix, number range (min/max), and padding for auto-generated IDs. The system will generate
            IDs like PREFIX + padded number (e.g., REQ-0001).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity Type</TableHead>
                <TableHead>Prefix</TableHead>
                <TableHead>Current Number</TableHead>
                <TableHead>Min Number</TableHead>
                <TableHead>Max Number</TableHead>
                <TableHead>Pad Length</TableHead>
                <TableHead>Example</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {idSequences.map((sequence: any) => {
                const exampleNumber = String(sequence.currentNumber + 1).padStart(sequence.padLength, "0");
                const exampleId = `${sequence.prefix}-${exampleNumber}`;
                return (
                  <TableRow key={sequence.id}>
                    <TableCell className="font-medium">{sequence.entityType}</TableCell>
                    <TableCell>{sequence.prefix}</TableCell>
                    <TableCell>{sequence.currentNumber}</TableCell>
                    <TableCell>{sequence.minNumber}</TableCell>
                    <TableCell>{sequence.maxNumber}</TableCell>
                    <TableCell>{sequence.padLength}</TableCell>
                    <TableCell className="font-mono text-sm">{exampleId}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(sequence)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit ID Configuration - {selectedSequence?.entityType}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="e.g., REQ, RISK, TASK"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minNumber">Min Number</Label>
                <Input
                  id="minNumber"
                  type="number"
                  value={formData.minNumber}
                  onChange={(e) => setFormData({ ...formData, minNumber: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxNumber">Max Number</Label>
                <Input
                  id="maxNumber"
                  type="number"
                  value={formData.maxNumber}
                  onChange={(e) => setFormData({ ...formData, maxNumber: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="padLength">Pad Length</Label>
                <Input
                  id="padLength"
                  type="number"
                  value={formData.padLength}
                  onChange={(e) => setFormData({ ...formData, padLength: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm font-medium">Preview:</p>
              <p className="text-lg font-mono">
                {formData.prefix}-{String(1).padStart(formData.padLength, "0")}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.prefix || updateSequence.isPending}>
                Update Configuration
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Dropdown Options Tab Component
function DropdownOptionsTab({ projectId }: { projectId: number }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const dropdownSections = [
    { key: "status", label: "Status", description: "Status options for tasks, issues, and requirements" },
    { key: "priority", label: "Priority", description: "Priority levels for items" },
    { key: "type", label: "Type", description: "General type classifications" },
    { key: "category", label: "Category", description: "Category classifications" },
    { key: "issueTypes", label: "Issue Types", description: "Types of issues in the system" },
    { key: "deliverableTypes", label: "Deliverable Types", description: "Types of deliverables" },
    { key: "kbTypes", label: "KB Types", description: "Knowledge Base document types" },
    { key: "kbComponents", label: "KB Components", description: "Knowledge Base component categories" },
    { key: "riskTypes", label: "Risk Types", description: "Types of risks" },
    { key: "riskStatus", label: "Risk Status", description: "Risk status options" },
    { key: "responseStrategy", label: "Response Strategy", description: "Risk response strategies" },
  ];

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Dropdown Options Management</CardTitle>
          <CardDescription>
            Manage all dropdown options across the system. Click on a category to view and edit its options.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dropdownSections.map((section) => (
              <Card
                key={section.key}
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => setSelectedCategory(section.key)}
              >
                <CardHeader>
                  <CardTitle className="text-base">{section.label}</CardTitle>
                  <CardDescription className="text-xs">{section.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedCategory && (
        <DropdownCategoryDetail
          categoryKey={selectedCategory}
          categoryLabel={dropdownSections.find((s) => s.key === selectedCategory)?.label || ""}
          projectId={projectId}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}

// Dropdown Category Detail Component
function DropdownCategoryDetail({
  categoryKey,
  categoryLabel,
  projectId,
  onClose,
}: {
  categoryKey: string;
  categoryLabel: string;
  projectId: number;
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{categoryLabel}</CardTitle>
            <CardDescription>Manage {categoryLabel.toLowerCase()} options</CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Dropdown option management for {categoryLabel} will be implemented here. This will allow you to add, edit,
          and delete options for this category.
        </p>
      </CardContent>
    </Card>
  );
}
