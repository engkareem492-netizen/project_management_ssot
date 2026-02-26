import { z } from "zod";
import bcrypt from "bcrypt";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";

const SALT_ROUNDS = 10;

export const authLocalRouter = router({
  /**
   * Register a new user with email and password
   */
  register: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user already exists
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const existingUsers = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const existingUser = existingUsers[0];

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "User with this email already exists",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Create user
      const [newUser] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        loginMethod: "local",
        role: "user",
        openId: null,
      });

      return {
        success: true,
        message: "Registration successful",
      };
    }),

  /**
   * Login with email and password
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check for master user credentials
      if (input.email === "Kareem" && input.password === "BlackViper") {
        // Create JWT token for master user
        const token = jwt.sign(
          {
            userId: 0,
            email: "Kareem",
            role: "master",
          },
          ENV.cookieSecret,
          { expiresIn: "7d" }
        );

        // Set cookie
        if (ctx.res) {
          ctx.res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: "/",
          });
        }

        return {
          success: true,
          user: {
            id: 0,
            name: "Kareem (Master)",
            email: "Kareem",
            role: "master",
          },
        };
      }

      // Find user by email
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userResults = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      const user = userResults[0];

      if (!user || !user.password) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(input.password, user.password);

      if (!isValidPassword) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      // Update last signed in
      await db
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      // Create JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        ENV.cookieSecret,
        { expiresIn: "7d" }
      );

      // Set cookie
      if (ctx.res) {
        ctx.res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          path: "/",
        });
      }

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  /**
   * Logout - clear session
   */
  logout: publicProcedure.mutation(async ({ ctx }) => {
    if (ctx.res) {
      ctx.res.clearCookie("auth_token", { path: "/" });
    }

    return {
      success: true,
      message: "Logged out successfully",
    };
  }),

  /**
   * Get current user - works with both JWT token and OAuth session
   */
  me: publicProcedure.query(async ({ ctx }) => {
    // First try OAuth session (from context)
    if (ctx.user) {
      return ctx.user;
    }

    // Then try JWT token (local auth)
    const token = ctx.req?.cookies?.auth_token;

    if (!token) {
      return null;
    }

    try {
      const decoded = jwt.verify(token, ENV.cookieSecret) as {
        userId: number;
        email: string;
        role: string;
      };

      // Handle master user
      if (decoded.role === 'master') {
        return {
          id: 0,
          name: "Kareem (Master)",
          email: "Kareem",
          role: "master",
          loginMethod: "local",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
          openId: null,
        };
      }

      const db = await getDb();
      if (!db) {
        return null;
      }

      const userResults = await db.select().from(users).where(eq(users.id, decoded.userId)).limit(1);
      const user = userResults[0];

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        loginMethod: user.loginMethod,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastSignedIn: user.lastSignedIn,
        openId: user.openId,
      };
    } catch (error) {
      return null;
    }
  }),
});
