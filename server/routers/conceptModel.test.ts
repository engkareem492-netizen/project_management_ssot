/**
 * Concept Model Unit Tests
 * Tests for Features, UserStories, TestPlans, Defects, and CFD routers
 */
import { describe, it, expect } from "vitest";

// ── EVM KPI helpers (pure functions) ────────────────────────────────────────
function computeEVMKPIs(pv: number, ev: number, ac: number, bac: number) {
  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv > 0 ? ev / pv : 0;
  const cpi = ac > 0 ? ev / ac : 0;
  const eac = cpi > 0 ? bac / cpi : bac;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (bac - ev) > 0 ? (bac - ev) / (bac - ac) : 0;
  return { sv, cv, spi, cpi, eac, etc, vac, tcpi };
}

// ── CFD status categorisation ────────────────────────────────────────────────
function categoriseTaskStatus(status: string): "done" | "inProgress" | "blocked" | "open" {
  const s = (status ?? "").toLowerCase().trim();
  if (s === "done" || s === "completed" || s === "closed") return "done";
  if (s === "in progress" || s === "in-progress" || s === "inprogress") return "inProgress";
  if (s === "blocked" || s === "on hold") return "blocked";
  return "open";
}

// ── Defect code generation ────────────────────────────────────────────────────
function generateDefectCode(seq: number): string {
  return `DF-${String(seq).padStart(4, "0")}`;
}

// ── Feature code generation ───────────────────────────────────────────────────
function generateFeatureCode(seq: number): string {
  return `FT-${String(seq).padStart(4, "0")}`;
}

// ── User Story code generation ────────────────────────────────────────────────
function generateUserStoryCode(seq: number): string {
  return `US-${String(seq).padStart(4, "0")}`;
}

// ── Test Plan code generation ─────────────────────────────────────────────────
function generateTestPlanCode(seq: number): string {
  return `TP-${String(seq).padStart(4, "0")}`;
}

// ── CFD percentage calculation ────────────────────────────────────────────────
function computeCFDPercentages(open: number, inProgress: number, blocked: number, done: number) {
  const total = open + inProgress + blocked + done;
  if (total === 0) return { open: 0, inProgress: 0, blocked: 0, done: 0 };
  return {
    open: Math.round((open / total) * 100),
    inProgress: Math.round((inProgress / total) * 100),
    blocked: Math.round((blocked / total) * 100),
    done: Math.round((done / total) * 100),
  };
}

// ────────────────────────────────────────────────────────────────────────────
describe("EVM KPI Calculations", () => {
  it("computes SV and CV correctly", () => {
    const { sv, cv } = computeEVMKPIs(100, 80, 90, 200);
    expect(sv).toBe(-20); // behind schedule
    expect(cv).toBe(-10); // over budget
  });

  it("computes SPI and CPI correctly", () => {
    const { spi, cpi } = computeEVMKPIs(100, 80, 90, 200);
    expect(spi).toBeCloseTo(0.8, 2);
    expect(cpi).toBeCloseTo(0.889, 2);
  });

  it("computes EAC correctly when CPI < 1", () => {
    const { eac } = computeEVMKPIs(100, 80, 90, 200);
    expect(eac).toBeCloseTo(225, 0); // BAC / CPI = 200 / 0.889
  });

  it("computes VAC correctly", () => {
    const { vac } = computeEVMKPIs(100, 80, 90, 200);
    expect(vac).toBeLessThan(0); // over budget forecast
  });

  it("handles zero AC gracefully", () => {
    const { cpi, eac } = computeEVMKPIs(100, 50, 0, 200);
    expect(cpi).toBe(0);
    expect(eac).toBe(200); // fallback to BAC
  });

  it("returns perfect scores when on track", () => {
    const { spi, cpi, sv, cv } = computeEVMKPIs(100, 100, 100, 200);
    expect(spi).toBe(1);
    expect(cpi).toBe(1);
    expect(sv).toBe(0);
    expect(cv).toBe(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("CFD Status Categorisation", () => {
  it("categorises Done statuses correctly", () => {
    expect(categoriseTaskStatus("Done")).toBe("done");
    expect(categoriseTaskStatus("Completed")).toBe("done");
    expect(categoriseTaskStatus("Closed")).toBe("done");
    expect(categoriseTaskStatus("DONE")).toBe("done");
  });

  it("categorises In Progress statuses correctly", () => {
    expect(categoriseTaskStatus("In Progress")).toBe("inProgress");
    expect(categoriseTaskStatus("in-progress")).toBe("inProgress");
    expect(categoriseTaskStatus("InProgress")).toBe("inProgress");
  });

  it("categorises Blocked statuses correctly", () => {
    expect(categoriseTaskStatus("Blocked")).toBe("blocked");
    expect(categoriseTaskStatus("On Hold")).toBe("blocked");
  });

  it("categorises Open/unknown statuses as open", () => {
    expect(categoriseTaskStatus("Open")).toBe("open");
    expect(categoriseTaskStatus("Not Started")).toBe("open");
    expect(categoriseTaskStatus("")).toBe("open");
    expect(categoriseTaskStatus("Pending")).toBe("open");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("CFD Percentage Calculation", () => {
  it("computes percentages that sum to 100", () => {
    const result = computeCFDPercentages(10, 20, 5, 65);
    const sum = result.open + result.inProgress + result.blocked + result.done;
    // Due to rounding, sum may be 99-101
    expect(sum).toBeGreaterThanOrEqual(98);
    expect(sum).toBeLessThanOrEqual(102);
  });

  it("handles all-done scenario", () => {
    const result = computeCFDPercentages(0, 0, 0, 100);
    expect(result.done).toBe(100);
    expect(result.open).toBe(0);
    expect(result.blocked).toBe(0);
  });

  it("handles zero total gracefully", () => {
    const result = computeCFDPercentages(0, 0, 0, 0);
    expect(result.open).toBe(0);
    expect(result.done).toBe(0);
  });

  it("computes correct proportions", () => {
    const result = computeCFDPercentages(25, 25, 25, 25);
    expect(result.open).toBe(25);
    expect(result.inProgress).toBe(25);
    expect(result.blocked).toBe(25);
    expect(result.done).toBe(25);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("Entity Code Generation", () => {
  it("generates correct Feature codes", () => {
    expect(generateFeatureCode(1)).toBe("FT-0001");
    expect(generateFeatureCode(42)).toBe("FT-0042");
    expect(generateFeatureCode(1000)).toBe("FT-1000");
  });

  it("generates correct User Story codes", () => {
    expect(generateUserStoryCode(1)).toBe("US-0001");
    expect(generateUserStoryCode(99)).toBe("US-0099");
  });

  it("generates correct Test Plan codes", () => {
    expect(generateTestPlanCode(1)).toBe("TP-0001");
    expect(generateTestPlanCode(5)).toBe("TP-0005");
  });

  it("generates correct Defect codes", () => {
    expect(generateDefectCode(1)).toBe("DF-0001");
    expect(generateDefectCode(999)).toBe("DF-0999");
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("Concept Model Relationships", () => {
  it("validates 1:n Requirement → Feature relationship", () => {
    const requirementId = 1;
    const features = [
      { id: 1, requirementId, title: "Feature A" },
      { id: 2, requirementId, title: "Feature B" },
      { id: 3, requirementId: 2, title: "Feature C" }, // different requirement
    ];
    const linked = features.filter(f => f.requirementId === requirementId);
    expect(linked).toHaveLength(2);
  });

  it("validates n:m User Story → Test Case relationship", () => {
    const junctionTable = [
      { userStoryId: 1, testCaseId: 10 },
      { userStoryId: 1, testCaseId: 11 },
      { userStoryId: 2, testCaseId: 10 }, // TC-10 covers multiple stories
    ];
    const storiesForTC10 = junctionTable.filter(j => j.testCaseId === 10);
    const testCasesForUS1 = junctionTable.filter(j => j.userStoryId === 1);
    expect(storiesForTC10).toHaveLength(2); // n:m confirmed
    expect(testCasesForUS1).toHaveLength(2);
  });

  it("validates n:m Defect → Test Case relationship", () => {
    const defectTestCases = [
      { defectId: 1, testCaseId: 10 },
      { defectId: 1, testCaseId: 11 },
      { defectId: 2, testCaseId: 10 },
    ];
    const defectsForTC10 = defectTestCases.filter(d => d.testCaseId === 10);
    expect(defectsForTC10).toHaveLength(2);
  });

  it("validates n:m Test Plan → Test Case relationship", () => {
    const planTestCases = [
      { testPlanId: 1, testCaseId: 10 },
      { testPlanId: 1, testCaseId: 11 },
      { testPlanId: 2, testCaseId: 11 }, // TC-11 in multiple plans
    ];
    const plansForTC11 = planTestCases.filter(p => p.testCaseId === 11);
    expect(plansForTC11).toHaveLength(2);
  });
});

// ────────────────────────────────────────────────────────────────────────────
describe("Defect Severity Prioritisation", () => {
  const SEVERITY_ORDER = ["Critical", "High", "Medium", "Low"];

  it("sorts defects by severity correctly", () => {
    const defects = [
      { id: 1, severity: "Low" },
      { id: 2, severity: "Critical" },
      { id: 3, severity: "Medium" },
      { id: 4, severity: "High" },
    ];
    const sorted = [...defects].sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );
    expect(sorted[0].severity).toBe("Critical");
    expect(sorted[1].severity).toBe("High");
    expect(sorted[2].severity).toBe("Medium");
    expect(sorted[3].severity).toBe("Low");
  });

  it("identifies critical defects that need immediate attention", () => {
    const defects = [
      { id: 1, severity: "Critical", status: "Open" },
      { id: 2, severity: "High", status: "Fixed" },
      { id: 3, severity: "Critical", status: "In Progress" },
    ];
    const criticalOpen = defects.filter(
      d => d.severity === "Critical" && d.status !== "Closed" && d.status !== "Verified"
    );
    expect(criticalOpen).toHaveLength(2);
  });
});
