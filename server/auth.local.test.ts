import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Local Authentication", () => {
  const createContext = (): TrpcContext => ({
    user: null,
    req: {
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  });

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = "testpassword123";
  const testName = "Test User";

  it("should register a new user", async () => {
    const caller = appRouter.createCaller(createContext());
    
    const result = await caller.auth.register({
      name: testName,
      email: testEmail,
      password: testPassword,
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("message", "Registration successful");
  });

  it("should not register duplicate email", async () => {
    const caller = appRouter.createCaller(createContext());
    
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    
    // First registration should succeed
    await caller.auth.register({
      name: testName,
      email: duplicateEmail,
      password: testPassword,
    });

    // Second registration with same email should fail
    await expect(
      caller.auth.register({
        name: testName,
        email: duplicateEmail,
        password: testPassword,
      })
    ).rejects.toThrow();
  });

  it("should login with correct credentials", async () => {
    const caller = appRouter.createCaller(createContext());
    
    const uniqueEmail = `login-test-${Date.now()}@example.com`;
    
    // Register first
    await caller.auth.register({
      name: testName,
      email: uniqueEmail,
      password: testPassword,
    });

    // Then login
    const result = await caller.auth.login({
      email: uniqueEmail,
      password: testPassword,
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("user");
    expect(result.user).toHaveProperty("email", uniqueEmail);
  });

  it("should not login with incorrect password", async () => {
    const caller = appRouter.createCaller(createContext());
    
    const uniqueEmail = `wrong-pass-${Date.now()}@example.com`;
    
    // Register first
    await caller.auth.register({
      name: testName,
      email: uniqueEmail,
      password: testPassword,
    });

    // Try login with wrong password
    await expect(
      caller.auth.login({
        email: uniqueEmail,
        password: "wrongpassword",
      })
    ).rejects.toThrow();
  });

  it("should not login with non-existent email", async () => {
    const caller = appRouter.createCaller(createContext());
    
    await expect(
      caller.auth.login({
        email: `nonexistent-${Date.now()}@example.com`,
        password: testPassword,
      })
    ).rejects.toThrow();
  });
});
