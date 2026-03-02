import { describe, it, expect, beforeAll, afterAll } from "vitest";
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

describe("Risk Register", () => {
  let testProjectId: number;
  let testRiskId: number;
  let testRiskTypeId: number;
  let testRiskStatusId: number;
  let testResponseStrategyId: number;
  let testStakeholderId: number;

  beforeAll(async () => {
    // Create test project using existing project ID 1 (should exist from other tests)
    // Or create a minimal test project
    testProjectId = 1; // Use existing project for simplicity
  });

  afterAll(async () => {
    // Cleanup: delete test risk
    if (testRiskId) {
      await db.deleteRisk(testRiskId);
    }
  });

  describe("Risk CRUD Operations", () => {
    it("should create a risk with auto-generated risk ID", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.create({
        projectId: testProjectId,
        title: "Database connection failure",
        identifiedOn: new Date().toISOString().split("T")[0],
        impact: 4,
        probability: 3,
        residualImpact: 2,
        residualProbability: 2,
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
      testRiskId = result.insertId;

      // Verify the risk was created with correct calculated scores
      const risk = await db.getRiskById(testRiskId);
      expect(risk).toBeDefined();
      expect(risk.title).toBe("Database connection failure");
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
      expect(risks[0].title).toBe("Database connection failure");
    });

    it("should update a risk and recalculate scores", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      await caller.risks.update({
        id: testRiskId,
        title: "Updated: Database connection failure",
        impact: 5,
        probability: 4,
        residualImpact: 1,
        residualProbability: 1,
      });

      const risk = await db.getRiskById(testRiskId);
      expect(risk.title).toBe("Updated: Database connection failure");
      expect(risk.score).toBe(20); // 5 * 4
      expect(risk.residualScore).toBe(1); // 1 * 1
    });

    it("should delete a risk", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      // Create a temporary risk to delete
      const tempRisk = await caller.risks.create({
        projectId: testProjectId,
        title: "Temporary risk for deletion",
        identifiedOn: new Date().toISOString().split("T")[0],
        impact: 1,
        probability: 1,
      });

      const result = await caller.risks.delete({ id: tempRisk.insertId });
      expect(result.success).toBe(true);

      // Verify deletion
      const deletedRisk = await db.getRiskById(tempRisk.insertId);
      expect(deletedRisk).toBeUndefined();
    });
  });

  describe("Risk Types Management", () => {
    it("should list risk types for a project", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const types = await caller.risks.types.list({ projectId: testProjectId });

      expect(types).toBeDefined();
      expect(Array.isArray(types)).toBe(true);
      expect(types.length).toBeGreaterThan(0);
      expect(types[0].name).toBe("Technical Risk");
    });

    it("should create a new risk type", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.types.create({
        projectId: testProjectId,
        name: "Business Risk",
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);

      // Cleanup
      await db.deleteRiskType(result.insertId);
    });
  });

  describe("Risk Status Management", () => {
    it("should list risk statuses for a project", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const statuses = await caller.risks.status.list({ projectId: testProjectId });

      expect(statuses).toBeDefined();
      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses[0].name).toBe("Active");
    });
  });

  describe("Response Strategies Management", () => {
    it("should list response strategies for a project", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const strategies = await caller.risks.strategy.list({ projectId: testProjectId });

      expect(strategies).toBeDefined();
      expect(Array.isArray(strategies)).toBe(true);
      expect(strategies.length).toBeGreaterThan(0);
      expect(strategies[0].name).toBe("Mitigate");
    });
  });

  describe("Risk Updates (Historical Tracking)", () => {
    it("should create a risk update entry", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.updates.create({
        riskId: testRiskId,
        update: "Risk mitigation plan implemented",
        updateDate: new Date().toISOString().split("T")[0],
      });

      expect(result.success).toBe(true);
    });

    it("should list risk updates for a risk", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const updates = await caller.risks.updates.list({ riskId: testRiskId });

      expect(updates).toBeDefined();
      expect(Array.isArray(updates)).toBe(true);
      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].update).toBe("Risk mitigation plan implemented");
    });
  });

  describe("Risk Analysis (Cause-Consequence)", () => {
    let testAnalysisId: number;

    it("should create a risk analysis entry", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.analysis.create({
        riskId: testRiskId,
        causeLevel: 1,
        cause: "Insufficient database backup procedures",
        consequences: "Data loss and system downtime",
        trigger: "Hardware failure or power outage",
      });

      expect(result).toBeDefined();
      expect(result.insertId).toBeGreaterThan(0);
      testAnalysisId = result.insertId;
    });

    it("should list risk analysis entries for a risk", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const analyses = await caller.risks.analysis.list({ riskId: testRiskId });

      expect(analyses).toBeDefined();
      expect(Array.isArray(analyses)).toBe(true);
      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses[0].cause).toBe("Insufficient database backup procedures");
      expect(analyses[0].consequences).toBe("Data loss and system downtime");
      expect(analyses[0].trigger).toBe("Hardware failure or power outage");
    });

    it("should update a risk analysis entry", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      await caller.risks.analysis.update({
        id: testAnalysisId,
        cause: "Updated: Insufficient database backup procedures",
      });

      const analyses = await caller.risks.analysis.list({ riskId: testRiskId });
      const updated = analyses.find((a) => a.id === testAnalysisId);
      expect(updated?.cause).toBe("Updated: Insufficient database backup procedures");
    });

    it("should delete a risk analysis entry", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.analysis.delete({ id: testAnalysisId });
      expect(result.success).toBe(true);

      const analyses = await caller.risks.analysis.list({ riskId: testRiskId });
      const deleted = analyses.find((a) => a.id === testAnalysisId);
      expect(deleted).toBeUndefined();
    });
  });

  describe("Score Calculation", () => {
    it("should calculate initial score correctly", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.create({
        projectId: testProjectId,
        title: "Score calculation test",
        identifiedOn: new Date().toISOString().split("T")[0],
        impact: 3,
        probability: 4,
      });

      const risk = await db.getRiskById(result.insertId);
      expect(risk.score).toBe(12); // 3 * 4

      // Cleanup
      await db.deleteRisk(result.insertId);
    });

    it("should calculate residual score correctly", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.create({
        projectId: testProjectId,
        title: "Residual score calculation test",
        identifiedOn: new Date().toISOString().split("T")[0],
        impact: 5,
        probability: 5,
        residualImpact: 2,
        residualProbability: 3,
      });

      const risk = await db.getRiskById(result.insertId);
      expect(risk.score).toBe(25); // 5 * 5
      expect(risk.residualScore).toBe(6); // 2 * 3

      // Cleanup
      await db.deleteRisk(result.insertId);
    });

    it("should handle null residual scores", async () => {
      const caller = appRouter.createCaller(createMockContext(1));

      const result = await caller.risks.create({
        projectId: testProjectId,
        title: "No residual score test",
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
  });
});
