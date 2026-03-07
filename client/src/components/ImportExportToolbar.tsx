/**
 * ImportExportToolbar
 * Reusable toolbar that provides:
 *  - Download Template (pre-formatted Excel with example row)
 *  - Export Current Data (Excel with live data)
 *  - Upload (Append or Replace) with a mode selector dialog
 *
 * Usage:
 *   <ImportExportToolbar module="tasks" projectId={currentProjectId!} onImportSuccess={() => utils.tasks.list.invalidate()} />
 */
import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Upload, FileSpreadsheet, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type Module =
  | "requirements"
  | "tasks"
  | "issues"
  | "dependencies"
  | "assumptions"
  | "stakeholders"
  | "deliverables"
  | "knowledgeBase"
  | "risks";

interface Props {
  module: Module;
  projectId: number;
  onImportSuccess?: () => void;
}

// ─── helper: trigger browser download from base64 ─────────────────────────────
function downloadBase64(base64: string, filename: string) {
  const byteChars = atob(base64);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNums)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── helper: read file as base64 ──────────────────────────────────────────────
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:...;base64,<data>"
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── component ────────────────────────────────────────────────────────────────
export function ImportExportToolbar({ module, projectId, onImportSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  // ── template download ──
  const templateQuery = trpc.bulkImport.downloadTemplate.useQuery(
    { module },
    { enabled: false, retry: false }
  );

  // ── export data ──
  const exportQuery = trpc.bulkImport.exportData.useQuery(
    { module, projectId },
    { enabled: false, retry: false }
  );

  // ── upload mutation ──
  const uploadMutation = trpc.bulkImport.upload.useMutation({
    onSuccess: (data) => {
      setImportResult(data);
      setUploadDialogOpen(false);
      setResultDialogOpen(true);
      if (data.imported > 0) onImportSuccess?.();
    },
    onError: (e) => toast.error(`Upload failed: ${e.message}`),
  });

  const handleDownloadTemplate = async () => {
    try {
      const result = await templateQuery.refetch();
      if (result.data) downloadBase64(result.data.base64, result.data.filename);
    } catch {
      toast.error("Failed to download template");
    }
  };

  const handleExportData = async () => {
    try {
      const result = await exportQuery.refetch();
      if (result.data) downloadBase64(result.data.base64, result.data.filename);
    } catch {
      toast.error("Failed to export data");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    setPendingFile(file);
    setUploadDialogOpen(true);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleConfirmUpload = async () => {
    if (!pendingFile) return;
    try {
      const base64 = await readFileAsBase64(pendingFile);
      uploadMutation.mutate({ module, projectId, mode: importMode, fileBase64: base64 });
    } catch {
      toast.error("Failed to read file");
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Download Template */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleDownloadTemplate}
          disabled={templateQuery.isFetching}
          title="Download Excel template with correct column headers"
        >
          {templateQuery.isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-3.5 h-3.5" />
          )}
          Template
        </Button>

        {/* Export Current Data */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleExportData}
          disabled={exportQuery.isFetching}
          title="Export current data to Excel"
        >
          {exportQuery.isFetching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          Export
        </Button>

        {/* Upload */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => fileInputRef.current?.click()}
          title="Upload Excel file to import data"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* ── Upload Mode Dialog ── */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import from Excel
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              File: <span className="font-medium text-foreground">{pendingFile?.name}</span>
            </p>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Import Mode</Label>
              <RadioGroup value={importMode} onValueChange={(v) => setImportMode(v as "append" | "replace")} className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => setImportMode("append")}>
                  <RadioGroupItem value="append" id="mode-append" className="mt-0.5" />
                  <div>
                    <Label htmlFor="mode-append" className="font-medium cursor-pointer">Append</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Add uploaded records to existing data. Nothing is deleted.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                  onClick={() => setImportMode("replace")}>
                  <RadioGroupItem value="replace" id="mode-replace" className="mt-0.5" />
                  <div>
                    <Label htmlFor="mode-replace" className="font-medium cursor-pointer">Replace</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="text-destructive font-medium">Deletes all existing records</span> for this module in the current project, then imports the uploaded data.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {importMode === "replace" && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">
                  All existing <strong>{module}</strong> records in this project will be permanently deleted before importing. This cannot be undone.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleConfirmUpload}
                disabled={uploadMutation.isPending}
                variant={importMode === "replace" ? "destructive" : "default"}
              >
                {uploadMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Importing...</>
                ) : (
                  `${importMode === "replace" ? "Replace & Import" : "Append & Import"}`
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Import Result Dialog ── */}
      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Import Complete
            </DialogTitle>
          </DialogHeader>
          {importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
                  <p className="text-2xl font-bold text-green-700">{importResult.imported}</p>
                  <p className="text-xs text-green-600">Records imported</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-center">
                  <p className="text-2xl font-bold text-orange-700">{importResult.skipped}</p>
                  <p className="text-xs text-orange-600">Rows skipped</p>
                </div>
              </div>
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">Errors (first 20):</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{err}</p>
                    ))}
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={() => setResultDialogOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
