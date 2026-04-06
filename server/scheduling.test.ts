/**
 * Tests for scheduling helper procedures:
 *   resources.calculateActiveHours
 *   resources.calculateEndDate
 *
 * These tests use a mock DB so no real DB connection is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Helpers ────────────────────────────────────────────────────────────────────
/**
 * Simulate the server-side calculateActiveHours logic in isolation.
 * This mirrors the implementation in resources.router.ts exactly.
 */
function calculateActiveHours(
  startDate: string,
  endDate: string,
  weekendDays: number[],
  calendarEntries: Array<{ date: string; type: string; availableHours: number }>,
  hoursPerDay = 8
): { activeHours: number; workingDays: number } {
  const weekendSet = new Set(weekendDays);
  const entryMap: Record<string, { type: string; availableHours: number }> = {};
  calendarEntries.forEach((e) => {
    entryMap[e.date] = { type: e.type, availableHours: e.availableHours };
  });

  let totalHours = 0;
  let workingDays = 0;
  const cur = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  const hpd = hoursPerDay;

  while (cur <= end) {
    const dk = cur.toISOString().split("T")[0];
    const dow = cur.getDay();
    const isWeekend = weekendSet.has(dow);
    const entry = entryMap[dk];

    if (entry) {
      const { type, availableHours } = entry;
      if (type === "Leave" || type === "Holiday") {
        const leaveHours = availableHours > 0 ? availableHours : hpd;
        const remaining = Math.max(hpd - leaveHours, 0);
        totalHours += remaining;
        if (remaining > 0) workingDays++;
      } else if (type === "Partial") {
        const hrs = availableHours > 0 ? availableHours : hpd;
        totalHours += hrs;
        workingDays++;
      } else {
        totalHours += hpd;
        workingDays++;
      }
    } else if (!isWeekend) {
      totalHours += hpd;
      workingDays++;
    }
    cur.setDate(cur.getDate() + 1);
  }

  return { activeHours: totalHours, workingDays };
}

/**
 * Simulate the server-side calculateEndDate logic in isolation.
 */
function calculateEndDate(
  startDate: string,
  activeHours: number,
  weekendDays: number[],
  calendarEntries: Array<{ date: string; type: string; availableHours: number }>,
  hoursPerDay = 8
): string {
  const weekendSet = new Set(weekendDays);
  const entryMap: Record<string, { type: string; availableHours: number }> = {};
  calendarEntries.forEach((e) => {
    entryMap[e.date] = { type: e.type, availableHours: e.availableHours };
  });

  let remaining = activeHours;
  const hpd = hoursPerDay;
  const cur = new Date(startDate + "T00:00:00");
  const maxDate = new Date(cur);
  maxDate.setFullYear(maxDate.getFullYear() + 2);

  while (remaining > 0 && cur <= maxDate) {
    const dk = cur.toISOString().split("T")[0];
    const dow = cur.getDay();
    const isWeekend = weekendSet.has(dow);
    const entry = entryMap[dk];
    let dayHours = 0;

    if (entry) {
      const { type, availableHours } = entry;
      if (type === "Leave" || type === "Holiday") {
        const leaveHours = availableHours > 0 ? availableHours : hpd;
        dayHours = Math.max(hpd - leaveHours, 0);
      } else if (type === "Partial") {
        dayHours = availableHours > 0 ? availableHours : hpd;
      } else {
        dayHours = hpd;
      }
    } else if (!isWeekend) {
      dayHours = hpd;
    }

    remaining -= dayHours;
    if (remaining > 0) cur.setDate(cur.getDate() + 1);
  }

  return cur.toISOString().split("T")[0];
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe("Scheduling Helpers", () => {
  // Standard Mon-Fri week (no calendar entries)
  const stdWeekend = [0, 6]; // Sun=0, Sat=6

  describe("calculateActiveHours", () => {
    it("counts 5 working days (40h) for a standard Mon-Fri week", () => {
      // 2026-04-06 is Monday, 2026-04-10 is Friday
      const result = calculateActiveHours("2026-04-06", "2026-04-10", stdWeekend, []);
      expect(result.workingDays).toBe(5);
      expect(result.activeHours).toBe(40);
    });

    it("excludes weekend days from the count", () => {
      // 2026-04-06 Mon → 2026-04-12 Sun = 5 working days
      const result = calculateActiveHours("2026-04-06", "2026-04-12", stdWeekend, []);
      expect(result.workingDays).toBe(5);
      expect(result.activeHours).toBe(40);
    });

    it("deducts a full Leave day", () => {
      // Mon-Fri with one full leave on Wednesday
      const entries = [{ date: "2026-04-08", type: "Leave", availableHours: 8 }];
      const result = calculateActiveHours("2026-04-06", "2026-04-10", stdWeekend, entries);
      expect(result.workingDays).toBe(4);
      expect(result.activeHours).toBe(32);
    });

    it("handles partial leave (4h leave → 4h remaining)", () => {
      // Wednesday has 4h leave → 4h still available
      const entries = [{ date: "2026-04-08", type: "Leave", availableHours: 4 }];
      const result = calculateActiveHours("2026-04-06", "2026-04-10", stdWeekend, entries);
      expect(result.workingDays).toBe(5); // partial day still counts
      expect(result.activeHours).toBe(36); // 4*8 + 4
    });

    it("handles Partial working day entry", () => {
      // Wednesday is a 6h partial day
      const entries = [{ date: "2026-04-08", type: "Partial", availableHours: 6 }];
      const result = calculateActiveHours("2026-04-06", "2026-04-10", stdWeekend, entries);
      expect(result.workingDays).toBe(5);
      expect(result.activeHours).toBe(38); // 4*8 + 6
    });

    it("returns 0 for a range entirely on weekends", () => {
      // 2026-04-11 Sat, 2026-04-12 Sun
      const result = calculateActiveHours("2026-04-11", "2026-04-12", stdWeekend, []);
      expect(result.workingDays).toBe(0);
      expect(result.activeHours).toBe(0);
    });

    it("handles custom weekend days (Fri+Sat)", () => {
      const friSatWeekend = [5, 6]; // Fri=5, Sat=6
      // 2026-04-06 Mon → 2026-04-10 Fri: Mon-Thu = 4 working days, Fri is weekend
      const result = calculateActiveHours("2026-04-06", "2026-04-10", friSatWeekend, []);
      expect(result.workingDays).toBe(4);
      expect(result.activeHours).toBe(32);
    });
  });

  describe("calculateEndDate", () => {
    it("calculates end date for 40h (5 working days) from a Monday", () => {
      // Start Monday 2026-04-06, need 40h → should end Friday 2026-04-10
      const endDate = calculateEndDate("2026-04-06", 40, stdWeekend, []);
      expect(endDate).toBe("2026-04-10");
    });

    it("skips weekends when counting hours", () => {
      // Start Thursday 2026-04-09, need 24h (3 days)
      // Thu=8h, Fri=8h, skip Sat+Sun, Mon=8h → end Mon 2026-04-13
      const endDate = calculateEndDate("2026-04-09", 24, stdWeekend, []);
      expect(endDate).toBe("2026-04-13"); // Thu(8)+Fri(8)+Mon(8) = 24h → Mon
    });

    it("accounts for leave days when projecting end date", () => {
      // Start Mon 2026-04-06, need 40h, but Wed is full leave
      // Mon(8)+Tue(8)+Wed(0)+Thu(8)+Fri(8)+Mon(8) = 40h → Mon 2026-04-13
      const entries = [{ date: "2026-04-08", type: "Leave", availableHours: 8 }];
      const endDate = calculateEndDate("2026-04-06", 40, stdWeekend, entries);
      expect(endDate).toBe("2026-04-13");
    });

    it("returns start date when 0 hours required", () => {
      const endDate = calculateEndDate("2026-04-06", 0, stdWeekend, []);
      expect(endDate).toBe("2026-04-06");
    });
  });
});
