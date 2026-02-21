import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb, createStakeholder, createRequirement, createTask, createIssue, getRequirementByIdCode, getTaskByTaskId, getIssueByIssueId } from "./db";
import { users, projects, stakeholders, requirements, tasks, issues } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

describe("Owner/Responsible Name Population", () => {
  let testUserId: number;
  let testProjectId: number;
  let testStakeholderId: number;
  let testRequirementIdCode: string;
  let testTaskId: string;
  let testIssueId: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    const userResult = await db.insert(users).values({
      email: "owner-test@example.com",
      password: hashedPassword,
      name: "Test User",
      loginMethod: "local",
    });
    testUserId = Number(userResult[0].insertId);

    // Create test project
    const projectResult = await db.insert(projects).values({
      name: "Owner Test Project",
      description: "Project for testing owner/responsible population",
      password: hashedPassword,
      createdBy: testUserId,
    });
    testProjectId = Number(projectResult[0].insertId);

    // Create test stakeholder
    const stakeholder = await createStakeholder({
      projectId: testProjectId,
      fullName: "John Doe",
      position: "Project Manager",
      role: "Manager",
      email: "john.doe@example.com",
      phone: "123-456-7890",
      department: "IT",
    });
    testStakeholderId = stakeholder.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testRequirementIdCode) {
      await db.delete(requirements).where(eq(requirements.idCode, testRequirementIdCode));
    }
    if (testTaskId) {
      await db.delete(tasks).where(eq(tasks.taskId, testTaskId));
    }
    if (testIssueId) {
      await db.delete(issues).where(eq(issues.issueId, testIssueId));
    }
    await db.delete(stakeholders).where(eq(stakeholders.id, testStakeholderId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should populate owner name when creating a requirement", async () => {
    const requirementData = {
      projectId: testProjectId,
      idCode: "REQ-TEST-001",
      description: "Test requirement with owner",
      ownerId: testStakeholderId,
      status: "Open",
      priority: "High",
      type: "Functional",
      category: "Feature",
    };

    await createRequirement(requirementData);
    testRequirementIdCode = requirementData.idCode;

    const createdRequirement = await getRequirementByIdCode(testRequirementIdCode);
    
    expect(createdRequirement).toBeDefined();
    expect(createdRequirement?.owner).toBe("John Doe");
    expect(createdRequirement?.ownerId).toBe(testStakeholderId);
  });

  it("should populate responsible name when creating a task", async () => {
    const taskData = {
      projectId: testProjectId,
      taskId: "TSK-TEST-001",
      taskGroup: "Test Group",
      description: "Test task with responsible",
      responsibleId: testStakeholderId,
      status: "Open",
      priority: "Medium",
    };

    await createTask(taskData);
    testTaskId = taskData.taskId;

    const createdTask = await getTaskByTaskId(testTaskId);
    
    expect(createdTask).toBeDefined();
    expect(createdTask?.responsible).toBe("John Doe");
    expect(createdTask?.responsibleId).toBe(testStakeholderId);
  });

  it("should populate owner name when creating an issue", async () => {
    const issueData = {
      projectId: testProjectId,
      issueId: "ISS-TEST-001",
      issueGroup: "Test Issue Group",
      description: "Test issue with owner",
      ownerId: testStakeholderId,
      status: "Open",
      priority: "High",
    };

    await createIssue(issueData);
    testIssueId = issueData.issueId;

    const createdIssue = await getIssueByIssueId(testIssueId);
    
    expect(createdIssue).toBeDefined();
    expect(createdIssue?.owner).toBe("John Doe");
    expect(createdIssue?.ownerId).toBe(testStakeholderId);
  });

  it("should populate all RACI fields when creating a task", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create additional stakeholders
    const accountableStakeholder = await createStakeholder({
      projectId: testProjectId,
      fullName: "Jane Smith",
      position: "Team Lead",
      role: "Lead",
    });
    const accountableId = accountableStakeholder.id;

    const informedStakeholder = await createStakeholder({
      projectId: testProjectId,
      fullName: "Bob Johnson",
      position: "Developer",
      role: "Developer",
    });
    const informedId = informedStakeholder.id;

    const consultedStakeholder = await createStakeholder({
      projectId: testProjectId,
      fullName: "Alice Williams",
      position: "Architect",
      role: "Architect",
    });
    const consultedId = consultedStakeholder.id;

    const taskData = {
      projectId: testProjectId,
      taskId: "TSK-TEST-002",
      taskGroup: "RACI Test Group",
      description: "Test task with full RACI",
      responsibleId: testStakeholderId,
      accountableId: accountableId,
      informedId: informedId,
      consultedId: consultedId,
      status: "Open",
      priority: "Medium",
    };

    await createTask(taskData);

    const createdTask = await getTaskByTaskId("TSK-TEST-002");
    
    expect(createdTask).toBeDefined();
    expect(createdTask?.responsible).toBe("John Doe");
    expect(createdTask?.accountable).toBe("Jane Smith");
    expect(createdTask?.informed).toBe("Bob Johnson");
    expect(createdTask?.consulted).toBe("Alice Williams");

    // Clean up
    await db.delete(tasks).where(eq(tasks.taskId, "TSK-TEST-002"));
    await db.delete(stakeholders).where(eq(stakeholders.id, accountableId));
    await db.delete(stakeholders).where(eq(stakeholders.id, informedId));
    await db.delete(stakeholders).where(eq(stakeholders.id, consultedId));
  });
});
