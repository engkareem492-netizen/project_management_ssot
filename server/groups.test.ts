import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Task Groups and Issue Groups Management", () => {
  let testProjectId: number;

  beforeAll(async () => {
    // Use existing project (ID 1 - Romansiah AMS)
    testProjectId = 1;
  });

  describe("Task Groups", () => {
    it("should create a new task group with auto-generated ID", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, name: "Test User", email: "test@example.com", role: "admin" } as any,
      });

      const result = await caller.dropdownOptions.taskGroups.create({
        projectId: testProjectId,
        name: `Test Task Group ${Date.now()}`,
        description: "Test description",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toContain("Test Task Group");
      expect(result.idCode).toMatch(/^TG-\d{4}$/);
      expect(result.projectId).toBe(testProjectId);
    });

    it("should get all task groups for a project", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: null,
      });

      const result = await caller.dropdownOptions.taskGroups.getAll({
        projectId: testProjectId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of first item
      const firstGroup = result[0];
      expect(firstGroup).toHaveProperty("id");
      expect(firstGroup).toHaveProperty("name");
      expect(firstGroup).toHaveProperty("idCode");
      expect(firstGroup).toHaveProperty("projectId");
      expect(firstGroup.projectId).toBe(testProjectId);
    });

    it("should update a task group name", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, name: "Test User", email: "test@example.com", role: "admin" } as any,
      });

      // First create a group to update
      const created = await caller.dropdownOptions.taskGroups.create({
        projectId: testProjectId,
        name: `Update Test ${Date.now()}`,
        description: "Original description",
      });

      // Update it
      const result = await caller.dropdownOptions.taskGroups.update({
        id: created.id,
        data: {
          name: "Updated Name",
          description: "Updated description",
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the update
      const groups = await caller.dropdownOptions.taskGroups.getAll({
        projectId: testProjectId,
      });
      const updatedGroup = groups.find((g) => g.id === created.id);
      expect(updatedGroup?.name).toBe("Updated Name");
      expect(updatedGroup?.description).toBe("Updated description");
    });
  });

  describe("Issue Groups", () => {
    it("should create a new issue group with auto-generated ID", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, name: "Test User", email: "test@example.com", role: "admin" } as any,
      });

      const result = await caller.dropdownOptions.issueGroups.create({
        projectId: testProjectId,
        name: `Test Issue Group ${Date.now()}`,
        description: "Test description",
      });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toContain("Test Issue Group");
      expect(result.idCode).toMatch(/^IG-\d{4}$/);
      expect(result.projectId).toBe(testProjectId);
    });

    it("should get all issue groups for a project", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: null,
      });

      const result = await caller.dropdownOptions.issueGroups.getAll({
        projectId: testProjectId,
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check structure of first item
      const firstGroup = result[0];
      expect(firstGroup).toHaveProperty("id");
      expect(firstGroup).toHaveProperty("name");
      expect(firstGroup).toHaveProperty("idCode");
      expect(firstGroup).toHaveProperty("projectId");
      expect(firstGroup.projectId).toBe(testProjectId);
    });

    it("should update an issue group name", async () => {
      const caller = appRouter.createCaller({
        req: {} as any,
        res: {} as any,
        user: { id: 1, name: "Test User", email: "test@example.com", role: "admin" } as any,
      });

      // First create a group to update
      const created = await caller.dropdownOptions.issueGroups.create({
        projectId: testProjectId,
        name: `Update Test ${Date.now()}`,
        description: "Original description",
      });

      // Update it
      const result = await caller.dropdownOptions.issueGroups.update({
        id: created.id,
        data: {
          name: "Updated Name",
          description: "Updated description",
        },
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);

      // Verify the update
      const groups = await caller.dropdownOptions.issueGroups.getAll({
        projectId: testProjectId,
      });
      const updatedGroup = groups.find((g) => g.id === created.id);
      expect(updatedGroup?.name).toBe("Updated Name");
      expect(updatedGroup?.description).toBe("Updated description");
    });
  });
});
