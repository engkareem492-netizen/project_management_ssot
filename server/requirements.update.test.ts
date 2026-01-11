import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
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

  return ctx;
}

describe("Requirements Update with Delta Change Detection", () => {
  it("should detect and log only changed fields", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a test requirement
    const idCode = "TEST-001-" + Date.now();
    await db.createRequirement({
      idCode,
      status: "Open",
      priority: "High",
      deliverables1: "Initial D1",
      d1Status: "Pending",
      deliverables2: "Initial D2",
      d2Status: "Pending",
      lastUpdate: "Initial update",
      updateDate: "01.01.2026",
      description: "Test requirement",
      owner: "Test Owner",
      type: "WRICEF",
      class: "Report",
      category: "FICO",
      sourceType: "Ticket",
      refSource: "1234",
    });

    const requirement = await db.getRequirementByIdCode(idCode);
    expect(requirement).toBeDefined();

    if (!requirement) return;

    // Update only status and priority
    const result = await caller.requirements.update({
      id: requirement.id,
      idCode,
      data: {
        status: "Closed",
        priority: "Very High",
      },
    });

    expect(result.success).toBe(true);
    expect(result.changedFields).toHaveLength(2);
    expect(result.changedFields).toContain("status");
    expect(result.changedFields).toContain("priority");

    // Verify action log was created
    const logs = await db.getActionLogsByEntity("requirement", idCode);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityType).toBe("requirement");
    expect(logs[0]?.entityId).toBe(idCode);

    const changedFields = logs[0]?.changedFields as Record<string, { oldValue: any; newValue: any }>;
    expect(changedFields.status).toBeDefined();
    expect(changedFields.status.oldValue).toBe("Open");
    expect(changedFields.status.newValue).toBe("Closed");
    expect(changedFields.priority).toBeDefined();
    expect(changedFields.priority.oldValue).toBe("High");
    expect(changedFields.priority.newValue).toBe("Very High");

    // Verify other fields were NOT logged
    expect(changedFields.deliverables1).toBeUndefined();
    expect(changedFields.d1Status).toBeUndefined();
  });

  it("should not create action log when no fields change", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const idCode = "TEST-002-" + Date.now();
    await db.createRequirement({
      idCode,
      status: "Open",
      priority: "High",
      description: "Test requirement 2",
      owner: "Test Owner",
    });

    const requirement = await db.getRequirementByIdCode(idCode);
    if (!requirement) return;

    // Update with same values
    const result = await caller.requirements.update({
      id: requirement.id,
      idCode,
      data: {
        status: "Open",
        priority: "High",
      },
    });

    expect(result.success).toBe(true);
    expect(result.changedFields).toHaveLength(0);

    // Verify no action log was created
    const logs = await db.getActionLogsByEntity("requirement", idCode);
    expect(logs).toHaveLength(0);
  });

  it("should track multiple updates chronologically", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const idCode = "TEST-003-" + Date.now();
    await db.createRequirement({
      idCode,
      status: "Open",
      priority: "Medium",
      deliverables1: "D1",
      d1Status: "Pending",
      description: "Test requirement 3",
      owner: "Test Owner",
    });

    const requirement = await db.getRequirementByIdCode(idCode);
    if (!requirement) return;

    // First update
    await caller.requirements.update({
      id: requirement.id,
      idCode,
      data: {
        status: "In Progress",
      },
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Second update
    await caller.requirements.update({
      id: requirement.id,
      idCode,
      data: {
        priority: "High",
        d1Status: "Completed",
      },
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Third update
    await caller.requirements.update({
      id: requirement.id,
      idCode,
      data: {
        status: "Closed",
      },
    });

    // Verify all three updates were logged
    const logs = await db.getActionLogsByEntity("requirement", idCode);
    expect(logs).toHaveLength(3);

    // Verify logs exist and have changed fields
    expect(logs[0]?.changedFields).toBeDefined();
    expect(logs[1]?.changedFields).toBeDefined();
    expect(logs[2]?.changedFields).toBeDefined();

    // Verify at least one log has status change to "Closed"
    const hasClosedStatus = logs.some(log => {
      const fields = log.changedFields as Record<string, any>;
      return fields.status?.newValue === "Closed";
    });
    expect(hasClosedStatus).toBe(true);

    // Verify at least one log has priority change
    const hasPriorityChange = logs.some(log => {
      const fields = log.changedFields as Record<string, any>;
      return fields.priority !== undefined;
    });
    expect(hasPriorityChange).toBe(true);
  });
});

describe("Tasks Update with Delta Change Detection", () => {
  it("should detect and log task status changes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const taskId = "T-001-" + Date.now();
    await db.createTask({
      taskId,
      currentStatus: "Not Started",
      statusUpdate: "Initial status",
      description: "Test task",
      responsible: "Test User",
    });

    const task = await db.getTaskByTaskId(taskId);
    if (!task) return;

    const result = await caller.tasks.update({
      id: task.id,
      taskId,
      data: {
        currentStatus: "In Progress",
        statusUpdate: "Work started",
      },
    });

    expect(result.success).toBe(true);
    expect(result.changedFields).toHaveLength(2);

    const logs = await db.getActionLogsByEntity("task", taskId);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityType).toBe("task");

    const changedFields = logs[0]?.changedFields as Record<string, any>;
    expect(changedFields.currentStatus.oldValue).toBe("Not Started");
    expect(changedFields.currentStatus.newValue).toBe("In Progress");
    expect(changedFields.statusUpdate.oldValue).toBe("Initial status");
    expect(changedFields.statusUpdate.newValue).toBe("Work started");
  });
});

describe("Issues Update with Delta Change Detection", () => {
  it("should detect and log issue changes", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const issueId = "I-001-" + Date.now();
    await db.createIssue({
      issueId,
      status: "Open",
      priority: "High",
      deliverables1: "Fix",
      d1Status: "Pending",
      description: "Test issue",
      owner: "Test Owner",
    });

    const issue = await db.getIssueByIssueId(issueId);
    if (!issue) return;

    const result = await caller.issues.update({
      id: issue.id,
      issueId,
      data: {
        status: "Resolved",
        d1Status: "Completed",
      },
    });

    expect(result.success).toBe(true);
    expect(result.changedFields).toHaveLength(2);

    const logs = await db.getActionLogsByEntity("issue", issueId);
    expect(logs).toHaveLength(1);
    expect(logs[0]?.entityType).toBe("issue");

    const changedFields = logs[0]?.changedFields as Record<string, any>;
    expect(changedFields.status.oldValue).toBe("Open");
    expect(changedFields.status.newValue).toBe("Resolved");
    expect(changedFields.d1Status.oldValue).toBe("Pending");
    expect(changedFields.d1Status.newValue).toBe("Completed");
  });
});
