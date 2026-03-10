import { useState, useMemo } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, FolderOpen, Search, FileText, File,
  FileImage, FileSpreadsheet, ExternalLink, Upload,
} from "lucide-react";

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv")) return FileSpreadsheet;
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("text")) return FileText;
  return File;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ENTITY_TYPES = ["general", "requirement", "task", "deliverable", "change-request", "risk", "meeting", "test-case"];

const EMPTY_FORM = {
  fileName: "", originalName: "", fileUrl: "", fileSize: "",
  mimeType: "", description: "", entityType: "general", entityId: "",
  uploadedBy: "", tags: "",
};

export default function DocumentLibrary() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;

  const { data: docs = [], isLoading, refetch } = trpc.documents.list.useQuery({ projectId }, { enabled });

  const create = trpc.documents.create.useMutation({
    onSuccess: () => { toast.success("Document registered"); refetch(); setOpen(false); },
    onError: () => toast.error("Failed to register document"),
  });
  const del = trpc.documents.delete.useMutation({
    onSuccess: () => { toast.success("Deleted"); refetch(); },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!form.fileUrl.trim()) return toast.error("File URL is required");
    if (!form.originalName.trim()) return toast.error("File name is required");
    create.mutate({
      projectId,
      fileName: form.fileName || form.originalName,
      originalName: form.originalName,
      fileUrl: form.fileUrl,
      fileSize: form.fileSize ? parseInt(form.fileSize) : undefined,
      mimeType: form.mimeType || undefined,
      description: form.description || undefined,
      entityType: form.entityType || undefined,
      entityId: form.entityId || undefined,
      uploadedBy: form.uploadedBy || undefined,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    });
  };

  const filtered = useMemo(() => docs.filter((d: any) => {
    if (typeFilter !== "all" && d.entityType !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.originalName?.toLowerCase().includes(q) ||
             d.description?.toLowerCase().includes(q) ||
             d.documentId?.toLowerCase().includes(q);
    }
    return true;
  }), [docs, typeFilter, search]);

  if (!currentProjectId) return <div className="p-6 text-muted-foreground">Select a project to view documents.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FolderOpen className="w-6 h-6" /> Document Library</h1>
          <p className="text-muted-foreground text-sm mt-1">Centralized repository for all project documents and attachments</p>
        </div>
        <Button onClick={() => { setForm({ ...EMPTY_FORM }); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />Register Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ENTITY_TYPES.slice(0, 4).map(type => {
          const count = docs.filter((d: any) => d.entityType === type).length;
          return (
            <Card key={type} className="p-4 cursor-pointer hover:bg-muted/30" onClick={() => setTypeFilter(typeFilter === type ? "all" : type)}>
              <div className="text-xs text-muted-foreground uppercase tracking-wide capitalize">{type}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ENTITY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No documents yet. Register your first document.</p>
          <p className="text-xs text-muted-foreground mt-2">
            You can link any file URL (SharePoint, S3, Google Drive, etc.)
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Linked To</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc: any) => {
                const Icon = getFileIcon(doc.mimeType);
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{doc.documentId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{doc.originalName}</div>
                          {doc.description && <div className="text-xs text-muted-foreground truncate max-w-48">{doc.description}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.entityType && <Badge variant="outline" className="capitalize text-xs">{doc.entityType}</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{doc.entityId || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.uploadedBy || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatBytes(doc.fileSize)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: doc.id })} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Register Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Register Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Paste the file URL from SharePoint, Google Drive, S3, or any other file storage. This registers the link — files are not uploaded directly.
            </p>
            <div>
              <Label>File Name *</Label>
              <Input value={form.originalName} onChange={e => set("originalName", e.target.value)} placeholder="Report_Q1_2026.pdf" />
            </div>
            <div>
              <Label>File URL *</Label>
              <Input value={form.fileUrl} onChange={e => set("fileUrl", e.target.value)} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Select value={form.entityType} onValueChange={v => set("entityType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Linked ID (optional)</Label>
                <Input value={form.entityId} onChange={e => set("entityId", e.target.value)} placeholder="e.g. REQ-0001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Uploaded By</Label>
                <Input value={form.uploadedBy} onChange={e => set("uploadedBy", e.target.value)} placeholder="Name..." />
              </div>
              <div>
                <Label>MIME Type (optional)</Label>
                <Input value={form.mimeType} onChange={e => set("mimeType", e.target.value)} placeholder="application/pdf" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief description..." />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="blueprint, approval, v2" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending}>
              {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
