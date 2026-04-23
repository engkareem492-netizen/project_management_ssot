import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { escalations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const escalationsRouter = router({
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(escalations)
        .where(eq(escalations.projectId, input.projectId))
        .orderBy(desc(escalations.createdAt));
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        level: z.number().min(1).max(3).default(1),
        status: z.string().default("Open"),
        raisedBy: z.string().optional(),
        raisedAt: z.string().optional(),
        dueDate: z.string().optional(),
        slaHours: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Generate code: ESC-001
      const existing = await db
        .select({ code: escalations.code })
        .from(escalations)
        .where(eq(escalations.projectId, input.projectId))
        .orderBy(desc(escalations.createdAt));
      const maxNum = existing.reduce((max, r) => {
        const m = r.code?.match(/ESC-(\d+)/);
        return m ? Math.max(max, parseInt(m[1])) : max;
      }, 0);
      const code = `ESC-${String(maxNum + 1).padStart(3, "0")}`;

      const [result] = await db.insert(escalations).values({
        projectId: input.projectId,
        code,
        title: input.title,
        description: input.description,
        level: input.level,
        status: input.status,
        raisedBy: input.raisedBy,
        raisedAt: input.raisedAt || new Date().toISOString().slice(0, 10),
        dueDate: input.dueDate,
        slaHours: input.slaHours,
        notes: input.notes,
      });
      return { id: (result as any).insertId, code };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        level: z.number().min(1).max(3).optional(),
        status: z.string().optional(),
        raisedBy: z.string().optional(),
        raisedAt: z.string().optional(),
        dueDate: z.string().optional(),
        resolvedAt: z.string().optional(),
        slaHours: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const { id, ...data } = input;
      await db.update(escalations).set(data).where(eq(escalations.id, id));
      return { ok: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.delete(escalations).where(eq(escalations.id, input.id));
      return { ok: true };
    }),

  stats: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { total: 0, open: 0, resolved: 0, byLevel: {} };
      const rows = await db
        .select()
        .from(escalations)
        .where(eq(escalations.projectId, input.projectId));
      const open = rows.filter((r) => !["Resolved", "Closed"].includes(r.status || "")).length;
      const resolved = rows.filter((r) => ["Resolved", "Closed"].includes(r.status || "")).length;
      const byLevel: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
      rows.forEach((r) => {
        const l = r.level ?? 1;
        byLevel[l] = (byLevel[l] || 0) + 1;
      });
      // SLA compliance: resolved within slaHours
      const slaRows = rows.filter((r) => r.slaHours && r.raisedAt && r.resolvedAt);
      const slaCompliant = slaRows.filter((r) => {
        const raised = new Date(r.raisedAt!).getTime();
        const resolved = new Date(r.resolvedAt!).getTime();
        const hours = (resolved - raised) / (1000 * 60 * 60);
        return hours <= (r.slaHours ?? Infinity);
      }).length;
      const slaCompliance = slaRows.length > 0 ? Math.round((slaCompliant / slaRows.length) * 100) : 100;
      return { total: rows.length, open, resolved, byLevel, slaCompliance };
    }),
});
