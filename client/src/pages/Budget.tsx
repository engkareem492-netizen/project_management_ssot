import { useState, useMemo, useEffect } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, Pencil, Trash2, Settings, Users, Loader2 } from "lucide-react";
import { CURRENCIES } from "@/lib/currencies";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

type EntryStatus = "Planned" | "Committed" | "Spent" | "Cancelled";

const STATUS_COLORS: Record<EntryStatus, string> = {
  Planned: "bg-gray-100 text-gray-600",
  Committed: "bg-blue-100 text-blue-700",
  Spent: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-600",
};

interface BudgetEntry {
  id: number;
  category: string;
  description: string;
  estimated: number;
  actual: number;
  status: EntryStatus;
  entityLink?: string;
}

interface BudgetSummary {
  totalBudget: number;
  currency: string;
}

const emptyEntry = (): BudgetEntry => ({
  id: Date.now(),
  category: "",
  description: "",
  estimated: 0,
  actual: 0,
  status: "Planned",
  entityLink: "",
});

function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0 }).format(amount);
}

export default function Budget() {
  const { currentProjectId } = useProject();

  const { data: resourceCostData, isLoading: resourceCostLoading } = trpc.resourceCost.summary.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const { data: budgetData } = trpc.budget.getSummary.useQuery(
    { projectId: currentProjectId! },
    { enabled: !!currentProjectId }
  );

  const upsertBudgetMutation = trpc.budget.upsertBudget.useMutation();

  const [summary, setSummary] = useState<BudgetSummary>({ totalBudget: 0, currency: "USD" });
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BudgetEntry | null>(null);
  const [budgetForm, setBudgetForm] = useState({ totalBudget: 0, currency: "USD" });

  // Sync summary from server when data loads
  useEffect(() => {
    if (budgetData?.budget) {
      const b = budgetData.budget as any;
      setSummary({ totalBudget: parseFloat(b.totalBudget ?? "0") || 0, currency: b.currency ?? "USD" });
      setBudgetForm({ totalBudget: parseFloat(b.totalBudget ?? "0") || 0, currency: b.currency ?? "USD" });
    }
  }, [budgetData?.budget]);
  const [entryForm, setEntryForm] = useState<BudgetEntry>(emptyEntry());

  // Totals
  const totals = useMemo(() => {
    const estimated = entries.reduce((s, e) => s + (e.estimated ?? 0), 0);
    const actual = entries.reduce((s, e) => s + (e.actual ?? 0), 0);
    const remaining = summary.totalBudget - actual;
    return { estimated, actual, remaining };
  }, [entries, summary.totalBudget]);

  // Chart data grouped by category
  const chartData = useMemo(() => {
    const map: Record<string, { estimated: number; actual: number }> = {};
    entries.forEach((e) => {
      const cat = e.category || "Uncategorized";
      if (!map[cat]) map[cat] = { estimated: 0, actual: 0 };
      map[cat].estimated += e.estimated ?? 0;
      map[cat].actual += e.actual ?? 0;
    });
    return Object.entries(map).map(([name, vals]) => ({ name, ...vals }));
  }, [entries]);

  function openCreateEntry() {
    setEditingEntry(null);
    setEntryForm(emptyEntry());
    setShowEntryDialog(true);
  }

  function openEditEntry(entry: BudgetEntry) {
    setEditingEntry(entry);
    setEntryForm({ ...entry });
    setShowEntryDialog(true);
  }

  function saveEntry() {
    if (!entryForm.category) {
      toast.error("Category is required");
      return;
    }
    if (editingEntry) {
      setEntries((prev) => prev.map((e) => (e.id === editingEntry.id ? { ...entryForm } : e)));
      toast.success("Cost item updated");
    } else {
      setEntries((prev) => [...prev, { ...entryForm, id: Date.now() }]);
      toast.success("Cost item added");
    }
    setShowEntryDialog(false);
  }

  function deleteEntry(id: number) {
    if (!confirm("Delete this cost item?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    toast.success("Cost item deleted");
  }

  function saveBudget() {
    setSummary({ totalBudget: budgetForm.totalBudget, currency: budgetForm.currency });
    if (currentProjectId) {
      upsertBudgetMutation.mutate({
        projectId: currentProjectId,
        totalBudget: String(budgetForm.totalBudget),
        currency: budgetForm.currency,
      });
    }
    toast.success("Budget updated");
    setShowBudgetDialog(false);
  }

  if (!currentProjectId) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Select a project to view the budget.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-gray-500" />
            Budget & Cost Tracking
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track estimated and actual costs by category</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => { setBudgetForm({ totalBudget: summary.totalBudget, currency: summary.currency }); setShowBudgetDialog(true); }}
          >
            <Settings className="w-4 h-4 mr-1" /> Set Budget
          </Button>
          <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={openCreateEntry}>
            <Plus className="w-4 h-4 mr-1" /> Add Cost Item
          </Button>
        </div>
      </div>

      {/* Budget summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">
            {summary.totalBudget > 0 ? formatCurrency(summary.totalBudget, summary.currency) : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{summary.currency}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Estimated Cost</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.estimated, summary.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">sum of estimates</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Actual Spend</div>
          <div className="text-2xl font-bold">{formatCurrency(totals.actual, summary.currency)}</div>
          <div className="text-xs text-muted-foreground mt-1">committed + spent</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Remaining</div>
          <div className={`text-2xl font-bold ${totals.remaining < 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(totals.remaining, summary.currency)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">budget − actual</div>
        </Card>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold mb-4">Estimated vs Actual by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ bottom: 40 }}>
              <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} interval={0} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v, summary.currency)} />
              <Legend />
              <Bar dataKey="estimated" name="Estimated" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Cost items table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Cost Items ({entries.length})</h3>
        </div>
        <div className="overflow-hidden">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Description</TableHead>
                <TableHead className="font-semibold text-right">Estimated</TableHead>
                <TableHead className="font-semibold text-right">Actual</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Linked To</TableHead>
                <TableHead className="w-24 font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No cost items yet. Click "+ Add Cost Item" to get started.
                  </TableCell>
                </TableRow>
              ) : entries.map((e) => (
                <TableRow key={e.id} className="hover:bg-gray-50/60">
                  <TableCell className="font-medium text-sm">{e.category}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{e.description || "—"}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(e.estimated, summary.currency)}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(e.actual, summary.currency)}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${STATUS_COLORS[e.status]}`}>{e.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.entityLink || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditEntry(e)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteEntry(e.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Totals footer */}
        {entries.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end gap-8 text-sm font-semibold">
            <span>Total Estimated: {formatCurrency(totals.estimated, summary.currency)}</span>
            <span>Total Actual: {formatCurrency(totals.actual, summary.currency)}</span>
            <span className={totals.remaining < 0 ? "text-red-600" : "text-green-600"}>
              Remaining: {formatCurrency(totals.remaining, summary.currency)}
            </span>
          </div>
        )}
      </Card>

      {/* Resource Costs Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-primary" />
            Resource Costs (Man-Hours × Stakeholder Rate)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {resourceCostLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading resource costs...</span>
            </div>
          ) : !resourceCostData || resourceCostData.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No resource costs yet. Assign stakeholder cost rates and task man-hours to see costs here.
            </p>
          ) : (
            <div className="space-y-3">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Stakeholder</TableHead>
                    <TableHead className="text-right">Man-Hours</TableHead>
                    <TableHead className="text-right">Rate ($/hr)</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resourceCostData.entries.map((entry: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm truncate max-w-xs">{entry.taskDescription}</TableCell>
                      <TableCell className="text-sm">{entry.stakeholderName}</TableCell>
                      <TableCell className="text-right text-sm">{Number(entry.manHours).toFixed(1)}</TableCell>
                      <TableCell className="text-right text-sm">${Number(entry.costPerHour).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatCurrency(Number(entry.cost), summary.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end border-t pt-3">
                <span className="font-semibold text-sm">
                  Total Resource Cost: {formatCurrency(Number(resourceCostData.totalCost), summary.currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Budget Dialog */}
      <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Project Budget</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Total Budget Amount</Label>
              <Input
                type="number"
                min={0}
                value={budgetForm.totalBudget}
                onChange={(e) => setBudgetForm((prev) => ({ ...prev, totalBudget: Number(e.target.value) }))}
                placeholder="e.g. 500000"
              />
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <Select value={budgetForm.currency} onValueChange={(v) => setBudgetForm((prev) => ({ ...prev, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(({ code, label }) => (
                    <SelectItem key={code} value={code}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBudgetDialog(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={saveBudget}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Cost Item Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Cost Item" : "Add Cost Item"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Category *</Label>
              <Input
                value={entryForm.category}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="e.g. Personnel, Infrastructure, Licenses"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Description</Label>
              <Input
                value={entryForm.description}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the cost item"
              />
            </div>
            <div className="space-y-1">
              <Label>Estimated ({summary.currency})</Label>
              <Input
                type="number"
                min={0}
                value={entryForm.estimated}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, estimated: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Actual ({summary.currency})</Label>
              <Input
                type="number"
                min={0}
                value={entryForm.actual}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, actual: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={entryForm.status}
                onValueChange={(v) => setEntryForm((prev) => ({ ...prev, status: v as EntryStatus }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["Planned", "Committed", "Spent", "Cancelled"] as EntryStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Linked Entity (optional)</Label>
              <Input
                value={entryForm.entityLink ?? ""}
                onChange={(e) => setEntryForm((prev) => ({ ...prev, entityLink: e.target.value }))}
                placeholder="e.g. TASK-0042, DEL-0001"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntryDialog(false)}>Cancel</Button>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white" onClick={saveEntry}>
              {editingEntry ? "Save Changes" : "Add Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
