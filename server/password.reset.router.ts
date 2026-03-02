import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, passwordResets } from "../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

export const passwordResetRouter = router({
  requestReset: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Check if user exists
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

      if (!user) {
        // Don't reveal if email exists for security
        return { success: true, message: "If the email exists, a reset link has been sent" };
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Delete any existing reset tokens for this email
      await db.delete(passwordResets).where(eq(passwordResets.email, input.email));

      // Store reset token
      await db.insert(passwordResets).values({
        email: input.email,
        token,
        expiresAt,
      });

      // TODO: Send email with reset link
      // For now, we'll just log the token (in production, send via email)
      console.log(`Password reset token for ${input.email}: ${token}`);
      console.log(`Reset link: /reset-password?token=${token}`);

      return { 
        success: true, 
        message: "If the email exists, a reset link has been sent",
        // Remove this in production - only for testing
        token: process.env.NODE_ENV === "development" ? token : undefined,
      };
    }),

  resetPassword: publicProcedure
    .input(
      z.object({
        token: z.string(),
        newPassword: z.string().min(8, "Password must be at least 8 characters"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Find valid reset token
      const [resetRecord] = await db
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.token, input.token),
            gt(passwordResets.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!resetRecord) {
        throw new Error("Invalid or expired reset token");
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      // Update user password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, resetRecord.email));

      // Delete used reset token
      await db.delete(passwordResets).where(eq(passwordResets.token, input.token));

      return { success: true, message: "Password reset successful" };
    }),

  verifyToken: publicProcedure
    .input(
      z.object({
        token: z.string(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      const [resetRecord] = await db
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.token, input.token),
            gt(passwordResets.expiresAt, new Date())
          )
        )
        .limit(1);

      return { valid: !!resetRecord };
    }),
});
