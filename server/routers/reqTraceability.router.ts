import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  requirements,
  features,
  featureRequirements,
  userStories,
  requirementUserStories,
  testCases,
  userStoryTestCases,
  requirementTestCases,
  defects,
  defectTestCases,
} from "../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

export const reqTraceabilityRouter = router({
  /**
   * Full chain for a project:
   * Requirement → Features → User Stories → Test Cases → Defects
   */
  chain: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const { projectId } = input;

      // Fetch all entities in parallel
      const [
        allReqs,
        allFeatures,
        allFeatReqs,
        allStories,
        allReqStories,
        allTestCases,
        allStoryTCs,
        allReqTCs,
        allDefects,
        allDefectTCs,
      ] = await Promise.all([
        db.select().from(requirements).where(eq(requirements.projectId, projectId)),
        db.select().from(features).where(eq(features.projectId, projectId)),
        db.select().from(featureRequirements),
        db.select().from(userStories).where(eq(userStories.projectId, projectId)),
        db.select().from(requirementUserStories),
        db.select().from(testCases).where(eq(testCases.projectId, projectId)),
        db.select().from(userStoryTestCases),
        db.select().from(requirementTestCases),
        db.select().from(defects).where(eq(defects.projectId, projectId)),
        db.select().from(defectTestCases),
      ]);

      return allReqs.map((req) => {
        // Features linked to this requirement
        const linkedFeatReqIds = allFeatReqs
          .filter((fr) => fr.requirementId === req.id)
          .map((fr) => fr.featureId);
        const linkedFeatures = allFeatures.filter((f) => linkedFeatReqIds.includes(f.id));

        // User stories linked to this requirement (via junction table)
        const linkedStoryIds = allReqStories
          .filter((rs) => rs.requirementId === req.id)
          .map((rs) => rs.userStoryId);
        const linkedStories = allStories.filter((us) => linkedStoryIds.includes(us.id));

        // Test cases linked to this requirement (via direct requirementId OR via requirementTestCases junction)
        const junctionTCIds = allReqTCs
          .filter((rt) => rt.requirementId === req.id)
          .map((rt) => rt.testCaseId);
        const linkedTestCases = allTestCases.filter(
          (tc) => tc.requirementId === req.idCode || junctionTCIds.includes(tc.id)
        );

        // Test cases linked via user stories
        const storyTCIds = allStoryTCs
          .filter((st) => linkedStoryIds.includes(st.userStoryId))
          .map((st) => st.testCaseId);
        const storyTestCases = allTestCases.filter((tc) => storyTCIds.includes(tc.id));

        // Merge all test cases (deduplicated)
        const allLinkedTCIds = new Set([
          ...linkedTestCases.map((tc) => tc.id),
          ...storyTestCases.map((tc) => tc.id),
        ]);
        const mergedTestCases = allTestCases.filter((tc) => allLinkedTCIds.has(tc.id));

        // Defects linked to any of these test cases
        const defectIds = allDefectTCs
          .filter((dt) => allLinkedTCIds.has(dt.testCaseId))
          .map((dt) => dt.defectId);
        const linkedDefects = allDefects.filter((d) => defectIds.includes(d.id));

        const testPassed = mergedTestCases.filter((tc) => tc.status === "Passed").length;
        const testFailed = mergedTestCases.filter((tc) => tc.status === "Failed").length;
        const testTotal = mergedTestCases.length;
        const testCoverage = testTotal > 0 ? Math.round((testPassed / testTotal) * 100) : null;
        const openDefects = linkedDefects.filter(
          (d) => d.status !== "Closed" && d.status !== "Fixed" && d.status !== "Verified"
        ).length;

        return {
          req: {
            id: req.id,
            idCode: req.idCode,
            description: req.description,
            status: req.status,
            priority: req.priority,
            category: req.category,
            type: req.type,
          },
          features: linkedFeatures.map((f) => ({
            id: f.id,
            featureCode: f.featureCode,
            title: f.title,
            status: f.status,
            priority: f.priority,
          })),
          userStories: linkedStories.map((us) => ({
            id: us.id,
            storyCode: us.storyCode,
            title: us.title,
            status: us.status,
            priority: us.priority,
            storyPoints: us.storyPoints,
          })),
          testCases: mergedTestCases.map((tc) => ({
            id: tc.id,
            testId: tc.testId,
            title: tc.title,
            status: tc.status,
            priority: tc.priority,
          })),
          defects: linkedDefects.map((d) => ({
            id: d.id,
            defectCode: d.defectCode,
            title: d.title,
            status: d.status,
            severity: d.severity,
            priority: d.priority,
          })),
          summary: {
            featureCount: linkedFeatures.length,
            storyCount: linkedStories.length,
            testTotal,
            testPassed,
            testFailed,
            testCoverage,
            defectCount: linkedDefects.length,
            openDefects,
          },
        };
      });
    }),
});
