import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { projectCurrencies, exchangeRates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { getDb } from "../db";

export const currenciesRouter = router({
  // List all currencies for a project
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");
      return db
        .select()
        .from(projectCurrencies)
        .where(eq(projectCurrencies.projectId, input.projectId))
        .orderBy(projectCurrencies.sortOrder);
    }),

  // Add a currency to the project
  add: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        currencyCode: z.string().max(10),
        currencyName: z.string().max(80),
        symbol: z.string().max(10).default(""),
        isBase: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");

      // If setting as base, unset all others first
      if (input.isBase) {
        await db
          .update(projectCurrencies)
          .set({ isBase: false })
          .where(eq(projectCurrencies.projectId, input.projectId));
      }

      // Get max sort order
      const existing = await db
        .select()
        .from(projectCurrencies)
        .where(eq(projectCurrencies.projectId, input.projectId));
      const sortOrder = existing.length;

      return db.insert(projectCurrencies).values({
        projectId: input.projectId,
        currencyCode: input.currencyCode.toUpperCase(),
        currencyName: input.currencyName,
        symbol: input.symbol,
        isBase: input.isBase,
        sortOrder,
      });
    }),

  // Update a currency
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        projectId: z.number(),
        currencyCode: z.string().max(10).optional(),
        currencyName: z.string().max(80).optional(),
        symbol: z.string().max(10).optional(),
        isBase: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");

      if (input.isBase) {
        await db
          .update(projectCurrencies)
          .set({ isBase: false })
          .where(eq(projectCurrencies.projectId, input.projectId));
      }

      const { id, projectId, ...rest } = input;
      const updateData: Record<string, unknown> = {};
      if (rest.currencyCode !== undefined) updateData.currencyCode = rest.currencyCode.toUpperCase();
      if (rest.currencyName !== undefined) updateData.currencyName = rest.currencyName;
      if (rest.symbol !== undefined) updateData.symbol = rest.symbol;
      if (rest.isBase !== undefined) updateData.isBase = rest.isBase;

      return db
        .update(projectCurrencies)
        .set(updateData)
        .where(and(eq(projectCurrencies.id, id), eq(projectCurrencies.projectId, projectId)));
    }),

  // Remove a currency
  remove: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");
      return db
        .delete(projectCurrencies)
        .where(and(eq(projectCurrencies.id, input.id), eq(projectCurrencies.projectId, input.projectId)));
    }),

  // List exchange rates for a project
  ratesList: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");
      return db
        .select()
        .from(exchangeRates)
        .where(eq(exchangeRates.projectId, input.projectId));
    }),

  // Upsert an exchange rate (from → to)
  upsertRate: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        fromCurrencyCode: z.string().max(10),
        toCurrencyCode: z.string().max(10),
        baselineRate: z.string(),
        currentRate: z.string(),
        predictedRate: z.string(),
        effectiveDate: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");

      // Check if rate pair already exists
      const existing = await db
        .select()
        .from(exchangeRates)
        .where(
          and(
            eq(exchangeRates.projectId, input.projectId),
            eq(exchangeRates.fromCurrencyCode, input.fromCurrencyCode.toUpperCase()),
            eq(exchangeRates.toCurrencyCode, input.toCurrencyCode.toUpperCase())
          )
        );

      if (existing.length > 0) {
        return db
          .update(exchangeRates)
          .set({
            baselineRate: input.baselineRate,
            currentRate: input.currentRate,
            predictedRate: input.predictedRate,
            effectiveDate: input.effectiveDate,
            notes: input.notes,
          })
          .where(eq(exchangeRates.id, existing[0].id));
      } else {
        return db.insert(exchangeRates).values({
          projectId: input.projectId,
          fromCurrencyCode: input.fromCurrencyCode.toUpperCase(),
          toCurrencyCode: input.toCurrencyCode.toUpperCase(),
          baselineRate: input.baselineRate,
          currentRate: input.currentRate,
          predictedRate: input.predictedRate,
          effectiveDate: input.effectiveDate,
          notes: input.notes,
        });
      }
    }),

  // Delete an exchange rate
  deleteRate: protectedProcedure
    .input(z.object({ id: z.number(), projectId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("DB not available");
      return db
        .delete(exchangeRates)
        .where(and(eq(exchangeRates.id, input.id), eq(exchangeRates.projectId, input.projectId)));
    }),
});
