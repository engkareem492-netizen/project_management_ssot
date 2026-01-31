import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  InsertIssueGroup
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
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
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

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
  const result = await db.insert(requirements).values(data);
  return result;
}

export async function updateRequirement(id: number, data: Partial<Requirement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(requirements).set(data).where(eq(requirements.id, id));
}

export async function deleteRequirement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(requirements).where(eq(requirements.id, id));
}

export async function deleteAllRequirements() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(requirements);
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
  const result = await db.insert(tasks).values(data);
  return result;
}

export async function updateTask(id: number, data: Partial<Task>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks).where(eq(tasks.id, id));
}

export async function deleteAllTasks() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(tasks);
}

// Issues CRUD
export async function getAllIssues() {
  const db = await getDb();
  if (!db) return [];
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
  const result = await db.insert(issues).values(data);
  return result;
}

export async function updateIssue(id: number, data: Partial<Issue>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(issues).set(data).where(eq(issues.id, id));
}

export async function deleteIssue(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(issues).where(eq(issues.id, id));
}

export async function deleteAllIssues() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(issues);
}

// Dependencies CRUD
export async function getAllDependencies() {
  const db = await getDb();
  if (!db) return [];
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

export async function deleteAllDependencies() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(dependencies);
}

// Assumptions CRUD
export async function getAllAssumptions() {
  const db = await getDb();
  if (!db) return [];
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

export async function deleteAllAssumptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(assumptions);
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

export async function getAllRelationships() {
  const db = await getDb();
  if (!db) return [];
  
  const allRequirements = await getAllRequirements();
  const allTasks = await getAllTasks();
  const allIssues = await getAllIssues();
  
  const relationships = [];
  
  for (const req of allRequirements) {
    const relatedTasks = allTasks.filter(t => t.requirementId === req.idCode);
    const relatedIssues = allIssues.filter(i => i.requirementId === req.idCode);
    
    if (relatedTasks.length > 0 || relatedIssues.length > 0) {
      relationships.push({
        requirement: req,
        tasks: relatedTasks,
        issues: relatedIssues,
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
  idSequences,
  InsertStakeholder,
  InsertDeliverable,
  InsertDeliverableLink,
  Stakeholder,
  Deliverable
} from "../drizzle/schema";

// ID Sequence functions - Auto-generate IDs
export async function getNextId(entityType: string, prefix: string, projectId: number = 1): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Try to get existing sequence for this project
  const existing = await db
    .select()
    .from(idSequences)
    .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)))
    .limit(1);
  
  let nextNumber: number;
  
  if (existing.length === 0) {
    // Create new sequence starting at 1
    await db.insert(idSequences).values({
      projectId,
      entityType,
      prefix,
      currentNumber: 1,
    });
    nextNumber = 1;
  } else {
    // Increment existing sequence
    nextNumber = existing[0].currentNumber + 1;
    await db
      .update(idSequences)
      .set({ currentNumber: nextNumber })
      .where(and(eq(idSequences.entityType, entityType), eq(idSequences.projectId, projectId)));
  }
  
  // Format as prefix + 4-digit number (e.g., Q-0001)
  return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
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
export async function getAllStakeholders(projectId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (projectId) {
    return await db.select().from(stakeholders).where(eq(stakeholders.projectId, projectId)).orderBy(stakeholders.fullName);
  }
  return await db.select().from(stakeholders).orderBy(stakeholders.fullName);
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
export async function getAllDeliverables() {
  const db = await getDb();
  if (!db) return [];
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

export async function getDeliverablesByEntity(entityType: "requirement" | "task" | "dependency", entityId: string) {
  const db = await getDb();
  if (!db) return [];
  
  const links = await getLinksByEntity(entityType, entityId);
  if (links.length === 0) return [];
  
  const deliverableIds = links.map(l => l.deliverableId);
  const allDeliverables = await getAllDeliverables();
  return allDeliverables.filter(d => deliverableIds.includes(d.id));
}

// Enhanced relationship functions
export async function getRequirementWithLinkedItems(requirementId: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Get the requirement
  const req = await getRequirementByIdCode(requirementId);
  if (!req) return null;
  
  // Get linked tasks
  const relatedTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.requirementId, requirementId));
  
  // Get linked issues
  const relatedIssues = await db
    .select()
    .from(issues)
    .where(eq(issues.requirementId, requirementId));
  
  // Get linked deliverables
  const relatedDeliverables = await getDeliverablesByEntity("requirement", requirementId);
  
  return {
    requirement: req,
    tasks: relatedTasks,
    issues: relatedIssues,
    deliverables: relatedDeliverables,
  };
}

// Get sorted lists by ID
export async function getAllRequirementsSorted() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(requirements).orderBy(requirements.idCode);
}

export async function getAllTasksSorted() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tasks).orderBy(tasks.taskId);
}

export async function getAllIssuesSorted() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(issues).orderBy(issues.issueId);
}

export async function getAllDependenciesSorted() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(dependencies).orderBy(dependencies.dependencyId);
}

export async function getAllAssumptionsSorted() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(assumptions).orderBy(assumptions.assumptionId);
}

// ID Configuration functions
export async function getAllIdSequences() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(idSequences);
}

export async function getIdSequence(entityType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(idSequences).where(eq(idSequences.entityType, entityType)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateIdSequence(entityType: string, data: { prefix?: string; startNumber?: number; minNumber?: number; maxNumber?: number; padLength?: number }) {
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
    .where(eq(idSequences.entityType, entityType));
  
  return await getIdSequence(entityType);
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

export async function createStatusOption(data: { value: string; label: string; category: string; color?: string; isDefault?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const [created] = await db.insert(statusOptions).values(data);
  return created;
}

export async function updateStatusOption(id: number, data: Partial<{ label: string; category: string; color: string; isDefault: boolean }>) {
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
    }).from(projects);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get projects:", error);
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

export async function updateProjectPassword(projectId: number, hashedPassword: string) {
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
