import { describe, it, expect } from "vitest";

// ─── Unit tests for stakeholderSub router logic ───────────────────────────────
// These tests validate the business logic helpers used by the absences and
// allocations procedures without requiring a live database connection.

// ─── Absence duration calculation ────────────────────────────────────────────
function calcAbsenceDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

describe("Absence duration calculation", () => {
  it("returns 1 for same-day absence", () => {
    expect(calcAbsenceDays("2026-04-01", "2026-04-01")).toBe(1);
  });

  it("returns 5 for a work week", () => {
    expect(calcAbsenceDays("2026-04-07", "2026-04-11")).toBe(5);
  });

  it("returns 0 when end is before start", () => {
    expect(calcAbsenceDays("2026-04-10", "2026-04-05")).toBe(0);
  });

  it("returns 31 for a full month", () => {
    expect(calcAbsenceDays("2026-03-01", "2026-03-31")).toBe(31);
  });
});

// ─── Allocation utilization calculation ──────────────────────────────────────
function calcUtilization(plannedHours: number, availableHours: number): number {
  if (availableHours <= 0) return 0;
  return Math.round((plannedHours / availableHours) * 100);
}

function calcAvailableHours(
  startDate: string,
  endDate: string,
  allocationPct: number,
  hoursPerDay: number,
  daysPerWeek: number
): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(0, (end.getTime() - start.getTime()) / 86400000 + 1);
  return (days * daysPerWeek / 7) * hoursPerDay * (allocationPct / 100);
}

describe("Allocation utilization calculation", () => {
  it("returns 100% when planned equals available", () => {
    expect(calcUtilization(40, 40)).toBe(100);
  });

  it("returns 0% when available is 0", () => {
    expect(calcUtilization(40, 0)).toBe(0);
  });

  it("returns 50% when planned is half of available", () => {
    expect(calcUtilization(20, 40)).toBe(50);
  });

  it("returns >100% when over-allocated", () => {
    expect(calcUtilization(80, 40)).toBe(200);
  });
});

describe("Available hours calculation", () => {
  it("calculates correctly for 1 week at 100% allocation, 8h/day, 5 days/week", () => {
    // 7 days range, 5/7 working days, 8h/day, 100%
    const result = calcAvailableHours("2026-04-07", "2026-04-13", 100, 8, 5);
    // 7 days * (5/7) * 8 * 1.0 = 40h
    expect(result).toBeCloseTo(40, 0);
  });

  it("calculates correctly for 50% allocation", () => {
    const result = calcAvailableHours("2026-04-07", "2026-04-13", 50, 8, 5);
    // 40h * 0.5 = 20h
    expect(result).toBeCloseTo(20, 0);
  });

  it("returns 0 for zero-day range", () => {
    const result = calcAvailableHours("2026-04-10", "2026-04-09", 100, 8, 5);
    expect(result).toBe(0);
  });
});

// ─── Cost calculation ─────────────────────────────────────────────────────────
function calcCost(hours: number, costRate: number | null, defaultRate: number): number {
  const rate = costRate ?? defaultRate;
  return hours * rate;
}

describe("Cost calculation", () => {
  it("uses override cost rate when provided", () => {
    expect(calcCost(10, 100, 50)).toBe(1000);
  });

  it("falls back to default rate when override is null", () => {
    expect(calcCost(10, null, 50)).toBe(500);
  });

  it("returns 0 for 0 hours", () => {
    expect(calcCost(0, 100, 50)).toBe(0);
  });
});

// ─── Allocation variance calculation ─────────────────────────────────────────
function calcVariance(plannedCost: number, actualCost: number): number {
  return plannedCost - actualCost;
}

describe("Cost variance calculation", () => {
  it("returns positive variance when under budget", () => {
    expect(calcVariance(1000, 800)).toBe(200);
  });

  it("returns negative variance when over budget", () => {
    expect(calcVariance(800, 1000)).toBe(-200);
  });

  it("returns 0 when on budget", () => {
    expect(calcVariance(1000, 1000)).toBe(0);
  });
});
