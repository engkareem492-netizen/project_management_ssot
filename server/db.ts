import { eq, desc, and, or, like, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
import { 
  InsertUser, 
  users, 
  projects,
  InsertProject,
  requirements, 
  tasks, 
  issues, 
  dependencies, 
  assumptions, 
  actionLogs,
  InsertRequirement,
  InsertTask,
  InsertIssue,
  InsertDependency,
  InsertAssumption,
  InsertActionLog,
  Requirement,
  Task,
  Issue,
  statusOptions,
  priorityOptions,
  typeOptions,
  categoryOptions,
  taskGroups,
  issueGroups,
  InsertTaskGroup,
  InsertIssueGroup,
  issueTypes,
  taskTypes,
  deliverableTypes,
  classOptions,
  InsertIssueType,
  InsertTaskType,
  InsertDeliverableType,
  InsertClassOption,
  knowledgeBase,
  knowledgeBaseTypes,
  knowledgeBaseComponents,
  knowledgeBaseCodeConfig,
  InsertKnowledgeBase,
  InsertKnowledgeBaseType,
  InsertKnowledgeBaseComponent,
  InsertKnowledgeBaseCodeConfig,
  risks,
  riskTypes,
  riskStatus,
  responseStrategy,
  riskUpdates,
  riskAnalysis,
  InsertRisk,
  InsertRiskType,
  InsertRiskStatus,
  InsertResponseStrategy,
  InsertRiskUpdate,
  InsertRiskAnalysis,
  Risk,
  RiskType,
  RiskStatus,
  ResponseStrategy,
  RiskUpdate,
  RiskAnalysis,
  dropdownCategories,
  InsertDropdownCategory,
  DropdownCategory,
  idSequences,
  assumptionCategories,
  assumptionStatuses,
  assumptionImpactLevels,
  assumptionHistory,
  InsertAssumptionCategory,
  InsertAssumptionStatus,
  InsertAssumptionImpactLevel,
  InsertAssumptionHistory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL, { schema, mode: 'default' });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // Email is now required
    if (!user.email) {
      console.warn("[Database] Cannot upsert user: email is required");
      return;
    }

    const values: InsertUser = {
      email: user.email,
      openId: user.openId ?? null,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);
    
    // Email is always set
    updateSet.email = user.email;

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Requirements CRUD
export async function getAllRequirements(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(requirements).where(eq(requirements.projectId, projectId)).orderBy(desc(requirements.importedAt));
  }
  return await db.select().from(requirements).orderBy(desc(requirements.importedAt));
}

export async function getRequirementByIdCode(idCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(requirements).where(eq(requirements.idCode, idCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRequirement(data: InsertRequirement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Populate owner name from ownerId
  const enrichedData: any = { ...data };
  if (data.ownerId) {
    const stakeholder = await getStakeholderById(data.ownerId);
    if (stakeholder) enrichedData.owner = stakeholder.fullName;
  }
  
  // Remove undefined values to prevent Drizzle from using DEFAULT keyword
  const cleanedData: any = {};
  for (const [key, value] of Object.entries(enrichedData)) {
    if (value !== undefined) {
      cleanedData[key] = value;
    }
  }
  
  const result = await db.insert(requirements).values(cleanedData);
  return result;
}

export async function updateRequirement(id: number, data: Partial<Requirement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Populate owner name from ownerId when updating
  const enrichedData: any = { ...data };
  if (data.ownerId !== undefined) {
    if (data.ownerId) {
      const stakeholder = await getStakeholderById(data.ownerId);
      if (stakeholder) enrichedData.owner = stakeholder.fullName;
    } else {
      enrichedData.owner = null;
    }
  }
  await db.update(requirements).set(enrichedData).where(eq(requirements.id, id));
}

export async function deleteRequirement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(requirements).where(eq(requirements.id, id));
}

export async function deleteAllRequirements(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (projectId) {
    await db.delete(requirements).where(eq(requirements.projectId, projectId));
  } else {
    await db.delete(requirements);
  }
}

// Tasks CRUD
export async function getAllTasks(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.importedAt));
  }
  return await db.select().from(tasks).orderBy(desc(tasks.importedAt));
}

export async function getTaskByTaskId(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.taskId, taskId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Populate stakeholder name fields from IDs
  const enrichedData: any = { ...data };
  
  if (data.responsibleId) {
    const stakeholder = await getStakeholderById(data.responsibleId);
    if (stakeholder) enrichedData.responsible = stakeholder.fullName;
  }
  if (data.accountableId) {
    const stakeholder = await getStakeholderById(data.accountableId);
    if (stakeholder) enrichedData.accountable = stakeholder.fullName;
  }
  if (data.informedId) {
    const stakeholder = await getStakeholderById(data.informedId);
    if (stakeholder) enrichedData.informed = stakeholder.fullName;
  }
  if (data.consultedId) {
    const stakeholder = await getStakeholderById(data.consultedId);
    if (stakeholder) enrichedData.consulted = stakeholder.fullName;
  }
  if (data.ownerId) {
    const stakeholder = await getStakeholderById(data.ownerId);
    if (stakeholder) enrichedData.owner = stakeholder.fullName;
  }
  
  // Set undefined optional fields to null explicitly to prevent Drizzle DEFAULT keyword issue
  const cleanedData: any = { ...enrichedData };
  const optionalFields = [
    'dependencyId', 'requirementId', 'deliverableId', 'accountable', 'accountableId',
    'informed', 'informedId', 'consulted', 'consultedId', 'dueDate', 'assignDate',
    'currentStatus', 'statusUpdate', 'owner', 'ownerId', 'lastUpdate', 'updateDate'
  ];
  
  optionalFields.forEach(field => {
    if (cleanedData[field] === undefined) {
      cleanedData[field] = null;
    }
  });
  
  const result = await db.insert(tasks).values(cleanedData);
  return result;
}

export async function updateTask(id: number, data: Partial<Task>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Populate stakeholder name fields from IDs when updating
  const enrichedData: any = { ...data };
  if (data.responsibleId !== undefined) {
    if (data.responsibleId) {
      const stakeholder = await getStakeholderById(data.responsibleId);
      if (stakeholder) enrichedData.responsible = stakeholder.fullName;
    } else {
      enrichedData.responsible = null;
    }
  }
  if (data.accountableId !== undefined) {
    if (data.accountableId) {
      const stakeholder = await getStakeholderById(data.accountableId);
      if (stakeholder) enrichedData.accountable = stakeholder.fullName;
    } else {
      enrichedData.accountable = null;
    }
  }
  if (data.informedId !== undefined) {
    if (data.informedId) {
      const stakeholder = await getStakeholderById(data.informedId);
      if (stakeholder) enrichedData.informed = stakeholder.fullName;
    } else {
      enrichedData.informed = null;
    }
  }
  if (data.consultedId !== undefined) {
    if (data.consultedId) {
      const stakeholder = await getStakeholderById(data.consultedId);
      if (stakeholder) enrichedData.consulted = stakeholder.fullName;
    } else {
      enrichedData.consulted = null;
    }
  }
  if (data.ownerId !== undefined) {
    if (data.ownerId) {
      const stakeholder = await getStakeholderById(data.ownerId);
      if (stakeholder) enrichedData.owner = stakeholder.fullName;
    } else {
      enrichedData.owner = null;
    }
  }
  await db.update(tasks).set(enrichedData).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function deleteAllTasks(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (projectId) {
    await db.delete(tasks).where(eq(tasks.projectId, projectId));
  } else {
    await db.delete(tasks);
  }
}

// Issues CRUD
export async function getAllIssues(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(issues).where(eq(issues.projectId, projectId)).orderBy(desc(issues.importedAt));
  }
  return await db.select().from(issues).orderBy(desc(issues.importedAt));
}

export async function getIssueByIssueId(issueId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(issues).where(eq(issues.issueId, issueId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createIssue(data: InsertIssue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Populate owner name from ownerId
  const enrichedData: any = { ...data };
  if (data.ownerId) {
    const stakeholder = await getStakeholderById(data.ownerId);
    if (stakeholder) enrichedData.owner = stakeholder.fullName;
  }
  
  // Set undefined optional fields to null explicitly to prevent Drizzle DEFAULT keyword issue
  const cleanedData: any = { ...enrichedData };
  const optionalFields = [
    'issueGroup', 'taskGroup', 'requirementId', 'type', 'class', 'owner', 'ownerId',
    'sourceType', 'refSource', 'openDate', 'deliverableId', 'taskId',
    'deliverables1', 'd1Status', 'deliverables2', 'd2Status', 'lastUpdate', 'updateDate'
  ];
  
  optionalFields.forEach(field => {
    if (cleanedData[field] === undefined) {
      cleanedData[field] = null;
    }
  });
  
  const result = await db.insert(issues).values(cleanedData);
  return result;
}

export async function updateIssue(id: number, data: Partial<Issue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Populate owner name from ownerId when updating
  const enrichedData: any = { ...data };
  if (data.ownerId) {
    const stakeholder = await getStakeholderById(data.ownerId);
    if (stakeholder) enrichedData.owner = stakeholder.fullName;
  }
  await db.update(issues).set(enrichedData).where(eq(issues.id, id));
}

export async function deleteIssue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(issues).where(eq(issues.id, id));
}

export async function deleteAllIssues(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (projectId) {
    await db.delete(issues).where(eq(issues.projectId, projectId));
  } else {
    await db.delete(issues);
  }
}

// Dependencies CRUD
export async function getAllDependencies(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(dependencies).where(eq(dependencies.projectId, projectId)).orderBy(desc(dependencies.importedAt));
  }
  return await db.select().from(dependencies).orderBy(desc(dependencies.importedAt));
}

export async function createDependency(data: InsertDependency) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dependencies).values(data);
  return result;
}

export async function deleteDependency(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dependencies).where(eq(dependencies.id, id));
}

export async function deleteAllDependencies(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (projectId) {
    await db.delete(dependencies).where(eq(dependencies.projectId, projectId));
  } else {
    await db.delete(dependencies);
  }
}

// Assumptions CRUD
export async function getAllAssumptions(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(assumptions).where(eq(assumptions.projectId, projectId)).orderBy(desc(assumptions.importedAt));
  }
  return await db.select().from(assumptions).orderBy(desc(assumptions.importedAt));
}

export async function createAssumption(data: InsertAssumption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assumptions).values(data);
  return result;
}

export async function deleteAssumption(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assumptions).where(eq(assumptions.id, id));
}

export async function deleteAllAssumptions(projectId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (projectId) {
    await db.delete(assumptions).where(eq(assumptions.projectId, projectId));
  } else {
    await db.delete(assumptions);
  }
}

// Action Log functions
export async function createActionLog(data: InsertActionLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(actionLogs).values(data);
  return result;
}

export async function getActionLogsByEntity(entityType: "requirement" | "task" | "issue", entityId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(actionLogs)
    .where(and(eq(actionLogs.entityType, entityType), eq(actionLogs.entityId, entityId)))
    .orderBy(desc(actionLogs.changedAt));
}

export async function getAllActionLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(actionLogs).orderBy(desc(actionLogs.changedAt));
}

// Search and filter functions
export async function searchRequirements(searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(requirements)
    .where(
      or(
        like(requirements.idCode, `%${searchTerm}%`),
        like(requirements.description, `%${searchTerm}%`),
        like(requirements.owner, `%${searchTerm}%`)
      )
    );
}

export async function filterRequirements(filters: {
  status?: string;
  priority?: string;
  owner?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions = [];
  if (filters.status) conditions.push(eq(requirements.status, filters.status));
  if (filters.priority) conditions.push(eq(requirements.priority, filters.priority));
  if (filters.owner) conditions.push(like(requirements.owner, `%${filters.owner}%`));
  
  if (conditions.length === 0) return await getAllRequirements();
  
  return await db.select().from(requirements).where(and(...conditions));
}

// Relationship mapping functions
export async function getRequirementRelationships(requirementId: string) {
  const db = await getDb();
  if (!db) return { tasks: [], issues: [] };
  
  const relatedTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.requirementId, requirementId));
  
  const relatedIssues = await db
    .select()
    .from(issues)
    .where(eq(issues.requirementId, requirementId));
  
  return { tasks: relatedTasks, issues: relatedIssues };
}

export async function getAllRelationships(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const allRequirements = projectId ? await getAllRequirements(projectId) : await getAllRequirements();
  const allTasks = projectId ? await getAllTasks(projectId) : await getAllTasks();
  const allIssues = projectId ? await getAllIssuesSorted(projectId) : await getAllIssues();
  
  const relationships = [];
  
  for (const req of allRequirements) {
    const relatedTasks = allTasks.filter(t => t.requirementId === req.idCode);
    const relatedIssues = allIssues.filter(i => i.requirementId === req.idCode);
    
    if (relatedTasks.length > 0 || relatedIssues.length > 0) {
      // Fetch linked deliverables for requirement, tasks, and issues
      const reqDeliverables = await getDeliverablesByEntity('requirement', req.idCode, projectId);
      const tasksWithDeliverables = await Promise.all(
        relatedTasks.map(async (task) => ({
          ...task,
          linkedDeliverables: await getDeliverablesByEntity('task', task.taskId, projectId)
        }))
      );
      const issuesWithDeliverables = await Promise.all(
        relatedIssues.map(async (issue) => ({
          ...issue,
          linkedDeliverables: [] // Issues don't link to deliverables currently
        }))
      );
      
      relationships.push({
        requirement: { ...req, linkedDeliverables: reqDeliverables },
        tasks: tasksWithDeliverables,
        issues: issuesWithDeliverables,
      });
    }
  }
  
  return relationships;
}


// Import new schema types
import { 
  stakeholders, 
  deliverables, 
  deliverableLinks,
  issueLinks,
  InsertStakeholder,
  InsertDeliverable,
  InsertDeliverableLink,
  InsertIssueLink,
  Stakeholder,
  Deliverable
} from "../drizzle/schema";

// ID Sequence functions - Auto-generate IDs
/**
 * Scans the actual data table for the given entityType and returns the highest
 * numeric suffix already stored. Used to self-heal stale idSequences rows.
 */
async function getMaxEntityNumber(entityType: string, projectId: number, prefix: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Map entityType to the table and its ID code column
  const entityTableMap: Record<string, { table: any; col: string }> = {
    requirement: { table: requirements, col: "idCode" },
    task: { table: tasks, col: "taskId" },
    issue: { table: issues, col: "issueId" },
    dependency: { table: dependencies, col: "dependencyId" },
    assumption: { table: assumptions, col: "assumptionId" },
    deliverable: { table: deliverables, col: "deliverableId" },
  };
  const entry = entityTableMap[entityType];
  if (!entry) return 0;
  try {
    const rows = await db.select().from(entry.table).where(eq(entry.table.projectId, projectId));
    let max = 0;
    for (const row of rows) {
      const code: string = row[entry.col] ?? "";
      // Extract trailing digits after the prefix separator
      const match = code.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > max) max = num;
      }
    }
    return max;
  } catch {
    return 0;
  }
}

export async function getNextId(entityType: string, defaultPrefix: string, projectId: number = 1): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Try to get existing sequence for this project
  const existing = await db
    .select()
    .from(idSequences)
    .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)))
    .limit(1);
  
  let nextNumber: number;
  let actualPrefix: string;
  
  if (existing.length === 0) {
    // Create new sequence starting at 1 with default prefix
    // Use raw SQL to avoid Drizzle schema mismatch with extra DB columns (padding, startNumber, entityLabel)
    try {
      await db.execute(
        sql`INSERT INTO idSequences (projectId, entityType, prefix, currentNumber) VALUES (${projectId}, ${entityType}, ${defaultPrefix}, 1)`
      );
    } catch (insertErr: any) {
      // If insert fails (e.g. duplicate), try to fetch again
      const retry = await db
        .select()
        .from(idSequences)
        .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)))
        .limit(1);
      if (retry.length > 0) {
        const retryNumber = retry[0].currentNumber + 1;
        await db
          .update(idSequences)
          .set({ currentNumber: retryNumber })
          .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)));
        return `${retry[0].prefix}-${retryNumber.toString().padStart(4, '0')}`;
      }
      throw insertErr;
    }
    nextNumber = 1;
    actualPrefix = defaultPrefix;
  } else {
    // Use prefix from database configuration, not the default parameter
    actualPrefix = existing[0].prefix;
    // Always sync with actual max ID in the data table to prevent reuse of deleted/imported IDs
    let baseNumber = existing[0].currentNumber;
    const maxFromData = await getMaxEntityNumber(entityType, projectId, actualPrefix);
    if (maxFromData > baseNumber) {
      baseNumber = maxFromData;
    }
    // Increment
    nextNumber = baseNumber + 1;
    await db
      .update(idSequences)
      .set({ currentNumber: nextNumber })
      .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)));
  }
  
  // Format as prefix + 4-digit number (e.g., Q-0001 or S-0003)
  return `${actualPrefix}-${nextNumber.toString().padStart(4, '0')}`;
}

export async function initializeIdSequence(entityType: string, prefix: string, startNumber: number, projectId: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(idSequences)
    .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)))
    .limit(1);
  
  if (existing.length === 0) {
    await db.insert(idSequences).values({
      projectId,
      entityType,
      prefix,
      currentNumber: startNumber,
    });
  } else if (startNumber > existing[0].currentNumber) {
    await db
      .update(idSequences)
      .set({ currentNumber: startNumber })
      .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)));
  }
}

// Stakeholders CRUD
export async function getAllStakeholders(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId)).orderBy(stakeholders.fullName);
}

export async function getStakeholderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(stakeholders).where(eq(stakeholders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createStakeholder(data: InsertStakeholder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(stakeholders).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(stakeholders).where(eq(stakeholders.id, insertId)).limit(1);
  return created[0];
}

export async function updateStakeholder(id: number, data: Partial<Stakeholder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(stakeholders).set(data).where(eq(stakeholders.id, id));
  const updated = await db.select().from(stakeholders).where(eq(stakeholders.id, id)).limit(1);
  return updated[0];
}

export async function deleteStakeholder(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(stakeholders).where(eq(stakeholders.id, id));
}

// Deliverables CRUD
export async function getAllDeliverables(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(deliverables).where(eq(deliverables.projectId, projectId)).orderBy(deliverables.deliverableId);
  }
  return await db.select().from(deliverables).orderBy(deliverables.deliverableId);
}

export async function getDeliverableById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(deliverables).where(eq(deliverables.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createDeliverable(data: InsertDeliverable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliverables).values(data);
  const insertId = result[0].insertId;
  const created = await db.select().from(deliverables).where(eq(deliverables.id, insertId)).limit(1);
  return created[0];
}

export async function updateDeliverable(id: number, data: Partial<Deliverable>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(deliverables).set(data).where(eq(deliverables.id, id));
  const updated = await db.select().from(deliverables).where(eq(deliverables.id, id)).limit(1);
  return updated[0];
}

export async function deleteDeliverable(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Delete all links first
  await db.delete(deliverableLinks).where(eq(deliverableLinks.deliverableId, id));
  // Then delete the deliverable
  await db.delete(deliverables).where(eq(deliverables.id, id));
}

// Deliverable Links CRUD
export async function getDeliverableLinks(deliverableId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(deliverableLinks)
    .where(eq(deliverableLinks.deliverableId, deliverableId));
}

export async function getLinksByEntity(entityType: "requirement" | "task" | "dependency", entityId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(deliverableLinks)
    .where(
      and(
        eq(deliverableLinks.linkedEntityType, entityType),
        eq(deliverableLinks.linkedEntityId, entityId)
      )
    );
}

export async function createDeliverableLink(data: InsertDeliverableLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(deliverableLinks).values(data);
  return result;
}

export async function deleteDeliverableLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(deliverableLinks).where(eq(deliverableLinks.id, id));
}

export async function getDeliverablesByEntity(entityType: "requirement" | "task" | "dependency", entityId: string, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const links = await getLinksByEntity(entityType, entityId);
  if (links.length === 0) return [];
  
  const deliverableIds = links.map(l => l.deliverableId);
  const allDeliverables = await getAllDeliverables(projectId);
  return allDeliverables.filter(d => deliverableIds.includes(d.id));
}

// Issue Links functions
export async function createIssueLink(data: InsertIssueLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(issueLinks).values(data);
  return result;
}

export async function deleteIssueLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(issueLinks).where(eq(issueLinks.id, id));
}

export async function getIssueLinksByEntity(entityType: "requirement" | "task" | "dependency", entityId: string) {
  const db = await getDb();
  if (!db) return [];
  return await db
    .select()
    .from(issueLinks)
    .where(
      and(
        eq(issueLinks.linkedEntityType, entityType),
        eq(issueLinks.linkedEntityId, entityId)
      )
    );
}

export async function getIssuesByEntity(entityType: "requirement" | "task" | "dependency", entityId: string, projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const links = await getIssueLinksByEntity(entityType, entityId);
  if (links.length === 0) return [];
  
  const issueIds = links.map(l => l.issueId);
  // Query issues directly by IDs and filter by projectId if provided
  if (projectId) {
    return await db.select().from(issues)
      .where(and(inArray(issues.id, issueIds), eq(issues.projectId, projectId)))
      .orderBy(issues.issueId);
  }
  return await db.select().from(issues)
    .where(inArray(issues.id, issueIds))
    .orderBy(issues.issueId);
}

// Enhanced relationship functions
export async function getRequirementWithLinkedItems(requirementId: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Get the requirement
  const req = await getRequirementByIdCode(requirementId);
  if (!req) return null;
  
  // Get linked tasks (filter by projectId)
  const relatedTasks = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.requirementId, requirementId), eq(tasks.projectId, req.projectId)));
  
  // Get linked issues (filter by projectId)
  const relatedIssues = await db
    .select()
    .from(issues)
    .where(and(eq(issues.requirementId, requirementId), eq(issues.projectId, req.projectId)));
  
  // Get linked deliverables (filter by projectId)
  const relatedDeliverables = await getDeliverablesByEntity("requirement", requirementId, req.projectId);
  
  return {
    requirement: req,
    tasks: relatedTasks,
    issues: relatedIssues,
    deliverables: relatedDeliverables,
  };
}

// Get sorted lists by ID
export async function getAllRequirementsSorted(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(requirements)
    .where(eq(requirements.projectId, projectId))
    .orderBy(requirements.idCode);
}

export async function getAllTasksSorted(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all tasks
  const allTasks = await db.select().from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.taskId);
  
  // For each task, get the latest action log entry to populate currentStatus
  const tasksWithStatus = await Promise.all(allTasks.map(async (task) => {
    const latestLog = await db.select().from(actionLogs)
      .where(and(eq(actionLogs.entityType, 'task'), eq(actionLogs.entityId, task.taskId)))
      .orderBy(desc(actionLogs.changedAt))
      .limit(1);
    
    const currentStatus = latestLog[0]?.changedFields?.currentStatus?.newValue || task.currentStatus || 'No updates';
    
    return {
      ...task,
      currentStatus,
    };
  }));
  
  return tasksWithStatus;
}

export async function getAllIssuesSorted(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(issues)
    .where(eq(issues.projectId, projectId))
    .orderBy(issues.issueId);
}

export async function getAllDependenciesSorted(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(dependencies);
  if (projectId) {
    return await query.where(eq(dependencies.projectId, projectId)).orderBy(dependencies.dependencyId);
  }
  return await query.orderBy(dependencies.dependencyId);
}

export async function getAllAssumptionsSorted(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(assumptions);
  if (projectId) {
    return await query.where(eq(assumptions.projectId, projectId)).orderBy(assumptions.assumptionId);
  }
  return await query.orderBy(assumptions.assumptionId);
}

// ID Configuration functions
export async function getAllIdSequences() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(idSequences);
}

export async function getIdSequencesByProject(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(idSequences).where(eq(idSequences.projectId, projectId));
}

export async function getIdSequence(entityType: string, projectId?: number) {
  const db = await getDb();
  if (!db) return null;
  const whereClause = projectId 
    ? and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId))
    : eq(idSequences.entityType, entityType);
  const result = await db.select().from(idSequences).where(whereClause).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateIdSequence(entityType: string, data: { prefix?: string; startNumber?: number; minNumber?: number; maxNumber?: number; padLength?: number }, projectId: number = 1) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = {};
  if (data.prefix !== undefined) updateData.prefix = data.prefix;
  if (data.startNumber !== undefined) updateData.currentNumber = data.startNumber - 1; // Set to startNumber - 1 so next ID will be startNumber
  if (data.minNumber !== undefined) updateData.minNumber = data.minNumber;
  if (data.maxNumber !== undefined) updateData.maxNumber = data.maxNumber;
  if (data.padLength !== undefined) updateData.padLength = data.padLength;
  
  await db.update(idSequences)
    .set(updateData)
    .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)));
  
  return await getIdSequence(entityType, projectId);
}


// ==================== Dropdown Options Management ====================

/**
 * Status Options
 */
export async function getAllStatusOptions(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== 'all') {
    return await db.select().from(statusOptions).where(
      or(eq(statusOptions.category, category), eq(statusOptions.category, 'all'))
    );
  }
  return await db.select().from(statusOptions);
}

export async function createStatusOption(data: { value: string; label: string; category: string; color?: string; isDefault?: boolean; isComplete?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(statusOptions).values(data);
  return created;
}

export async function updateStatusOption(id: number, data: Partial<{ label: string; value: string; category: string; color: string; isDefault: boolean; isComplete: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(statusOptions).set(data).where(eq(statusOptions.id, id));
  return await db.select().from(statusOptions).where(eq(statusOptions.id, id)).limit(1);
}

export async function deleteStatusOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  // Check if option is in use
  const option = await db.select().from(statusOptions).where(eq(statusOptions.id, id)).limit(1);
  if (option[0]?.usageCount && option[0].usageCount > 0) {
    throw new Error('Cannot delete option that is currently in use');
  }
  await db.delete(statusOptions).where(eq(statusOptions.id, id));
}

export async function incrementStatusUsage(value: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(statusOptions)
    .set({ usageCount: sql`${statusOptions.usageCount} + 1` })
    .where(eq(statusOptions.value, value));
}

/**
 * Priority Options
 */
export async function getAllPriorityOptions(category?: string) {
  const db = await getDb();
  if (!db) return [];
  if (category && category !== 'all') {
    return await db.select().from(priorityOptions).where(
      or(eq(priorityOptions.category, category), eq(priorityOptions.category, 'all'))
    ).orderBy(priorityOptions.level);
  }
  return await db.select().from(priorityOptions).orderBy(priorityOptions.level);
}

export async function createPriorityOption(data: { value: string; label: string; category: string; level: number; color?: string; isDefault?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(priorityOptions).values(data);
  return created;
}

export async function updatePriorityOption(id: number, data: Partial<{ label: string; category: string; level: number; color: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(priorityOptions).set(data).where(eq(priorityOptions.id, id));
  return await db.select().from(priorityOptions).where(eq(priorityOptions.id, id)).limit(1);
}

export async function deletePriorityOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const option = await db.select().from(priorityOptions).where(eq(priorityOptions.id, id)).limit(1);
  if (option[0]?.usageCount && option[0].usageCount > 0) {
    throw new Error('Cannot delete option that is currently in use');
  }
  await db.delete(priorityOptions).where(eq(priorityOptions.id, id));
}

export async function incrementPriorityUsage(value: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(priorityOptions)
    .set({ usageCount: sql`${priorityOptions.usageCount} + 1` })
    .where(eq(priorityOptions.value, value));
}

/**
 * Type Options
 */
export async function getAllTypeOptions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(typeOptions);
}

export async function createTypeOption(data: { value: string; label: string; description?: string; isDefault?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(typeOptions).values(data);
  const [created] = await db.select().from(typeOptions).where(eq(typeOptions.value, data.value));
  return created;
}

export async function updateTypeOption(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(typeOptions).set(data).where(eq(typeOptions.id, id));
  return await db.select().from(typeOptions).where(eq(typeOptions.id, id)).limit(1);
}

export async function deleteTypeOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const option = await db.select().from(typeOptions).where(eq(typeOptions.id, id)).limit(1);
  if (option[0]?.usageCount && option[0].usageCount > 0) {
    throw new Error('Cannot delete option that is currently in use');
  }
  await db.delete(typeOptions).where(eq(typeOptions.id, id));
}

export async function incrementTypeUsage(value: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(typeOptions)
    .set({ usageCount: sql`${typeOptions.usageCount} + 1` })
    .where(eq(typeOptions.value, value));
}

/**
 * Category Options
 */
export async function getAllCategoryOptions() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categoryOptions);
}

export async function createCategoryOption(data: { value: string; label: string; description?: string; isDefault?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(categoryOptions).values(data);
  const [created] = await db.select().from(categoryOptions).where(eq(categoryOptions.value, data.value));
  return created;
}

export async function updateCategoryOption(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(categoryOptions).set(data).where(eq(categoryOptions.id, id));
  return await db.select().from(categoryOptions).where(eq(categoryOptions.id, id)).limit(1);
}

export async function deleteCategoryOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const option = await db.select().from(categoryOptions).where(eq(categoryOptions.id, id)).limit(1);
  if (option[0]?.usageCount && option[0].usageCount > 0) {
    throw new Error('Cannot delete option that is currently in use');
  }
  await db.delete(categoryOptions).where(eq(categoryOptions.id, id));
}

export async function incrementCategoryUsage(value: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(categoryOptions)
    .set({ usageCount: sql`${categoryOptions.usageCount} + 1` })
    .where(eq(categoryOptions.value, value));
}

/**
 * Issue Types (project-specific)
 */
export async function getAllIssueTypes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(issueTypes).where(eq(issueTypes.projectId, projectId));
}

export async function createIssueType(data: InsertIssueType) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(issueTypes).values(data).$returningId();
  return await db.select().from(issueTypes).where(eq(issueTypes.id, created.id)).limit(1).then(r => r[0]);
}

export async function updateIssueType(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(issueTypes).set(data).where(eq(issueTypes.id, id));
  return await db.select().from(issueTypes).where(eq(issueTypes.id, id)).limit(1).then(r => r[0]);
}

export async function deleteIssueType(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(issueTypes).where(eq(issueTypes.id, id));
}

/**
 * Task Types (project-specific)
 */
export async function getAllTaskTypes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(taskTypes).where(eq(taskTypes.projectId, projectId));
}

export async function createTaskType(data: InsertTaskType) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(taskTypes).values(data).$returningId();
  return await db.select().from(taskTypes).where(eq(taskTypes.id, created.id)).limit(1).then(r => r[0]);
}

export async function updateTaskType(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(taskTypes).set(data).where(eq(taskTypes.id, id));
  return await db.select().from(taskTypes).where(eq(taskTypes.id, id)).limit(1).then(r => r[0]);
}

export async function deleteTaskType(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(taskTypes).where(eq(taskTypes.id, id));
}

/**
 * Deliverable Types (project-specific)
 */
export async function getAllDeliverableTypes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(deliverableTypes).where(eq(deliverableTypes.projectId, projectId));
}

export async function createDeliverableType(data: InsertDeliverableType) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(deliverableTypes).values(data).$returningId();
  return await db.select().from(deliverableTypes).where(eq(deliverableTypes.id, created.id)).limit(1).then(r => r[0]);
}

export async function updateDeliverableType(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(deliverableTypes).set(data).where(eq(deliverableTypes.id, id));
  return await db.select().from(deliverableTypes).where(eq(deliverableTypes.id, id)).limit(1).then(r => r[0]);
}

export async function deleteDeliverableType(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(deliverableTypes).where(eq(deliverableTypes.id, id));
}

/**
 * Class Options (project-specific)
 */
export async function getAllClassOptions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(classOptions).where(eq(classOptions.projectId, projectId));
}

export async function createClassOption(data: InsertClassOption) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(classOptions).values(data).$returningId();
  return await db.select().from(classOptions).where(eq(classOptions.id, created.id)).limit(1).then(r => r[0]);
}

export async function updateClassOption(id: number, data: Partial<{ label: string; description: string; isDefault: boolean }>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(classOptions).set(data).where(eq(classOptions.id, id));
  return await db.select().from(classOptions).where(eq(classOptions.id, id)).limit(1).then(r => r[0]);
}

export async function deleteClassOption(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(classOptions).where(eq(classOptions.id, id));
}

// Project functions
export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      createdBy: projects.createdBy,
      password: projects.password,
    }).from(projects);
    return result.map(p => ({ ...p, hasPassword: !!p.password, password: undefined }));
  } catch (error) {
    console.error("[Database] Failed to get projects:", error);
    return [];
  }
}

export async function getProjectsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      createdAt: projects.createdAt,
      createdBy: projects.createdBy,
      password: projects.password,
    }).from(projects).where(eq(projects.createdBy, userId));
    return result.map(p => ({ ...p, hasPassword: !!p.password, password: undefined }));
  } catch (error) {
    console.error("[Database] Failed to get projects by user:", error);
    return [];
  }
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get project:", error);
    return null;
  }
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    const result = await db.insert(projects).values(data);
    const insertResult = result as any;
    const insertId = insertResult[0]?.insertId || insertResult.insertId;
    if (!insertId || isNaN(Number(insertId))) {
      // Fallback: get the latest created project by name
      const [created] = await db.select().from(projects)
        .where(eq(projects.name, data.name))
        .orderBy(desc(projects.id))
        .limit(1);
      return created;
    }
    const [created] = await db.select().from(projects).where(eq(projects.id, Number(insertId)));
    return created;
  } catch (error) {
    console.error("[Database] Failed to create project:", error);
    throw error;
  }
}

export async function updateProjectPassword(projectId: number, hashedPassword: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    await db.update(projects).set({ password: hashedPassword }).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update project password:", error);
    throw error;
  }
}

export async function importProjectData(targetProjectId: number, sourceData: any, selectedEntities: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Import stakeholders
    if (selectedEntities.stakeholders && sourceData.stakeholders?.length > 0) {
      for (const stakeholder of sourceData.stakeholders) {
        const { id, createdAt, updatedAt, ...stakeholderData } = stakeholder;
        await db.insert(stakeholders).values({
          ...stakeholderData,
          projectId: targetProjectId,
        });
      }
    }

    // Import task groups
    if (selectedEntities.taskGroups && sourceData.taskGroups?.length > 0) {
      for (const group of sourceData.taskGroups) {
        const { id, createdAt, updatedAt, ...groupData } = group;
        await db.insert(taskGroups).values({
          ...groupData,
          projectId: targetProjectId,
        });
      }
    }

    // Import issue groups
    if (selectedEntities.issueGroups && sourceData.issueGroups?.length > 0) {
      for (const group of sourceData.issueGroups) {
        const { id, createdAt, updatedAt, ...groupData } = group;
        await db.insert(issueGroups).values({
          ...groupData,
          projectId: targetProjectId,
        });
      }
    }

    // Import issue types
    if (selectedEntities.issueTypes && sourceData.issueTypes?.length > 0) {
      for (const type of sourceData.issueTypes) {
        const { id, createdAt, updatedAt, ...typeData } = type;
        await db.insert(issueTypes).values({
          ...typeData,
          projectId: targetProjectId,
        });
      }
    }

    // Import task types
    if (selectedEntities.taskTypes && sourceData.taskTypes?.length > 0) {
      for (const type of sourceData.taskTypes) {
        const { id, createdAt, updatedAt, ...typeData } = type;
        await db.insert(taskTypes).values({
          ...typeData,
          projectId: targetProjectId,
        });
      }
    }

    // Import deliverable types
    if (selectedEntities.deliverableTypes && sourceData.deliverableTypes?.length > 0) {
      for (const type of sourceData.deliverableTypes) {
        const { id, createdAt, updatedAt, ...typeData } = type;
        await db.insert(deliverableTypes).values({
          ...typeData,
          projectId: targetProjectId,
        });
      }
    }

    // Import class options
    if (selectedEntities.classOptions && sourceData.classOptions?.length > 0) {
      for (const option of sourceData.classOptions) {
        const { id, createdAt, updatedAt, ...optionData } = option;
        await db.insert(classOptions).values({
          ...optionData,
          projectId: targetProjectId,
        });
      }
    }

    // Import deliverables
    if (selectedEntities.deliverables && sourceData.deliverables?.length > 0) {
      for (const deliverable of sourceData.deliverables) {
        const { id, createdAt, updatedAt, importedAt, ...deliverableData } = deliverable;
        await db.insert(deliverables).values({
          ...deliverableData,
          projectId: targetProjectId,
        });
      }
    }

    // Import requirements
    if (selectedEntities.requirements && sourceData.requirements?.length > 0) {
      for (const requirement of sourceData.requirements) {
        const { id, createdAt, updatedAt, importedAt, ...requirementData } = requirement;
        await db.insert(requirements).values({
          ...requirementData,
          projectId: targetProjectId,
        });
      }
    }

    // Import tasks
    if (selectedEntities.tasks && sourceData.tasks?.length > 0) {
      for (const task of sourceData.tasks) {
        const { id, createdAt, updatedAt, importedAt, ...taskData } = task;
        await db.insert(tasks).values({
          ...taskData,
          projectId: targetProjectId,
        });
      }
    }

    // Import issues
    if (selectedEntities.issues && sourceData.issues?.length > 0) {
      for (const issue of sourceData.issues) {
        const { id, createdAt, updatedAt, importedAt, ...issueData } = issue;
        await db.insert(issues).values({
          ...issueData,
          projectId: targetProjectId,
        });
      }
    }

    // Import dependencies
    if (selectedEntities.dependencies && sourceData.dependencies?.length > 0) {
      for (const dependency of sourceData.dependencies) {
        const { id, createdAt, updatedAt, importedAt, ...dependencyData } = dependency;
        await db.insert(dependencies).values({
          ...dependencyData,
          projectId: targetProjectId,
        });
      }
    }

    // Import assumptions
    if (selectedEntities.assumptions && sourceData.assumptions?.length > 0) {
      for (const assumption of sourceData.assumptions) {
        const { id, createdAt, updatedAt, importedAt, ...assumptionData } = assumption;
        await db.insert(assumptions).values({
          ...assumptionData,
          projectId: targetProjectId,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error importing project data:", error);
    throw error;
  }
}

export async function exportProjectData(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Export all project data for import into another project
    const [projectRequirements, projectTasks, projectIssues, projectStakeholders, 
           projectDeliverables, projectDependencies, projectAssumptions,
           projectTaskGroups, projectIssueGroups, projectIssueTypes,
           projectTaskTypes, projectDeliverableTypes, projectClassOptions] = await Promise.all([
      db.select().from(requirements).where(eq(requirements.projectId, projectId)),
      db.select().from(tasks).where(eq(tasks.projectId, projectId)),
      db.select().from(issues).where(eq(issues.projectId, projectId)),
      db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId)),
      db.select().from(deliverables).where(eq(deliverables.projectId, projectId)),
      db.select().from(dependencies).where(eq(dependencies.projectId, projectId)),
      db.select().from(assumptions).where(eq(assumptions.projectId, projectId)),
      db.select().from(taskGroups).where(eq(taskGroups.projectId, projectId)),
      db.select().from(issueGroups).where(eq(issueGroups.projectId, projectId)),
      db.select().from(issueTypes).where(eq(issueTypes.projectId, projectId)),
      db.select().from(taskTypes).where(eq(taskTypes.projectId, projectId)),
      db.select().from(deliverableTypes).where(eq(deliverableTypes.projectId, projectId)),
      db.select().from(classOptions).where(eq(classOptions.projectId, projectId)),
    ]);

    return {
      requirements: projectRequirements,
      tasks: projectTasks,
      issues: projectIssues,
      stakeholders: projectStakeholders,
      deliverables: projectDeliverables,
      dependencies: projectDependencies,
      assumptions: projectAssumptions,
      taskGroups: projectTaskGroups,
      issueGroups: projectIssueGroups,
      issueTypes: projectIssueTypes,
      taskTypes: projectTaskTypes,
      deliverableTypes: projectDeliverableTypes,
      classOptions: projectClassOptions,
    };
  } catch (error) {
    console.error("Error exporting project data:", error);
    throw error;
  }
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Delete all related data first
    await db.delete(requirements).where(eq(requirements.projectId, projectId));
    await db.delete(tasks).where(eq(tasks.projectId, projectId));
    await db.delete(issues).where(eq(issues.projectId, projectId));
    await db.delete(stakeholders).where(eq(stakeholders.projectId, projectId));
    await db.delete(taskGroups).where(eq(taskGroups.projectId, projectId));
    await db.delete(issueGroups).where(eq(issueGroups.projectId, projectId));
    
    // Finally delete the project itself
    await db.delete(projects).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete project:", error);
    throw error;
  }
}

// Task Groups functions
export async function getAllTaskGroups(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.select().from(taskGroups).where(eq(taskGroups.projectId, projectId)).orderBy(taskGroups.name);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get task groups:", error);
    return [];
  }
}

export async function createTaskGroup(data: { projectId: number; name: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Generate ID code for Task Group
    const idCode = await getNextId('Task Group', 'TG', data.projectId);
    const result = await db.insert(taskGroups).values({ ...data, idCode });
    const insertResult = result as any;
    const insertId = insertResult[0]?.insertId || insertResult.insertId;
    if (!insertId || isNaN(Number(insertId))) {
      // Fallback: get the latest created task group by name
      const [created] = await db.select().from(taskGroups)
        .where(and(eq(taskGroups.projectId, data.projectId), eq(taskGroups.name, data.name)))
        .orderBy(desc(taskGroups.id))
        .limit(1);
      return created;
    }
    const [created] = await db.select().from(taskGroups).where(eq(taskGroups.id, Number(insertId)));
    return created;
  } catch (error) {
    console.error("[Database] Failed to create task group:", error);
    throw error;
  }
}

export async function updateTaskGroup(id: number, data: { name?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(taskGroups).set(data).where(eq(taskGroups.id, id));
  return { success: true };
}

export async function deleteTaskGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(taskGroups).where(eq(taskGroups.id, id));
}

// Issue Groups functions
export async function getAllIssueGroups(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  
  try {
    const result = await db.select().from(issueGroups).where(eq(issueGroups.projectId, projectId)).orderBy(issueGroups.name);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get issue groups:", error);
    return [];
  }
}

export async function createIssueGroup(data: { projectId: number; name: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  try {
    // Generate ID code for Issue Group
    const idCode = await getNextId('Issue Group', 'IG', data.projectId);
    const result = await db.insert(issueGroups).values({ ...data, idCode });
    const insertResult = result as any;
    const insertId = insertResult[0]?.insertId || insertResult.insertId;
    if (!insertId || isNaN(Number(insertId))) {
      // Fallback: get the latest created issue group by name
      const [created] = await db.select().from(issueGroups)
        .where(and(eq(issueGroups.projectId, data.projectId), eq(issueGroups.name, data.name)))
        .orderBy(desc(issueGroups.id))
        .limit(1);
      return created;
    }
    const [created] = await db.select().from(issueGroups).where(eq(issueGroups.id, Number(insertId)));
    return created;
  } catch (error) {
    console.error("[Database] Failed to create issue group:", error);
    throw error;
  }
}

export async function updateIssueGroup(id: number, data: { name?: string; description?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(issueGroups).set(data).where(eq(issueGroups.id, id));
  return { success: true };
}

export async function deleteIssueGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(issueGroups).where(eq(issueGroups.id, id));
}


// ============================================
// Knowledge Base Functions
// ============================================

export async function getKnowledgeBaseEntries(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId));
}

export async function getKnowledgeBaseEntry(id: number) {
  const db = await getDb();
  if (!db) return null;
  const results = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id)).limit(1);
  return results[0] || null;
}

export async function createKnowledgeBaseEntry(data: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(knowledgeBase).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateKnowledgeBaseEntry(id: number, data: Partial<InsertKnowledgeBase>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgeBase).set(data).where(eq(knowledgeBase.id, id));
  return { success: true };
}

export async function deleteKnowledgeBaseEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(knowledgeBase).where(eq(knowledgeBase.id, id));
  return { success: true };
}

// Knowledge Base Types
export async function getKnowledgeBaseTypes(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeBaseTypes).where(eq(knowledgeBaseTypes.projectId, projectId));
}

export async function createKnowledgeBaseType(data: InsertKnowledgeBaseType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(knowledgeBaseTypes).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateKnowledgeBaseType(id: number, data: Partial<InsertKnowledgeBaseType>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgeBaseTypes).set(data).where(eq(knowledgeBaseTypes.id, id));
  return { success: true };
}

export async function deleteKnowledgeBaseType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(knowledgeBaseTypes).where(eq(knowledgeBaseTypes.id, id));
  return { success: true };
}

// Knowledge Base Components
export async function getKnowledgeBaseComponents(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(knowledgeBaseComponents).where(eq(knowledgeBaseComponents.projectId, projectId));
}

export async function createKnowledgeBaseComponent(data: InsertKnowledgeBaseComponent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(knowledgeBaseComponents).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateKnowledgeBaseComponent(id: number, data: Partial<InsertKnowledgeBaseComponent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(knowledgeBaseComponents).set(data).where(eq(knowledgeBaseComponents.id, id));
  return { success: true };
}

export async function deleteKnowledgeBaseComponent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(knowledgeBaseComponents).where(eq(knowledgeBaseComponents.id, id));
  return { success: true };
}

// Knowledge Base Code Configuration
export async function getKnowledgeBaseCodeConfig(projectId: number) {
  const db = await getDb();
  if (!db) return { prefix: "KB" };
  const results = await db.select().from(knowledgeBaseCodeConfig).where(eq(knowledgeBaseCodeConfig.projectId, projectId)).limit(1);
  return results[0] || { prefix: "KB" };
}

export async function updateKnowledgeBaseCodeConfig(projectId: number, prefix: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if config exists
  const existing = await db.select().from(knowledgeBaseCodeConfig).where(eq(knowledgeBaseCodeConfig.projectId, projectId)).limit(1);
  
  if (existing.length > 0) {
    await db.update(knowledgeBaseCodeConfig).set({ prefix }).where(eq(knowledgeBaseCodeConfig.projectId, projectId));
  } else {
    await db.insert(knowledgeBaseCodeConfig).values({ projectId, prefix });
  }
  
  return { success: true };
}

export async function generateKnowledgeBaseCode(projectId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get prefix configuration
  const config = await getKnowledgeBaseCodeConfig(projectId);
  const prefix = config.prefix || "KB";
  
  // Get the highest code number for this project
  const entries = await db.select().from(knowledgeBase).where(eq(knowledgeBase.projectId, projectId));
  
  let maxNumber = 0;
  entries.forEach((entry) => {
    // Extract number from code (e.g., "KB-001" -> 1)
    const match = entry.code.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNumber) maxNumber = num;
    }
  });
  
  const nextNumber = maxNumber + 1;
  return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
}

// ==================== Risk Register Functions ====================

export async function getAllRisks(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(risks).where(eq(risks.projectId, projectId));
}

export async function getRiskById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(risks).where(eq(risks.id, id));
  return result[0];
}

export async function createRisk(data: InsertRisk) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(risks).values(data);
  return result;
}

export async function updateRisk(id: number, data: Partial<Risk>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(risks).set(data).where(eq(risks.id, id));
}

export async function deleteRisk(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(risks).where(eq(risks.id, id));
}

// Risk Types
export async function getAllRiskTypes(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(riskTypes).where(eq(riskTypes.projectId, projectId));
}

export async function createRiskType(data: InsertRiskType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(riskTypes).values(data);
  return result;
}

export async function updateRiskType(id: number, data: Partial<RiskType>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(riskTypes).set(data).where(eq(riskTypes.id, id));
}

export async function deleteRiskType(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(riskTypes).where(eq(riskTypes.id, id));
}

// Risk Status
export async function getAllRiskStatuses(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(riskStatus).where(eq(riskStatus.projectId, projectId));
}

export async function createRiskStatus(data: InsertRiskStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(riskStatus).values(data);
  return result;
}

export async function updateRiskStatus(id: number, data: Partial<RiskStatus>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(riskStatus).set(data).where(eq(riskStatus.id, id));
}

export async function deleteRiskStatus(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(riskStatus).where(eq(riskStatus.id, id));
}

// Response Strategies
export async function getAllResponseStrategies(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(responseStrategy).where(eq(responseStrategy.projectId, projectId));
}

export async function createResponseStrategy(data: InsertResponseStrategy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(responseStrategy).values(data);
  return result;
}

export async function updateResponseStrategy(id: number, data: Partial<ResponseStrategy>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(responseStrategy).set(data).where(eq(responseStrategy.id, id));
}

export async function deleteResponseStrategy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(responseStrategy).where(eq(responseStrategy.id, id));
}

// Risk Updates (Historical tracking)
export async function getRiskUpdates(riskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(riskUpdates).where(eq(riskUpdates.riskId, riskId));
}

export async function createRiskUpdate(data: InsertRiskUpdate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(riskUpdates).values(data);
  return result;
}

export async function deleteRiskUpdate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(riskUpdates).where(eq(riskUpdates.id, id));
}

// Risk Analysis
export async function getRiskAnalysis(riskId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(riskAnalysis).where(eq(riskAnalysis.riskId, riskId));
}

export async function createRiskAnalysis(data: InsertRiskAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(riskAnalysis).values(data);
  return result;
}

export async function updateRiskAnalysis(id: number, data: Partial<RiskAnalysis>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(riskAnalysis).set(data).where(eq(riskAnalysis.id, id));
}

export async function deleteRiskAnalysis(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(riskAnalysis).where(eq(riskAnalysis.id, id));
}

// Generate Risk ID
export async function generateRiskId(projectId: number): Promise<string> {
  return await getNextId("RISK", "RISK", projectId);
}

// ==================== System Configuration ====================

// Dropdown Categories
export async function getDropdownCategories(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dropdownCategories).where(eq(dropdownCategories.projectId, projectId));
}

export async function createDropdownCategory(data: InsertDropdownCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dropdownCategories).values(data);
  return result;
}

export async function updateDropdownCategory(id: number, data: Partial<DropdownCategory>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(dropdownCategories).set(data).where(eq(dropdownCategories.id, id));
}

export async function deleteDropdownCategory(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dropdownCategories).where(eq(dropdownCategories.id, id));
}

// ID Sequences - Wrapper functions for system config router
export async function getIdSequences(projectId: number) {
  return await getIdSequencesByProject(projectId);
}

export async function createIdSequence(data: { projectId: number; entityType: string; prefix: string; minNumber?: number; maxNumber?: number; padLength?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(idSequences).values({
    projectId: data.projectId,
    entityType: data.entityType,
    prefix: data.prefix,
    currentNumber: 0,
    minNumber: data.minNumber ?? 1,
    maxNumber: data.maxNumber ?? 9999,
    padLength: data.padLength ?? 4,
  });
  return result;
}

export async function deleteIdSequence(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(idSequences).where(eq(idSequences.id, id));
}

// ==================== Assumption Dropdown Helpers ====================

export async function getAssumptionCategories(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptionCategories).where(eq(assumptionCategories.projectId, projectId)).orderBy(assumptionCategories.name);
}

export async function createAssumptionCategory(data: InsertAssumptionCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assumptionCategories).values(data);
  const insertResult = result as any;
  const insertId = insertResult[0]?.insertId || insertResult.insertId;
  if (insertId) {
    const [created] = await db.select().from(assumptionCategories).where(eq(assumptionCategories.id, Number(insertId)));
    return created;
  }
  const [created] = await db.select().from(assumptionCategories)
    .where(and(eq(assumptionCategories.projectId, data.projectId), eq(assumptionCategories.name, data.name)))
    .orderBy(desc(assumptionCategories.id)).limit(1);
  return created;
}

export async function getAssumptionStatuses(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptionStatuses).where(eq(assumptionStatuses.projectId, projectId)).orderBy(assumptionStatuses.name);
}

export async function createAssumptionStatus(data: InsertAssumptionStatus) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assumptionStatuses).values(data);
  const insertResult = result as any;
  const insertId = insertResult[0]?.insertId || insertResult.insertId;
  if (insertId) {
    const [created] = await db.select().from(assumptionStatuses).where(eq(assumptionStatuses.id, Number(insertId)));
    return created;
  }
  const [created] = await db.select().from(assumptionStatuses)
    .where(and(eq(assumptionStatuses.projectId, data.projectId), eq(assumptionStatuses.name, data.name)))
    .orderBy(desc(assumptionStatuses.id)).limit(1);
  return created;
}

export async function getAssumptionImpactLevels(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptionImpactLevels).where(eq(assumptionImpactLevels.projectId, projectId)).orderBy(assumptionImpactLevels.name);
}

export async function createAssumptionImpactLevel(data: InsertAssumptionImpactLevel) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assumptionImpactLevels).values(data);
  const insertResult = result as any;
  const insertId = insertResult[0]?.insertId || insertResult.insertId;
  if (insertId) {
    const [created] = await db.select().from(assumptionImpactLevels).where(eq(assumptionImpactLevels.id, Number(insertId)));
    return created;
  }
  const [created] = await db.select().from(assumptionImpactLevels)
    .where(and(eq(assumptionImpactLevels.projectId, data.projectId), eq(assumptionImpactLevels.name, data.name)))
    .orderBy(desc(assumptionImpactLevels.id)).limit(1);
  return created;
}

// ==================== Assumption CRUD (enhanced) ====================

export async function createAssumptionEnhanced(data: {
  projectId: number;
  description?: string;
  categoryId?: number;
  statusId?: number;
  impactLevelId?: number;
  ownerId?: number;
  requirementId?: number;
  taskId?: number;
  notes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const assumptionId = await getNextId('assumption', 'ASM', data.projectId);

  // Resolve display names
  let category: string | undefined;
  let status: string | undefined;
  let owner: string | undefined;

  if (data.categoryId) {
    const [cat] = await db.select().from(assumptionCategories).where(eq(assumptionCategories.id, data.categoryId));
    category = cat?.name;
  }
  if (data.statusId) {
    const [st] = await db.select().from(assumptionStatuses).where(eq(assumptionStatuses.id, data.statusId));
    status = st?.name;
  }
  if (data.ownerId) {
    const [sh] = await db.select().from(stakeholders).where(eq(stakeholders.id, data.ownerId));
    owner = sh?.fullName;
  }

  const result = await db.insert(assumptions).values({
    ...data,
    assumptionId,
    category,
    status,
    owner,
  });

  const insertResult = result as any;
  const insertId = insertResult[0]?.insertId || insertResult.insertId;
  if (insertId) {
    const [created] = await db.select().from(assumptions).where(eq(assumptions.id, Number(insertId)));
    return created;
  }
  const [created] = await db.select().from(assumptions)
    .where(and(eq(assumptions.projectId, data.projectId), eq(assumptions.assumptionId, assumptionId)))
    .limit(1);
  return created;
}

export async function updateAssumptionEnhanced(
  id: number,
  data: {
    description?: string;
    categoryId?: number;
    statusId?: number;
    impactLevelId?: number;
    ownerId?: number;
    requirementId?: number;
    taskId?: number;
    notes?: string;
    validatedAt?: Date;
    validatedBy?: number;
  },
  changedBy?: number,
  changedByName?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current record for history diff
  const [current] = await db.select().from(assumptions).where(eq(assumptions.id, id));
  if (!current) throw new Error("Assumption not found");

  // Resolve display names
  const updateData: any = { ...data };
  if (data.categoryId !== undefined) {
    const [cat] = await db.select().from(assumptionCategories).where(eq(assumptionCategories.id, data.categoryId));
    updateData.category = cat?.name ?? null;
  }
  if (data.statusId !== undefined) {
    const [st] = await db.select().from(assumptionStatuses).where(eq(assumptionStatuses.id, data.statusId));
    updateData.status = st?.name ?? null;
  }
  if (data.ownerId !== undefined) {
    const [sh] = await db.select().from(stakeholders).where(eq(stakeholders.id, data.ownerId));
    updateData.owner = sh?.fullName ?? null;
  }

  // Build history diff
  const changedFields: Record<string, { oldValue: any; newValue: any }> = {};
  const trackFields = ['description', 'categoryId', 'statusId', 'impactLevelId', 'ownerId', 'requirementId', 'taskId', 'notes'] as const;
  for (const field of trackFields) {
    if (data[field as keyof typeof data] !== undefined && (current as any)[field] !== data[field as keyof typeof data]) {
      changedFields[field] = { oldValue: (current as any)[field], newValue: data[field as keyof typeof data] };
    }
  }

  await db.update(assumptions).set(updateData).where(eq(assumptions.id, id));

  // Record history if anything changed
  if (Object.keys(changedFields).length > 0) {
    await db.insert(assumptionHistory).values({
      assumptionId: id,
      changedFields,
      changedBy: changedBy ?? null,
      changedByName: changedByName ?? null,
    } as InsertAssumptionHistory);
  }

  const [updated] = await db.select().from(assumptions).where(eq(assumptions.id, id));
  return updated;
}

export async function getAssumptionHistory(assumptionId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptionHistory)
    .where(eq(assumptionHistory.assumptionId, assumptionId))
    .orderBy(desc(assumptionHistory.changedAt));
}

export async function getAssumptionsEnhanced(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptions)
    .where(eq(assumptions.projectId, projectId))
    .orderBy(assumptions.assumptionId);
}

// ─── Sub-tasks ───────────────────────────────────────────────────────────────

export async function getSubTasks(parentTaskId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.parentTaskId, parentTaskId)).orderBy(tasks.taskId);
}

// ─── Follow-up tasks ─────────────────────────────────────────────────────────

export async function getFollowUpTasks(followUpOfId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).where(eq(tasks.followUpOfId, followUpOfId)).orderBy(tasks.taskId);
}

// ─── Badge counts ─────────────────────────────────────────────────────────────

export async function getBadgeCounts(projectId: number) {
  const db = await getDb();
  if (!db) return { overdueTasks: 0, openIssues: 0, highRisks: 0 };

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Overdue tasks: dueDate < today AND status not completed/closed
  const allTasks = await db.select({ dueDate: tasks.dueDate, status: tasks.status, currentStatus: tasks.currentStatus })
    .from(tasks).where(eq(tasks.projectId, projectId));
  const overdueTasks = allTasks.filter(t => {
    if (!t.dueDate) return false;
    const done = ['completed', 'closed', 'done', 'complete'].includes((t.status || t.currentStatus || '').toLowerCase());
    return !done && t.dueDate < today;
  }).length;

  // Open issues: status not resolved/closed
  const allIssues = await db.select({ status: issues.status }).from(issues).where(eq(issues.projectId, projectId));
  const openIssues = allIssues.filter(i => {
    const s = (i.status || '').toLowerCase();
    return !['resolved', 'closed', 'done', 'complete'].includes(s);
  }).length;

  // High-severity risks: score >= 15 and riskStatusId is not null (open)
  const allRisks = await db.select({ score: risks.score, riskStatusId: risks.riskStatusId }).from(risks).where(eq(risks.projectId, projectId));
  const highRisks = allRisks.filter(r => (r.score || 0) >= 15).length;

  return { overdueTasks, openIssues, highRisks };
}

// ─────── Decisions ───────────────────────────────────────────

export async function getAllDecisions(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.decisions)
    .where(eq(schema.decisions.projectId, projectId))
    .orderBy(desc(schema.decisions.createdAt));
}

export async function getDecisionById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(schema.decisions).where(eq(schema.decisions.id, id)).limit(1);
  return result ?? null;
}

export async function createDecision(data: schema.InsertDecision) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.decisions).values(data);
  const [created] = await db.select().from(schema.decisions)
    .where(eq(schema.decisions.decisionId, data.decisionId))
    .limit(1);
  return created;
}

export async function updateDecision(id: number, data: Partial<schema.InsertDecision>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.decisions).set(data).where(eq(schema.decisions.id, id));
  return getDecisionById(id);
}

export async function deleteDecision(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.decisions).where(eq(schema.decisions.id, id));
}

// ─────── Notifications ───────────────────────────────────────

export async function createNotification(data: schema.InsertNotification) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(schema.notifications).values(data);
}

export async function getNotifications(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.notifications)
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.projectId, projectId)))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.notifications).set({ read: true }).where(eq(schema.notifications.id, id));
}

export async function markAllNotificationsRead(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.notifications)
    .set({ read: true })
    .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.projectId, projectId)));
}

export async function getUnreadNotificationCount(userId: number, projectId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.projectId, projectId),
      eq(schema.notifications.read, false)
    ));
  return result[0]?.count ?? 0;
}

// ─────── Budget ──────────────────────────────────────────────

export async function getProjectBudget(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.select().from(schema.projectBudget).where(eq(schema.projectBudget.projectId, projectId)).limit(1);
  return result ?? null;
}

export async function upsertProjectBudget(projectId: number, data: { totalBudget: string; currency: string; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getProjectBudget(projectId);
  if (existing) {
    await db.update(schema.projectBudget).set(data).where(eq(schema.projectBudget.projectId, projectId));
  } else {
    await db.insert(schema.projectBudget).values({ projectId, ...data });
  }
  return getProjectBudget(projectId);
}

export async function getBudgetEntries(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.budgetEntries)
    .where(eq(schema.budgetEntries.projectId, projectId))
    .orderBy(desc(schema.budgetEntries.createdAt));
}

export async function createBudgetEntry(data: schema.InsertBudgetEntry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.budgetEntries).values(data);
  const [created] = await db.select().from(schema.budgetEntries).where(eq(schema.budgetEntries.id, (result as any).insertId)).limit(1);
  return created;
}

export async function updateBudgetEntry(id: number, data: Partial<schema.InsertBudgetEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.budgetEntries).set(data).where(eq(schema.budgetEntries.id, id));
  const [updated] = await db.select().from(schema.budgetEntries).where(eq(schema.budgetEntries.id, id)).limit(1);
  return updated;
}

export async function deleteBudgetEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.budgetEntries).where(eq(schema.budgetEntries.id, id));
}

// ─────── Resource Capacity ───────────────────────────────────

export async function getResourceCapacities(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schema.resourceCapacity)
    .where(eq(schema.resourceCapacity.projectId, projectId));
}

export async function upsertResourceCapacity(projectId: number, stakeholderId: number, weekStart: string, availableHours: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const weekStartDate = new Date(weekStart);
  const [existing] = await db.select().from(schema.resourceCapacity)
    .where(and(
      eq(schema.resourceCapacity.projectId, projectId),
      eq(schema.resourceCapacity.stakeholderId, stakeholderId),
      eq(schema.resourceCapacity.weekStart, weekStartDate)
    )).limit(1);
  if (existing) {
    await db.update(schema.resourceCapacity).set({ availableHours }).where(eq(schema.resourceCapacity.id, existing.id));
  } else {
    await db.insert(schema.resourceCapacity).values({ projectId, stakeholderId, weekStart: weekStartDate, availableHours });
  }
}

// ─────── Global Search ───────────────────────────────────────

export async function globalSearch(projectId: number, term: string) {
  const db = await getDb();
  if (!db) return { requirements: [], tasks: [], issues: [], risks: [], decisions: [] };
  const like_term = `%${term}%`;
  const [reqs, tsks, iss, rsks, decs] = await Promise.all([
    db.select({ id: requirements.id, idCode: requirements.idCode, description: requirements.description, status: requirements.status })
      .from(requirements)
      .where(and(eq(requirements.projectId, projectId), or(like(requirements.idCode, like_term), like(requirements.description, like_term), like(requirements.owner, like_term))))
      .limit(10),
    db.select({ id: tasks.id, taskId: tasks.taskId, description: tasks.description, currentStatus: tasks.currentStatus })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), or(like(tasks.taskId, like_term), like(tasks.description, like_term), like(tasks.responsible, like_term))))
      .limit(10),
    db.select({ id: issues.id, issueId: issues.issueId, description: issues.description, status: issues.status })
      .from(issues)
      .where(and(eq(issues.projectId, projectId), or(like(issues.issueId, like_term), like(issues.description, like_term), like(issues.owner, like_term))))
      .limit(10),
    db.select({ id: risks.id, riskId: risks.riskId, title: risks.title, riskStatusId: risks.riskStatusId })
      .from(risks)
      .where(and(eq(risks.projectId, projectId), or(like(risks.riskId, like_term), like(risks.title, like_term))))
      .limit(10),
    db.select({ id: schema.decisions.id, decisionId: schema.decisions.decisionId, title: schema.decisions.title, status: schema.decisions.status })
      .from(schema.decisions)
      .where(and(eq(schema.decisions.projectId, projectId), or(like(schema.decisions.title, like_term), like(schema.decisions.description, like_term))))
      .limit(10),
  ]);
  return { requirements: reqs, tasks: tsks, issues: iss, risks: rsks, decisions: decs };
}

// ─────── Scope Items ─────────────────────────────────────────

export async function getAllScopeItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(schema.scopeItems).where(eq(schema.scopeItems.projectId, projectId)).orderBy(schema.scopeItems.idCode);
}

export async function createScopeItem(data: schema.InsertScopeItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schema.scopeItems).values(data);
  const created = await db.select().from(schema.scopeItems).where(eq(schema.scopeItems.id, result[0].insertId)).limit(1);
  return created[0];
}

export async function updateScopeItem(id: number, data: Partial<schema.ScopeItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(schema.scopeItems).set(data).where(eq(schema.scopeItems.id, id));
  const updated = await db.select().from(schema.scopeItems).where(eq(schema.scopeItems.id, id)).limit(1);
  return updated[0];
}

export async function deleteScopeItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schema.scopeItems).where(eq(schema.scopeItems.id, id));
}

// ─────── Resource Cost (stakeholder rates × task manHours) ───

export async function getResourceCostSummary(projectId: number) {
  const db = await getDb();
  if (!db) return { entries: [], totalCost: 0 };
  const projectTasks = await db.select().from(tasks)
    .where(and(eq(tasks.projectId, projectId), sql`${tasks.manHours} IS NOT NULL`));
  const projectStakeholders = await db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId));
  const shMap = new Map(projectStakeholders.map(s => [s.id, s]));
  let totalCost = 0;
  const entries = projectTasks
    .filter(t => t.manHours && t.responsibleId)
    .map(t => {
      const sh = shMap.get(t.responsibleId!);
      const hours = parseFloat(String(t.manHours ?? 0));
      const rate = sh ? parseFloat(String(sh.costPerHour ?? 0)) : 0;
      const cost = hours * rate;
      totalCost += cost;
      return {
        taskId: t.taskId,
        taskDescription: t.description,
        responsible: t.responsible,
        manHours: hours,
        costPerHour: rate,
        cost,
      };
    });
  return { entries, totalCost };
}
