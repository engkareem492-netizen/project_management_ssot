/**
 * Tests for PM Plan and WBS routers
 * Uses the same pattern as auth.logout.test.ts
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ─────────────────────────────────────────────────────────────────
const mockRows: any[] = [];
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(() => Promise.resolve(mockRows)),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockImplementation(() => ({
    $returningId: () => Promise.resolve([{ id: 1 }]),
  })),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockImplementation(() => Promise.resolve(mockRows)),
};

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: any, val: any) => ({ col, val })),
  and: vi.fn((...args: any[]) => args),
  asc: vi.fn((col: any) => col),
}));

vi.mock("../drizzle/schema", () => ({
  pmPlanSections: { id: "id", projectId: "projectId", sectionKey: "sectionKey", content: "content", lastUpdatedBy: "lastUpdatedBy" },
  wbsElements: { id: "id", projectId: "projectId", parentId: "parentId", code: "code", title: "title", level: "level", status: "status", sortOrder: "sortOrder" },
}));

// ─── PM Plan section key list ─────────────────────────────────────────────────
describe("PM Plan section keys", () => {
  it("should define exactly 9 subsidiary plan keys", async () => {
    const { SECTION_KEYS } = await import("./routers/pmPlan.router");
    expect(SECTION_KEYS).toHaveLength(9);
    expect(SECTION_KEYS).toContain("scope_mgmt");
    expect(SECTION_KEYS).toContain("schedule_mgmt");
    expect(SECTION_KEYS).toContain("cost_mgmt");
    expect(SECTION_KEYS).toContain("quality_mgmt");
    expect(SECTION_KEYS).toContain("resource_mgmt");
    expect(SECTION_KEYS).toContain("comms_mgmt");
    expect(SECTION_KEYS).toContain("risk_mgmt");
    expect(SECTION_KEYS).toContain("procurement_mgmt");
    expect(SECTION_KEYS).toContain("stakeholder_mgmt");
  });
});

// ─── WBS tree builder ─────────────────────────────────────────────────────────
describe("WBS tree building logic", () => {
  it("builds a flat list into a tree correctly", () => {
    type Node = { id: number; parentId: number | null; code: string; title: string; children?: Node[] };
    function buildTree(flat: Node[]): Node[] {
      const map = new Map<number, Node & { children: Node[] }>();
      for (const n of flat) map.set(n.id, { ...n, children: [] });
      const roots: (Node & { children: Node[] })[] = [];
      for (const n of flat) {
        const node = map.get(n.id)!;
        if (n.parentId && map.has(n.parentId)) {
          map.get(n.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
      return roots;
    }

    const flat: Node[] = [
      { id: 1, parentId: null, code: "1", title: "Phase 1" },
      { id: 2, parentId: 1, code: "1.1", title: "Deliverable 1.1" },
      { id: 3, parentId: 1, code: "1.2", title: "Deliverable 1.2" },
      { id: 4, parentId: 2, code: "1.1.1", title: "Work Package 1.1.1" },
      { id: 5, parentId: null, code: "2", title: "Phase 2" },
    ];

    const tree = buildTree(flat);
    expect(tree).toHaveLength(2); // 2 root phases
    expect(tree[0].children).toHaveLength(2); // Phase 1 has 2 deliverables
    expect(tree[0].children[0].children).toHaveLength(1); // Deliverable 1.1 has 1 work package
    expect(tree[1].children).toHaveLength(0); // Phase 2 has no children
  });

  it("handles empty flat list", () => {
    function buildTree(flat: any[]): any[] {
      const map = new Map<number, any>();
      for (const n of flat) map.set(n.id, { ...n, children: [] });
      const roots: any[] = [];
      for (const n of flat) {
        const node = map.get(n.id)!;
        if (n.parentId && map.has(n.parentId)) {
          map.get(n.parentId)!.children.push(node);
        } else {
          roots.push(node);
        }
      }
      return roots;
    }
    expect(buildTree([])).toHaveLength(0);
  });
});

// ─── WBS code generation logic ────────────────────────────────────────────────
describe("WBS code generation", () => {
  it("generates correct codes for root-level elements", () => {
    const siblings = [{ code: "1" }, { code: "2" }, { code: "3" }];
    const siblingNumbers = siblings
      .map(s => parseInt(s.code.split(".").pop()!, 10))
      .filter(n => !isNaN(n));
    const nextNum = siblingNumbers.length > 0 ? Math.max(...siblingNumbers) + 1 : 1;
    expect(nextNum).toBe(4);
    expect(`${nextNum}`).toBe("4");
  });

  it("generates correct codes for nested elements", () => {
    const parentCode = "1.2.";
    const siblings = [{ code: "1.2.1" }, { code: "1.2.2" }];
    const siblingNumbers = siblings
      .map(s => parseInt(s.code.split(".").pop()!, 10))
      .filter(n => !isNaN(n));
    const nextNum = siblingNumbers.length > 0 ? Math.max(...siblingNumbers) + 1 : 1;
    expect(`${parentCode}${nextNum}`).toBe("1.2.3");
  });

  it("starts at 1 when no siblings exist", () => {
    const siblings: any[] = [];
    const siblingNumbers = siblings
      .map((s: any) => parseInt(s.code.split(".").pop()!, 10))
      .filter((n: number) => !isNaN(n));
    const nextNum = siblingNumbers.length > 0 ? Math.max(...siblingNumbers) + 1 : 1;
    expect(nextNum).toBe(1);
  });
});
