import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Upload, FileSpreadsheet, Download, Database, GitBranch, Clock, Filter, Users, Package } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [uploading, setUploading] = useState(false);

  const importMutation = trpc.excel.import.useMutation({
    onSuccess: (data) => {
      toast.success(`Import successful! Imported ${data.imported.requirements} requirements, ${data.imported.tasks} tasks, ${data.imported.issues} issues`);
      setLocation("/requirements");
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
      setUploading(false);
    },
  });

  const exportQuery = trpc.excel.export.useQuery(undefined, {
    enabled: false,
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const base64Data = e.target?.result as string;
      const base64 = base64Data.split(',')[1];
      
      importMutation.mutate({ base64Data: base64 });
    };
    
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (result.data) {
      const link = document.createElement('a');
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.base64Data}`;
      link.download = result.data.filename;
      link.click();
      toast.success('Excel file exported successfully');
    }
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

  if (!isAuthenticated) {
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
          <CardContent>
            <Button 
              onClick={() => window.location.href = getLoginUrl()} 
              className="w-full"
              size="lg"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container py-12">
        <div className="text-center mb-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Project Management SSOT
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive tracking system with action logs and relationship mapping
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Import Excel Data
              </CardTitle>
              <CardDescription>
                Upload your OST-SSOT.xlsx file to import requirements, tasks, and issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button 
                    className="w-full" 
                    size="lg" 
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {uploading ? 'Importing...' : 'Choose Excel File'}
                    </span>
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Export Excel Data
              </CardTitle>
              <CardDescription>
                Download all data including action logs in Excel format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                size="lg" 
                variant="outline"
                onClick={handleExport}
                disabled={exportQuery.isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {exportQuery.isLoading ? 'Exporting...' : 'Export to Excel'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/requirements')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                Requirements
              </CardTitle>
              <CardDescription>
                View and manage project requirements
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/tasks')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                Tasks
              </CardTitle>
              <CardDescription>
                Track and update project tasks
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/issues')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-red-600" />
                Issues
              </CardTitle>
              <CardDescription>
                Monitor and resolve issues
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/relationships')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="w-5 h-5 text-purple-600" />
                Relationships
              </CardTitle>
              <CardDescription>
                View entity relationships
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/action-log')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-600" />
                Action Log
              </CardTitle>
              <CardDescription>
                Review change history
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/dependencies')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GitBranch className="w-5 h-5 text-indigo-600" />
                Dependencies
              </CardTitle>
              <CardDescription>
                Manage project dependencies
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/assumptions')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="w-5 h-5 text-yellow-600" />
                Assumptions
              </CardTitle>
              <CardDescription>
                Track project assumptions
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/stakeholders')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-teal-600" />
                Stakeholders
              </CardTitle>
              <CardDescription>
                Manage project stakeholders
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setLocation('/deliverables')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-pink-600" />
                Deliverables
              </CardTitle>
              <CardDescription>
                Track project deliverables
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
