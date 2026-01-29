import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-open-id",
    name: "Test User",
    email: "test@example.com",
    loginMethod: "email",
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
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Project Password Reset and Deletion", () => {
  let testProjectId: number;
  const ctx = createAuthContext();
  const caller = appRouter.createCaller(ctx);

  beforeAll(async () => {
    // Create a test project
    const project = await caller.projects.create({
      name: "Test Project for Reset",
      description: "Test project for password reset and deletion",
      password: "original-password",
    });
    console.log("Created project:", project);
    testProjectId = Number(project.id);
    console.log("Test project ID:", testProjectId);
  });

  it("should verify password before reset", async () => {
    const result = await caller.projects.verify({
      projectId: testProjectId,
      password: "original-password",
    });
    expect(result.valid).toBe(true);
  });

  it("should reset project password successfully", async () => {
    const result = await caller.projects.resetPassword({
      projectId: testProjectId,
      newPassword: "new-password-123",
    });
    expect(result.success).toBe(true);
  });

  it("should verify new password after reset", async () => {
    const result = await caller.projects.verify({
      projectId: testProjectId,
      password: "new-password-123",
    });
    expect(result.valid).toBe(true);
  });

  it("should reject old password after reset", async () => {
    const result = await caller.projects.verify({
      projectId: testProjectId,
      password: "original-password",
    });
    expect(result.valid).toBe(false);
  });

  it("should delete project successfully", async () => {
    const result = await caller.projects.delete({
      projectId: testProjectId,
    });
    expect(result.success).toBe(true);
  });

  it("should not find deleted project", async () => {
    await expect(
      caller.projects.verify({
        projectId: testProjectId,
        password: "new-password-123",
      })
    ).rejects.toThrow("Project not found");
  });
});
