import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function tryLocalJwtAuth(req: CreateExpressContextOptions["req"]): Promise<User | null> {
  try {
    const token = (req as any).cookies?.auth_token;
    if (!token) return null;

    const decoded = jwt.verify(token, ENV.cookieSecret) as {
      userId: number;
      email: string;
      role: string;
    };

    // Handle master user
    if (decoded.role === "master") {
      return {
        id: 0,
        name: "Kareem (Master)",
        email: "kareem@eid.com",
        role: "admin",
        loginMethod: "local",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        openId: "master",
        password: null,
      } as User;
    }

    const db = await getDb();
    if (!db) return null;

    const userResults = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
    return userResults[0] ?? null;
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Try Manus OAuth session first
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  // Fallback: try local JWT auth (auth_token cookie set by auth.local.router.ts)
  if (!user) {
    user = await tryLocalJwtAuth(opts.req);
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
