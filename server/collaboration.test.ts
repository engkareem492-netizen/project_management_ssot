import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, projects, projectMembers, projectInvitations } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

describe("Collaboration System", () => {
  let testUserId1: number;
  let testUserId2: number;
  let testProjectId: number;
  let testToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test users
    const hashedPassword = await bcrypt.hash("testpassword123", 10);
    
    const user1Result = await db.insert(users).values({
      email: "collab-test-user1@example.com",
      password: hashedPassword,
      name: "Test User 1",
      loginMethod: "local",
    });
    testUserId1 = Number(user1Result[0].insertId);

    const user2Result = await db.insert(users).values({
      email: "collab-test-user2@example.com",
      password: hashedPassword,
      name: "Test User 2",
      loginMethod: "local",
    });
    testUserId2 = Number(user2Result[0].insertId);

    // Create test project
    const projectResult = await db.insert(projects).values({
      name: "Test Collaboration Project",
      description: "Project for testing collaboration features",
      password: hashedPassword,
      createdBy: testUserId1,
    });
    testProjectId = Number(projectResult[0].insertId);

    // Add user1 as owner
    await db.insert(projectMembers).values({
      projectId: testProjectId,
      userId: testUserId1,
      role: "owner",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(projectInvitations).where(eq(projectInvitations.projectId, testProjectId));
    await db.delete(projectMembers).where(eq(projectMembers.projectId, testProjectId));
    await db.delete(projects).where(eq(projects.id, testProjectId));
    await db.delete(users).where(eq(users.id, testUserId1));
    await db.delete(users).where(eq(users.id, testUserId2));
  });

  it("should invite a user by email", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    const result = await caller.collaboration.inviteUserByEmail({
      projectId: testProjectId,
      email: "collab-test-user2@example.com",
      role: "editor",
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("successfully");
    expect(result.invitationLink).toBeDefined();

    // Extract token from invitation link for later tests
    const tokenMatch = result.invitationLink?.match(/token=([^&]+)/);
    if (tokenMatch) {
      testToken = tokenMatch[1];
    }
  });

  it("should not allow duplicate invitations", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    await expect(
      caller.collaboration.inviteUserByEmail({
        projectId: testProjectId,
        email: "collab-test-user2@example.com",
        role: "editor",
      })
    ).rejects.toThrow("already been sent");
  });

  it("should list pending invitations", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    const invitations = await caller.collaboration.getPendingInvitations({
      projectId: testProjectId,
    });

    expect(invitations.length).toBeGreaterThan(0);
    expect(invitations[0].email).toBe("collab-test-user2@example.com");
    expect(invitations[0].role).toBe("editor");
  });

  it("should accept an invitation", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId2,
        email: "collab-test-user2@example.com",
        name: "Test User 2",
        role: "user",
      },
    });

    const result = await caller.collaboration.acceptInvitation({
      token: testToken,
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe(testProjectId);
    expect(result.message).toContain("joined");
  });

  it("should list project members", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    const members = await caller.collaboration.getProjectMembers({
      projectId: testProjectId,
    });

    expect(members.length).toBe(2);
    expect(members.some((m) => m.userId === testUserId1 && m.role === "owner")).toBe(true);
    expect(members.some((m) => m.userId === testUserId2 && m.role === "editor")).toBe(true);
  });

  it("should generate a shareable link with password", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    const result = await caller.collaboration.generateShareableLink({
      projectId: testProjectId,
      password: "sharepassword123",
    });

    expect(result.success).toBe(true);
    expect(result.shareLink).toContain(`/join-project/${testProjectId}`);
  });

  it("should join project with correct password", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId2,
        email: "collab-test-user2@example.com",
        name: "Test User 2",
        role: "user",
      },
    });

    const result = await caller.collaboration.joinProjectWithPassword({
      projectId: testProjectId,
      password: "sharepassword123",
    });

    expect(result.success).toBe(true);
    expect(result.projectId).toBe(testProjectId);
  });

  it("should reject incorrect password", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: testUserId2,
        email: "collab-test-user2@example.com",
        name: "Test User 2",
        role: "user",
      },
    });

    await expect(
      caller.collaboration.joinProjectWithPassword({
        projectId: testProjectId,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Incorrect password");
  });

  it("should remove a member", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get member ID for user2
    const members = await db
      .select()
      .from(projectMembers)
      .where(eq(projectMembers.userId, testUserId2));
    
    const memberId = members[0].id;

    const caller = appRouter.createCaller({
      user: {
        id: testUserId1,
        email: "collab-test-user1@example.com",
        name: "Test User 1",
        role: "user",
      },
    });

    const result = await caller.collaboration.removeMember({
      projectId: testProjectId,
      memberId,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain("removed");

    // Verify member was removed
    const remainingMembers = await caller.collaboration.getProjectMembers({
      projectId: testProjectId,
    });
    expect(remainingMembers.some((m) => m.userId === testUserId2)).toBe(false);
  });
});
