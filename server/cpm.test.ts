import { describe, it, expect } from "vitest";
import { computeCPM } from "./lib/cpm";

// Helper: build a simple node with date-based duration
function node(
  id: number,
  durationDays: number,
  predecessors: number[],
  startDate = "2026-01-01"
) {
  const start = new Date(startDate);
  const end = new Date(startDate);
  end.setDate(end.getDate() + durationDays);
  return {
    id,
    plannedStart: start.toISOString().slice(0, 10),
    plannedEnd: end.toISOString().slice(0, 10),
    durationDays: String(durationDays),
    predecessors: predecessors.map(p => ({ predecessorId: p, lagDays: 0 })),
    successors: [] as Array<{ successorId: number; lagDays?: number }>,
  };
}

// Wire successors from predecessors
function wire(nodes: ReturnType<typeof node>[]) {
  const byId = new Map(nodes.map(n => [n.id, n]));
  for (const n of nodes) {
    for (const p of n.predecessors) {
      byId.get(p.predecessorId)!.successors.push({ successorId: n.id, lagDays: 0 });
    }
  }
  return nodes;
}

describe("CPM Algorithm", () => {
  it("handles empty input", () => {
    const { results, cycle } = computeCPM([]);
    expect(results).toEqual([]);
    expect(cycle).toBe(false);
  });

  it("handles a single node with no predecessors", () => {
    const nodes = wire([node(1, 5, [])]);
    const { results, cycle } = computeCPM(nodes);
    expect(cycle).toBe(false);
    expect(results).toHaveLength(1);
    expect(results[0].totalFloat).toBe(0);
    expect(results[0].isCritical).toBe(true);
  });

  it("computes a simple linear chain correctly", () => {
    // 1(3) → 2(4) → 3(2)
    const nodes = wire([
      node(1, 3, [], "2026-01-01"),
      node(2, 4, [1]),
      node(3, 2, [2]),
    ]);
    const { results, cycle } = computeCPM(nodes);
    expect(cycle).toBe(false);
    const byId = Object.fromEntries(results.map(r => [r.id, r]));

    // All nodes on critical path → zero float
    expect(byId[1].totalFloat).toBe(0);
    expect(byId[2].totalFloat).toBe(0);
    expect(byId[3].totalFloat).toBe(0);
    expect(byId[1].isCritical).toBe(true);
    expect(byId[2].isCritical).toBe(true);
    expect(byId[3].isCritical).toBe(true);
  });

  it("identifies non-critical path with float", () => {
    // A(3) → B(1) → D(2) → E(1)   critical path = 7
    // A(3) → C(2) → E(1)           total = 6, float on C = 1
    const nodes = wire([
      node(1, 3, [], "2026-01-01"),  // A
      node(2, 1, [1]),               // B
      node(3, 2, [1]),               // C
      node(4, 2, [2]),               // D
      node(5, 1, [3, 4]),            // E
    ]);
    const { results, cycle } = computeCPM(nodes);
    expect(cycle).toBe(false);
    const byId = Object.fromEntries(results.map(r => [r.id, r]));

    // C has float = 1 day
    expect(byId[3].totalFloat).toBe(1);
    expect(byId[3].isCritical).toBe(false);

    // A, B, D, E are critical
    expect(byId[1].isCritical).toBe(true);
    expect(byId[2].isCritical).toBe(true);
    expect(byId[4].isCritical).toBe(true);
    expect(byId[5].isCritical).toBe(true);
  });

  it("detects a cycle and returns cycle=true", () => {
    // 1 → 2 → 3 → 1 (cycle)
    const nodes = [
      { id: 1, plannedStart: "2026-01-01", plannedEnd: "2026-01-04", durationDays: "3",
        predecessors: [{ predecessorId: 3, lagDays: 0 }], successors: [{ successorId: 2 }] },
      { id: 2, plannedStart: "2026-01-04", plannedEnd: "2026-01-08", durationDays: "4",
        predecessors: [{ predecessorId: 1, lagDays: 0 }], successors: [{ successorId: 3 }] },
      { id: 3, plannedStart: "2026-01-08", plannedEnd: "2026-01-10", durationDays: "2",
        predecessors: [{ predecessorId: 2, lagDays: 0 }], successors: [{ successorId: 1 }] },
    ];
    const { cycle } = computeCPM(nodes);
    expect(cycle).toBe(true);
  });
});
