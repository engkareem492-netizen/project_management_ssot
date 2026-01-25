import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("CRUD Operations", () => {
  describe("Requirements", () => {
    it("should create a new requirement", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      const result = await caller.requirements.create({
        idCode: `REQ-TEST-${timestamp}`,
        description: "Test requirement",
        owner: "Test Owner",
        status: "Open",
        priority: "High",
      });

      expect(result.success).toBe(true);
    });

    it("should delete a requirement", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a requirement
      const timestamp = Date.now();
      await caller.requirements.create({
        idCode: `REQ-DEL-${timestamp}`,
        description: "To be deleted",
        owner: "Test Owner",
        status: "Open",
        priority: "Medium",
      });

      // Get the created requirement
      const requirements = await caller.requirements.list();
      const created = requirements.find(r => r.idCode === `REQ-DEL-${timestamp}`);
      expect(created).toBeDefined();

      // Delete it
      if (created) {
        const deleteResult = await caller.requirements.delete({ id: created.id });
        expect(deleteResult.success).toBe(true);

        // Verify it's deleted
        const afterDelete = await caller.requirements.list();
        const deleted = afterDelete.find(r => r.id === created.id);
        expect(deleted).toBeUndefined();
      }
    });
  });

  describe("Tasks", () => {
    it("should create a new task", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      const result = await caller.tasks.create({
        taskId: `TASK-TEST-${timestamp}`,
        description: "Test task",
        owner: "Test Owner",
        status: "Not Started",
        priority: "Medium",
      });

      expect(result.success).toBe(true);
    });

    it("should delete a task", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      await caller.tasks.create({
        taskId: `TASK-DEL-${timestamp}`,
        description: "To be deleted",
        owner: "Test Owner",
        status: "Not Started",
        priority: "Low",
      });

      const tasks = await caller.tasks.list();
      const created = tasks.find(t => t.taskId === `TASK-DEL-${timestamp}`);
      expect(created).toBeDefined();

      if (created) {
        const deleteResult = await caller.tasks.delete({ id: created.id });
        expect(deleteResult.success).toBe(true);

        const afterDelete = await caller.tasks.list();
        const deleted = afterDelete.find(t => t.id === created.id);
        expect(deleted).toBeUndefined();
      }
    });
  });

  describe("Issues", () => {
    it("should create a new issue", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      const result = await caller.issues.create({
        issueId: `ISSUE-TEST-${timestamp}`,
        description: "Test issue",
        owner: "Test Owner",
        status: "Open",
        priority: "High",
      });

      expect(result.success).toBe(true);
    });

    it("should delete an issue", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      await caller.issues.create({
        issueId: `ISSUE-DEL-${timestamp}`,
        description: "To be deleted",
        owner: "Test Owner",
        status: "Open",
        priority: "Medium",
      });

      const issues = await caller.issues.list();
      const created = issues.find(i => i.issueId === `ISSUE-DEL-${timestamp}`);
      expect(created).toBeDefined();

      if (created) {
        const deleteResult = await caller.issues.delete({ id: created.id });
        expect(deleteResult.success).toBe(true);

        const afterDelete = await caller.issues.list();
        const deleted = afterDelete.find(i => i.id === created.id);
        expect(deleted).toBeUndefined();
      }
    });
  });

  describe("Dependencies", () => {
    it("should create a new dependency", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      const result = await caller.dependencies.create({
        dependencyId: `DEP-TEST-${timestamp}`,
        description: "Test dependency",
        responsible: "Test Owner",
        currentStatus: "Pending",
      });

      expect(result.success).toBe(true);
    });

    it("should delete a dependency", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      await caller.dependencies.create({
        dependencyId: `DEP-DEL-${timestamp}`,
        description: "To be deleted",
        responsible: "Test Owner",
        currentStatus: "Pending",
      });

      const dependencies = await caller.dependencies.list();
      const created = dependencies.find(d => d.dependencyId === `DEP-DEL-${timestamp}`);
      expect(created).toBeDefined();

      if (created) {
        const deleteResult = await caller.dependencies.delete({ id: created.id });
        expect(deleteResult.success).toBe(true);

        const afterDelete = await caller.dependencies.list();
        const deleted = afterDelete.find(d => d.id === created.id);
        expect(deleted).toBeUndefined();
      }
    });
  });

  describe("Assumptions", () => {
    it("should create a new assumption", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      const result = await caller.assumptions.create({
        assumptionId: `ASSUMP-TEST-${timestamp}`,
        description: "Test assumption",
        category: "Technical",
        owner: "Test Owner",
        status: "Active",
      });

      expect(result.success).toBe(true);
    });

    it("should delete an assumption", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const timestamp = Date.now();
      await caller.assumptions.create({
        assumptionId: `ASSUMP-DEL-${timestamp}`,
        description: "To be deleted",
        category: "Business",
        owner: "Test Owner",
        status: "Active",
      });

      const assumptions = await caller.assumptions.list();
      const created = assumptions.find(a => a.assumptionId === `ASSUMP-DEL-${timestamp}`);
      expect(created).toBeDefined();

      if (created) {
        const deleteResult = await caller.assumptions.delete({ id: created.id });
        expect(deleteResult.success).toBe(true);

        const afterDelete = await caller.assumptions.list();
        const deleted = afterDelete.find(a => a.id === created.id);
        expect(deleted).toBeUndefined();
      }
    });
  });
});
