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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2, Plus, Trash2, FolderOpen, Search, FileText, File,
  FileImage, FileSpreadsheet, ExternalLink, Upload, Link2, Tag,
  Settings2, Pencil, X, Check,
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

const CATEGORY_COLORS = [
  { value: "gray", label: "Gray", bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { value: "blue", label: "Blue", bg: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  { value: "green", label: "Green", bg: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  { value: "amber", label: "Amber", bg: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" },
  { value: "red", label: "Red", bg: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" },
  { value: "purple", label: "Purple", bg: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
  { value: "pink", label: "Pink", bg: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300" },
  { value: "teal", label: "Teal", bg: "bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300" },
];

function getCategoryBg(color: string | null) {
  return CATEGORY_COLORS.find(c => c.value === color)?.bg ?? CATEGORY_COLORS[0].bg;
}

const EMPTY_FORM = {
  fileName: "", originalName: "", fileUrl: "", fileSize: "",
  mimeType: "", description: "", entityType: "general", entityId: "",
  uploadedBy: "", tags: "", categoryId: "",
};

function LinkDialog({ open, onClose, docId, projectId }: { open: boolean; onClose: () => void; docId: number; projectId: number; }) {
  const utils = trpc.useUtils();
  const { data: allIssues = [] } = trpc.issues.list.useQuery({ projectId }, { enabled: open });
  const { data: allReqs = [] } = trpc.requirements.list.useQuery({ projectId }, { enabled: open });
  const { data: linkedIssues = [], isLoading: loadingIssues } = trpc.documents.getIssueLinks.useQuery({ documentId: docId }, { enabled: open });
  const { data: linkedReqs = [], isLoading: loadingReqs } = trpc.documents.getRequirementLinks.useQuery({ documentId: docId }, { enabled: open });
  const [selectedIssueIds, setSelectedIssueIds] = useState<number[]>([]);
  const [selectedReqIds, setSelectedReqIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);
  if (!initialized && !loadingIssues && !loadingReqs) {
    setSelectedIssueIds((linkedIssues as any[]).map(i => i.id));
    setSelectedReqIds((linkedReqs as any[]).map(r => r.id));
    setInitialized(true);
  }
  const setIssueLinks = trpc.documents.setIssueLinks.useMutation({ onSuccess: () => utils.documents.getIssueLinks.invalidate({ documentId: docId }) });
  const setReqLinks = trpc.documents.setRequirementLinks.useMutation({ onSuccess: () => utils.documents.getRequirementLinks.invalidate({ documentId: docId }) });
  const handleSave = async () => {
    await setIssueLinks.mutateAsync({ documentId: docId, issueIds: selectedIssueIds });
    await setReqLinks.mutateAsync({ documentId: docId, requirementIds: selectedReqIds });
    toast.success("Links saved");
    onClose();
  };
  const toggleIssue = (id: number) => setSelectedIssueIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleReq = (id: number) => setSelectedReqIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { setInitialized(false); onClose(); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Link2 className="w-4 h-4" /> Link Document</DialogTitle></DialogHeader>
        <Tabs defaultValue="issues">
          <TabsList className="mb-3">
            <TabsTrigger value="issues">Issues ({selectedIssueIds.length} linked)</TabsTrigger>
            <TabsTrigger value="requirements">Requirements ({selectedReqIds.length} linked)</TabsTrigger>
          </TabsList>
          <TabsContent value="issues">
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {(allIssues as any[]).length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No issues in this project</p>}
              {(allIssues as any[]).map(issue => (
                <label key={issue.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={selectedIssueIds.includes(issue.id)} onCheckedChange={() => toggleIssue(issue.id)} />
                  <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{issue.issueId}</span>
                  <span className="text-sm truncate">{issue.description || "—"}</span>
                  {issue.status && <Badge variant="outline" className="text-xs shrink-0">{issue.status}</Badge>}
                </label>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="requirements">
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {(allReqs as any[]).length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No requirements in this project</p>}
              {(allReqs as any[]).map(req => (
                <label key={req.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
                  <Checkbox checked={selectedReqIds.includes(req.id)} onCheckedChange={() => toggleReq(req.id)} />
                  <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{req.idCode}</span>
                  <span className="text-sm truncate">{req.description || "—"}</span>
                  {req.status && <Badge variant="outline" className="text-xs shrink-0">{req.status}</Badge>}
                </label>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setInitialized(false); onClose(); }}>Cancel</Button>
          <Button onClick={handleSave} disabled={setIssueLinks.isPending || setReqLinks.isPending}>
            {(setIssueLinks.isPending || setReqLinks.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Links
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryManagerDialog({ open, onClose, projectId }: { open: boolean; onClose: () => void; projectId: number; }) {
  const utils = trpc.useUtils();
  const { data: categories = [], refetch } = trpc.documents.listCategories.useQuery({ projectId }, { enabled: open });
  const createCat = trpc.documents.createCategory.useMutation({ onSuccess: () => { refetch(); setNewName(""); setNewColor("gray"); } });
  const updateCat = trpc.documents.updateCategory.useMutation({ onSuccess: () => { refetch(); setEditingId(null); } });
  const deleteCat = trpc.documents.deleteCategory.useMutation({ onSuccess: () => { refetch(); utils.documents.list.invalidate(); } });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("gray");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("gray");
  const startEdit = (cat: any) => { setEditingId(cat.id); setEditName(cat.name); setEditColor(cat.color ?? "gray"); };
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Tag className="w-4 h-4" /> Manage Categories</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {(categories as any[]).length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No categories yet</p>}
            {(categories as any[]).map(cat => (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-md border">
                {editingId === cat.id ? (
                  <>
                    <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-7 text-sm flex-1"
                      onKeyDown={e => { if (e.key === "Enter") updateCat.mutate({ id: cat.id, name: editName, color: editColor }); if (e.key === "Escape") setEditingId(null); }} />
                    <Select value={editColor} onValueChange={setEditColor}>
                      <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORY_COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateCat.mutate({ id: cat.id, name: editName, color: editColor })}><Check className="w-3 h-3 text-green-600" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                  </>
                ) : (
                  <>
                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + getCategoryBg(cat.color)}>{cat.name}</span>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(cat)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => deleteCat.mutate({ id: cat.id })}><Trash2 className="w-3 h-3" /></Button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Add new category</p>
            <div className="flex gap-2">
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name..." className="h-8 text-sm flex-1"
                onKeyDown={e => { if (e.key === "Enter" && newName.trim()) createCat.mutate({ projectId, name: newName.trim(), color: newColor }); }} />
              <Select value={newColor} onValueChange={setNewColor}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORY_COLORS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
              <Button size="sm" className="h-8" onClick={() => { if (newName.trim()) createCat.mutate({ projectId, name: newName.trim(), color: newColor }); }} disabled={!newName.trim() || createCat.isPending}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueReqSelector({ projectId, selectedIssueIds, selectedReqIds, onIssueChange, onReqChange }: {
  projectId: number; selectedIssueIds: number[]; selectedReqIds: number[];
  onIssueChange: (ids: number[]) => void; onReqChange: (ids: number[]) => void;
}) {
  const { data: allIssues = [] } = trpc.issues.list.useQuery({ projectId });
  const { data: allReqs = [] } = trpc.requirements.list.useQuery({ projectId });
  const toggleIssue = (id: number) => onIssueChange(selectedIssueIds.includes(id) ? selectedIssueIds.filter(x => x !== id) : [...selectedIssueIds, id]);
  const toggleReq = (id: number) => onReqChange(selectedReqIds.includes(id) ? selectedReqIds.filter(x => x !== id) : [...selectedReqIds, id]);
  return (
    <Tabs defaultValue="issues">
      <TabsList className="mb-3">
        <TabsTrigger value="issues">Issues ({selectedIssueIds.length})</TabsTrigger>
        <TabsTrigger value="requirements">Requirements ({selectedReqIds.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="issues">
        <div className="max-h-56 overflow-y-auto border rounded-md divide-y">
          {(allIssues as any[]).length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No issues in this project</p>}
          {(allIssues as any[]).map(issue => (
            <label key={issue.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={selectedIssueIds.includes(issue.id)} onCheckedChange={() => toggleIssue(issue.id)} />
              <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">{issue.issueId}</span>
              <span className="text-sm truncate">{issue.description || "—"}</span>
              {issue.status && <Badge variant="outline" className="text-xs shrink-0">{issue.status}</Badge>}
            </label>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="requirements">
        <div className="max-h-56 overflow-y-auto border rounded-md divide-y">
          {(allReqs as any[]).length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">No requirements in this project</p>}
          {(allReqs as any[]).map(req => (
            <label key={req.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/40">
              <Checkbox checked={selectedReqIds.includes(req.id)} onCheckedChange={() => toggleReq(req.id)} />
              <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{req.idCode}</span>
              <span className="text-sm truncate">{req.description || "—"}</span>
              {req.status && <Badge variant="outline" className="text-xs shrink-0">{req.status}</Badge>}
            </label>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}

export default function DocumentLibrary() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId!;
  const enabled = !!currentProjectId;
  const { data: docs = [], isLoading, refetch } = trpc.documents.list.useQuery({ projectId }, { enabled });
  const { data: categories = [], refetch: refetchCats } = trpc.documents.listCategories.useQuery({ projectId }, { enabled });
  const create = trpc.documents.create.useMutation({
    onSuccess: () => { toast.success("Document registered"); refetch(); setOpen(false); resetForm(); },
    onError: () => toast.error("Failed to register document"),
  });
  const del = trpc.documents.delete.useMutation({ onSuccess: () => { toast.success("Deleted"); refetch(); } });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>({ ...EMPTY_FORM });
  const [formIssueIds, setFormIssueIds] = useState<number[]>([]);
  const [formReqIds, setFormReqIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [linkDocId, setLinkDocId] = useState<number | null>(null);
  const [catManagerOpen, setCatManagerOpen] = useState(false);
  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));
  const resetForm = () => { setForm({ ...EMPTY_FORM }); setFormIssueIds([]); setFormReqIds([]); };
  const filtered = useMemo(() => (docs as any[]).filter(doc => {
    const matchSearch = !search || doc.originalName.toLowerCase().includes(search.toLowerCase()) ||
      (doc.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (doc.documentId ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "all" || (catFilter === "uncategorized" ? !doc.categoryId : String(doc.categoryId) === catFilter);
    return matchSearch && matchCat;
  }), [docs, search, catFilter]);
  const catMap = useMemo(() => { const m: Record<number, any> = {}; (categories as any[]).forEach(c => { m[c.id] = c; }); return m; }, [categories]);
  const handleSave = () => {
    if (!form.fileUrl.trim()) return toast.error("File URL is required");
    if (!form.originalName.trim()) return toast.error("File name is required");
    create.mutate({
      projectId, fileName: form.fileName || form.originalName, originalName: form.originalName,
      fileUrl: form.fileUrl, fileSize: form.fileSize ? parseInt(form.fileSize) : undefined,
      mimeType: form.mimeType || undefined, description: form.description || undefined,
      entityType: form.entityType || undefined, entityId: form.entityId || undefined,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      uploadedBy: form.uploadedBy || undefined,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      issueIds: formIssueIds, requirementIds: formReqIds,
    });
  };
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-semibold">Document Library</h1>
          <Badge variant="secondary">{(docs as any[]).length}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatManagerOpen(true)}><Settings2 className="w-4 h-4 mr-1" /> Categories</Button>
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Register Document</Button>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-9 w-48"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {(categories as any[]).map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center">
          <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No documents found</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Register your first document</Button>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-36">Category</TableHead>
                <TableHead className="w-32">Uploaded By</TableHead>
                <TableHead className="w-20">Size</TableHead>
                <TableHead className="w-24">Date</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc: any) => {
                const Icon = getFileIcon(doc.mimeType ?? null);
                const cat = doc.categoryId ? catMap[doc.categoryId] : null;
                return (
                  <TableRow key={doc.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{doc.documentId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <div className="font-medium text-sm">{doc.originalName}</div>
                          {doc.description && <div className="text-xs text-muted-foreground truncate max-w-48">{doc.description}</div>}
                          {Array.isArray(doc.tags) && doc.tags.length > 0 && (
                            <div className="flex gap-1 mt-0.5 flex-wrap">
                              {(doc.tags as string[]).map(tag => <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">{tag}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {cat ? <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + getCategoryBg(cat.color ?? null)}>{cat.name}</span>
                           : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{doc.uploadedBy || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatBytes(doc.fileSize ?? null)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Manage links" onClick={() => setLinkDocId(doc.id)}><Link2 className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="sm" asChild><a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3" /></a></Button>
                        <Button variant="ghost" size="sm" onClick={() => del.mutate({ id: doc.id })} className="text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <Dialog open={open} onOpenChange={v => { if (!v) resetForm(); setOpen(v); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Upload className="w-4 h-4" /> Register Document</DialogTitle></DialogHeader>
          <Tabs defaultValue="details">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="links">
                Links{(formIssueIds.length + formReqIds.length) > 0 && <Badge variant="secondary" className="ml-1 text-xs">{formIssueIds.length + formReqIds.length}</Badge>}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">Paste the file URL from SharePoint, Google Drive, S3, or any other file storage. This registers the link, files are not uploaded directly.</p>
              <div><Label>File Name *</Label><Input value={form.originalName} onChange={e => set("originalName", e.target.value)} placeholder="Report_Q1_2026.pdf" /></div>
              <div><Label>File URL *</Label><Input value={form.fileUrl} onChange={e => set("fileUrl", e.target.value)} placeholder="https://..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.categoryId || "none"} onValueChange={v => set("categoryId", v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {(categories as any[]).map(cat => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Uploaded By</Label><Input value={form.uploadedBy} onChange={e => set("uploadedBy", e.target.value)} placeholder="Name..." /></div>
              </div>
              <div><Label>Description</Label><Textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Brief description..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>MIME Type (optional)</Label><Input value={form.mimeType} onChange={e => set("mimeType", e.target.value)} placeholder="application/pdf" /></div>
                <div><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="blueprint, approval, v2" /></div>
              </div>
            </TabsContent>
            <TabsContent value="links">
              <IssueReqSelector projectId={projectId} selectedIssueIds={formIssueIds} selectedReqIds={formReqIds} onIssueChange={setFormIssueIds} onReqChange={setFormReqIds} />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setOpen(false); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={create.isPending}>{create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {linkDocId !== null && <LinkDialog open={linkDocId !== null} onClose={() => setLinkDocId(null)} docId={linkDocId} projectId={projectId} />}
      <CategoryManagerDialog open={catManagerOpen} onClose={() => { setCatManagerOpen(false); refetchCats(); }} projectId={projectId} />
    </div>
  );
}
