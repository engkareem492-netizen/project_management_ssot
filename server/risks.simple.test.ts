import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";
import * as db from "./db";

// Mock context for testing
const createMockContext = (userId?: number): TrpcContext => ({
  req: {} as any,
  res: {} as any,
  user: userId
    ? {
        id: userId,
        openId: `test-user-${userId}`,
        name: "Test User",
        email: "test@example.com",
        role: "admin" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      }
    : null,
});

describe("Risk Register - Core Functionality", () => {
  const testProjectId = 1; // Use existing project
  let createdRiskId: number;

  it("should create a risk with auto-calculated scores", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const result = await caller.risks.create({
      projectId: testProjectId,
      title: "Test Risk - Database connection failure",
      identifiedOn: new Date().toISOString().split("T")[0],
      impact: 4,
      probability: 3,
      residualImpact: 2,
      residualProbability: 2,
    });

    expect(result).toBeDefined();
    expect(result.insertId).toBeGreaterThan(0);
    createdRiskId = result.insertId;

    // Verify the risk was created with correct calculated scores
    const risk = await db.getRiskById(createdRiskId);
    expect(risk).toBeDefined();
    expect(risk.title).toBe("Test Risk - Database connection failure");
    expect(risk.riskId).toMatch(/^RISK-\d{3}$/);
    expect(risk.score).toBe(12); // 4 * 3
    expect(risk.residualScore).toBe(4); // 2 * 2
    expect(risk.impact).toBe(4);
    expect(risk.probability).toBe(3);
  });

  it("should list all risks for a project", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const risks = await caller.risks.list({ projectId: testProjectId });

    expect(risks).toBeDefined();
    expect(Array.isArray(risks)).toBe(true);
    expect(risks.length).toBeGreaterThan(0);
    
    // Find our created risk
    const ourRisk = risks.find(r => r.id === createdRiskId);
    expect(ourRisk).toBeDefined();
    expect(ourRisk?.title).toBe("Test Risk - Database connection failure");
  });

  it("should update a risk and recalculate scores", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    await caller.risks.update({
      id: createdRiskId,
      title: "Updated: Database connection failure",
      impact: 5,
      probability: 4,
      residualImpact: 1,
      residualProbability: 1,
    });

    const risk = await db.getRiskById(createdRiskId);
    expect(risk.title).toBe("Updated: Database connection failure");
    expect(risk.score).toBe(20); // 5 * 4
    expect(risk.residualScore).toBe(1); // 1 * 1
  });

  it("should handle null residual scores correctly", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const result = await caller.risks.create({
      projectId: testProjectId,
      title: "Risk without residual score",
      identifiedOn: new Date().toISOString().split("T")[0],
      impact: 3,
      probability: 3,
    });

    const risk = await db.getRiskById(result.insertId);
    expect(risk.score).toBe(9); // 3 * 3
    expect(risk.residualScore).toBeNull();

    // Cleanup
    await db.deleteRisk(result.insertId);
  });

  it("should delete a risk", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    const result = await caller.risks.delete({ id: createdRiskId });
    expect(result.success).toBe(true);

    // Verify deletion
    const deletedRisk = await db.getRiskById(createdRiskId);
    expect(deletedRisk).toBeUndefined();
  });

  it("should create and list risk updates (historical tracking)", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    // Create a risk first
    const riskResult = await caller.risks.create({
      projectId: testProjectId,
      title: "Risk for update tracking",
      identifiedOn: new Date().toISOString().split("T")[0],
      impact: 2,
      probability: 2,
    });

    const riskId = riskResult.insertId;

    // Create an update
    const updateResult = await caller.risks.updates.create({
      riskId,
      update: "Mitigation plan implemented",
      updateDate: new Date().toISOString().split("T")[0],
    });

    expect(updateResult.success).toBe(true);

    // List updates
    const updates = await caller.risks.updates.list({ riskId });
    expect(updates).toBeDefined();
    expect(Array.isArray(updates)).toBe(true);
    expect(updates.length).toBeGreaterThan(0);
    expect(updates[0].update).toBe("Mitigation plan implemented");

    // Cleanup
    await db.deleteRisk(riskId);
  });

  it("should create and manage risk analysis entries", async () => {
    const caller = appRouter.createCaller(createMockContext(1));

    // Create a risk first
    const riskResult = await caller.risks.create({
      projectId: testProjectId,
      title: "Risk for analysis",
      identifiedOn: new Date().toISOString().split("T")[0],
      impact: 3,
      probability: 3,
    });

    const riskId = riskResult.insertId;

    // Create analysis entry
    const analysisResult = await caller.risks.analysis.create({
      riskId,
      causeLevel: 1,
      cause: "Insufficient backup procedures",
      consequences: "Data loss and downtime",
      trigger: "Hardware failure",
    });

    expect(analysisResult).toBeDefined();
    expect(analysisResult.insertId).toBeGreaterThan(0);

    // List analysis entries
    const analyses = await caller.risks.analysis.list({ riskId });
    expect(analyses).toBeDefined();
    expect(Array.isArray(analyses)).toBe(true);
    expect(analyses.length).toBeGreaterThan(0);
    expect(analyses[0].cause).toBe("Insufficient backup procedures");

    // Cleanup
    await db.deleteRisk(riskId);
  });
});
