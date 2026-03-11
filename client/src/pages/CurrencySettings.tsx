import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useProject } from "@/contexts/ProjectContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  RefreshCw,
  Info,
} from "lucide-react";
import { toast } from "sonner";

// Common world currencies for quick-add
const COMMON_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "KD" },
  { code: "QAR", name: "Qatari Riyal", symbol: "QR" },
  { code: "BHD", name: "Bahraini Dinar", symbol: "BD" },
  { code: "OMR", name: "Omani Rial", symbol: "OMR" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CHF", name: "Swiss Franc", symbol: "Fr" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
];

const EMPTY_CURRENCY_FORM = { currencyCode: "", currencyName: "", symbol: "", isBase: false };
const EMPTY_RATE_FORM = {
  fromCurrencyCode: "",
  toCurrencyCode: "",
  baselineRate: "1",
  currentRate: "1",
  predictedRate: "1",
  effectiveDate: "",
  notes: "",
};

function rateVariance(baseline: string, current: string) {
  const b = parseFloat(baseline);
  const c = parseFloat(current);
  if (!b || !c) return null;
  const pct = ((c - b) / b) * 100;
  return pct;
}

export default function CurrencySettings() {
  const { currentProjectId } = useProject();
  const projectId = currentProjectId ?? 0;

  const { data: currencies = [], refetch: refetchCurrencies } = trpc.currencies.list.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );
  const { data: rates = [], refetch: refetchRates } = trpc.currencies.ratesList.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const addCurrency = trpc.currencies.add.useMutation({
    onSuccess: () => { refetchCurrencies(); toast.success("Currency added"); setCurrencyDialogOpen(false); setCurrencyForm(EMPTY_CURRENCY_FORM); },
    onError: (e) => toast.error(e.message),
  });
  const updateCurrency = trpc.currencies.update.useMutation({
    onSuccess: () => { refetchCurrencies(); toast.success("Currency updated"); setCurrencyDialogOpen(false); setEditingCurrencyId(null); setCurrencyForm(EMPTY_CURRENCY_FORM); },
    onError: (e) => toast.error(e.message),
  });
  const removeCurrency = trpc.currencies.remove.useMutation({
    onSuccess: () => { refetchCurrencies(); refetchRates(); toast.success("Currency removed"); setDeleteCurrencyId(null); },
    onError: (e) => toast.error(e.message),
  });
  const upsertRate = trpc.currencies.upsertRate.useMutation({
    onSuccess: () => { refetchRates(); toast.success("Exchange rate saved"); setRateDialogOpen(false); setRateForm(EMPTY_RATE_FORM); setEditingRateId(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRate = trpc.currencies.deleteRate.useMutation({
    onSuccess: () => { refetchRates(); toast.success("Exchange rate deleted"); setDeleteRateId(null); },
    onError: (e) => toast.error(e.message),
  });

  const [currencyDialogOpen, setCurrencyDialogOpen] = useState(false);
  const [editingCurrencyId, setEditingCurrencyId] = useState<number | null>(null);
  const [currencyForm, setCurrencyForm] = useState(EMPTY_CURRENCY_FORM);
  const [deleteCurrencyId, setDeleteCurrencyId] = useState<number | null>(null);

  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [editingRateId, setEditingRateId] = useState<number | null>(null);
  const [rateForm, setRateForm] = useState(EMPTY_RATE_FORM);
  const [deleteRateId, setDeleteRateId] = useState<number | null>(null);

  const baseCurrency = currencies.find((c) => c.isBase);
  const nonBaseCurrencies = currencies.filter((c) => !c.isBase);

  const openAddCurrency = (preset?: typeof COMMON_CURRENCIES[0]) => {
    setEditingCurrencyId(null);
    setCurrencyForm(preset
      ? { currencyCode: preset.code, currencyName: preset.name, symbol: preset.symbol, isBase: false }
      : EMPTY_CURRENCY_FORM
    );
    setCurrencyDialogOpen(true);
  };

  const openEditCurrency = (c: typeof currencies[0]) => {
    setEditingCurrencyId(c.id);
    setCurrencyForm({ currencyCode: c.currencyCode, currencyName: c.currencyName, symbol: c.symbol, isBase: c.isBase ?? false });
    setCurrencyDialogOpen(true);
  };

  const handleCurrencySubmit = () => {
    if (!currencyForm.currencyCode.trim() || !currencyForm.currencyName.trim()) {
      toast.error("Currency code and name are required");
      return;
    }
    if (editingCurrencyId) {
      updateCurrency.mutate({ id: editingCurrencyId, projectId, ...currencyForm });
    } else {
      addCurrency.mutate({ projectId, ...currencyForm });
    }
  };

  const openAddRate = (fromCode?: string, toCode?: string) => {
    setEditingRateId(null);
    setRateForm({ ...EMPTY_RATE_FORM, fromCurrencyCode: fromCode ?? "", toCurrencyCode: toCode ?? "" });
    setRateDialogOpen(true);
  };

  const openEditRate = (r: typeof rates[0]) => {
    setEditingRateId(r.id);
    setRateForm({
      fromCurrencyCode: r.fromCurrencyCode,
      toCurrencyCode: r.toCurrencyCode,
      baselineRate: r.baselineRate?.toString() ?? "1",
      currentRate: r.currentRate?.toString() ?? "1",
      predictedRate: r.predictedRate?.toString() ?? "1",
      effectiveDate: r.effectiveDate ?? "",
      notes: r.notes ?? "",
    });
    setRateDialogOpen(true);
  };

  const handleRateSubmit = () => {
    if (!rateForm.fromCurrencyCode || !rateForm.toCurrencyCode) {
      toast.error("Both currency codes are required");
      return;
    }
    upsertRate.mutate({ projectId, ...rateForm });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Project Currency Settings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define the main (base) currency, additional currencies, and track Baseline / Current / Predicted exchange rates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-green-700 border-green-300">
            {currencies.length} Currenc{currencies.length !== 1 ? "ies" : "y"}
          </Badge>
          <Button size="sm" onClick={() => openAddCurrency()}>
            <Plus className="h-4 w-4 mr-1" /> Add Currency
          </Button>
        </div>
      </div>

      {/* Base Currency Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-2 ${baseCurrency ? "border-green-400 bg-green-50/30" : "border-dashed border-gray-300"}`}>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" /> Base Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {baseCurrency ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{baseCurrency.symbol} {baseCurrency.currencyCode}</div>
                  <div className="text-sm text-gray-500">{baseCurrency.currencyName}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-700" onClick={() => openEditCurrency(baseCurrency)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="text-sm text-gray-400 italic">
                No base currency set. Add a currency and mark it as base.
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border border-gray-200 md:col-span-2">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-gray-600">Additional Currencies</CardTitle>
            <CardDescription className="text-xs">
              {nonBaseCurrencies.length === 0 ? "No additional currencies added yet" : `${nonBaseCurrencies.length} additional currenc${nonBaseCurrencies.length !== 1 ? "ies" : "y"}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="flex flex-wrap gap-2">
              {nonBaseCurrencies.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-gray-100 rounded-md px-3 py-1.5 text-sm">
                  <span className="font-semibold text-gray-700">{c.symbol} {c.currencyCode}</span>
                  <span className="text-gray-500 text-xs">{c.currencyName}</span>
                  <button className="ml-1 text-gray-400 hover:text-gray-700" onClick={() => openEditCurrency(c)}>
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button className="text-gray-300 hover:text-red-500" onClick={() => setDeleteCurrencyId(c.id)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {nonBaseCurrencies.length === 0 && (
                <span className="text-xs text-gray-400 italic">None added</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick-add common currencies */}
      {currencies.length < 3 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1.5">
            <Info className="h-4 w-4" /> Quick-add common currencies
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_CURRENCIES.filter(
              (c) => !currencies.find((existing) => existing.currencyCode === c.code)
            ).slice(0, 8).map((c) => (
              <button
                key={c.code}
                onClick={() => openAddCurrency(c)}
                className="text-xs bg-white border border-blue-200 rounded px-2.5 py-1 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exchange Rates Table */}
      <Card className="border border-gray-200">
        <CardHeader className="px-5 pt-5 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" /> Exchange Rates
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Track Baseline (locked at project start), Current (live), and Predicted (forecast) rates
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => openAddRate(baseCurrency?.currencyCode)}>
            <Plus className="h-4 w-4 mr-1" /> Add Rate
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="font-medium text-gray-700 text-sm">No exchange rates defined</p>
              <p className="text-xs mt-1 text-gray-400">
                Add currencies above, then define the exchange rates between them.
              </p>
              {currencies.length >= 2 && (
                <Button size="sm" className="mt-3" variant="outline" onClick={() => openAddRate(baseCurrency?.currencyCode)}>
                  <Plus className="h-4 w-4 mr-1" /> Add First Rate
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">
                    <span className="inline-flex items-center gap-1">Baseline Rate</span>
                  </TableHead>
                  <TableHead className="text-right">Current Rate</TableHead>
                  <TableHead className="text-right">Predicted Rate</TableHead>
                  <TableHead className="text-center">Variance</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rates.map((r) => {
                  const variance = rateVariance(r.baselineRate?.toString() ?? "1", r.currentRate?.toString() ?? "1");
                  const predictedVariance = rateVariance(r.baselineRate?.toString() ?? "1", r.predictedRate?.toString() ?? "1");
                  return (
                    <TableRow key={r.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <span className="font-semibold text-gray-900">{r.fromCurrencyCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">{r.toCurrencyCode}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {parseFloat(r.baselineRate?.toString() ?? "1").toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                          {parseFloat(r.currentRate?.toString() ?? "1").toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                          {parseFloat(r.predictedRate?.toString() ?? "1").toFixed(4)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          {variance !== null && (
                            <div className={`flex items-center gap-1 text-xs font-medium ${variance > 0 ? "text-green-600" : variance < 0 ? "text-red-600" : "text-gray-400"}`}>
                              {variance > 0 ? <TrendingUp className="h-3 w-3" /> : variance < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {variance > 0 ? "+" : ""}{variance.toFixed(2)}%
                              <span className="text-gray-400 font-normal">curr</span>
                            </div>
                          )}
                          {predictedVariance !== null && (
                            <div className={`flex items-center gap-1 text-xs ${predictedVariance > 0 ? "text-purple-600" : predictedVariance < 0 ? "text-orange-600" : "text-gray-400"}`}>
                              {predictedVariance > 0 ? <TrendingUp className="h-3 w-3" /> : predictedVariance < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                              {predictedVariance > 0 ? "+" : ""}{predictedVariance.toFixed(2)}%
                              <span className="text-gray-400">pred</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{r.effectiveDate || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-gray-900" onClick={() => openEditRate(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-red-600" onClick={() => setDeleteRateId(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Currency Add/Edit Dialog */}
      <Dialog open={currencyDialogOpen} onOpenChange={(o) => { setCurrencyDialogOpen(o); if (!o) { setEditingCurrencyId(null); setCurrencyForm(EMPTY_CURRENCY_FORM); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCurrencyId ? "Edit Currency" : "Add Currency"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Currency Code <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. USD"
                  value={currencyForm.currencyCode}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, currencyCode: e.target.value.toUpperCase() })}
                  maxLength={10}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g. $"
                  value={currencyForm.symbol}
                  onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
                  maxLength={10}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Currency Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. US Dollar"
                value={currencyForm.currencyName}
                onChange={(e) => setCurrencyForm({ ...currencyForm, currencyName: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <input
                type="checkbox"
                id="isBase"
                checked={currencyForm.isBase}
                onChange={(e) => setCurrencyForm({ ...currencyForm, isBase: e.target.checked })}
                className="h-4 w-4 accent-yellow-500"
              />
              <label htmlFor="isBase" className="text-sm text-yellow-800 cursor-pointer">
                <Star className="h-3.5 w-3.5 inline mr-1 fill-yellow-400 text-yellow-500" />
                Set as <strong>Base Currency</strong> (all budgets and costs will be expressed in this currency)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCurrencyDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCurrencySubmit} disabled={addCurrency.isPending || updateCurrency.isPending}>
              {editingCurrencyId ? "Save Changes" : "Add Currency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange Rate Add/Edit Dialog */}
      <Dialog open={rateDialogOpen} onOpenChange={(o) => { setRateDialogOpen(o); if (!o) { setEditingRateId(null); setRateForm(EMPTY_RATE_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRateId ? "Edit Exchange Rate" : "Add Exchange Rate"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>From Currency <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. USD"
                  value={rateForm.fromCurrencyCode}
                  onChange={(e) => setRateForm({ ...rateForm, fromCurrencyCode: e.target.value.toUpperCase() })}
                  list="currency-codes"
                  maxLength={10}
                />
              </div>
              <div className="space-y-1.5">
                <Label>To Currency <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. SAR"
                  value={rateForm.toCurrencyCode}
                  onChange={(e) => setRateForm({ ...rateForm, toCurrencyCode: e.target.value.toUpperCase() })}
                  list="currency-codes"
                  maxLength={10}
                />
              </div>
            </div>
            <datalist id="currency-codes">
              {currencies.map((c) => <option key={c.id} value={c.currencyCode}>{c.currencyName}</option>)}
            </datalist>

            {/* Three rate columns */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600 uppercase tracking-wide">
                  Baseline Rate
                </Label>
                <div className="text-xs text-gray-400 mb-1">Locked at project start</div>
                <Input
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="1.000000"
                  value={rateForm.baselineRate}
                  onChange={(e) => setRateForm({ ...rateForm, baselineRate: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-blue-600 uppercase tracking-wide">
                  Current Rate
                </Label>
                <div className="text-xs text-gray-400 mb-1">Live / today's rate</div>
                <Input
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="1.000000"
                  value={rateForm.currentRate}
                  onChange={(e) => setRateForm({ ...rateForm, currentRate: e.target.value })}
                  className="font-mono border-blue-300 focus:border-blue-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-purple-600 uppercase tracking-wide">
                  Predicted Rate
                </Label>
                <div className="text-xs text-gray-400 mb-1">Forecast / end-of-project</div>
                <Input
                  type="number"
                  step="0.000001"
                  min="0"
                  placeholder="1.000000"
                  value={rateForm.predictedRate}
                  onChange={(e) => setRateForm({ ...rateForm, predictedRate: e.target.value })}
                  className="font-mono border-purple-300 focus:border-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Effective Date</Label>
                <Input
                  type="date"
                  value={rateForm.effectiveDate}
                  onChange={(e) => setRateForm({ ...rateForm, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Input
                  placeholder="Optional notes..."
                  value={rateForm.notes}
                  onChange={(e) => setRateForm({ ...rateForm, notes: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRateSubmit} disabled={upsertRate.isPending}>
              {editingRateId ? "Save Changes" : "Add Rate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Currency Confirmation */}
      <AlertDialog open={deleteCurrencyId !== null} onOpenChange={(o) => !o && setDeleteCurrencyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Currency</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the currency from the project. Any exchange rates referencing it will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteCurrencyId && removeCurrency.mutate({ id: deleteCurrencyId, projectId })}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Rate Confirmation */}
      <AlertDialog open={deleteRateId !== null} onOpenChange={(o) => !o && setDeleteRateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exchange Rate</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exchange rate record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteRateId && deleteRate.mutate({ id: deleteRateId, projectId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
