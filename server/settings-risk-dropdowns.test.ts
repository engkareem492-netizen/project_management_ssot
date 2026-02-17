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

describe("Risk Types CRUD via tRPC", () => {
  it("should create a risk type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risks.types.create({
      projectId: 1,
      name: "Technical Risk",
    });

    expect(result).toBeDefined();
    // Result is [ResultSetHeader, undefined] - the first element has insertId
    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[0]).toHaveProperty("insertId");
  });

  it("should list risk types for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const types = await caller.risks.types.list({ projectId: 1 });

    expect(Array.isArray(types)).toBe(true);
    // Should contain at least the one we just created
    expect(types.length).toBeGreaterThanOrEqual(1);
    const found = types.find((t) => t.name === "Technical Risk");
    expect(found).toBeDefined();
  });

  it("should update a risk type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get existing types
    const types = await caller.risks.types.list({ projectId: 1 });
    const techRisk = types.find((t) => t.name === "Technical Risk");
    expect(techRisk).toBeDefined();

    const result = await caller.risks.types.update({
      id: techRisk!.id,
      name: "Technical Risk Updated",
    });

    expect(result).toEqual({ success: true });

    // Verify update
    const updatedTypes = await caller.risks.types.list({ projectId: 1 });
    const updated = updatedTypes.find((t) => t.id === techRisk!.id);
    expect(updated?.name).toBe("Technical Risk Updated");
  });

  it("should delete a risk type", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get existing types
    const types = await caller.risks.types.list({ projectId: 1 });
    const techRisk = types.find((t) => t.name === "Technical Risk Updated");
    expect(techRisk).toBeDefined();

    const result = await caller.risks.types.delete({ id: techRisk!.id });
    expect(result).toEqual({ success: true });

    // Verify deletion
    const afterDelete = await caller.risks.types.list({ projectId: 1 });
    const deleted = afterDelete.find((t) => t.id === techRisk!.id);
    expect(deleted).toBeUndefined();
  });
});

describe("Risk Status CRUD via tRPC", () => {
  it("should create a risk status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risks.status.create({
      projectId: 1,
      name: "Open",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[0]).toHaveProperty("insertId");
  });

  it("should list risk statuses for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const statuses = await caller.risks.status.list({ projectId: 1 });

    expect(Array.isArray(statuses)).toBe(true);
    expect(statuses.length).toBeGreaterThanOrEqual(1);
  });

  it("should delete a risk status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const statuses = await caller.risks.status.list({ projectId: 1 });
    const openStatus = statuses.find((s) => s.name === "Open");
    expect(openStatus).toBeDefined();

    const result = await caller.risks.status.delete({ id: openStatus!.id });
    expect(result).toEqual({ success: true });
  });
});

describe("Response Strategy CRUD via tRPC", () => {
  it("should create a response strategy", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.risks.strategy.create({
      projectId: 1,
      name: "Mitigate",
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[0]).toHaveProperty("insertId");
  });

  it("should list response strategies for a project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const strategies = await caller.risks.strategy.list({ projectId: 1 });

    expect(Array.isArray(strategies)).toBe(true);
    expect(strategies.length).toBeGreaterThanOrEqual(1);
  });

  it("should delete a response strategy", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const strategies = await caller.risks.strategy.list({ projectId: 1 });
    const mitigate = strategies.find((s) => s.name === "Mitigate");
    expect(mitigate).toBeDefined();

    const result = await caller.risks.strategy.delete({ id: mitigate!.id });
    expect(result).toEqual({ success: true });
  });
});
