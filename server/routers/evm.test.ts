/**
 * EVM KPI Calculation Unit Tests
 * Tests the core Earned Value Management formulas used in evm.router.ts
 */

import { describe, it, expect } from "vitest";

// ─── Replicate the helper from evm.router.ts ─────────────────────────────────

function toNum(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "string" ? parseFloat(val) : val;
  return isNaN(n) ? 0 : n;
}

function calcEvm(pv: number, ev: number, ac: number, bac: number) {
  const sv = ev - pv;
  const cv = ev - ac;
  const spi = pv === 0 ? 0 : ev / pv;
  const cpi = ac === 0 ? 0 : ev / ac;
  const eac = cpi === 0 ? bac : bac / cpi;
  const etc = eac - ac;
  const vac = bac - eac;
  const tcpi = (bac - ev) === 0 ? 0 : (bac - ev) / (bac - ac);
  const svPct = bac === 0 ? 0 : (sv / bac) * 100;
  const cvPct = bac === 0 ? 0 : (cv / bac) * 100;
  const percentComplete = bac === 0 ? 0 : (ev / bac) * 100;
  return { sv, cv, spi, cpi, eac, etc, vac, tcpi, svPct, cvPct, percentComplete };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("toNum helper", () => {
  it("converts string to number", () => {
    expect(toNum("1234.56")).toBe(1234.56);
  });
  it("returns 0 for null", () => {
    expect(toNum(null)).toBe(0);
  });
  it("returns 0 for undefined", () => {
    expect(toNum(undefined)).toBe(0);
  });
  it("returns 0 for NaN string", () => {
    expect(toNum("abc")).toBe(0);
  });
  it("passes through number", () => {
    expect(toNum(42)).toBe(42);
  });
});

describe("calcEvm – on-schedule, on-budget scenario", () => {
  // PV = EV = AC = 500, BAC = 1000 → perfect performance
  const result = calcEvm(500, 500, 500, 1000);

  it("SV = 0 when on schedule", () => {
    expect(result.sv).toBe(0);
  });
  it("CV = 0 when on budget", () => {
    expect(result.cv).toBe(0);
  });
  it("SPI = 1.0 when on schedule", () => {
    expect(result.spi).toBe(1.0);
  });
  it("CPI = 1.0 when on budget", () => {
    expect(result.cpi).toBe(1.0);
  });
  it("EAC = BAC when CPI = 1", () => {
    expect(result.eac).toBe(1000);
  });
  it("VAC = 0 when EAC = BAC", () => {
    expect(result.vac).toBe(0);
  });
  it("% complete = 50 when EV = BAC/2", () => {
    expect(result.percentComplete).toBe(50);
  });
});

describe("calcEvm – behind schedule, over budget scenario", () => {
  // PV=600, EV=400, AC=500, BAC=1000
  const result = calcEvm(600, 400, 500, 1000);

  it("SV is negative (behind schedule)", () => {
    expect(result.sv).toBe(-200);
  });
  it("CV is negative (over budget)", () => {
    expect(result.cv).toBe(-100);
  });
  it("SPI < 1 (behind schedule)", () => {
    expect(result.spi).toBeCloseTo(0.6667, 3);
  });
  it("CPI < 1 (over budget)", () => {
    expect(result.cpi).toBeCloseTo(0.8, 3);
  });
  it("EAC > BAC (projected overrun)", () => {
    expect(result.eac).toBe(1250);
  });
  it("VAC < 0 (projected overrun)", () => {
    expect(result.vac).toBe(-250);
  });
  it("TCPI > 1 (harder to achieve)", () => {
    // (1000-400)/(1000-500) = 600/500 = 1.2
    expect(result.tcpi).toBeCloseTo(1.2, 3);
  });
});

describe("calcEvm – ahead of schedule, under budget scenario", () => {
  // PV=400, EV=600, AC=500, BAC=1000
  const result = calcEvm(400, 600, 500, 1000);

  it("SV is positive (ahead of schedule)", () => {
    expect(result.sv).toBe(200);
  });
  it("CV is positive (under budget)", () => {
    expect(result.cv).toBe(100);
  });
  it("SPI > 1 (ahead of schedule)", () => {
    expect(result.spi).toBeCloseTo(1.5, 3);
  });
  it("CPI > 1 (under budget)", () => {
    expect(result.cpi).toBeCloseTo(1.2, 3);
  });
  it("EAC < BAC (projected underrun)", () => {
    expect(result.eac).toBeCloseTo(833.33, 1);
  });
  it("VAC > 0 (projected savings)", () => {
    expect(result.vac).toBeCloseTo(166.67, 1);
  });
});

describe("calcEvm – edge cases", () => {
  it("handles zero PV (SPI = 0)", () => {
    const r = calcEvm(0, 100, 100, 1000);
    expect(r.spi).toBe(0);
  });
  it("handles zero AC (CPI = 0 → EAC = BAC)", () => {
    const r = calcEvm(100, 100, 0, 1000);
    expect(r.cpi).toBe(0);
    expect(r.eac).toBe(1000);
  });
  it("handles zero BAC (percentComplete = 0)", () => {
    const r = calcEvm(0, 0, 0, 0);
    expect(r.percentComplete).toBe(0);
    expect(r.svPct).toBe(0);
    expect(r.cvPct).toBe(0);
  });
  it("handles complete project (EV = BAC)", () => {
    const r = calcEvm(1000, 1000, 950, 1000);
    expect(r.percentComplete).toBe(100);
    expect(r.sv).toBe(0);
    expect(r.cv).toBe(50);
  });
  it("TCPI = 0 when BAC = EV (project complete)", () => {
    const r = calcEvm(1000, 1000, 900, 1000);
    expect(r.tcpi).toBe(0);
  });
});

describe("calcEvm – svPct and cvPct", () => {
  it("svPct is negative when behind schedule", () => {
    const r = calcEvm(600, 400, 500, 1000);
    expect(r.svPct).toBe(-20); // (400-600)/1000 * 100
  });
  it("cvPct is negative when over budget", () => {
    const r = calcEvm(600, 400, 500, 1000);
    expect(r.cvPct).toBe(-10); // (400-500)/1000 * 100
  });
});
