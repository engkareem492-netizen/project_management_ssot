import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { MessageSquare, Plus, Pencil, Trash2, Download, Filter } from "lucide-react";

const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed", "One-time", "Event-driven"];
const CHANNELS = ["Email", "Meeting", "Video Call", "Phone", "Report", "Dashboard", "Instant Message", "Newsletter", "Workshop", "Presentation"];
const PURPOSES = ["Inform", "Consult", "Approve", "Collaborate", "Escalate", "Report", "Coordinate"];

const FREQ_BADGE: Record<string, string> = {
  Daily: "bg-red-100 text-red-700",
  Weekly: "bg-orange-100 text-orange-700",
  "Bi-weekly": "bg-yellow-100 text-yellow-700",
  Monthly: "bg-blue-100 text-blue-700",
  Quarterly: "bg-purple-100 text-purple-700",
  "As needed": "bg-gray-100 text-gray-700",
  "One-time": "bg-teal-100 text-teal-700",
  "Event-driven": "bg-pink-100 text-pink-700",
};

const EMPTY_FORM = {
  stakeholderId: "",
  purpose: "",
  message: "",
  channel: "",
  frequency: "",
  responsible: "",
  responsibleId: "",
  timing: "",
  format: "",
  notes: "",
};

export default function CommunicationPlan() {
  const { currentProjectId } = useProject();
  const utils = trpc.useUtils();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterFreq, setFilterFreq] = useState("all");

  const { data: stakeholders = [] } = trpc.stakeholders.list.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  // Communication plan entries are stored in the stakeholders table's communication fields.
  // We use the stakeholders list as the source of truth and allow editing per-stakeholder.
  // For a richer communication plan, we show all stakeholders with communication data
  // and allow adding/editing communication entries.

  const updateMutation = trpc.stakeholders.update.useMutation({
    onSuccess: () => {
      utils.stakeholders.list.invalidate();
      setIsAddOpen(false);
      setEditingId(null);
      toast.success("Communication plan updated");
    },
    onError: (e) => toast.error(`Failed: ${e.message}`),
  });

  const stakeholdersWithComm = stakeholders.filter(
    (s) => s.communicationFrequency || s.communicationChannel || s.communicationMessage
  );

  const filteredEntries = stakeholdersWithComm.filter((s) => {
    if (filterChannel !== "all" && s.communicationChannel !== filterChannel) return false;
    if (filterFreq !== "all" && s.communicationFrequency !== filterFreq) return false;
    return true;
  });

  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      stakeholderId: s.id.toString(),
      purpose: s.communicationPurpose || "",
      message: s.communicationMessage || "",
      channel: s.communicationChannel || "",
      frequency: s.communicationFrequency || "",
      responsible: s.communicationResponsible || "",
      responsibleId: s.communicationResponsibleId?.toString() || "",
      timing: s.communicationTiming || "",
      format: s.communicationFormat || "",
      notes: s.communicationNotes || "",
    });
    setIsAddOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setIsAddOpen(true);
  };

  const handleSave = () => {
    const targetId = editingId || parseInt(form.stakeholderId);
    if (!targetId) { toast.error("Please select a stakeholder"); return; }
    updateMutation.mutate({
      id: targetId,
      data: {
        communicationFrequency: form.frequency || undefined,
        communicationChannel: form.channel || undefined,
        communicationMessage: form.message || undefined,
        communicationResponsible: form.responsible || undefined,
        communicationResponsibleId: form.responsibleId ? parseInt(form.responsibleId) : undefined,
      },
    });
  };

  const renderForm = () => (
    <div className="space-y-3">
      {!editingId && (
        <div className="space-y-2">
          <Label>Stakeholder *</Label>
          <Select value={form.stakeholderId} onValueChange={(v) => setForm({ ...form, stakeholderId: v })}>
            <SelectTrigger><SelectValue placeholder="Select stakeholder..." /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => (
                <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}{s.position ? ` — ${s.position}` : ""}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Communication Channel</Label>
          <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
            <SelectTrigger><SelectValue placeholder="Channel..." /></SelectTrigger>
            <SelectContent>
              {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
            <SelectTrigger><SelectValue placeholder="How often?" /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Key Message / Purpose</Label>
        <Textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={2}
          placeholder="What is the key message or purpose of this communication?"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Responsible Person</Label>
          <Select value={form.responsibleId} onValueChange={(v) => {
            const s = stakeholders.find((x) => x.id.toString() === v);
            setForm({ ...form, responsibleId: v, responsible: s?.fullName || "" });
          }}>
            <SelectTrigger><SelectValue placeholder="Who sends it?" /></SelectTrigger>
            <SelectContent>
              {stakeholders.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Format</Label>
          <Input value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} placeholder="e.g. PDF Report, Slide Deck, Email" />
        </div>
      </div>
    </div>
  );

  // Summary stats
  const byChannel = CHANNELS.reduce((acc, c) => {
    acc[c] = stakeholdersWithComm.filter((s) => s.communicationChannel === c).length;
    return acc;
  }, {} as Record<string, number>);
  const topChannels = Object.entries(byChannel).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-card border rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Communication Plan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define how, when, and what to communicate with each stakeholder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{stakeholdersWithComm.length} entries</Badge>
          <Button onClick={openAdd} className="gap-2" size="sm">
            <Plus className="h-4 w-4" /> Add Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {topChannels.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {topChannels.map(([channel, count]) => (
            <Card key={channel} className="border">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">{channel}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filterChannel} onValueChange={setFilterChannel}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Channel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            {CHANNELS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFreq} onValueChange={setFilterFreq}>
          <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="Frequency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterChannel !== "all" || filterFreq !== "all") && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterChannel("all"); setFilterFreq("all"); }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Communication Plan Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Communication Register</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Stakeholder</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Key Message</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.fullName}</div>
                      {s.position && <div className="text-xs text-muted-foreground">{s.position}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        s.classification === "team_member" || s.isInternalTeam
                          ? "bg-blue-100 text-blue-700 border-blue-200 text-xs"
                          : s.classification === "external"
                          ? "bg-purple-100 text-purple-700 border-purple-200 text-xs"
                          : "bg-orange-100 text-orange-700 border-orange-200 text-xs"
                      }>
                        {s.classification === "team_member" || s.isInternalTeam ? "Team Member"
                          : s.classification === "external" ? "External" : "Stakeholder"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.communicationChannel ? (
                        <Badge variant="outline" className="text-xs">{s.communicationChannel}</Badge>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      {s.communicationFrequency ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${FREQ_BADGE[s.communicationFrequency] || "bg-gray-100 text-gray-700"}`}>
                          {s.communicationFrequency}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-sm truncate" title={s.communicationMessage || ""}>
                        {s.communicationMessage || <span className="text-muted-foreground text-xs">—</span>}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{s.communicationResponsible || <span className="text-muted-foreground text-xs">—</span>}</span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No communication entries yet</p>
                      <p className="text-sm mt-1">Add communication details to stakeholders or click "Add Entry" above.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Stakeholders without communication plan */}
      {stakeholders.length > stakeholdersWithComm.length && (
        <Card className="border-dashed border-orange-300 bg-orange-50/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 flex items-center gap-2">
              ⚠ Stakeholders without communication plan ({stakeholders.length - stakeholdersWithComm.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stakeholders
                .filter((s) => !s.communicationFrequency && !s.communicationChannel && !s.communicationMessage)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => openEdit(s)}
                    className="px-3 py-1 rounded-full border border-orange-200 bg-white text-sm hover:bg-orange-50 transition-colors"
                  >
                    {s.fullName}
                  </button>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { if (!o) { setIsAddOpen(false); setEditingId(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Communication Entry" : "Add Communication Entry"}</DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setEditingId(null); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
