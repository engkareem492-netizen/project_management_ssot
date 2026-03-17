import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { tasks } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as XLSX from "xlsx";
import { TRPCError } from "@trpc/server";
import { projectsRouter } from "./projects.router";
import { knowledgeBaseRouter } from "./knowledgeBase.router";
import { risksRouter } from "./risks.router";
import { systemConfigRouter } from "./systemConfig.router";
import { authLocalRouter } from "./auth.local.router";
import { passwordResetRouter } from "./password.reset.router";
import { collaborationRouter } from "./routers/collaboration";
import { changeRequestsRouter } from "./routers/changeRequests.router";
import { meetingsRouter } from "./routers/meetings.router";
import { testCasesRouter } from "./routers/testCases.router";
import { taskDependenciesRouter } from "./routers/taskDependencies.router";
import { traceabilityRouter } from "./routers/traceability.router";
import { bulkImportRouter } from "./routers/bulkImport.router";
import { searchRouter } from "./routers/search.router";
import { sidebarBadgesRouter } from "./routers/sidebarBadges.router";
import { stakeholderEnhancementsRouter } from "./routers/stakeholderEnhancements.router";
import { decisionsRouter } from "./routers/decisions.router";
import { notificationsRouter } from "./routers/notifications.router";
import { budgetRouter } from "./routers/budget.router";
import { resourcesRouter } from "./routers/resources.router";
import { charterRouter } from "./routers/charter.router";
import { milestonesRouter } from "./routers/milestones.router";
import { testRunsRouter } from "./routers/testRuns.router";
import { actionItemsRouter } from "./routers/actionItems.router";
import { lessonsLearnedRouter } from "./routers/lessonsLearned.router";
import { documentsRouter } from "./routers/documents.router";
import { sprintsRouter } from "./routers/sprints.router";
import { timeLogsRouter } from "./routers/timeLogs.router";
import { commentsRouter } from "./routers/comments.router";
import { goalsRouter } from "./routers/goals.router";
import { ticketTypesRouter } from "./routers/ticketTypes.router";
import { ticketsRouter } from "./routers/tickets.router";
import { slaPolicyRouter } from "./routers/slaPolicy.router";
import { projectTemplatesRouter } from "./routers/projectTemplates.router";
import { reportBuilderRouter } from "./routers/reportBuilder.router";
import { capacityPlanningRouter } from "./routers/capacityPlanning.router";
import { budgetVarianceRouter } from "./routers/budgetVariance.router";
import { stakeholderPortalRouter } from "./routers/stakeholderPortal.router";
import { engagementRouter } from "./routers/engagement.router";
import { teamCharterRouter } from "./routers/teamCharter.router";
import { communicationPlanRouter } from "./routers/communicationPlan.router";
import { commPlanOptionsRouter } from "./routers/commPlanOptions.router";
import { rbsResourceTypesRouter } from "./routers/rbsResourceTypes.router";
import { teamSkillsRouter } from "./routers/teamSkills.router";
import { rbsNodesRouter } from "./routers/rbsNodes.router";
import { projectWorkWeekRouter } from "./routers/projectWorkWeek.router";
import { eefRouter } from "./routers/eef.router";
import { llDropdownRouter } from "./routers/llDropdown.router";
import { externalPartiesRouter } from "./routers/externalParties.router";
import { wbsNodesRouter } from "./routers/wbsNodes.router";
import { commRaciMatrixRouter } from "./routers/commRaciMatrix.router";
import { communicationLogRouter } from "./routers/communicationLog.router";
import { dropdownRegistryRouter } from "./routers/dropdownRegistry.router";
import { wbsResourceAssignmentsRouter } from "./routers/wbsResourceAssignments.router";

export const appRouter = router({
  system: systemRouter,
  projects: projectsRouter,
  knowledgeBase: knowledgeBaseRouter,
  risks: risksRouter,
  systemConfig: systemConfigRouter,
  auth: authLocalRouter,
  passwordReset: passwordResetRouter,
  collaboration: collaborationRouter,
  changeRequests: changeRequestsRouter,
  meetings: meetingsRouter,
  testCases: testCasesRouter,
  taskDependencies: taskDependenciesRouter,
  traceability: traceabilityRouter,
  bulkImport: bulkImportRouter,
  search: searchRouter,
  sidebarBadges: sidebarBadgesRouter,
  stakeholderEnhancements: stakeholderEnhancementsRouter,
  decisions: decisionsRouter,
  notifications: notificationsRouter,
  budget: budgetRouter,
  resources: resourcesRouter,
  charter: charterRouter,
  milestones: milestonesRouter,
  testRuns: testRunsRouter,
  actionItems: actionItemsRouter,
  lessonsLearned: lessonsLearnedRouter,
  documents: documentsRouter,
  sprints: sprintsRouter,
  timeLogs: timeLogsRouter,
  comments: commentsRouter,
  goals: goalsRouter,
  ticketTypes: ticketTypesRouter,
  tickets: ticketsRouter,
  slaPolicy: slaPolicyRouter,
  projectTemplates: projectTemplatesRouter,
  reportBuilder: reportBuilderRouter,
  capacityPlanning: capacityPlanningRouter,
  budgetVariance: budgetVarianceRouter,
  stakeholderPortal: stakeholderPortalRouter,
  engagement: engagementRouter,
  teamCharter: teamCharterRouter,
  communicationPlan: communicationPlanRouter,
  commPlanOptions: commPlanOptionsRouter,
  rbsResourceTypes: rbsResourceTypesRouter,
  teamSkills: teamSkillsRouter,
  rbsNodes: rbsNodesRouter,
  projectWorkWeek: projectWorkWeekRouter,
  eef: eefRouter,
  llDropdown: llDropdownRouter,
  externalParties: externalPartiesRouter,
  wbsNodes: wbsNodesRouter,
  commRaciMatrix: commRaciMatrixRouter,
  communicationLog: communicationLogRouter,
  dropdownRegistry: dropdownRegistryRouter,
  wbsResourceAssignments: wbsResourceAssignmentsRouter,
  scopeItems: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => db.getAllScopeItems(input.projectId)),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        phase: z.string().optional(),
        processArea: z.string().optional(),
        category: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const idCode = await db.getNextId('scope', 'SC', input.projectId);
        return db.createScopeItem({ ...input, idCode });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          name: z.string().optional(),
          description: z.string().optional(),
          phase: z.string().optional(),
          processArea: z.string().optional(),
          category: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => db.updateScopeItem(input.id, input.data)),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => { await db.deleteScopeItem(input.id); return { success: true }; }),
  }),

  resourceCost: router({
    summary: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => db.getResourceCostSummary(input.projectId)),
  }),

  // Excel import/export
  excel: router({
    import: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        base64Data: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Decode base64 to buffer
          const buffer = Buffer.from(input.base64Data, 'base64');
          const workbook = XLSX.read(buffer, { type: 'buffer' });

          let importedCounts = {
            requirements: 0,
            tasks: 0,
            issues: 0,
            dependencies: 0,
            assumptions: 0,
          };

          // Clear existing data for this project only
          await db.deleteAllRequirements(input.projectId);
          await db.deleteAllTasks(input.projectId);
          await db.deleteAllIssues(input.projectId);
          await db.deleteAllDependencies(input.projectId);
          await db.deleteAllAssumptions(input.projectId);

          // Import Requirements
          if (workbook.SheetNames.includes('Requirements')) {
            const sheet = workbook.Sheets['Requirements'];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            for (const row of data) {
              const req: any = row;
              await db.createRequirement({
                projectId: input.projectId,
                idCode: req['ID Code'] || '',
                taskGroup: req['Task Group'] || null,
                issueGroup: req['Issue Group'] || null,
                createdAt: req['created at'] || null,
                type: req['Type'] || null,
                class: req['Class'] || null,
                category: req['Category'] || null,
                agreement: req['Aggrement'] || null,
                owner: req['Owner'] || null,
                description: req['Description'] || null,
                sourceType: req['Source Type'] || null,
                refSource: req['Ref Source '] || null,
                status: req['Status'] || null,
                priority: req['Priority'] || null,
                deliverables1: req['Deliverables 1'] || null,
                d1Status: req['D1 Status'] || null,
                deliverables2: req['Deliverables 2'] || null,
                d2Status: req['D2 Status'] || null,
                lastUpdate: req['Last Update'] || null,
                updateDate: req['Update Date'] || null,
              });
              importedCounts.requirements++;
            }
          }

          // Import Tasks
          if (workbook.SheetNames.includes('Tasks')) {
            const sheet = workbook.Sheets['Tasks'];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            for (const row of data) {
              const task: any = row;
              await db.createTask({
                projectId: input.projectId,
                taskId: task['Task ID'] || '',
                taskGroup: task['Task Group'] || null,
                dependencyId: task['Depeneddncy ID'] || null,
                requirementId: task['Requirement ID'] || null,
                description: task['Description'] || null,
                responsible: task['Reponsible'] || null,
                accountable: task['Accountable'] || null,
                informed: task['Informed'] || null,
                consulted: task['Consulted'] || null,
                dueDate: task['Due Date'] || null,
                currentStatus: task['Current Status'] || null,
                statusUpdate: task['Ststus Update'] || null,
              });
              importedCounts.tasks++;
            }
          }

          // Import Issues
          if (workbook.SheetNames.includes('Issue')) {
            const sheet = workbook.Sheets['Issue'];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            for (const row of data) {
              const issue: any = row;
              await db.createIssue({
                projectId: input.projectId,
                issueId: issue['Issue ID'] || '',
                issueGroup: issue['Issue Group'] || null,
                taskGroup: issue['Task Group'] || null,
                requirementId: issue['Requirement ID'] || null,
                type: issue['Type'] || null,
                class: issue['Class'] || null,
                owner: issue['Owner'] || null,
                status: issue['Status'] || null,
                description: issue['Description'] || null,
                sourceType: issue['Source Type'] || null,
                refSource: issue['Ref Source '] || null,
                createdAt: issue['Created At'] || null,
                priority: issue['Priority'] || null,
                deliverables1: issue['Deliverables 1'] || null,
                d1Status: issue['D1 Status'] || null,
                deliverables2: issue['Deliverables 2'] || null,
                d2Status: issue['D2 Status'] || null,
                lastUpdate: issue['Last Update'] || null,
                updateDate: issue['Update Date'] || null,
              });
              importedCounts.issues++;
            }
          }

          // Import Dependencies
          if (workbook.SheetNames.includes('Dependency')) {
            const sheet = workbook.Sheets['Dependency'];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            for (const row of data) {
              const dep: any = row;
              if (dep['Dependency ID']) {
                await db.createDependency({
                  projectId: input.projectId,
                  dependencyId: dep['Dependency ID'] || '',
                  depGroup: dep['Dep Group'] || null,
                  taskId: dep['Task ID'] || null,
                  requirementId: dep['Requirement ID'] || null,
                  description: dep['Description'] || null,
                  responsible: dep['Reponsible'] || null,
                  accountable: dep['Accountable'] || null,
                  informed: dep['Informed'] || null,
                  consulted: dep['Consulted'] || null,
                  dueDate: dep['Due Date'] || null,
                  currentStatus: dep['Current Status'] || null,
                  statusUpdate: dep['Ststus Update'] || null,
                });
                importedCounts.dependencies++;
              }
            }
          }

          // Import Assumptions
          if (workbook.SheetNames.includes('Assumptions')) {
            const sheet = workbook.Sheets['Assumptions'];
            const data = XLSX.utils.sheet_to_json(sheet);
            
            for (const row of data) {
              const assumption: any = row;
              if (assumption['Assumption Id']) {
                await db.createAssumption({
                  projectId: input.projectId,
                  assumptionId: assumption['Assumption Id'] || '',
                  description: assumption['Description'] || null,
                  category: assumption['Category'] || null,
                  owner: assumption['Owner'] || null,
                  status: assumption['Status'] || null,
                });
                importedCounts.assumptions++;
              }
            }
          }

          return {
            success: true,
            imported: importedCounts,
          };
        } catch (error) {
          console.error('Excel import error:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to import Excel file',
          });
        }
      }),

    export: protectedProcedure.query(async () => {
      try {
        const requirements = await db.getAllRequirements();
        const tasks = await db.getAllTasks();
        const issues = await db.getAllIssues();
        const dependencies = await db.getAllDependencies();
        const assumptions = await db.getAllAssumptions();
        const actionLogs = await db.getAllActionLogs();

        const workbook = XLSX.utils.book_new();

        // Requirements sheet
        const reqData = requirements.map(r => ({
          'ID-Code': r.idCode,
          'Task Group': r.taskGroup,
          'Issue Group': r.issueGroup,
          'created at': r.createdAt,
          'Type': r.type,
          'Class': r.class,
          'Category': r.category,
          'Aggrement': r.agreement,
          'Owner': r.owner,
          'Description': r.description,
          'Source Type': r.sourceType,
          'Ref Source ': r.refSource,
          'Status': r.status,
          'Priority': r.priority,
          'Deliverables 1': r.deliverables1,
          'D1 Status': r.d1Status,
          'Deliverables 2': r.deliverables2,
          'D2 Status': r.d2Status,
          'Last Update': r.lastUpdate,
          'Update Date': r.updateDate,
        }));
        const reqSheet = XLSX.utils.json_to_sheet(reqData);
        XLSX.utils.book_append_sheet(workbook, reqSheet, 'Requirements');

        // Tasks sheet
        const taskData = tasks.map(t => ({
          'Task ID': t.taskId,
          'Task Group': t.taskGroup,
          'Depeneddncy ID': t.dependencyId,
          'Requirement ID': t.requirementId,
          'Description': t.description,
          'Reponsible': t.responsible,
          'Accountable': t.accountable,
          'Informed': t.informed,
          'Consulted': t.consulted,
          'Due Date': t.dueDate,
          'Current Status': t.currentStatus,
          'Ststus Update': t.statusUpdate,
        }));
        const taskSheet = XLSX.utils.json_to_sheet(taskData);
        XLSX.utils.book_append_sheet(workbook, taskSheet, 'Tasks');

        // Issues sheet
        const issueData = issues.map(i => ({
          'Issue ID': i.issueId,
          'Issue Group': i.issueGroup,
          'Task Group': i.taskGroup,
          'Requirement ID': i.requirementId,
          'Type': i.type,
          'Class': i.class,
          'Owner': i.owner,
          'Status': i.status,
          'Description': i.description,
          'Source Type': i.sourceType,
          'Ref Source ': i.refSource,
          'Created At': i.createdAt,
          'Priority': i.priority,
          'Deliverables 1': i.deliverables1,
          'D1 Status': i.d1Status,
          'Deliverables 2': i.d2Status,
          'D2 Status': i.d2Status,
          'Last Update': i.lastUpdate,
          'Update Date': i.updateDate,
        }));
        const issueSheet = XLSX.utils.json_to_sheet(issueData);
        XLSX.utils.book_append_sheet(workbook, issueSheet, 'Issue');

        // Dependencies sheet
        const depData = dependencies.map(d => ({
          'Dependency ID': d.dependencyId,
          'Dep Group': d.depGroup,
          'Task ID': d.taskId,
          'Requirement ID': d.requirementId,
          'Description': d.description,
          'Reponsible': d.responsible,
          'Accountable': d.accountable,
          'Informed': d.informed,
          'Consulted': d.consulted,
          'Due Date': d.dueDate,
          'Current Status': d.currentStatus,
          'Ststus Update': d.statusUpdate,
        }));
        const depSheet = XLSX.utils.json_to_sheet(depData);
        XLSX.utils.book_append_sheet(workbook, depSheet, 'Dependency');

        // Assumptions sheet
        const assumpData = assumptions.map(a => ({
          'Assumption Id': a.assumptionId,
          'Description': a.description,
          'Category': a.category,
          'Owner': a.owner,
          'Status': a.status,
        }));
        const assumpSheet = XLSX.utils.json_to_sheet(assumpData);
        XLSX.utils.book_append_sheet(workbook, assumpSheet, 'Assumptions');

        // Action Log sheet
        const logData = actionLogs.map(log => ({
          'Entity Type': log.entityType,
          'Entity ID': log.entityId,
          'Changed Fields': JSON.stringify(log.changedFields),
          'Changed At': log.changedAt,
        }));
        const logSheet = XLSX.utils.json_to_sheet(logData);
        XLSX.utils.book_append_sheet(workbook, logSheet, 'Action log');

        // Convert to base64
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const base64 = buffer.toString('base64');

        return {
          success: true,
          base64Data: base64,
          filename: `SSOT-Export-${new Date().toISOString().split('T')[0]}.xlsx`,
        };
      } catch (error) {
        console.error('Excel export error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to export Excel file',
        });
      }
    }),
  }),

  // Requirements
  requirements: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllRequirementsSorted(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ idCode: z.string() }))
      .query(async ({ input }) => {
        return await db.getRequirementByIdCode(input.idCode);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        taskGroup: z.string().optional(),
        issueGroup: z.string().optional(),
        type: z.string().optional(),
        class: z.string().optional(),
        category: z.string().optional(),
        agreement: z.string().optional(),
        owner: z.string().optional(),
        ownerId: z.number().optional(),
        description: z.string().optional(),
        sourceType: z.string().optional(),
        refSource: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        deliverables1: z.string().optional(),
        d1Status: z.string().optional(),
        deliverables2: z.string().optional(),
        d2Status: z.string().optional(),
        lastUpdate: z.string().optional(),
        updateDate: z.string().optional(),
        scopeItemId: z.number().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Generate auto ID
          const idCode = await db.getNextId('requirement', 'Q', input.projectId);
          
          // Look up owner name from ownerId if provided
          let ownerName = input.owner;
          if (input.ownerId && !ownerName) {
            const stakeholder = await db.getStakeholderById(input.ownerId);
            if (stakeholder) {
              ownerName = stakeholder.fullName;
            }
          }
          
          const requirementData = { 
            ...input, 
            idCode, 
            projectId: input.projectId,
            owner: ownerName,
            ownerId: input.ownerId,
          };
          
          console.log('[requirements.create] Creating requirement with data:', requirementData);
          
          await db.createRequirement(requirementData);
          return { success: true, idCode };
        } catch (error: any) {
          console.error('[requirements.create] Error:', error);
          console.error('[requirements.create] Error details:', {
            message: error.message,
            cause: error.cause,
            sqlMessage: error.cause?.sqlMessage,
            errno: error.cause?.errno,
          });
          
          // User-friendly error for duplicate IDs
          if (error.cause?.errno === 1062 && error.cause?.sqlMessage?.includes('idCode_unique')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A requirement with this ID already exists. Please increment the counter in Settings or delete the existing requirement.',
            });
          }
          
          throw error;
        }
      }),

    createTask: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        requirementId: z.string(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        accountable: z.string().optional(),
        accountableId: z.number().optional(),
        informed: z.string().optional(),
        consulted: z.string().optional(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Generate auto ID for task
        const taskId = await db.getNextId('task', 'T', input.projectId);
        await db.createTask({
          projectId: input.projectId,
          taskId,
          requirementId: input.requirementId,
          description: input.description,
          responsible: input.responsible,
          responsibleId: input.responsibleId,
          accountable: input.accountable,
          accountableId: input.accountableId,
          informed: input.informed,
          consulted: input.consulted,
          dueDate: input.dueDate,
          status: input.status,
          priority: input.priority,
        });
        return { success: true, taskId };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        idCode: z.string(),
        data: z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          deliverables1: z.string().optional(),
          d1Status: z.string().optional(),
          deliverables2: z.string().optional(),
          d2Status: z.string().optional(),
          lastUpdate: z.string().optional(),
          updateDate: z.string().optional(),
          owner: z.string().optional(),
          description: z.string().optional(),
          scopeItemId: z.number().optional().nullable(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Get current state
        const current = await db.getRequirementByIdCode(input.idCode);
        if (!current) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Requirement not found' });
        }

        // Detect changes
        const changedFields: Record<string, { oldValue: any; newValue: any }> = {};
        const trackFields = ['status', 'priority', 'deliverables1', 'd1Status', 'deliverables2', 'd2Status', 'lastUpdate', 'updateDate'];
        
        for (const field of trackFields) {
          if (input.data[field as keyof typeof input.data] !== undefined && 
              current[field as keyof typeof current] !== input.data[field as keyof typeof input.data]) {
            changedFields[field] = {
              oldValue: current[field as keyof typeof current],
              newValue: input.data[field as keyof typeof input.data],
            };
          }
        }

        // Update requirement
        await db.updateRequirement(input.id, input.data);

        // Log changes if any
        if (Object.keys(changedFields).length > 0) {
          await db.createActionLog({
            entityType: 'requirement',
            entityId: input.idCode,
            entityInternalId: input.id,
            changedFields,
            changedBy: ctx.user.id,
          });
        }

        return { success: true, changedFields: Object.keys(changedFields) };
      }),

    search: protectedProcedure
      .input(z.object({ searchTerm: z.string() }))
      .query(async ({ input }) => {
        return await db.searchRequirements(input.searchTerm);
      }),

    filter: protectedProcedure
      .input(z.object({
        status: z.string().optional(),
        priority: z.string().optional(),
        owner: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.filterRequirements(input);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteRequirement(input.id);
        return { success: true };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.deleteRequirement(id);
        }
        return { success: true, deleted: input.ids.length };
      }),

    bulkUpdateStatus: protectedProcedure
      .input(z.object({ ids: z.array(z.number()), status: z.string() }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.updateRequirement(id, { status: input.status });
        }
        return { success: true, updated: input.ids.length };
      }),
  }),

  // Tasks
  tasks: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllTasksSorted(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ input }) => {
        return await db.getTaskByTaskId(input.taskId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        taskGroup: z.string().optional(),
        dependencyId: z.string().optional(),
        requirementId: z.string().optional(),
        deliverableId: z.number().optional(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        accountable: z.string().optional(),
        accountableId: z.number().optional(),
        informed: z.string().optional(),
        informedId: z.number().optional(),
        consulted: z.string().optional(),
        consultedId: z.number().optional(),
        owner: z.string().optional(),
        ownerId: z.number().optional(),
        dueDate: z.string().optional(),
        assignDate: z.string().optional(),
        currentStatus: z.string().optional(),
        statusUpdate: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        parentTaskId: z.number().optional(),
        followUpOfId: z.number().optional(),
        seriesId: z.number().optional(),
        recurringType: z.enum(['none', 'daily', 'weekly', 'monthly', 'custom']).optional(),
        recurringInterval: z.number().optional(),
        recurringEndDate: z.string().optional(),
        manHours: z.number().optional(),
        subject: z.string().optional(),
        subjectId: z.number().optional(),
        taskCategory: z.enum(['task', 'communication']).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Clean up empty strings and convert to undefined
          const cleanedInput: any = {};
          Object.keys(input).forEach(key => {
            const value = (input as any)[key];
            if (value !== '' && value !== 'none' && value !== undefined) {
              cleanedInput[key] = value;
            }
          });
          
          // Use COMM prefix for communication tasks, T for regular tasks
          const isCommTask = input.taskCategory === 'communication';
          const taskId = isCommTask
            ? await db.getNextId('commTask', 'COMM', input.projectId)
            : await db.getNextId('task', 'T', input.projectId);
          await db.createTask({ ...cleanedInput, taskId, projectId: input.projectId });
          
          return { success: true, taskId };
        } catch (error: any) {
          console.error('[tasks.create] Error creating task:', error);
          console.error('[tasks.create] Error details:', {
            message: error.message,
            cause: error.cause,
            sqlMessage: error.cause?.sqlMessage,
            errno: error.cause?.errno,
          });
          
          // User-friendly error for duplicate task IDs
          if (error.cause?.errno === 1062 && error.cause?.sqlMessage?.includes('taskId_unique')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A task with this ID already exists. Please increment the counter in Settings or delete the existing task.',
            });
          }
          
          // User-friendly error for duplicate requirement IDs (when creating linked requirement)
          if (error.cause?.errno === 1062 && error.cause?.sqlMessage?.includes('idCode_unique')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A requirement with this ID already exists. The task was not created. Please increment the requirement counter in Settings.',
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create task. Please try again.',
            cause: error,
          });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        taskId: z.string(),
        data: z.object({
          currentStatus: z.string().optional(),
          statusUpdate: z.string().optional(),
          description: z.string().optional(),
          dueDate: z.string().optional(),
          taskGroup: z.string().optional(),
          status: z.string().optional(),
          priority: z.string().optional(),
          requirementId: z.string().nullable().optional(),
          deliverableId: z.number().nullable().optional(),
          issueId: z.string().nullable().optional(),
          assignDate: z.string().optional(),
          responsibleId: z.number().nullable().optional(),
          accountableId: z.number().nullable().optional(),
          consultedId: z.number().nullable().optional(),
          informedId: z.number().nullable().optional(),
          ownerId: z.number().nullable().optional(),
          manHours: z.union([z.number(), z.string()]).nullable().optional(),
          subject: z.string().nullable().optional(),
          subjectId: z.number().nullable().optional(),
          taskCategory: z.enum(['task', 'communication']).optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Convert manHours to string for decimal DB column
        if (input.data.manHours !== undefined && input.data.manHours !== null) {
          (input.data as any).manHours = String(input.data.manHours);
        }
        const current = await db.getTaskByTaskId(input.taskId);
        if (!current) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
        }

        const changedFields: Record<string, { oldValue: any; newValue: any }> = {};
        const trackFields = [
          'currentStatus', 'statusUpdate', 'taskGroup', 'status', 'priority',
          'description', 'requirementId', 'deliverableId', 'issueId',
          'responsibleId', 'accountableId', 'consultedId', 'informedId', 'ownerId',
          'dueDate', 'assignDate'
        ];
        
        for (const field of trackFields) {
          if (input.data[field as keyof typeof input.data] !== undefined && 
              current[field as keyof typeof current] !== input.data[field as keyof typeof input.data]) {
            changedFields[field] = {
              oldValue: current[field as keyof typeof current],
              newValue: input.data[field as keyof typeof input.data],
            };
          }
        }

        await db.updateTask(input.id, input.data as any);

        if (Object.keys(changedFields).length > 0) {
          await db.createActionLog({
            entityType: 'task',
            entityId: input.taskId,
            entityInternalId: input.id,
            changedFields,
            changedBy: ctx.user.id,
          });
        }

        return { success: true, changedFields: Object.keys(changedFields) };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.deleteTask(id);
        }
        return { success: true, deleted: input.ids.length };
      }),

    bulkUpdateStatus: protectedProcedure
      .input(z.object({ ids: z.array(z.number()), status: z.string() }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.updateTask(id, { currentStatus: input.status });
        }
        return { success: true, updated: input.ids.length };
      }),

    linkToRequirement: protectedProcedure
      .input(z.object({ id: z.number(), requirementId: z.string().nullable() }))
      .mutation(async ({ input }) => {
        await db.updateTask(input.id, { requirementId: input.requirementId });
        return { success: true };
      }),

    // Sub-task: create a child task linked to a parent
    createSubTask: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        parentTaskId: z.number(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        taskGroup: z.string().optional(),
        requirementId: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const taskId = await db.getNextId('task', 'T', input.projectId);
        await db.createTask({ ...input, taskId });
        const created = await db.getTaskByTaskId(taskId);
        return { success: true, taskId, id: created?.id };
      }),

    // Follow-up: create a new task linked to an original completed task
    createFollowUp: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        followUpOfId: z.number(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        accountable: z.string().optional(),
        accountableId: z.number().optional(),
        informed: z.string().optional(),
        informedId: z.number().optional(),
        consulted: z.string().optional(),
        consultedId: z.number().optional(),
        dueDate: z.string().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        taskGroup: z.string().optional(),
        requirementId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const taskId = await db.getNextId('task', 'T', input.projectId);
        await db.createTask({ ...input, taskId });
        const created = await db.getTaskByTaskId(taskId);
        return { success: true, taskId, id: created?.id };
      }),

    // Get sub-tasks for a parent task
    getSubTasks: protectedProcedure
      .input(z.object({ parentTaskId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubTasks(input.parentTaskId);
      }),

    // Get follow-up tasks for an original task
    getFollowUps: protectedProcedure
      .input(z.object({ followUpOfId: z.number() }))
      .query(async ({ input }) => {
        return await db.getFollowUpTasks(input.followUpOfId);
      }),

    // Configure recurring schedule for a task
    setRecurring: protectedProcedure
      .input(z.object({
        id: z.number(),
        recurringType: z.enum(['daily', 'weekly', 'monthly', 'custom']).nullable(),
        recurringInterval: z.number().optional(),
        recurringEndDate: z.string().nullable().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.updateTask(input.id, {
          recurringType: input.recurringType,
          recurringInterval: input.recurringInterval,
          recurringEndDate: input.recurringEndDate || null,
        });
        return { success: true };
      }),

    // Badge counts: overdue tasks, open issues, high-severity risks
    badgeCounts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBadgeCounts(input.projectId);
      }),
  }),

  // Issues
  issues: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllIssuesSorted(input.projectId);
    }),

    get: protectedProcedure
      .input(z.object({ issueId: z.string() }))
      .query(async ({ input }) => {
        return await db.getIssueByIssueId(input.issueId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        issueGroup: z.string().optional(),
        taskGroup: z.string().optional(),
        requirementId: z.string().optional(),
        type: z.string().optional(),
        class: z.string().optional(),
        owner: z.string().optional(),
        ownerId: z.number().optional(),
        status: z.string().optional(),
        description: z.string().optional(),
        sourceType: z.string().optional(),
        refSource: z.string().optional(),
        openDate: z.string().optional(),
        priority: z.string().optional(),
        deliverableId: z.number().optional(),
        taskId: z.string().optional(),
        deliverables1: z.string().optional(),
        d1Status: z.string().optional(),
        deliverables2: z.string().optional(),
        d2Status: z.string().optional(),
        lastUpdate: z.string().optional(),
        updateDate: z.string().optional(),
        resolutionDate: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Clean up empty strings and convert to undefined
          const cleanedInput: any = {};
          Object.keys(input).forEach(key => {
            const value = (input as any)[key];
            if (value !== '' && value !== 'none' && value !== undefined) {
              cleanedInput[key] = value;
            }
          });

          // Generate auto ID
          const issueId = await db.getNextId('issue', 'I', input.projectId);
          await db.createIssue({ ...cleanedInput, issueId });
          return { success: true, issueId };
        } catch (error: any) {
          console.error('[issues.create] Error creating issue:', error);
          console.error('[issues.create] Error details:', {
            message: error.message,
            cause: error.cause,
            sqlMessage: error.cause?.sqlMessage,
            errno: error.cause?.errno,
          });
          
          // User-friendly error for duplicate IDs
          if (error.cause?.errno === 1062 && error.cause?.sqlMessage?.includes('issueId_unique')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'An issue with this ID already exists. Please increment the counter in Settings or delete the existing issue.',
            });
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Failed to create issue',
          });
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        issueId: z.string(),
        data: z.object({
          status: z.string().optional(),
          priority: z.string().optional(),
          deliverables1: z.string().optional(),
          d1Status: z.string().optional(),
          deliverables2: z.string().optional(),
          d2Status: z.string().optional(),
          lastUpdate: z.string().optional(),
          updateDate: z.string().optional(),
          resolutionDate: z.string().optional(),
          description: z.string().optional(),
          owner: z.string().optional(),
          ownerId: z.number().optional(),
          issueGroup: z.string().optional(),
          taskGroup: z.string().optional(),
          requirementId: z.string().optional(),
          type: z.string().optional(),
          class: z.string().optional(),
          sourceType: z.string().optional(),
          refSource: z.string().optional(),
          openDate: z.string().optional(),
          deliverableId: z.number().optional(),
          taskId: z.string().optional(),
          knowledgeBaseCode: z.string().optional(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const current = await db.getIssueByIssueId(input.issueId);
        if (!current) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Issue not found' });
        }

        const changedFields: Record<string, { oldValue: any; newValue: any }> = {};
        const trackFields = ['status', 'priority', 'deliverables1', 'd1Status', 'deliverables2', 'd2Status', 'lastUpdate', 'updateDate', 'resolutionDate', 'description', 'owner', 'openDate'];
        
        for (const field of trackFields) {
          if (input.data[field as keyof typeof input.data] !== undefined && 
              current[field as keyof typeof current] !== input.data[field as keyof typeof input.data]) {
            changedFields[field] = {
              oldValue: current[field as keyof typeof current],
              newValue: input.data[field as keyof typeof input.data],
            };
          }
        }

        await db.updateIssue(input.id, input.data);

        if (Object.keys(changedFields).length > 0) {
          await db.createActionLog({
            entityType: 'issue',
            entityId: input.issueId,
            entityInternalId: input.id,
            changedFields,
            changedBy: ctx.user.id,
          });
        }

        return { success: true, changedFields: Object.keys(changedFields) };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteIssue(input.id);
        return { success: true };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ ids: z.array(z.number()) }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.deleteIssue(id);
        }
        return { success: true, deleted: input.ids.length };
      }),

    bulkUpdateStatus: protectedProcedure
      .input(z.object({ ids: z.array(z.number()), status: z.string() }))
      .mutation(async ({ input }) => {
        for (const id of input.ids) {
          await db.updateIssue(id, { status: input.status });
        }
        return { success: true, updated: input.ids.length };
      }),

    linkToRequirement: protectedProcedure
      .input(z.object({ id: z.number(), requirementId: z.string().nullable() }))
      .mutation(async ({ input }) => {
        await db.updateIssue(input.id, { requirementId: input.requirementId });
        return { success: true };
      }),

    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(['requirement', 'task', 'dependency']),
        entityId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getIssuesByEntity(input.entityType, input.entityId);
      }),

    addLink: protectedProcedure
      .input(z.object({
        issueId: z.number(),
        entityType: z.enum(['requirement', 'task', 'dependency']),
        entityId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createIssueLink({
          issueId: input.issueId,
          linkedEntityType: input.entityType,
          linkedEntityId: input.entityId,
        });
        return { success: true };
      }),

    removeLink: protectedProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteIssueLink(input.linkId);
        return { success: true };
      }),
  }),

  // Dependencies
  dependencies: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }).optional())
      .query(async ({ input }) => {
        return await db.getAllDependenciesSorted(input?.projectId);
    }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        taskId: z.string().optional(),
        requirementId: z.string().optional(),
        description: z.string().optional(),
        responsible: z.string().optional(),
        responsibleId: z.number().optional(),
        accountable: z.string().optional(),
        accountableId: z.number().optional(),
        informed: z.string().optional(),
        informedId: z.number().optional(),
        consulted: z.string().optional(),
        consultedId: z.number().optional(),
        dueDate: z.string().optional(),
        statusUpdate: z.string().optional(),
        currentStatus: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Generate auto ID
        const dependencyId = await db.getNextId('dependency', 'D', input.projectId);
        await db.createDependency({ ...input, dependencyId });
        return { success: true, dependencyId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDependency(input.id);
        return { success: true };
      }),
  }),

  // Assumptions
  assumptions: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssumptionsEnhanced(input.projectId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        statusId: z.number().optional(),
        impactLevelId: z.number().optional(),
        ownerId: z.number().optional(),
        requirementId: z.number().optional(),
        taskId: z.number().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const created = await db.createAssumptionEnhanced(input);
        return created;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        description: z.string().optional(),
        categoryId: z.number().optional(),
        statusId: z.number().optional(),
        impactLevelId: z.number().optional(),
        ownerId: z.number().optional(),
        requirementId: z.number().optional(),
        taskId: z.number().optional(),
        notes: z.string().optional(),
        validatedAt: z.date().optional(),
        validatedBy: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const updated = await db.updateAssumptionEnhanced(
          id,
          data,
          ctx.user?.id,
          ctx.user?.name ?? ctx.user?.email
        );
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAssumption(input.id);
        return { success: true };
      }),

    getHistory: protectedProcedure
      .input(z.object({ assumptionId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAssumptionHistory(input.assumptionId);
      }),

    // Dropdown management
    categories: router({
      list: protectedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => db.getAssumptionCategories(input.projectId)),
      create: protectedProcedure
        .input(z.object({ projectId: z.number(), name: z.string() }))
        .mutation(async ({ input }) => db.createAssumptionCategory(input)),
    }),

    statuses: router({
      list: protectedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => db.getAssumptionStatuses(input.projectId)),
      create: protectedProcedure
        .input(z.object({ projectId: z.number(), name: z.string() }))
        .mutation(async ({ input }) => db.createAssumptionStatus(input)),
    }),

    impactLevels: router({
      list: protectedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => db.getAssumptionImpactLevels(input.projectId)),
      create: protectedProcedure
        .input(z.object({ projectId: z.number(), name: z.string() }))
        .mutation(async ({ input }) => db.createAssumptionImpactLevel(input)),
    }),
  }),

  // Action Logs
  actionLogs: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllActionLogs();
    }),

    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(['requirement', 'task', 'issue']),
        entityId: z.string(),
      }))
      .query(async ({ input }) => {
        return await db.getActionLogsByEntity(input.entityType, input.entityId);
      }),
  }),

  // Relationships
  relationships: router({
    getAll: protectedProcedure
      .input(z.object({ projectId: z.number().optional() }))
      .query(async ({ input }) => {
        return await db.getAllRelationships(input.projectId);
      }),

    getByRequirement: protectedProcedure
      .input(z.object({ requirementId: z.string() }))
      .query(async ({ input }) => {
        return await db.getRequirementRelationships(input.requirementId);
      }),

    getWithLinkedItems: protectedProcedure
      .input(z.object({ requirementId: z.string() }))
      .query(async ({ input }) => {
        return await db.getRequirementWithLinkedItems(input.requirementId);
      }),
  }),

  // Stakeholders
  stakeholders: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllStakeholders(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getStakeholderById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        fullName: z.string(),
        email: z.string().optional(),
        position: z.string().optional(),
        role: z.string().optional(),
        job: z.string().optional(),
        phone: z.string().optional(),
        department: z.string().optional(),
        classification: z.enum(["TeamMember", "External", "Stakeholder"]).optional(),
        isInternalTeam: z.boolean().optional(),
        isPooledResource: z.boolean().optional(),
        workingHoursPerDay: z.string().optional(),
        workingDaysPerWeek: z.number().optional(),
        stakeholderManagerId: z.number().nullable().optional(),
        externalPartyId: z.number().nullable().optional(),
        powerLevel: z.number().min(1).max(5).optional(),
        interestLevel: z.number().min(1).max(5).optional(),
        engagementStrategy: z.string().optional(),
        currentEngagementStatus: z.enum(["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).nullable().optional(),
        desiredEngagementStatus: z.enum(["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).nullable().optional(),
        communicationFrequency: z.string().optional(),
        communicationChannel: z.string().optional(),
        communicationMessage: z.string().optional(),
        communicationResponsible: z.string().optional(),
        communicationResponsibleId: z.number().optional(),
        notes: z.string().optional(),
        costPerHour: z.string().optional(),
        costPerDay: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Resolve communicationResponsibleId to name
        let commResponsibleName = input.communicationResponsible;
        if (input.communicationResponsibleId) {
          const resp = await db.getStakeholderById(input.communicationResponsibleId);
          if (resp) commResponsibleName = resp.fullName ?? commResponsibleName;
        }
        const result = await db.createStakeholder({
          ...input,
          communicationResponsible: commResponsibleName,
        });
        // Auto-create recurring task if frequency + responsible are set
        if (input.communicationFrequency && input.communicationFrequency !== 'None' && input.communicationResponsibleId) {
          const freqMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
            Daily: 'daily', Weekly: 'weekly', 'Bi-weekly': 'weekly',
            Monthly: 'monthly', Quarterly: 'monthly',
          };
          const intervalMap: Record<string, number> = {
            Daily: 1, Weekly: 1, 'Bi-weekly': 2, Monthly: 1, Quarterly: 3,
          };
          const recurringType = freqMap[input.communicationFrequency] ?? 'weekly';
          const recurringInterval = intervalMap[input.communicationFrequency] ?? 1;
          const newStakeholderId = (result as any).id ?? (result as any).insertId;
          const dbConn = await getDb();
          const existingCommTask = dbConn ? await dbConn.select().from(tasks)
            .where(and(eq(tasks.projectId, input.projectId), eq(tasks.communicationStakeholderId, newStakeholderId)))
            .limit(1) : [];
          if (existingCommTask.length === 0) {
            const taskId = await db.getNextId('task', 'T', input.projectId);
            await db.createTask({
              projectId: input.projectId,
              taskId,
              description: `Communicate with ${input.fullName} (${input.communicationFrequency} via ${input.communicationChannel ?? 'TBD'})`,
              responsibleId: input.communicationResponsibleId,
              responsible: commResponsibleName ?? undefined,
              recurringType,
              recurringInterval,
              status: 'Open',
              communicationStakeholderId: newStakeholderId,
            } as any);
          }
        }
        return result;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          fullName: z.string().optional(),
          email: z.string().optional(),
          position: z.string().optional(),
          role: z.string().optional(),
          job: z.string().optional(),
          phone: z.string().optional(),
          department: z.string().optional(),
          classification: z.enum(["TeamMember", "External", "Stakeholder"]).optional(),
          isInternalTeam: z.boolean().optional(),
          isPooledResource: z.boolean().optional(),
          workingHoursPerDay: z.string().optional(),
          workingDaysPerWeek: z.number().optional(),
          stakeholderManagerId: z.number().nullable().optional(),
          externalPartyId: z.number().nullable().optional(),
          powerLevel: z.number().min(1).max(5).optional(),
          interestLevel: z.number().min(1).max(5).optional(),
          engagementStrategy: z.string().optional(),
          currentEngagementStatus: z.enum(["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).nullable().optional(),
          desiredEngagementStatus: z.enum(["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).nullable().optional(),
          communicationFrequency: z.string().optional(),
          communicationChannel: z.string().optional(),
          communicationMessage: z.string().optional(),
          communicationResponsible: z.string().optional(),
          communicationResponsibleId: z.number().nullable().optional(),
          notes: z.string().optional(),
          costPerHour: z.string().optional().nullable(),
          costPerDay: z.string().optional().nullable(),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        // Resolve communicationResponsibleId to name
        let updateData: any = { ...input.data };
        if (input.data.communicationResponsibleId) {
          const resp = await db.getStakeholderById(input.data.communicationResponsibleId);
          if (resp) updateData.communicationResponsible = resp.fullName ?? updateData.communicationResponsible;
        }
        const result = await db.updateStakeholder(input.id, updateData);
        // Upsert recurring communication task (deduplication: one task per stakeholder)
        const freq = input.data.communicationFrequency;
        const respId = input.data.communicationResponsibleId;
        if (freq && freq !== 'None' && respId) {
          const stakeholder = await db.getStakeholderById(input.id);
          const freqMap: Record<string, 'daily' | 'weekly' | 'monthly'> = {
            Daily: 'daily', Weekly: 'weekly', 'Bi-weekly': 'weekly',
            Monthly: 'monthly', Quarterly: 'monthly',
          };
          const intervalMap: Record<string, number> = {
            Daily: 1, Weekly: 1, 'Bi-weekly': 2, Monthly: 1, Quarterly: 3,
          };
          const recurringType = freqMap[freq] ?? 'weekly';
          const recurringInterval = intervalMap[freq] ?? 1;
          const newDesc = `Communicate with ${stakeholder?.fullName ?? 'Stakeholder'} (${freq} via ${input.data.communicationChannel ?? stakeholder?.communicationChannel ?? 'TBD'})`;
          const dbConn = await getDb();
          const existingCommTask = dbConn ? await dbConn.select().from(tasks)
            .where(and(eq(tasks.projectId, stakeholder?.projectId ?? 1), eq(tasks.communicationStakeholderId, input.id)))
            .limit(1) : [];
          if (existingCommTask.length > 0) {
            // Update existing communication task instead of creating a duplicate
            await dbConn!.update(tasks).set({
              description: newDesc,
              responsibleId: respId,
              responsible: updateData.communicationResponsible ?? undefined,
              recurringType,
              recurringInterval,
            }).where(eq(tasks.id, existingCommTask[0].id));
          } else {
            const taskId = await db.getNextId('task', 'T', stakeholder?.projectId ?? 1);
            await db.createTask({
              projectId: stakeholder?.projectId ?? 1,
              taskId,
              description: newDesc,
              responsibleId: respId,
              responsible: updateData.communicationResponsible ?? undefined,
              recurringType,
              recurringInterval,
              status: 'Open',
              communicationStakeholderId: input.id,
            } as any);
          }
        }
        return result;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStakeholder(input.id);
        return { success: true };
      }),
  }),

  // Deliverables
  deliverables: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllDeliverables(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliverableById(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string().optional(),
        status: z.string().optional(),
        dueDate: z.string().optional(),
        linkedEntities: z.array(z.object({
          entityType: z.enum(['requirement', 'task', 'dependency']),
          entityId: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input }) => {
        try {
          // Generate auto ID
          const deliverableId = await db.getNextId('deliverable', 'DEL', input.projectId);
          
          console.log('[deliverables.create] Creating deliverable with data:', {
            projectId: input.projectId,
            deliverableId,
            description: input.description,
            status: input.status,
            dueDate: input.dueDate,
          });
          
          const created = await db.createDeliverable({
            projectId: input.projectId,
            deliverableId,
            description: input.description,
            status: input.status,
            dueDate: input.dueDate,
          });

          // Create links if provided
          if (created && input.linkedEntities) {
            for (const link of input.linkedEntities) {
              await db.createDeliverableLink({
                deliverableId: created.id,
                linkedEntityType: link.entityType,
                linkedEntityId: link.entityId,
              });
            }
          }

          return created;
        } catch (error: any) {
          console.error('[deliverables.create] Error:', error);
          console.error('[deliverables.create] Error details:', {
            message: error.message,
            cause: error.cause,
            sqlMessage: error.cause?.sqlMessage,
            errno: error.cause?.errno,
          });
          
          // User-friendly error for duplicate IDs
          if (error.cause?.errno === 1062 && error.cause?.sqlMessage?.includes('deliverableId_unique')) {
            throw new TRPCError({
              code: 'CONFLICT',
              message: 'A deliverable with this ID already exists. Please increment the counter in Settings or delete the existing deliverable.',
            });
          }
          
          throw error;
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          description: z.string().optional(),
          status: z.string().optional(),
          dueDate: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        const updated = await db.updateDeliverable(input.id, input.data);
        return updated;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDeliverable(input.id);
        return { success: true };
      }),

    getLinks: protectedProcedure
      .input(z.object({ deliverableId: z.number() }))
      .query(async ({ input }) => {
        return await db.getDeliverableLinks(input.deliverableId);
      }),

    addLink: protectedProcedure
      .input(z.object({
        deliverableId: z.number(),
        entityType: z.enum(['requirement', 'task', 'dependency']),
        entityId: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.createDeliverableLink({
          deliverableId: input.deliverableId,
          linkedEntityType: input.entityType,
          linkedEntityId: input.entityId,
        });
        return { success: true };
      }),

    removeLink: protectedProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDeliverableLink(input.linkId);
        return { success: true };
      }),

    getByEntity: protectedProcedure
      .input(z.object({
        entityType: z.enum(['requirement', 'task', 'dependency']),
        entityId: z.string(),
        projectId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getDeliverablesByEntity(input.entityType, input.entityId, input.projectId);
      }),
  }),

  // ID Configuration
  idConfig: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getIdSequencesByProject(input.projectId);
      }),

    initDefaults: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const existing = await db.getIdSequencesByProject(input.projectId);
        const existingTypes = new Set(existing.map(e => e.entityType));
        const defaults = [
          { entityType: 'requirement', prefix: 'REQ', padLength: 4 },
          { entityType: 'task', prefix: 'TSK', padLength: 4 },
          { entityType: 'issue', prefix: 'ISS', padLength: 4 },
          { entityType: 'deliverable', prefix: 'DEL', padLength: 4 },
          { entityType: 'dependency', prefix: 'DEP', padLength: 4 },
          { entityType: 'assumption', prefix: 'ASM', padLength: 4 },
          { entityType: 'knowledgeBase', prefix: 'KB', padLength: 4 },
          { entityType: 'risk', prefix: 'RISK', padLength: 4 },
          { entityType: 'Task Group', prefix: 'TG', padLength: 3, maxNumber: 999 },
          { entityType: 'Issue Group', prefix: 'IG', padLength: 3, maxNumber: 999 },
          { entityType: 'decision', prefix: 'DEC', padLength: 4 },
        ];
        let created = 0;
        for (const def of defaults) {
          if (!existingTypes.has(def.entityType)) {
            await db.createIdSequence({
              projectId: input.projectId,
              entityType: def.entityType,
              prefix: def.prefix,
              padLength: def.padLength,
              minNumber: 1,
              maxNumber: def.maxNumber || 9999,
            });
            created++;
          }
        }
        return { created };
      }),

    update: protectedProcedure
      .input(z.object({
        entityType: z.string(),
        prefix: z.string(),
        startNumber: z.number().optional(),
        minNumber: z.number().optional(),
        maxNumber: z.number().optional(),
        padLength: z.number().optional(),
        projectId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.updateIdSequence(input.entityType, {
          prefix: input.prefix,
          startNumber: input.startNumber,
          minNumber: input.minNumber,
          maxNumber: input.maxNumber,
          padLength: input.padLength,
        }, input.projectId);
      }),
  }),

  // Auto ID generation
  autoId: router({
    getNext: protectedProcedure
      .input(z.object({
        entityType: z.enum(['requirement', 'task', 'issue', 'dependency', 'assumption', 'deliverable']),
      }))
      .query(async ({ input }) => {
        const prefixes: Record<string, string> = {
          requirement: 'Q',
          task: 'T',
          issue: 'I',
          dependency: 'D',
          assumption: 'A',
          deliverable: 'DEL',
        };
        const nextId = await db.getNextId(input.entityType, prefixes[input.entityType]);
        return { nextId };
      }),
  }),

  // Dropdown Options Management
  statusOptions: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllStatusOptions(input?.category);
      }),
    create: protectedProcedure
      .input(z.object({
        value: z.string(),
        label: z.string(),
        category: z.string(),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createStatusOption(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          category: z.string().optional(),
          color: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateStatusOption(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteStatusOption(input.id);
        return { success: true };
      }),
  }),

  priorityOptions: router({
    list: publicProcedure
      .input(z.object({ category: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllPriorityOptions(input?.category);
      }),
    create: protectedProcedure
      .input(z.object({
        value: z.string(),
        label: z.string(),
        category: z.string(),
        level: z.number(),
        color: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createPriorityOption(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          category: z.string().optional(),
          level: z.number().optional(),
          color: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updatePriorityOption(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePriorityOption(input.id);
        return { success: true };
      }),
  }),

  typeOptions: router({
    list: publicProcedure.query(async () => {
      return await db.getAllTypeOptions();
    }),
    create: protectedProcedure
      .input(z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTypeOption(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTypeOption(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTypeOption(input.id);
        return { success: true };
      }),
  }),

  categoryOptions: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategoryOptions();
    }),
    create: protectedProcedure
      .input(z.object({
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCategoryOption(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCategoryOption(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCategoryOption(input.id);
        return { success: true };
      }),
  }),

  issueTypes: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllIssueTypes(input.projectId);
      }),
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createIssueType(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateIssueType(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteIssueType(input.id);
        return { success: true };
      }),
  }),

  taskTypes: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllTaskTypes(input.projectId);
      }),
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createTaskType(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTaskType(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTaskType(input.id);
        return { success: true };
      }),
  }),

  deliverableTypes: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllDeliverableTypes(input.projectId);
      }),
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createDeliverableType(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateDeliverableType(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDeliverableType(input.id);
        return { success: true };
      }),
  }),

  classOptions: router({
    list: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllClassOptions(input.projectId);
      }),
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        value: z.string(),
        label: z.string(),
        description: z.string().optional(),
        isDefault: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createClassOption(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          label: z.string().optional(),
          description: z.string().optional(),
          isDefault: z.boolean().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateClassOption(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteClassOption(input.id);
        return { success: true };
      }),
  }),

  // Dropdown Options namespace for easier frontend access
  dropdownOptions: router({
    status: router({
      getAll: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getAllStatusOptions(input?.category);
        }),
      create: protectedProcedure
        .input(z.object({
          value: z.string(),
          category: z.string().optional(),
          isComplete: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createStatusOption({
            value: input.value,
            label: input.value,
            category: input.category || 'general',
            isComplete: input.isComplete ?? false,
          });
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          value: z.string().optional(),
          isComplete: z.boolean().optional(),
        }))
        .mutation(async ({ input }) => {
          const updateData: any = {};
          if (input.value !== undefined) { updateData.label = input.value; updateData.value = input.value; }
          if (input.isComplete !== undefined) updateData.isComplete = input.isComplete;
          return await db.updateStatusOption(input.id, updateData);
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteStatusOption(input.id);
          return { success: true };
        }),
    }),
    priority: router({
      getAll: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return await db.getAllPriorityOptions(input?.category);
        }),
      create: protectedProcedure
        .input(z.object({
          value: z.string(),
          category: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          // Assign level based on common priority values
          const levelMap: Record<string, number> = {
            'Low': 1,
            'Medium': 2,
            'High': 3,
            'Very High': 4,
            'Critical': 5,
          };
          const level = levelMap[input.value] || 2;
          return await db.createPriorityOption({
            value: input.value,
            label: input.value,
            category: input.category || 'general',
            level,
          });
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          value: z.string(),
        }))
        .mutation(async ({ input }) => {
          return await db.updatePriorityOption(input.id, { label: input.value });
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deletePriorityOption(input.id);
          return { success: true };
        }),
    }),
    type: router({
      getAll: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(async () => {
          return await db.getAllTypeOptions();
        }),
      create: protectedProcedure
        .input(z.object({
          value: z.string(),
          category: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createTypeOption({
            value: input.value,
            label: input.value,
          });
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          value: z.string(),
        }))
        .mutation(async ({ input }) => {
          return await db.updateTypeOption(input.id, { label: input.value });
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteTypeOption(input.id);
          return { success: true };
        }),
    }),
    category: router({
      getAll: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(async () => {
          return await db.getAllCategoryOptions();
        }),
      create: protectedProcedure
        .input(z.object({
          value: z.string(),
          category: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createCategoryOption({
            value: input.value,
            label: input.value,
          });
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          value: z.string(),
        }))
        .mutation(async ({ input }) => {
          return await db.updateCategoryOption(input.id, { label: input.value });
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteCategoryOption(input.id);
          return { success: true };
        }),
    }),
    // Task Groups
    taskGroups: router({
      getAll: publicProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => {
          return await db.getAllTaskGroups(input.projectId);
        }),
      create: protectedProcedure
        .input(z.object({
          projectId: z.number(),
          name: z.string(),
          description: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createTaskGroup(input);
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return await db.updateTaskGroup(input.id, input.data);
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteTaskGroup(input.id);
          return { success: true };
        }),
    }),
    // Issue Groups
    issueGroups: router({
      getAll: publicProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => {
          return await db.getAllIssueGroups(input.projectId);
        }),
      create: protectedProcedure
        .input(z.object({
          projectId: z.number(),
          name: z.string(),
          description: z.string().optional(),
        }))
        .mutation(async ({ input }) => {
          return await db.createIssueGroup(input);
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          data: z.object({
            name: z.string().optional(),
            description: z.string().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return await db.updateIssueGroup(input.id, input.data);
        }),
      delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteIssueGroup(input.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
