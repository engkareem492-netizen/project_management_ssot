import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, Pencil, Trash2, Users, CheckSquare } from "lucide-react";
import { toast } from "sonner";

const MEETING_TYPE_COLORS: Record<string, string> = {
  "Steering Committee": "bg-purple-100 text-purple-700",
  "Project Team": "bg-blue-100 text-blue-700",
  "Workshop": "bg-green-100 text-green-700",
  "Review": "bg-yellow-100 text-yellow-700",
  "Kickoff": "bg-orange-100 text-orange-700",
  "Other": "bg-gray-100 text-gray-700",
};

const MEETING_STATUS_COLORS: Record<string, string> = {
  Scheduled: "bg-blue-100 text-blue-700",
  "In Progress": "bg-yellow-100 text-yellow-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
};

const DECISION_STATUS_COLORS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-700",
  Implemented: "bg-green-100 text-green-700",
  Deferred: "bg-gray-100 text-gray-600",
  Cancelled: "bg-red-100 text-red-600",
};

type MeetingStatus = "Scheduled" | "In Progress" | "Completed" | "Cancelled";
type DecisionStatus = "Open" | "Implemented" | "Deferred" | "Cancelled";

interface MeetingForm {
  title: string;
  meetingDate: string;
  location: string;
  organizer: string;
  attendees: string[];
  agenda: string;
  minutes: string;
  status: MeetingStatus;
}

interface DecisionForm {
  title: string;
  description: string;
  decidedBy: string;
  decisionDate: string;
  status: DecisionStatus;
  impact: string;
  requirementId: string;
  taskId: string;
  issueId: string;
}

const emptyMeetingForm: MeetingForm = {
  title: "", meetingDate: "", location: "", organizer: "",
  attendees: [], agenda: "", minutes: "", status: "Scheduled",
};

const emptyDecisionForm: DecisionForm = {
  title: "", description: "", decidedBy: "", decisionDate: "",
  status: "Open", impact: "", requirementId: "", taskId: "", issueId: "",
};

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
}

export default function Meetings() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const [tab, setTab] = useState("meetings");
  const [search, setSearch] = useState("");
  const [showCreateMeeting, setShowCreateMeeting] = useState(false);
  const [showViewMeeting, setShowViewMeeting] = useState(false);
  const [showEditMeeting, setShowEditMeeting] = useState(false);
  const [showCreateDecision, setShowCreateDecision] = useState(false);
  const [showViewDecision, setShowViewDecision] = useState(false);
  const [showEditDecision, setShowEditDecision] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<number | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<number | null>(null);
  const [meetingForm, setMeetingForm] = useState<MeetingForm>(emptyMeetingForm);
  const [decisionForm, setDecisionForm] = useState<DecisionForm>(emptyDecisionForm);
  const [attendeesText, setAttendeesText] = useState("");

  const utils = trpc.useUtils();
  const { data: meetings = [], isLoading: loadingMeetings } = trpc.meetings.listMeetings.useQuery({ projectId }, { enabled: !!projectId });
  const { data: decisions = [], isLoading: loadingDecisions } = trpc.meetings.listDecisions.useQuery({ projectId }, { enabled: !!projectId });

  const createMeetingMutation = trpc.meetings.createMeeting.useMutation({
    onSuccess: () => { utils.meetings.listMeetings.invalidate(); setShowCreateMeeting(false); setMeetingForm(emptyMeetingForm); setAttendeesText(""); toast.success("Meeting created"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMeetingMutation = trpc.meetings.updateMeeting.useMutation({
    onSuccess: () => { utils.meetings.listMeetings.invalidate(); setShowEditMeeting(false); toast.success("Meeting updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMeetingMutation = trpc.meetings.deleteMeeting.useMutation({
    onSuccess: () => { utils.meetings.listMeetings.invalidate(); toast.success("Meeting deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const createDecisionMutation = trpc.meetings.createDecision.useMutation({
    onSuccess: () => { utils.meetings.listDecisions.invalidate(); setShowCreateDecision(false); setDecisionForm(emptyDecisionForm); toast.success("Decision logged"); },
    onError: (e) => toast.error(e.message),
  });
  const updateDecisionMutation = trpc.meetings.updateDecision.useMutation({
    onSuccess: () => { utils.meetings.listDecisions.invalidate(); setShowEditDecision(false); toast.success("Decision updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteDecisionMutation = trpc.meetings.deleteDecision.useMutation({
    onSuccess: () => { utils.meetings.listDecisions.invalidate(); toast.success("Decision deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const selectedMeetingData = meetings.find((m) => m.id === selectedMeeting);
  const selectedDecisionData = decisions.find((d) => d.id === selectedDecision);

  const filteredMeetings = meetings.filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()) || (m.organizer ?? "").toLowerCase().includes(search.toLowerCase()));
  const filteredDecisions = decisions.filter((d) => !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.decidedBy ?? "").toLowerCase().includes(search.toLowerCase()));

  function openEditMeeting(m: typeof meetings[0]) {
    setSelectedMeeting(m.id);
    setMeetingForm({
      title: m.title,
      meetingDate: m.meetingDate ? new Date(m.meetingDate).toISOString().split("T")[0] : "",
      location: m.location ?? "",
      organizer: m.organizer ?? "",
      attendees: (m.attendees as string[]) ?? [],
      agenda: m.agenda ?? "",
      minutes: m.minutes ?? "",
      status: (m.status as MeetingStatus) ?? "Scheduled",
    });
    setAttendeesText(((m.attendees as string[]) ?? []).join(", "));
    setShowEditMeeting(true);
  }

  function openEditDecision(d: typeof decisions[0]) {
    setSelectedDecision(d.id);
    setDecisionForm({
      title: d.title,
      description: d.description ?? "",
      decidedBy: d.decidedBy ?? "",
      decisionDate: d.decisionDate ? new Date(d.decisionDate).toISOString().split("T")[0] : "",
      status: (d.status as DecisionStatus) ?? "Open",
      impact: d.impact ?? "",
      requirementId: d.requirementId ?? "",
      taskId: d.taskId ?? "",
      issueId: d.issueId ?? "",
    });
    setShowEditDecision(true);
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Meetings & Decision Log
          </h1>
          <p className="text-indigo-700 text-sm mt-1">Record meeting minutes, action items, and key project decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-indigo-700 border-indigo-300">{meetings.length} Meetings</Badge>
          <Badge variant="outline" className="text-indigo-700 border-indigo-300">{decisions.length} Decisions</Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="meetings"><Users className="w-4 h-4 mr-1" />Meetings</TabsTrigger>
            <TabsTrigger value="decisions"><CheckSquare className="w-4 h-4 mr-1" />Decisions</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-56" />
            {tab === "meetings" ? (
              <Button onClick={() => { setMeetingForm(emptyMeetingForm); setAttendeesText(""); setShowCreateMeeting(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Add Meeting
              </Button>
            ) : (
              <Button onClick={() => { setDecisionForm(emptyDecisionForm); setShowCreateDecision(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                <Plus className="w-4 h-4 mr-1" /> Log Decision
              </Button>
            )}
          </div>
        </div>

        {/* Meetings Tab */}
        <TabsContent value="meetings">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-50">
                  <TableHead className="w-24 font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="w-28 font-semibold">Date</TableHead>
                  <TableHead className="w-36 font-semibold">Status</TableHead>
                  <TableHead className="w-36 font-semibold">Organizer</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingMeetings ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredMeetings.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No meetings recorded yet</TableCell></TableRow>
                ) : filteredMeetings.map((m) => (
                  <TableRow key={m.id} className="hover:bg-indigo-50/30">
                    <TableCell className="font-mono text-sm font-semibold text-indigo-700">{m.meetingId}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="font-medium text-sm truncate">{m.title}</div>
                      {m.location && <div className="text-xs text-muted-foreground">{m.location}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(m.meetingDate)}</TableCell>
                    <TableCell><Badge className={`text-xs ${MEETING_STATUS_COLORS[m.status ?? "Scheduled"] ?? ""}`}>{m.status ?? "Scheduled"}</Badge></TableCell>
                    <TableCell className="text-sm">{m.organizer ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedMeeting(m.id); setShowViewMeeting(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditMeeting(m)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm("Delete this meeting?")) deleteMeetingMutation.mutate({ id: m.id }); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Decisions Tab */}
        <TabsContent value="decisions">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-indigo-50">
                  <TableHead className="w-24 font-semibold">ID</TableHead>
                  <TableHead className="font-semibold">Decision</TableHead>
                  <TableHead className="w-28 font-semibold">Date</TableHead>
                  <TableHead className="w-36 font-semibold">Decided By</TableHead>
                  <TableHead className="w-32 font-semibold">Status</TableHead>
                  <TableHead className="w-32 font-semibold">Linked To</TableHead>
                  <TableHead className="w-32 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDecisions ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filteredDecisions.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No decisions logged yet</TableCell></TableRow>
                ) : filteredDecisions.map((d) => (
                  <TableRow key={d.id} className="hover:bg-indigo-50/30">
                    <TableCell className="font-mono text-sm font-semibold text-indigo-700">{d.decisionId}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="font-medium text-sm truncate">{d.title}</div>
                      {d.description && <div className="text-xs text-muted-foreground truncate">{d.description}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(d.decisionDate)}</TableCell>
                    <TableCell className="text-sm">{d.decidedBy ?? "—"}</TableCell>
                    <TableCell><Badge className={`text-xs ${DECISION_STATUS_COLORS[d.status ?? "Open"] ?? ""}`}>{d.status ?? "Open"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.requirementId && <div>REQ: {d.requirementId}</div>}
                      {d.taskId && <div>TASK: {d.taskId}</div>}
                      {!d.requirementId && !d.taskId && "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedDecision(d.id); setShowViewDecision(true); }}><Eye className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDecision(d)}><Pencil className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500" onClick={() => { if (confirm("Delete this decision?")) deleteDecisionMutation.mutate({ id: d.id }); }}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Meeting Dialog */}
      <Dialog open={showCreateMeeting} onOpenChange={setShowCreateMeeting}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Meeting</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })} /></div>
            <div className="space-y-1"><Label>Location / Link</Label><Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={meetingForm.status} onValueChange={(v) => setMeetingForm({ ...meetingForm, status: v as MeetingStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Scheduled", "In Progress", "Completed", "Cancelled"] as MeetingStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Organizer</Label><Input value={meetingForm.organizer} onChange={(e) => setMeetingForm({ ...meetingForm, organizer: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Attendees (comma-separated)</Label><Textarea value={attendeesText} onChange={(e) => { setAttendeesText(e.target.value); setMeetingForm({ ...meetingForm, attendees: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) }); }} rows={2} placeholder="John Doe, Jane Smith, ..." /></div>
            <div className="col-span-2 space-y-1"><Label>Agenda</Label><Textarea value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} rows={3} /></div>
            <div className="col-span-2 space-y-1"><Label>Minutes / Summary</Label><Textarea value={meetingForm.minutes} onChange={(e) => setMeetingForm({ ...meetingForm, minutes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateMeeting(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => createMeetingMutation.mutate({ projectId, title: meetingForm.title, meetingDate: meetingForm.meetingDate, location: meetingForm.location, organizer: meetingForm.organizer, attendees: meetingForm.attendees, agenda: meetingForm.agenda, minutes: meetingForm.minutes, status: meetingForm.status })} disabled={!meetingForm.title || createMeetingMutation.isPending}>
              {createMeetingMutation.isPending ? "Saving..." : "Save Meeting"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Meeting Dialog */}
      <Dialog open={showEditMeeting} onOpenChange={setShowEditMeeting}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Meeting</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Title *</Label><Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Date</Label><Input type="date" value={meetingForm.meetingDate} onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })} /></div>
            <div className="space-y-1"><Label>Location / Link</Label><Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={meetingForm.status} onValueChange={(v) => setMeetingForm({ ...meetingForm, status: v as MeetingStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Scheduled", "In Progress", "Completed", "Cancelled"] as MeetingStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Organizer</Label><Input value={meetingForm.organizer} onChange={(e) => setMeetingForm({ ...meetingForm, organizer: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Attendees (comma-separated)</Label><Textarea value={attendeesText} onChange={(e) => { setAttendeesText(e.target.value); setMeetingForm({ ...meetingForm, attendees: e.target.value.split(",").map((a) => a.trim()).filter(Boolean) }); }} rows={2} /></div>
            <div className="col-span-2 space-y-1"><Label>Agenda</Label><Textarea value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} rows={3} /></div>
            <div className="col-span-2 space-y-1"><Label>Minutes / Summary</Label><Textarea value={meetingForm.minutes} onChange={(e) => setMeetingForm({ ...meetingForm, minutes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMeeting(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => selectedMeeting && updateMeetingMutation.mutate({ id: selectedMeeting, title: meetingForm.title, meetingDate: meetingForm.meetingDate, location: meetingForm.location, organizer: meetingForm.organizer, attendees: meetingForm.attendees, agenda: meetingForm.agenda, minutes: meetingForm.minutes, status: meetingForm.status })} disabled={!meetingForm.title || updateMeetingMutation.isPending}>
              {updateMeetingMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Meeting Dialog */}
      <Dialog open={showViewMeeting} onOpenChange={setShowViewMeeting}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Meeting Details</DialogTitle></DialogHeader>
          {selectedMeetingData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono font-bold text-indigo-700">{selectedMeetingData.meetingId}</span>
                <Badge className={MEETING_STATUS_COLORS[selectedMeetingData.status ?? "Scheduled"]}>{selectedMeetingData.status}</Badge>
              </div>
              <h2 className="text-xl font-semibold">{selectedMeetingData.title}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Date:</span> {formatDate(selectedMeetingData.meetingDate)}</div>
                <div><span className="font-medium">Location:</span> {selectedMeetingData.location ?? "—"}</div>
                <div><span className="font-medium">Organizer:</span> {selectedMeetingData.organizer ?? "—"}</div>
                <div><span className="font-medium">Attendees:</span> {Array.isArray(selectedMeetingData.attendees) ? (selectedMeetingData.attendees as string[]).join(", ") : "—"}</div>
              </div>
              {selectedMeetingData.agenda && <div><span className="font-medium text-sm">Agenda:</span><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedMeetingData.agenda}</p></div>}
              {selectedMeetingData.minutes && <div><span className="font-medium text-sm">Minutes / Summary:</span><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{selectedMeetingData.minutes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Decision Dialog */}
      <Dialog open={showCreateDecision} onOpenChange={setShowCreateDecision}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Decision</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Decision Title *</Label><Input value={decisionForm.title} onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={decisionForm.description} onChange={(e) => setDecisionForm({ ...decisionForm, description: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Decided By</Label><Input value={decisionForm.decidedBy} onChange={(e) => setDecisionForm({ ...decisionForm, decidedBy: e.target.value })} /></div>
            <div className="space-y-1"><Label>Decision Date</Label><Input type="date" value={decisionForm.decisionDate} onChange={(e) => setDecisionForm({ ...decisionForm, decisionDate: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={decisionForm.status} onValueChange={(v) => setDecisionForm({ ...decisionForm, status: v as DecisionStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Open", "Implemented", "Deferred", "Cancelled"] as DecisionStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Requirement ID</Label><Input value={decisionForm.requirementId} onChange={(e) => setDecisionForm({ ...decisionForm, requirementId: e.target.value })} placeholder="e.g. EQ-0001" /></div>
            <div className="col-span-2 space-y-1"><Label>Impact</Label><Textarea value={decisionForm.impact} onChange={(e) => setDecisionForm({ ...decisionForm, impact: e.target.value })} rows={2} /></div>
            <div className="space-y-1"><Label>Linked Task ID</Label><Input value={decisionForm.taskId} onChange={(e) => setDecisionForm({ ...decisionForm, taskId: e.target.value })} /></div>
            <div className="space-y-1"><Label>Linked Issue ID</Label><Input value={decisionForm.issueId} onChange={(e) => setDecisionForm({ ...decisionForm, issueId: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDecision(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => createDecisionMutation.mutate({ projectId, title: decisionForm.title, description: decisionForm.description, decidedBy: decisionForm.decidedBy, decisionDate: decisionForm.decisionDate, status: decisionForm.status, impact: decisionForm.impact, requirementId: decisionForm.requirementId, taskId: decisionForm.taskId, issueId: decisionForm.issueId })} disabled={!decisionForm.title || createDecisionMutation.isPending}>
              {createDecisionMutation.isPending ? "Saving..." : "Log Decision"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Decision Dialog */}
      <Dialog open={showEditDecision} onOpenChange={setShowEditDecision}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Decision</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1"><Label>Decision Title *</Label><Input value={decisionForm.title} onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Description</Label><Textarea value={decisionForm.description} onChange={(e) => setDecisionForm({ ...decisionForm, description: e.target.value })} rows={3} /></div>
            <div className="space-y-1"><Label>Decided By</Label><Input value={decisionForm.decidedBy} onChange={(e) => setDecisionForm({ ...decisionForm, decidedBy: e.target.value })} /></div>
            <div className="space-y-1"><Label>Decision Date</Label><Input type="date" value={decisionForm.decisionDate} onChange={(e) => setDecisionForm({ ...decisionForm, decisionDate: e.target.value })} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={decisionForm.status} onValueChange={(v) => setDecisionForm({ ...decisionForm, status: v as DecisionStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["Open", "Implemented", "Deferred", "Cancelled"] as DecisionStatus[]).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Linked Requirement ID</Label><Input value={decisionForm.requirementId} onChange={(e) => setDecisionForm({ ...decisionForm, requirementId: e.target.value })} /></div>
            <div className="col-span-2 space-y-1"><Label>Impact</Label><Textarea value={decisionForm.impact} onChange={(e) => setDecisionForm({ ...decisionForm, impact: e.target.value })} rows={2} /></div>
            <div className="space-y-1"><Label>Linked Task ID</Label><Input value={decisionForm.taskId} onChange={(e) => setDecisionForm({ ...decisionForm, taskId: e.target.value })} /></div>
            <div className="space-y-1"><Label>Linked Issue ID</Label><Input value={decisionForm.issueId} onChange={(e) => setDecisionForm({ ...decisionForm, issueId: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDecision(false)}>Cancel</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => selectedDecision && updateDecisionMutation.mutate({ id: selectedDecision, title: decisionForm.title, description: decisionForm.description, decidedBy: decisionForm.decidedBy, decisionDate: decisionForm.decisionDate, status: decisionForm.status, impact: decisionForm.impact, requirementId: decisionForm.requirementId, taskId: decisionForm.taskId, issueId: decisionForm.issueId })} disabled={!decisionForm.title || updateDecisionMutation.isPending}>
              {updateDecisionMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Decision Dialog */}
      <Dialog open={showViewDecision} onOpenChange={setShowViewDecision}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Decision Details</DialogTitle></DialogHeader>
          {selectedDecisionData && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-indigo-700">{selectedDecisionData.decisionId}</span>
                <Badge className={DECISION_STATUS_COLORS[selectedDecisionData.status ?? "Open"]}>{selectedDecisionData.status}</Badge>
              </div>
              <h2 className="text-xl font-semibold">{selectedDecisionData.title}</h2>
              {selectedDecisionData.description && <p className="text-muted-foreground">{selectedDecisionData.description}</p>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="font-medium">Decided By:</span> {selectedDecisionData.decidedBy ?? "—"}</div>
                <div><span className="font-medium">Date:</span> {formatDate(selectedDecisionData.decisionDate)}</div>
                {selectedDecisionData.requirementId && <div><span className="font-medium">Requirement:</span> {selectedDecisionData.requirementId}</div>}
                {selectedDecisionData.taskId && <div><span className="font-medium">Task:</span> {selectedDecisionData.taskId}</div>}
                {selectedDecisionData.issueId && <div><span className="font-medium">Issue:</span> {selectedDecisionData.issueId}</div>}
              </div>
              {selectedDecisionData.impact && <div><span className="font-medium text-sm">Impact:</span><p className="text-sm text-muted-foreground mt-1">{selectedDecisionData.impact}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
