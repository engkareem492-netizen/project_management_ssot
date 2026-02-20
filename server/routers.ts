import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as XLSX from "xlsx";
import { TRPCError } from "@trpc/server";
import { projectsRouter } from "./projects.router";
import { knowledgeBaseRouter } from "./knowledgeBase.router";
import { risksRouter } from "./risks.router";
import { systemConfigRouter } from "./systemConfig.router";
import { authLocalRouter } from "./auth.local.router";

export const appRouter = router({
  system: systemRouter,
  projects: projectsRouter,
  knowledgeBase: knowledgeBaseRouter,
  risks: risksRouter,
  systemConfig: systemConfigRouter,
  auth: authLocalRouter,

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

          // Clear existing data
          await db.deleteAllRequirements();
          await db.deleteAllTasks();
          await db.deleteAllIssues();
          await db.deleteAllDependencies();
          await db.deleteAllAssumptions();

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
          
          // Generate auto ID for task
          const taskId = await db.getNextId('task', 'T', input.projectId);
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
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const current = await db.getTaskByTaskId(input.taskId);
        if (!current) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Task not found' });
        }

        const changedFields: Record<string, { oldValue: any; newValue: any }> = {};
        const trackFields = ['currentStatus', 'statusUpdate'];
        
        for (const field of trackFields) {
          if (input.data[field as keyof typeof input.data] !== undefined && 
              current[field as keyof typeof current] !== input.data[field as keyof typeof input.data]) {
            changedFields[field] = {
              oldValue: current[field as keyof typeof current],
              newValue: input.data[field as keyof typeof input.data],
            };
          }
        }

        await db.updateTask(input.id, input.data);

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
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const current = await db.getIssueByIssueId(input.issueId);
        if (!current) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Issue not found' });
        }

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
      .input(z.object({ projectId: z.number() }).optional())
      .query(async ({ input }) => {
        return await db.getAllAssumptionsSorted(input?.projectId);
    }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        description: z.string().optional(),
        category: z.string().optional(),
        owner: z.string().optional(),
        ownerId: z.number().optional(),
        status: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Generate auto ID
        const assumptionId = await db.getNextId('assumption', 'A', input.projectId);
        await db.createAssumption({ ...input, assumptionId });
        return { success: true, assumptionId };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAssumption(input.id);
        return { success: true };
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
      }))
      .mutation(async ({ input }) => {
        const result = await db.createStakeholder(input);
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
        }),
      }))
      .mutation(async ({ input }) => {
        const result = await db.updateStakeholder(input.id, input.data);
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
      }))
      .query(async ({ input }) => {
        return await db.getDeliverablesByEntity(input.entityType, input.entityId);
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
        }))
        .mutation(async ({ input }) => {
          return await db.createStatusOption({
            value: input.value,
            label: input.value,
            category: input.category || 'general',
          });
        }),
      update: protectedProcedure
        .input(z.object({
          id: z.number(),
          value: z.string(),
        }))
        .mutation(async ({ input }) => {
          return await db.updateStatusOption(input.id, { label: input.value });
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
