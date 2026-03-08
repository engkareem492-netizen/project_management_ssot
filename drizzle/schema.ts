import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, date, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin", "master"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Password resets table - stores password reset tokens
 */
export const passwordResets = mysqlTable("password_resets", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;

/**
 * Projects table - stores multiple projects with password protection
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  password: varchar("password", { length: 255 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Project Members table - tracks users who have access to projects
 */
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "editor", "viewer"]).default("editor").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

/**
 * Project Invitations table - stores pending email invitations
 */
export const projectInvitations = mysqlTable("project_invitations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  role: mysqlEnum("role", ["editor", "viewer"]).default("editor").notNull(),
  invitedBy: int("invitedBy").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectInvitation = typeof projectInvitations.$inferSelect;
export type InsertProjectInvitation = typeof projectInvitations.$inferInsert;

/**
 * ID Sequences table - tracks auto-generated IDs for each entity type
 */
export const idSequences = mysqlTable("idSequences", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  prefix: varchar("prefix", { length: 10 }).notNull(),
  currentNumber: int("currentNumber").notNull().default(0),
  minNumber: int("minNumber").notNull().default(1),
  maxNumber: int("maxNumber").notNull().default(9999),
  padLength: int("padLength").notNull().default(4),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IdSequence = typeof idSequences.$inferSelect;
export type InsertIdSequence = typeof idSequences.$inferInsert;

/**
 * Task Groups table - stores task group options for requirements and tasks
 */
export const taskGroups = mysqlTable("taskGroups", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  idCode: varchar("idCode", { length: 20 }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskGroup = typeof taskGroups.$inferSelect;
export type InsertTaskGroup = typeof taskGroups.$inferInsert;

/**
 * Issue Groups table - stores issue group options for requirements and issues
 */
export const issueGroups = mysqlTable("issueGroups", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  idCode: varchar("idCode", { length: 20 }),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IssueGroup = typeof issueGroups.$inferSelect;
export type InsertIssueGroup = typeof issueGroups.$inferInsert;

/**
 * Stakeholders table - stores all project stakeholders for person-based fields
 */
export const stakeholders = mysqlTable("stakeholders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  position: varchar("position", { length: 200 }),
  role: varchar("role", { length: 200 }),
  job: varchar("job", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  // Internal team & engagement fields
  isInternalTeam: boolean("isInternalTeam").default(false).notNull(),
  powerLevel: int("powerLevel").default(3),       // 1-5
  interestLevel: int("interestLevel").default(3),  // 1-5
  engagementStrategy: varchar("engagementStrategy", { length: 100 }), // Manage Closely | Keep Satisfied | Keep Informed | Monitor
  communicationFrequency: varchar("communicationFrequency", { length: 100 }),
  communicationChannel: varchar("communicationChannel", { length: 100 }),
  communicationMessage: text("communicationMessage"),
  communicationResponsible: varchar("communicationResponsible", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = typeof stakeholders.$inferInsert;

/**
 * Requirements table - stores all project requirements
 */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  idCode: varchar("idCode", { length: 50 }).notNull(),
  taskGroup: varchar("taskGroup", { length: 100 }),
  issueGroup: varchar("issueGroup", { length: 100 }),
  createdAt: varchar("createdAt", { length: 50 }),
  type: varchar("type", { length: 100 }),
  class: varchar("class", { length: 100 }),
  category: varchar("category", { length: 100 }),
  agreement: varchar("agreement", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  description: text("description"),
  sourceType: varchar("sourceType", { length: 100 }),
  refSource: varchar("refSource", { length: 500 }),
  status: varchar("status", { length: 100 }),
  priority: varchar("priority", { length: 100 }),
  deliverables1: text("deliverables1"),
  d1Status: varchar("d1Status", { length: 100 }),
  deliverables2: text("deliverables2"),
  d2Status: varchar("d2Status", { length: 100 }),
  lastUpdate: text("lastUpdate"),
  updateDate: varchar("updateDate", { length: 50 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  ownerId: int("ownerId"),
  source: varchar("source", { length: 20 }),
  knowledgeBaseCode: varchar("knowledgeBaseCode", { length: 50 }),
});

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = typeof requirements.$inferInsert;

/**
 * Tasks table - stores all project tasks
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskId: varchar("taskId", { length: 50 }).notNull(),
  taskGroup: varchar("taskGroup", { length: 100 }),
  dependencyId: varchar("dependencyId", { length: 50 }),
  requirementId: varchar("requirementId", { length: 50 }),
  deliverableId: int("deliverableId"),
  issueId: varchar("issueId", { length: 50 }),
  description: text("description"),
  responsible: varchar("responsible", { length: 200 }),
  responsibleId: int("responsibleId"),
  accountable: varchar("accountable", { length: 200 }),
  accountableId: int("accountableId"),
  informed: varchar("informed", { length: 200 }),
  informedId: int("informedId"),
  consulted: varchar("consulted", { length: 200 }),
  consultedId: int("consultedId"),
  dueDate: varchar("dueDate", { length: 50 }),
  assignDate: varchar("assignDate", { length: 50 }),
  currentStatus: text("currentStatus"),
  statusUpdate: text("statusUpdate"),
  owner: varchar("owner", { length: 200 }),
  ownerId: int("ownerId"),
  status: varchar("status", { length: 100 }),
  priority: varchar("priority", { length: 100 }),
  lastUpdate: text("lastUpdate"),
  updateDate: varchar("updateDate", { length: 50 }),
  // Sub-task support: parentTaskId links a sub-task to its parent
  parentTaskId: int("parentTaskId"),
  // Follow-up support: followUpOfId links a follow-up task to the original
  followUpOfId: int("followUpOfId"),
  // Recurring task support
  seriesId: int("seriesId"),
  recurringType: mysqlEnum("recurringType", ["none", "daily", "weekly", "monthly", "custom"]).default("none"),
  recurringInterval: int("recurringInterval").default(1),
  recurringEndDate: varchar("recurringEndDate", { length: 50 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Issues table - stores all project issues
 */
export const issues = mysqlTable("issues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  issueId: varchar("issueId", { length: 50 }).notNull(),
  issueGroup: varchar("issueGroup", { length: 100 }),
  taskGroup: varchar("taskGroup", { length: 100 }),
  requirementId: varchar("requirementId", { length: 50 }),
  type: varchar("type", { length: 100 }),
  class: varchar("class", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  ownerId: int("ownerId"),
  status: varchar("status", { length: 100 }),
  description: text("description"),
  source: varchar("source", { length: 20 }),
  sourceType: varchar("sourceType", { length: 100 }),
  refSource: varchar("refSource", { length: 500 }),
  createdAt: varchar("createdAt", { length: 50 }),
  openDate: varchar("openDate", { length: 50 }),
  priority: varchar("priority", { length: 100 }),
  deliverableId: int("deliverableId"),
  taskId: varchar("taskId", { length: 50 }),
  deliverables1: text("deliverables1"),
  d1Status: varchar("d1Status", { length: 100 }),
  deliverables2: text("deliverables2"),
  d2Status: varchar("d2Status", { length: 100 }),
  lastUpdate: text("lastUpdate"),
  updateDate: varchar("updateDate", { length: 50 }),
  resolutionDate: varchar("resolutionDate", { length: 50 }),
  knowledgeBaseCode: varchar("knowledgeBaseCode", { length: 50 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;

/**
 * Dependencies table - stores project dependencies
 */
export const dependencies = mysqlTable("dependencies", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  dependencyId: varchar("dependencyId", { length: 50 }).notNull(),
  depGroup: varchar("depGroup", { length: 100 }),
  taskId: varchar("taskId", { length: 50 }),
  requirementId: varchar("requirementId", { length: 50 }),
  description: text("description"),
  responsible: varchar("responsible", { length: 200 }),
  responsibleId: int("responsibleId"),
  accountable: varchar("accountable", { length: 200 }),
  accountableId: int("accountableId"),
  informed: varchar("informed", { length: 200 }),
  informedId: int("informedId"),
  consulted: varchar("consulted", { length: 200 }),
  consultedId: int("consultedId"),
  dueDate: varchar("dueDate", { length: 50 }),
  currentStatus: text("currentStatus"),
  statusUpdate: text("statusUpdate"),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dependency = typeof dependencies.$inferSelect;
export type InsertDependency = typeof dependencies.$inferInsert;

/**
 * Assumption Categories dropdown table
 */
export const assumptionCategories = mysqlTable("assumptionCategories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AssumptionCategory = typeof assumptionCategories.$inferSelect;
export type InsertAssumptionCategory = typeof assumptionCategories.$inferInsert;

/**
 * Assumption Statuses dropdown table
 */
export const assumptionStatuses = mysqlTable("assumptionStatuses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AssumptionStatus = typeof assumptionStatuses.$inferSelect;
export type InsertAssumptionStatus = typeof assumptionStatuses.$inferInsert;

/**
 * Assumption Impact Levels dropdown table
 */
export const assumptionImpactLevels = mysqlTable("assumptionImpactLevels", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AssumptionImpactLevel = typeof assumptionImpactLevels.$inferSelect;
export type InsertAssumptionImpactLevel = typeof assumptionImpactLevels.$inferInsert;

/**
 * Assumptions table - stores project assumptions
 */
export const assumptions = mysqlTable("assumptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  assumptionId: varchar("assumptionId", { length: 50 }).notNull(),
  description: text("description"),
  // Legacy text fields kept for backward compat
  category: varchar("category", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  status: varchar("status", { length: 100 }),
  // New FK fields
  categoryId: int("categoryId"),
  statusId: int("statusId"),
  impactLevelId: int("impactLevelId"),
  ownerId: int("ownerId"),
  requirementId: int("requirementId"),
  taskId: int("taskId"),
  notes: text("notes"),
  validatedAt: timestamp("validatedAt"),
  validatedBy: int("validatedBy"),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

/**
 * Assumption History table - tracks all changes to assumptions
 */
export const assumptionHistory = mysqlTable("assumptionHistory", {
  id: int("id").autoincrement().primaryKey(),
  assumptionId: int("assumptionId").notNull(),
  changedFields: json("changedFields").notNull().$type<Record<string, { oldValue: any; newValue: any }>>(),
  changedBy: int("changedBy"),
  changedByName: varchar("changedByName", { length: 200 }),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});
export type AssumptionHistory = typeof assumptionHistory.$inferSelect;
export type InsertAssumptionHistory = typeof assumptionHistory.$inferInsert;

/**
 * Deliverables table - stores project deliverables
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  deliverableId: varchar("deliverableId", { length: 50 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 100 }),
  dueDate: varchar("dueDate", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

/**
 * Deliverable Links table - many-to-many relationships between deliverables and other entities
 */
export const deliverableLinks = mysqlTable("deliverableLinks", {
  id: int("id").autoincrement().primaryKey(),
  deliverableId: int("deliverableId").notNull(),
  linkedEntityType: mysqlEnum("linkedEntityType", ["requirement", "task", "dependency"]).notNull(),
  linkedEntityId: varchar("linkedEntityId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DeliverableLink = typeof deliverableLinks.$inferSelect;
export type InsertDeliverableLink = typeof deliverableLinks.$inferInsert;

/**
 * Issue Links table - many-to-many relationships between issues and other entities
 */
export const issueLinks = mysqlTable("issueLinks", {
  id: int("id").autoincrement().primaryKey(),
  issueId: int("issueId").notNull(),
  linkedEntityType: mysqlEnum("linkedEntityType", ["requirement", "task", "dependency"]).notNull(),
  linkedEntityId: varchar("linkedEntityId", { length: 50 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IssueLink = typeof issueLinks.$inferSelect;
export type InsertIssueLink = typeof issueLinks.$inferInsert;

/**
 * Action Log table - stores all changes with delta tracking
 * Records only the fields that changed, not entire records
 */
export const actionLogs = mysqlTable("actionLogs", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["requirement", "task", "issue"]).notNull(),
  entityId: varchar("entityId", { length: 50 }).notNull(),
  entityInternalId: int("entityInternalId").notNull(),
  changedFields: json("changedFields").notNull().$type<Record<string, { oldValue: any; newValue: any }>>(),
  changedBy: int("changedBy").notNull(),
  changedAt: timestamp("changedAt").defaultNow().notNull(),
});

export type ActionLog = typeof actionLogs.$inferSelect;
export type InsertActionLog = typeof actionLogs.$inferInsert;

/**
 * Status Options table - stores customizable status values
 */
export const statusOptions = mysqlTable("statusOptions", {
  id: int("id").autoincrement().primaryKey(),
  value: varchar("value", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }),
  isDefault: boolean("isDefault").default(false).notNull(),
  isComplete: boolean("isComplete").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StatusOption = typeof statusOptions.$inferSelect;
export type InsertStatusOption = typeof statusOptions.$inferInsert;

/**
 * Priority Options table - stores customizable priority values
 */
export const priorityOptions = mysqlTable("priorityOptions", {
  id: int("id").autoincrement().primaryKey(),
  value: varchar("value", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  color: varchar("color", { length: 50 }),
  level: int("level").notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PriorityOption = typeof priorityOptions.$inferSelect;
export type InsertPriorityOption = typeof priorityOptions.$inferInsert;

/**
 * Type Options table - stores customizable type values (for requirements)
 */
export const typeOptions = mysqlTable("typeOptions", {
  id: int("id").autoincrement().primaryKey(),
  value: varchar("value", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TypeOption = typeof typeOptions.$inferSelect;
export type InsertTypeOption = typeof typeOptions.$inferInsert;

/**
 * Category Options table - stores customizable category values (for requirements)
 */
export const categoryOptions = mysqlTable("categoryOptions", {
  id: int("id").autoincrement().primaryKey(),
  value: varchar("value", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CategoryOption = typeof categoryOptions.$inferSelect;
export type InsertCategoryOption = typeof categoryOptions.$inferInsert;

/**
 * Issue Types table - stores customizable type values for issues (project-specific)
 */
export const issueTypes = mysqlTable("issueTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IssueType = typeof issueTypes.$inferSelect;
export type InsertIssueType = typeof issueTypes.$inferInsert;

/**
 * Task Types table - stores customizable type values for tasks (project-specific)
 */
export const taskTypes = mysqlTable("taskTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TaskType = typeof taskTypes.$inferSelect;
export type InsertTaskType = typeof taskTypes.$inferInsert;

/**
 * Deliverable Types table - stores customizable type values for deliverables (project-specific)
 */
export const deliverableTypes = mysqlTable("deliverableTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DeliverableType = typeof deliverableTypes.$inferSelect;
export type InsertDeliverableType = typeof deliverableTypes.$inferInsert;

/**
 * Class Options table - stores customizable class values for issues (project-specific)
 */
export const classOptions = mysqlTable("classOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  value: varchar("value", { length: 100 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isDefault: boolean("isDefault").default(false).notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ClassOption = typeof classOptions.$inferSelect;
export type InsertClassOption = typeof classOptions.$inferInsert;

/**
 * Knowledge Base Types table - hierarchical types with parent-child relationships
 */
export const knowledgeBaseTypes = mysqlTable("knowledgeBaseTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  parentTypeId: int("parentTypeId"), // null for root types, references another type for children
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseType = typeof knowledgeBaseTypes.$inferSelect;
export type InsertKnowledgeBaseType = typeof knowledgeBaseTypes.$inferInsert;

/**
 * Knowledge Base Components table - configurable component options
 */
export const knowledgeBaseComponents = mysqlTable("knowledgeBaseComponents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseComponent = typeof knowledgeBaseComponents.$inferSelect;
export type InsertKnowledgeBaseComponent = typeof knowledgeBaseComponents.$inferInsert;

/**
 * Knowledge Base Code Configuration table - stores code prefix per project
 */
export const knowledgeBaseCodeConfig = mysqlTable("knowledgeBaseCodeConfig", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  prefix: varchar("prefix", { length: 10 }).notNull().default("KB"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseCodeConfig = typeof knowledgeBaseCodeConfig.$inferSelect;
export type InsertKnowledgeBaseCodeConfig = typeof knowledgeBaseCodeConfig.$inferInsert;

/**
 * Knowledge Base table - main entries with code, type, component, title, description
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  code: varchar("code", { length: 50 }).notNull(), // prefix + number, e.g., KB-001
  typeId: int("typeId"), // references knowledgeBaseTypes
  componentId: int("componentId"), // references knowledgeBaseComponents
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  attachmentUrl: varchar("attachmentUrl", { length: 500 }),
  attachmentName: varchar("attachmentName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBase.$inferInsert;


/**
 * Risk Types table - configurable dropdown for risk types
 */
export const riskTypes = mysqlTable("riskTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiskType = typeof riskTypes.$inferSelect;
export type InsertRiskType = typeof riskTypes.$inferInsert;

/**
 * Risk Status table - configurable dropdown for risk status
 */
export const riskStatus = mysqlTable("riskStatus", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiskStatus = typeof riskStatus.$inferSelect;
export type InsertRiskStatus = typeof riskStatus.$inferInsert;

/**
 * Response Strategy table - configurable dropdown for response strategies
 */
export const responseStrategy = mysqlTable("responseStrategy", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().onUpdateNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseStrategy = typeof responseStrategy.$inferSelect;
export type InsertResponseStrategy = typeof responseStrategy.$inferInsert;

/**
 * Risks table - main risk register
 */
export const risks = mysqlTable("risks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  riskId: varchar("riskId", { length: 50 }).notNull(), // e.g., RISK-0001
  riskTypeId: int("riskTypeId"),
  title: text("title").notNull(),
  riskOwnerId: int("riskOwnerId"), // stakeholder ID
  riskStatusId: int("riskStatusId"),
  identifiedOn: date("identifiedOn").notNull(),
  impact: int("impact").notNull(), // 1-5
  probability: int("probability").notNull(), // 1-5
  score: int("score").notNull(), // impact * probability
  residualImpact: int("residualImpact"), // 1-5
  residualProbability: int("residualProbability"), // 1-5
  residualScore: int("residualScore"), // residualImpact * residualProbability
  contingencyPlanId: int("contingencyPlanId"), // task group ID
  responseStrategyId: int("responseStrategyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = typeof risks.$inferInsert;

/**
 * Risk Updates table - historical tracking of risk updates
 */
export const riskUpdates = mysqlTable("riskUpdates", {
  id: int("id").autoincrement().primaryKey(),
  riskId: int("riskId").notNull(), // foreign key to risks.id
  update: text("update").notNull(),
  updateDate: date("updateDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RiskUpdate = typeof riskUpdates.$inferSelect;
export type InsertRiskUpdate = typeof riskUpdates.$inferInsert;

/**
 * Risk Analysis table - cause-consequence-mitigation tracking
 */
export const riskAnalysis = mysqlTable("riskAnalysis", {
  id: int("id").autoincrement().primaryKey(),
  riskId: int("riskId").notNull(), // foreign key to risks.id
  causeLevel: int("causeLevel").notNull(),
  cause: text("cause").notNull(),
  consequences: text("consequences").notNull(),
  trigger: text("trigger").notNull(),
  mitigationPlanId: int("mitigationPlanId"), // task group ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiskAnalysis = typeof riskAnalysis.$inferSelect;
export type InsertRiskAnalysis = typeof riskAnalysis.$inferInsert;

/**
 * System Configuration table - stores dropdown option categories and settings
 */
export const dropdownCategories = mysqlTable("dropdownCategories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  categoryKey: varchar("categoryKey", { length: 50 }).notNull(), // e.g., "riskTypes", "issueTypes"
  categoryLabel: varchar("categoryLabel", { length: 100 }).notNull(), // e.g., "Risk Types", "Issue Types"
  description: text("description"),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DropdownCategory = typeof dropdownCategories.$inferSelect;
export type InsertDropdownCategory = typeof dropdownCategories.$inferInsert;

/**
 * Change Requests table - formal change request management with approval workflow
 */
export const changeRequests = mysqlTable("changeRequests", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  crId: varchar("crId", { length: 50 }).notNull(), // e.g., CR-0001
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  requestedBy: varchar("requestedBy", { length: 200 }),
  requestedById: int("requestedById"),
  assignedTo: varchar("assignedTo", { length: 200 }),
  assignedToId: int("assignedToId"),
  priority: varchar("priority", { length: 50 }).default("Medium"),
  status: mysqlEnum("crStatus", ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Implemented", "Closed"]).default("Draft").notNull(),
  impactAssessment: text("impactAssessment"),
  requirementId: varchar("requirementId", { length: 50 }),
  taskId: varchar("taskId", { length: 50 }),
  issueId: varchar("issueId", { length: 50 }),
  submittedAt: timestamp("submittedAt"),
  reviewedAt: timestamp("reviewedAt"),
  approvedAt: timestamp("approvedAt"),
  implementedAt: timestamp("implementedAt"),
  reviewedBy: varchar("reviewedBy", { length: 200 }),
  approvedBy: varchar("approvedBy", { length: 200 }),
  rejectionReason: text("rejectionReason"),
  estimatedEffort: varchar("estimatedEffort", { length: 100 }),
  actualEffort: varchar("actualEffort", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ChangeRequest = typeof changeRequests.$inferSelect;
export type InsertChangeRequest = typeof changeRequests.$inferInsert;

/**
 * Meetings table - meeting log with agenda, attendees, and outcomes
 */
export const meetings = mysqlTable("meetings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  meetingId: varchar("meetingId", { length: 50 }).notNull(), // e.g., MTG-0001
  title: varchar("title", { length: 255 }).notNull(),
  meetingDate: date("meetingDate").notNull(),
  startTime: varchar("startTime", { length: 10 }),
  endTime: varchar("endTime", { length: 10 }),
  location: varchar("location", { length: 255 }),
  organizer: varchar("organizer", { length: 200 }),
  organizerId: int("organizerId"),
  attendees: json("attendees"), // array of stakeholder names/ids
  agenda: text("agenda"),
  minutes: text("minutes"),
  status: mysqlEnum("meetingStatus", ["Scheduled", "In Progress", "Completed", "Cancelled"]).default("Scheduled").notNull(),
  nextMeetingDate: date("nextMeetingDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = typeof meetings.$inferInsert;

/**
 * Decisions table - decisions made during meetings or project lifecycle
 */
export const decisions = mysqlTable("decisions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  decisionId: varchar("decisionId", { length: 50 }).notNull(), // e.g., DEC-0001
  meetingId: int("meetingId"), // optional link to a meeting
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  decisionDate: date("decisionDate").notNull(),
  decidedBy: varchar("decidedBy", { length: 200 }),
  decidedById: int("decidedById"),
  status: mysqlEnum("decisionStatus", ["Open", "Implemented", "Deferred", "Cancelled"]).default("Open").notNull(),
  impact: varchar("impact", { length: 100 }),
  requirementId: varchar("requirementId", { length: 50 }),
  taskId: varchar("taskId", { length: 50 }),
  issueId: varchar("issueId", { length: 50 }),
  actionItems: json("actionItems"), // array of {description, owner, dueDate, done}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = typeof decisions.$inferInsert;

/**
 * Test Cases table - test cases linked to requirements
 */
export const testCases = mysqlTable("testCases", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  testId: varchar("testId", { length: 50 }).notNull(), // e.g., TC-0001
  requirementId: varchar("requirementId", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  preconditions: text("preconditions"),
  testSteps: json("testSteps"), // array of {step, expectedResult}
  expectedResult: text("expectedResult"),
  actualResult: text("actualResult"),
  tester: varchar("tester", { length: 200 }),
  testerId: int("testerId"),
  priority: varchar("priority", { length: 50 }).default("Medium"),
  status: mysqlEnum("testStatus", ["Not Executed", "In Progress", "Passed", "Failed", "Blocked", "Skipped"]).default("Not Executed").notNull(),
  testType: varchar("testType", { length: 100 }), // Unit, Integration, UAT, Regression
  executionDate: date("executionDate"),
  defectId: varchar("defectId", { length: 50 }), // link to issue if failed
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TestCase = typeof testCases.$inferSelect;
export type InsertTestCase = typeof testCases.$inferInsert;

/**
 * Task Dependencies table - predecessor/successor relationships between tasks
 */
export const taskDependencies = mysqlTable("taskDependencies", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  predecessorTaskId: varchar("predecessorTaskId", { length: 50 }).notNull(), // taskId of predecessor
  successorTaskId: varchar("successorTaskId", { length: 50 }).notNull(),   // taskId of successor
  dependencyType: mysqlEnum("dependencyType", ["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"]).default("Finish-to-Start").notNull(),
  lagDays: int("lagDays").default(0), // positive = lag, negative = lead
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskDependency = typeof taskDependencies.$inferSelect;
export type InsertTaskDependency = typeof taskDependencies.$inferInsert;

/**
 * Stakeholder Task Groups - links Internal Team members to Task Groups (Development Plan)
 */
export const stakeholderTaskGroups = mysqlTable("stakeholderTaskGroups", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  taskGroupId: int("taskGroupId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StakeholderTaskGroup = typeof stakeholderTaskGroups.$inferSelect;
export type InsertStakeholderTaskGroup = typeof stakeholderTaskGroups.$inferInsert;

/**
 * Stakeholder KPIs - performance indicators defined per stakeholder
 */
export const stakeholderKpis = mysqlTable("stakeholderKpis", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  target: varchar("target", { length: 100 }), // e.g. "95%", "10 tasks/week"
  unit: varchar("unit", { length: 50 }),       // e.g. "%", "tasks", "score"
  weight: int("weight").default(1),            // relative weight for weighted avg
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StakeholderKpi = typeof stakeholderKpis.$inferSelect;
export type InsertStakeholderKpi = typeof stakeholderKpis.$inferInsert;

/**
 * Stakeholder Assessments - periodic performance reviews
 */
export const stakeholderAssessments = mysqlTable("stakeholderAssessments", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  projectId: int("projectId").notNull(),
  assessmentDate: date("assessmentDate").notNull(),
  assessorName: varchar("assessorName", { length: 200 }),
  notes: text("notes"),
  overallScore: int("overallScore"),  // 0-100 weighted average
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StakeholderAssessment = typeof stakeholderAssessments.$inferSelect;
export type InsertStakeholderAssessment = typeof stakeholderAssessments.$inferInsert;

/**
 * Stakeholder KPI Scores - individual KPI scores per assessment
 */
export const stakeholderKpiScores = mysqlTable("stakeholderKpiScores", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull(),
  kpiId: int("kpiId").notNull(),
  score: int("score").notNull(), // 0-100
  notes: text("notes"),
});

export type StakeholderKpiScore = typeof stakeholderKpiScores.$inferSelect;
export type InsertStakeholderKpiScore = typeof stakeholderKpiScores.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Notifications table
// ─────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("notificationType", [
    "task_overdue", "issue_escalated", "cr_submitted", "risk_high",
    "task_assigned", "decision_added", "due_soon"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: varchar("entityId", { length: 50 }),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Project Budget table
// ─────────────────────────────────────────────────────────────
export const projectBudget = mysqlTable("projectBudget", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  totalBudget: decimal("totalBudget", { precision: 15, scale: 2 }).default("0"),
  currency: varchar("currency", { length: 10 }).default("USD"),
  notes: text("notes"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectBudget = typeof projectBudget.$inferSelect;
export type InsertProjectBudget = typeof projectBudget.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Budget entries (cost items)
// ─────────────────────────────────────────────────────────────
export const budgetEntries = mysqlTable("budgetEntries", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }).default("0"),
  actualCost: decimal("actualCost", { precision: 15, scale: 2 }).default("0"),
  entityType: varchar("entityType", { length: 50 }), // task / deliverable / risk / other
  entityId: varchar("entityId", { length: 50 }),
  status: mysqlEnum("budgetStatus", ["Planned", "Committed", "Spent", "Cancelled"]).default("Planned").notNull(),
  entryDate: date("entryDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BudgetEntry = typeof budgetEntries.$inferSelect;
export type InsertBudgetEntry = typeof budgetEntries.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Resource Capacity table
// ─────────────────────────────────────────────────────────────
export const resourceCapacity = mysqlTable("resourceCapacity", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stakeholderId: int("stakeholderId").notNull(),
  weekStart: date("weekStart").notNull(), // ISO week start (Monday)
  availableHours: decimal("availableHours", { precision: 5, scale: 1 }).default("40"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ResourceCapacity = typeof resourceCapacity.$inferSelect;
export type InsertResourceCapacity = typeof resourceCapacity.$inferInsert;
