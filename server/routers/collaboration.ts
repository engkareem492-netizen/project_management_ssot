import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { projectMembers, projectInvitations, projects, users, ProjectInvitation } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

/**
 * Collaboration router - handles project invitations and member management
 */
export const collaborationRouter = router({
  /**
   * Get all members of a project
   */
  getProjectMembers: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const members = await db
        .select({
          id: projectMembers.id,
          userId: projectMembers.userId,
          role: projectMembers.role,
          joinedAt: projectMembers.joinedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(projectMembers)
        .leftJoin(users, eq(projectMembers.userId, users.id))
        .where(eq(projectMembers.projectId, input.projectId));

      return members;
    }),

  /**
   * Get pending invitations for a project
   */
  getPendingInvitations: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const invitations = await db
        .select()
        .from(projectInvitations)
        .where(eq(projectInvitations.projectId, input.projectId));

      // Filter out expired invitations
      const now = new Date();
      return invitations.filter((inv: ProjectInvitation) => new Date(inv.expiresAt) > now);
    }),

  /**
   * Invite a user to a project by email
   */
  inviteUserByEmail: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        email: z.string().email(),
        role: z.enum(["editor", "viewer"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(projectMembers)
        .leftJoin(users, eq(projectMembers.userId, users.id))
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(users.email, input.email)
          )
        );

      if (existingMember.length > 0) {
        throw new Error("User is already a member of this project");
      }

      // Check if there's already a pending invitation
      const existingInvitation = await db
        .select()
        .from(projectInvitations)
        .where(
          and(
            eq(projectInvitations.projectId, input.projectId),
            eq(projectInvitations.email, input.email)
          )
        );

      if (existingInvitation.length > 0) {
        // Check if it's expired
        const now = new Date();
        const notExpired = existingInvitation.filter(
          (inv: ProjectInvitation) => new Date(inv.expiresAt) > now
        );
        if (notExpired.length > 0) {
          throw new Error("An invitation has already been sent to this email");
        }
      }

      // Generate invitation token
      const token = crypto.randomBytes(32).toString("hex");

      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      await db.insert(projectInvitations).values({
        projectId: input.projectId,
        email: input.email,
        token,
        role: input.role,
        invitedBy: ctx.user.id,
        expiresAt,
      });

      // In production, send email here
      // For now, log the invitation link
      const invitationLink = `${process.env.VITE_OAUTH_PORTAL_URL || "http://localhost:3000"}/accept-invitation?token=${token}`;
      console.log(`Invitation link for ${input.email}: ${invitationLink}`);

      return {
        success: true,
        message: "Invitation sent successfully",
        invitationLink, // Return for development/testing
      };
    }),

  /**
   * Accept an invitation and join a project
   */
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Find the invitation
      const invitation = await db
        .select()
        .from(projectInvitations)
        .where(eq(projectInvitations.token, input.token))
        .limit(1);

      if (invitation.length === 0) {
        throw new Error("Invalid invitation token");
      }

      const inv = invitation[0];

      // Check if expired
      if (new Date(inv.expiresAt) < new Date()) {
        throw new Error("This invitation has expired");
      }

      // Check if user's email matches invitation
      if (ctx.user.email !== inv.email) {
        throw new Error("This invitation is for a different email address");
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, inv.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        );

      if (existingMember.length > 0) {
        throw new Error("You are already a member of this project");
      }

      // Add user to project members
      await db.insert(projectMembers).values({
        projectId: inv.projectId,
        userId: ctx.user.id,
        role: inv.role,
      });

      // Delete the invitation
      await db
        .delete(projectInvitations)
        .where(eq(projectInvitations.id, inv.id));

      return {
        success: true,
        projectId: inv.projectId,
        message: "Successfully joined the project",
      };
    }),

  /**
   * Remove a member from a project
   */
  removeMember: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        memberId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if the current user is the project owner
      const projectOwner = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id),
            eq(projectMembers.role, "owner")
          )
        );

      if (projectOwner.length === 0) {
        throw new Error("Only project owners can remove members");
      }

      // Don't allow removing the owner
      const memberToRemove = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.id, input.memberId))
        .limit(1);

      if (memberToRemove.length > 0 && memberToRemove[0].role === "owner") {
        throw new Error("Cannot remove the project owner");
      }

      // Remove the member
      await db.delete(projectMembers).where(eq(projectMembers.id, input.memberId));

      return { success: true, message: "Member removed successfully" };
    }),

  /**
   * Cancel a pending invitation
   */
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .delete(projectInvitations)
        .where(eq(projectInvitations.id, input.invitationId));

      return { success: true, message: "Invitation cancelled" };
    }),

  /**
   * Generate a shareable project link with password
   */
  generateShareableLink: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Check if user has access to this project
      const member = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        );

      if (member.length === 0) {
        throw new Error("You don't have access to this project");
      }

      // Update project password
      const bcrypt = await import("bcrypt");
      const hashedPassword = await bcrypt.hash(input.password, 10);

      await db
        .update(projects)
        .set({ password: hashedPassword })
        .where(eq(projects.id, input.projectId));

      // Generate shareable link
      const shareLink = `${process.env.VITE_OAUTH_PORTAL_URL || "http://localhost:3000"}/join-project/${input.projectId}`;

      return {
        success: true,
        shareLink,
        message: "Shareable link generated successfully",
      };
    }),

  /**
   * Join a project using password-protected link
   */
  joinProjectWithPassword: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get project
      const project = await db
        .select()
        .from(projects)
        .where(eq(projects.id, input.projectId))
        .limit(1);

      if (project.length === 0) {
        throw new Error("Project not found");
      }

      // Verify password
      if (!project[0].password) {
        throw new Error("This project does not require a password");
      }
      const bcrypt = await import("bcrypt");
      const passwordMatch = await bcrypt.compare(
        input.password,
        project[0].password
      );

      if (!passwordMatch) {
        throw new Error("Incorrect password");
      }

      // Check if user is already a member
      const existingMember = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, input.projectId),
            eq(projectMembers.userId, ctx.user.id)
          )
        );

      if (existingMember.length > 0) {
        return {
          success: true,
          message: "You are already a member of this project",
          projectId: input.projectId,
        };
      }

      // Add user as viewer
      await db.insert(projectMembers).values({
        projectId: input.projectId,
        userId: ctx.user.id,
        role: "viewer",
      });

      return {
        success: true,
        projectId: input.projectId,
        message: "Successfully joined the project",
      };
    }),
});
