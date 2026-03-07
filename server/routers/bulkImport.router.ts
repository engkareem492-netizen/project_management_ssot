/**
 * Bulk Import / Export Router
 * Provides Excel template download and bulk upload (append | replace) for all 9 modules.
 * Files are transferred as base64 strings to stay within the tRPC/JSON transport.
 */
import { z } from "zod";
import * as XLSX from "xlsx";
import { eq, and, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../_core/trpc";
import * as db from "../db";
import {
  requirements, tasks, issues, dependencies, assumptions,
  stakeholders, deliverables, knowledgeBase, risks, taskGroups,
  idSequences,
} from "../../drizzle/schema";

// ─── Column definitions per module ────────────────────────────────────────────
const TEMPLATES: Record<string, { headers: string[]; example: Record<string, string> }> = {
  requirements: {
    headers: ["description", "category", "type", "status", "priority", "source", "owner", "notes"],
    example: {
      description: "System must allow users to log in with email and password",
      category: "Functional",
      type: "Business",
      status: "Active",
      priority: "High",
      source: "Business",
      owner: "John Doe",
      notes: "",
    },
  },
  tasks: {
    headers: ["description", "status", "priority", "assignDate", "dueDate", "responsible", "accountable", "consulted", "informed", "requirementCode", "taskGroupCode", "notes"],
    example: {
      description: "Create wireframes for the login page",
      status: "In Progress",
      priority: "High",
      assignDate: "2026-03-01",
      dueDate: "2026-03-15",
      responsible: "John Doe",
      accountable: "Jane Smith",
      consulted: "",
      informed: "",
      requirementCode: "REQ-0001",
      taskGroupCode: "TG-0001",
      notes: "",
    },
  },
  issues: {
    headers: ["description", "status", "priority", "type", "class", "source", "owner", "openDate", "resolutionDate"],
    example: {
      description: "Login button is unresponsive on mobile",
      status: "Open",
      priority: "High",
      type: "Bug",
      class: "Technical",
      source: "User Report",
      owner: "John Doe",
      openDate: "2026-03-01",
      resolutionDate: "",
    },
  },
  dependencies: {
    headers: ["description", "depGroup", "taskId", "requirementId", "responsible", "accountable", "consulted", "informed", "dueDate", "currentStatus"],
    example: {
      description: "Login module must be complete before dashboard",
      depGroup: "Technical",
      taskId: "TASK-001",
      requirementId: "REQ-001",
      responsible: "John Doe",
      accountable: "Jane Smith",
      consulted: "",
      informed: "",
      dueDate: "2026-04-01",
      currentStatus: "On Track",
    },
  },
  assumptions: {
    headers: ["description", "category", "status", "owner", "notes"],
    example: {
      description: "Internet connectivity is available at all project sites",
      category: "Technical",
      status: "Active",
      owner: "John Doe",
      notes: "",
    },
  },
  stakeholders: {
    headers: ["fullName", "email", "phone", "position", "role", "department"],
    example: {
      fullName: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 234 567 8900",
      position: "Project Sponsor",
      role: "Decision Maker",
      department: "Chief Executive Officer",
    },
  },
  deliverables: {
    headers: ["description", "status", "dueDate"],
    example: {
      description: "System Design Document",
      status: "In Progress",
      dueDate: "2026-04-01",
    },
  },
  knowledgeBase: {
    headers: ["title", "description"],
    example: {
      title: "API Integration Guide",
      description: "How to integrate with the payment gateway API",
    },
  },
  risks: {
    headers: ["title", "impact", "probability", "identifiedOn", "residualImpact", "residualProbability"],
    example: {
      title: "Key developer resignation",
      impact: "4",
      probability: "3",
      identifiedOn: "2026-03-01",
      residualImpact: "2",
      residualProbability: "2",
    },
  },
};

// ─── Helper: build xlsx buffer (single sheet) ─────────────────────────────────
function buildXlsx(sheetName: string, headers: string[], rows: Record<string, any>[]): Buffer {
  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws["!cols"] = headers.map(() => ({ wch: 26 }));
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Helper: build xlsx buffer (multi-sheet) ──────────────────────────────────
function buildXlsxMultiSheet(sheets: { name: string; headers: string[]; rows: Record<string, any>[] }[]): Buffer {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const wsData = [sheet.headers, ...sheet.rows.map((r) => sheet.headers.map((h) => r[h] ?? ""))];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = sheet.headers.map(() => ({ wch: 26 }));
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─── Helper: parse base64 xlsx ─────────────────────────────────────────────────
function parseXlsx(base64: string): Record<string, string>[] {
  const buf = Buffer.from(base64, "base64");
  const wb = XLSX.read(buf, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const bulkImportRouter = router({
  downloadTemplate: protectedProcedure
    .input(z.object({
      module: z.enum(["requirements", "tasks", "issues", "dependencies", "assumptions", "stakeholders", "deliverables", "knowledgeBase", "risks"]),
    }))
    .query(async ({ input }) => {
      const tpl = TEMPLATES[input.module];
      // Tasks template includes a second sheet for Task Groups
      if (input.module === "tasks") {
        const buf = buildXlsxMultiSheet([
          { name: "Tasks", headers: tpl.headers, rows: [tpl.example] },
          { name: "Task Groups", headers: ["name", "description"], rows: [{ name: "TG-0001 - Frontend Tasks", description: "All frontend related tasks" }] },
        ]);
        return { base64: buf.toString("base64"), filename: "tasks_template.xlsx" };
      }
      const buf = buildXlsx(input.module, tpl.headers, [tpl.example]);
      return { base64: buf.toString("base64"), filename: `${input.module}_template.xlsx` };
    }),

  upload: protectedProcedure
    .input(z.object({
      module: z.enum(["requirements", "tasks", "issues", "dependencies", "assumptions", "stakeholders", "deliverables", "knowledgeBase", "risks"]),
      projectId: z.number(),
      mode: z.enum(["append", "replace"]),
      fileBase64: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { module, projectId, mode, fileBase64 } = input;
      const rows = parseXlsx(fileBase64);
      if (!rows.length) return { imported: 0, skipped: 0, errors: ["File is empty or has no data rows"] };

      const errors: string[] = [];
      let imported = 0;
      let skipped = 0;

      if (mode === "replace") {
        await purgeModule(module, projectId);
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        try {
          await importRow(module, projectId, row);
          imported++;
        } catch (e: any) {
          errors.push(`Row ${rowNum}: ${e.message}`);
          skipped++;
        }
      }

      return { imported, skipped, errors: errors.slice(0, 20) };
    }),

  exportData: protectedProcedure
    .input(z.object({
      module: z.enum(["requirements", "tasks", "issues", "dependencies", "assumptions", "stakeholders", "deliverables", "knowledgeBase", "risks"]),
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      const { module, projectId } = input;
      const tpl = TEMPLATES[module];
      const rows = await fetchModuleData(module, projectId);
      // Tasks export includes a second sheet for Task Groups
      if (module === "tasks") {
        const dbConn = await db.getDb();
        const tgRows = dbConn ? await dbConn.select().from(taskGroups).where(eq(taskGroups.projectId, projectId)) : [];
        const buf = buildXlsxMultiSheet([
          { name: "Tasks", headers: tpl.headers, rows },
          { name: "Task Groups", headers: ["name", "description"], rows: tgRows.map((tg) => ({ name: tg.name ?? "", description: tg.description ?? "" })) },
        ]);
        return { base64: buf.toString("base64"), filename: "tasks_export.xlsx" };
      }
      const buf = buildXlsx(module, tpl.headers, rows);
      return { base64: buf.toString("base64"), filename: `${module}_export.xlsx` };
    }),
});

// ─── Purge ─────────────────────────────────────────────────────────────────────
// Map from module name to the entityType key used in idSequences
const MODULE_ENTITY_TYPE: Record<string, string> = {
  requirements: "requirement",
  tasks: "task",
  issues: "issue",
  dependencies: "dependency",
  assumptions: "assumption",
  deliverables: "deliverable",
  risks: "RISK",
  // stakeholders and knowledgeBase have no auto-ID sequence
};

async function purgeModule(module: string, projectId: number) {
  const dbConn = await db.getDb();
  if (!dbConn) throw new Error("Database not available");
  const tableMap: Record<string, any> = {
    requirements, tasks, issues, dependencies, assumptions,
    stakeholders, deliverables, knowledgeBase, risks,
  };
  const table = tableMap[module];
  if (!table) throw new Error(`Unknown module: ${module}`);
  // Delete all rows for this project
  await dbConn.delete(table).where(eq(table.projectId, projectId));
  // Reset ALL ID sequence rows for this module (handles duplicate rows with different casing)
  // Use raw SQL LIKE so 'RISK' and 'risk' are both reset in one statement
  const entityType = MODULE_ENTITY_TYPE[module];
  if (entityType) {
    await dbConn.execute(
      sql`UPDATE idSequences SET currentNumber = 0 WHERE projectId = ${projectId} AND LOWER(entityType) = LOWER(${entityType})`
    );
  }
}

// ─── Import row ────────────────────────────────────────────────────────────────
async function importRow(module: string, projectId: number, row: Record<string, string>) {
  const dbConn = await db.getDb();
  if (!dbConn) throw new Error("Database not available");

  switch (module) {
    case "requirements": {
      const id = await db.getNextId("requirement", "REQ", projectId);
      await dbConn.insert(requirements).values({
        projectId,
        idCode: id,
        description: row.description || null,
        category: row.category || null,
        type: row.type || null,
        status: row.status || "Active",
        priority: row.priority || null,
        source: row.source || null,
        owner: row.owner || null,
      });
      break;
    }
    case "tasks": {
      const id = await db.getNextId("task", "TASK", projectId);
      // requirementId is stored as the code string (e.g. "REQ-0001")
      const requirementIdStr = row.requirementCode?.trim() || null;
      // taskGroup is stored as the group name string
      // If user provides a code like "TG-0001" try to resolve to the group name
      let taskGroupName: string | null = row.taskGroupCode?.trim() || null;
      if (taskGroupName) {
        const tgRows = await dbConn.select().from(taskGroups)
          .where(eq(taskGroups.projectId, projectId));
        const match = tgRows.find((tg) =>
          tg.name?.toLowerCase() === taskGroupName!.toLowerCase() ||
          tg.idCode?.toLowerCase() === taskGroupName!.toLowerCase()
        );
        if (match) taskGroupName = match.name ?? taskGroupName;
      }
      await dbConn.insert(tasks).values({
        projectId,
        taskId: id,
        description: row.description || null,
        status: row.status || "Not Started",
        priority: row.priority || null,
        assignDate: row.assignDate || null,
        dueDate: row.dueDate || null,
        responsible: row.responsible || null,
        accountable: row.accountable || null,
        consulted: row.consulted || null,
        informed: row.informed || null,
        requirementId: requirementIdStr,
        taskGroup: taskGroupName,
      });
      break;
    }
    case "issues": {
      const id = await db.getNextId("issue", "ISS", projectId);
      await dbConn.insert(issues).values({
        projectId,
        issueId: id,
        description: row.description || null,
        status: row.status || "Open",
        priority: row.priority || null,
        type: row.type || null,
        class: row.class || null,
        source: row.source || null,
        owner: row.owner || null,
        openDate: row.openDate || null,
        resolutionDate: row.resolutionDate || null,
      });
      break;
    }
    case "dependencies": {
      const id = await db.getNextId("dependency", "DEP", projectId);
      await dbConn.insert(dependencies).values({
        projectId,
        dependencyId: id,
        description: row.description || null,
        depGroup: row.depGroup || null,
        taskId: row.taskId || null,
        requirementId: row.requirementId || null,
        responsible: row.responsible || null,
        accountable: row.accountable || null,
        consulted: row.consulted || null,
        informed: row.informed || null,
        dueDate: row.dueDate || null,
        currentStatus: row.currentStatus || null,
      });
      break;
    }
    case "assumptions": {
      const id = await db.getNextId("assumption", "ASM", projectId);
      await dbConn.insert(assumptions).values({
        projectId,
        assumptionId: id,
        description: row.description || null,
        category: row.category || null,
        status: row.status || null,
        owner: row.owner || null,
        notes: row.notes || null,
      });
      break;
    }
    case "stakeholders": {
      if (!row.fullName?.trim()) throw new Error("fullName is required");
      await dbConn.insert(stakeholders).values({
        projectId,
        fullName: row.fullName.trim(),
        email: row.email || null,
        phone: row.phone || null,
        position: row.position || null,
        role: row.role || null,
        // Accept both "department" (new) and "job" (legacy) column names
        job: row.department || row.job || null,
      });
      break;
    }
    case "deliverables": {
      const id = await db.getNextId("deliverable", "DEL", projectId);
      await dbConn.insert(deliverables).values({
        projectId,
        deliverableId: id,
        description: row.description || null,
        status: row.status || null,
        dueDate: row.dueDate || null,
      });
      break;
    }
    case "knowledgeBase": {
      const id = await db.getNextId("knowledgeBase", "KB", projectId);
      if (!row.title?.trim()) throw new Error("title is required");
      await dbConn.insert(knowledgeBase).values({
        projectId,
        code: id,
        title: row.title.trim(),
        description: row.description || null,
      });
      break;
    }
    case "risks": {
      const id = await db.getNextId("risk", "RISK", projectId);
      const impact = Math.max(1, Math.min(5, Number(row.impact) || 1));
      const probability = Math.max(1, Math.min(5, Number(row.probability) || 1));
      const residualImpact = row.residualImpact ? Math.max(1, Math.min(5, Number(row.residualImpact))) : null;
      const residualProbability = row.residualProbability ? Math.max(1, Math.min(5, Number(row.residualProbability))) : null;
      if (!row.title?.trim()) throw new Error("title is required");
      await dbConn.insert(risks).values({
        projectId,
        riskId: id,
        title: row.title.trim(),
        impact,
        probability,
        score: impact * probability,
        residualImpact,
        residualProbability,
        residualScore: residualImpact && residualProbability ? residualImpact * residualProbability : null,
        identifiedOn: row.identifiedOn ? new Date(row.identifiedOn) : new Date(),
      });
      break;
    }
  }
}

// ─── Fetch for export ──────────────────────────────────────────────────────────
async function fetchModuleData(module: string, projectId: number): Promise<Record<string, any>[]> {
  const dbConn = await db.getDb();
  if (!dbConn) return [];

  switch (module) {
    case "requirements": {
      const rows = await dbConn.select().from(requirements).where(eq(requirements.projectId, projectId));
      return rows.map((r) => ({
        description: r.description ?? "",
        category: r.category ?? "",
        type: r.type ?? "",
        status: r.status ?? "",
        priority: r.priority ?? "",
        source: r.source ?? "",
        owner: r.owner ?? "",
        notes: "",
      }));
    }
    case "tasks": {
      const rows = await dbConn.select().from(tasks).where(eq(tasks.projectId, projectId));
      // Fetch requirements and task groups for code resolution
      const allReqs = await dbConn.select().from(requirements).where(eq(requirements.projectId, projectId));
      const allTgs = await dbConn.select().from(taskGroups).where(eq(taskGroups.projectId, projectId));
      const reqMap = new Map(allReqs.map((r) => [r.id, r.idCode ?? ""]));
      const tgMap = new Map(allTgs.map((tg) => [tg.id, tg.name ?? ""]));
      return rows.map((r) => ({
        description: r.description ?? "",
        status: r.status ?? "",
        priority: r.priority ?? "",
        assignDate: r.assignDate ?? "",
        dueDate: r.dueDate ?? "",
        responsible: r.responsible ?? "",
        accountable: r.accountable ?? "",
        consulted: r.consulted ?? "",
        informed: r.informed ?? "",
        requirementCode: r.requirementId ?? "",
        taskGroupCode: r.taskGroup ?? "",
        notes: "",
      }));
    }
    case "issues": {
      const rows = await dbConn.select().from(issues).where(eq(issues.projectId, projectId));
      return rows.map((r) => ({
        description: r.description ?? "",
        status: r.status ?? "",
        priority: r.priority ?? "",
        type: r.type ?? "",
        class: r.class ?? "",
        source: r.source ?? "",
        owner: r.owner ?? "",
        openDate: r.openDate ?? "",
        resolutionDate: r.resolutionDate ?? "",
      }));
    }
    case "dependencies": {
      const rows = await dbConn.select().from(dependencies).where(eq(dependencies.projectId, projectId));
      return rows.map((r) => ({
        description: r.description ?? "",
        depGroup: r.depGroup ?? "",
        taskId: r.taskId ?? "",
        requirementId: r.requirementId ?? "",
        responsible: r.responsible ?? "",
        accountable: r.accountable ?? "",
        consulted: r.consulted ?? "",
        informed: r.informed ?? "",
        dueDate: r.dueDate ?? "",
        currentStatus: r.currentStatus ?? "",
      }));
    }
    case "assumptions": {
      const rows = await dbConn.select().from(assumptions).where(eq(assumptions.projectId, projectId));
      return rows.map((r) => ({
        description: r.description ?? "",
        category: r.category ?? "",
        status: r.status ?? "",
        owner: r.owner ?? "",
        notes: r.notes ?? "",
      }));
    }
    case "stakeholders": {
      const rows = await dbConn.select().from(stakeholders).where(eq(stakeholders.projectId, projectId));
      return rows.map((r) => ({
        fullName: r.fullName ?? "",
        email: r.email ?? "",
        phone: r.phone ?? "",
        position: r.position ?? "",
        role: r.role ?? "",
        department: r.job ?? "",
      }));
    }
    case "deliverables": {
      const rows = await dbConn.select().from(deliverables).where(eq(deliverables.projectId, projectId));
      return rows.map((r) => ({
        description: r.description ?? "",
        status: r.status ?? "",
        dueDate: r.dueDate ?? "",
      }));
    }
    case "knowledgeBase": {
      const rows = await dbConn.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId));
      return rows.map((r) => ({
        title: r.title ?? "",
        description: r.description ?? "",
      }));
    }
    case "risks": {
      const rows = await dbConn.select().from(risks).where(eq(risks.projectId, projectId));
      return rows.map((r) => ({
        title: r.title ?? "",
        impact: r.impact ?? "",
        probability: r.probability ?? "",
        identifiedOn: r.identifiedOn ? new Date(r.identifiedOn).toISOString().split("T")[0] : "",
        residualImpact: r.residualImpact ?? "",
        residualProbability: r.residualProbability ?? "",
      }));
    }
    default:
      return [];
  }
}
