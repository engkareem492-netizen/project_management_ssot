import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-v2",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Stakeholder Management", () => {
  it("creates and manages stakeholders", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const timestamp = Date.now();

    // Create
    const created = await caller.stakeholders.create({
      fullName: `Test User ${timestamp}`,
      email: `test.${timestamp}@example.com`,
      position: "Project Manager",
    });

    expect(created).toBeDefined();
    expect(created.fullName).toBe(`Test User ${timestamp}`);
    expect(created.id).toBeDefined();

    // Update
    const updated = await caller.stakeholders.update({
      id: created.id,
      data: { position: "Senior Manager" },
    });

    expect(updated.position).toBe("Senior Manager");

    // Delete
    const deleted = await caller.stakeholders.delete({ id: created.id });
    expect(deleted.success).toBe(true);
  });

  it("lists all stakeholders", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stakeholders.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Deliverables Management", () => {
  it("creates and manages deliverables", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create
    const created = await caller.deliverables.create({
      description: `Test deliverable ${Date.now()}`,
      status: "Pending",
    });

    expect(created).toBeDefined();
    expect(created.deliverableId).toMatch(/^DEL-\d{4}$/);
    expect(created.id).toBeDefined();

    // Update
    const updated = await caller.deliverables.update({
      id: created.id,
      data: { status: "In Progress" },
    });

    expect(updated.status).toBe("In Progress");

    // Delete
    const deleted = await caller.deliverables.delete({ id: created.id });
    expect(deleted.success).toBe(true);
  });

  it("lists all deliverables", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.deliverables.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Entity Lists", () => {
  it("returns requirements list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.requirements.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns tasks list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.tasks.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("returns issues list", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.issues.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
