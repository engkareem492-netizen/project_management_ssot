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
  programName: varchar("programName", { length: 200 }),
  portfolioName: varchar("portfolioName", { length: 200 }),
  logoUrl: text("logoUrl"),
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
  department: varchar("department", { length: 200 }),
  // Classification: TeamMember | External | Stakeholder
  classification: mysqlEnum("classification", ["TeamMember", "External", "Stakeholder"]).default("Stakeholder"),
  // Legacy boolean kept for backward compat; derived from classification
  isInternalTeam: boolean("isInternalTeam").default(false).notNull(),
  // TeamMember-specific
  isPooledResource: boolean("isPooledResource").default(false),
  workingHoursPerDay: decimal("workingHoursPerDay", { precision: 4, scale: 1 }).default("8.0"),
  workingDaysPerWeek: int("workingDaysPerWeek").default(5),
  // External-specific: manager is another stakeholder
  stakeholderManagerId: int("stakeholderManagerId"),
  // External-specific: which external party/organisation this person belongs to
  externalPartyId: int("externalPartyId"),
  // Stakeholder engagement tracking
  powerLevel: int("powerLevel").default(3),       // 1-5
  interestLevel: int("interestLevel").default(3),  // 1-5
  positionedOnMap: boolean("positionedOnMap").default(false), // true when user explicitly placed on Power/Interest map
  engagementStrategy: varchar("engagementStrategy", { length: 100 }), // Manage Closely | Keep Satisfied | Keep Informed | Monitor
  currentEngagementStatus: mysqlEnum("currentEngagementStatus", ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]),
  desiredEngagementStatus: mysqlEnum("desiredEngagementStatus", ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]),
  communicationFrequency: varchar("communicationFrequency", { length: 100 }),
  communicationChannel: varchar("communicationChannel", { length: 100 }),
  communicationMessage: text("communicationMessage"),
  communicationResponsible: varchar("communicationResponsible", { length: 200 }),
  communicationResponsibleId: int("communicationResponsibleId"),
  notes: text("notes"),
  // Cost / billing rate
  costPerHour: decimal("costPerHour", { precision: 10, scale: 2 }),
  costPerDay: decimal("costPerDay", { precision: 10, scale: 2 }),
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
  scopeItemId: int("scopeItemId"),
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
  // Communication task link: links auto-created communication tasks to their stakeholder
  communicationStakeholderId: int("communicationStakeholderId"),
  // Recurring task support
  seriesId: int("seriesId"),
  recurringType: mysqlEnum("recurringType", ["none", "daily", "weekly", "monthly", "custom"]).default("none"),
  recurringInterval: int("recurringInterval").default(1),
  recurringEndDate: varchar("recurringEndDate", { length: 50 }),
  // Communication task link
  communicationStakeholderId: int("communicationStakeholderId"),
  // Subject (stakeholder name for COMM tasks)
  subject: varchar("subject", { length: 200 }),
  // Development task links (DEV- tasks tied to a Dev Plan)
  devPlanId: int("devPlanId"),
  devTaskSwotId: int("devTaskSwotId"),
  devTaskSkillId: int("devTaskSkillId"),
  // Resource effort
  manHours: decimal("manHours", { precision: 10, scale: 2 }),
  // Sprint association
  sprintId: int("sprintId"),
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
  scopeItemId: int("scopeItemId"),
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
  linkedDocumentId: int("linkedDocumentId"),  // optional link to documents table
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
  scopeItemId: int("scopeItemId"),
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
  scopeItemId: int("scopeItemId"),
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
  linkedSkillId: int("linkedSkillId"),         // optional link to a stakeholder skill
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
  assessmentDate: timestamp("assessmentDate").notNull(),
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

// ─────────────────────────────────────────────────────────────
// Scope Items table — SAP Cloud ALM-style project scope management
// ─────────────────────────────────────────────────────────────
export const scopeItems = mysqlTable("scopeItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  idCode: varchar("idCode", { length: 50 }).notNull(), // e.g. SC-0001
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  phase: varchar("phase", { length: 100 }),          // e.g. Explore / Realize / Deploy
  processArea: varchar("processArea", { length: 100 }),
  category: varchar("category", { length: 100 }),
  status: varchar("status", { length: 50 }).default("Active"),
  priority: varchar("priority", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScopeItem = typeof scopeItems.$inferSelect;
export type InsertScopeItem = typeof scopeItems.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Project Charter table — single record per project
// ─────────────────────────────────────────────────────────────
export const projectCharter = mysqlTable("projectCharter", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  objectives: text("objectives"),
  scopeStatement: text("scopeStatement"),
  outOfScope: text("outOfScope"),
  successCriteria: text("successCriteria"),
  constraints: text("constraints"),
  methodology: varchar("methodology", { length: 100 }).default("Waterfall"),
  projectStartDate: date("projectStartDate"),
  projectEndDate: date("projectEndDate"),
  phase: varchar("phase", { length: 100 }),
  ragStatus: mysqlEnum("ragStatus", ["Green", "Amber", "Red"]).default("Green"),
  ragJustification: text("ragJustification"),
  sponsorId: int("sponsorId"),
  projectManagerId: int("projectManagerId"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectCharter = typeof projectCharter.$inferSelect;
export type InsertProjectCharter = typeof projectCharter.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Milestones table — formal project milestones
// ─────────────────────────────────────────────────────────────
export const milestones = mysqlTable("milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  milestoneId: varchar("milestoneId", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: date("dueDate"),
  completedDate: date("completedDate"),
  ragStatus: mysqlEnum("ragStatus", ["Green", "Amber", "Red"]).default("Green"),
  status: mysqlEnum("status", ["Upcoming", "In Progress", "Achieved", "Missed", "Deferred"]).default("Upcoming"),
  phase: varchar("phase", { length: 100 }),
  ownerId: int("ownerId"),
  owner: varchar("owner", { length: 255 }),
  linkedDeliverableIds: json("linkedDeliverableIds").$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = typeof milestones.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Test Runs table — test execution records per test case
// ─────────────────────────────────────────────────────────────
export const testRuns = mysqlTable("testRuns", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  testCaseId: int("testCaseId").notNull(),
  runId: varchar("runId", { length: 50 }).notNull(),
  executedBy: varchar("executedBy", { length: 255 }),
  executedById: int("executedById"),
  executionDate: date("executionDate"),
  status: mysqlEnum("status", ["Not Executed", "Passed", "Failed", "Blocked", "Skipped"]).default("Not Executed"),
  environment: varchar("environment", { length: 100 }),
  actualResult: text("actualResult"),
  defectIds: json("defectIds").$type<string[]>(),
  notes: text("notes"),
  stepResults: json("stepResults").$type<Array<{ step: string; result: string; status: string }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TestRun = typeof testRuns.$inferSelect;
export type InsertTestRun = typeof testRuns.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Standalone Action Items table
// ─────────────────────────────────────────────────────────────
export const actionItems = mysqlTable("actionItems", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  actionItemId: varchar("actionItemId", { length: 50 }).notNull(),
  description: text("description").notNull(),
  ownerId: int("ownerId"),
  owner: varchar("owner", { length: 255 }),
  dueDate: date("dueDate"),
  status: mysqlEnum("status", ["Open", "In Progress", "Done", "Cancelled"]).default("Open"),
  priority: mysqlEnum("priority", ["Low", "Medium", "High", "Critical"]).default("Medium"),
  sourceType: varchar("sourceType", { length: 50 }), // meeting / decision / issue / general
  sourceId: varchar("sourceId", { length: 50 }),
  meetingId: int("meetingId"),
  notes: text("notes"),
  completedDate: date("completedDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ActionItem = typeof actionItems.$inferSelect;
export type InsertActionItem = typeof actionItems.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Lessons Learned table
// ─────────────────────────────────────────────────────────────
export const lessonsLearned = mysqlTable("lessonsLearned", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  lessonId: varchar("lessonId", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["Technical", "Process", "People", "Commercial", "Risk", "Communication", "Other"]).default("Process"),
  phase: varchar("phase", { length: 100 }),
  whatWentWell: text("whatWentWell"),
  whatToImprove: text("whatToImprove"),
  recommendation: text("recommendation"),
  impact: mysqlEnum("impact", ["Low", "Medium", "High"]).default("Medium"),
  ownerId: int("ownerId"),
  owner: varchar("owner", { length: 255 }),
  dateRecorded: date("dateRecorded"),
  status: mysqlEnum("status", ["Draft", "Reviewed", "Approved", "Archived"]).default("Draft"),
  tags: json("tags").$type<string[]>().default([]),
  linkedDocumentId: int("linkedDocumentId"),  // optional link to documents table
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonLearned = typeof lessonsLearned.$inferSelect;
export type InsertLessonLearned = typeof lessonsLearned.$inferInsert;

// ─────────────────────────────────────────────────────────────
// Documents table — file attachments for any entity
// ─────────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  documentId: varchar("documentId", { length: 50 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  originalName: varchar("originalName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  description: text("description"),
  entityType: varchar("entityType", { length: 50 }),  // task / requirement / deliverable / cr / general
  entityId: varchar("entityId", { length: 50 }),
  uploadedBy: varchar("uploadedBy", { length: 255 }),
  uploadedById: int("uploadedById"),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Sprints ────────────────────────────────────────────────────────────────
export const sprints = mysqlTable("sprints", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  goal: text("goal"),
  status: mysqlEnum("status", ["Planning", "Active", "Completed", "Cancelled"]).default("Planning").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  capacity: int("capacity"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Sprint = typeof sprints.$inferSelect;
export type InsertSprint = typeof sprints.$inferInsert;

// ─── Time Logs ───────────────────────────────────────────────────────────────
export const timeLogs = mysqlTable("timeLogs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  taskId: int("taskId"),
  taskDescription: varchar("taskDescription", { length: 300 }),
  loggedBy: varchar("loggedBy", { length: 200 }),
  logDate: date("logDate").notNull(),
  hoursLogged: decimal("hoursLogged", { precision: 5, scale: 2 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = typeof timeLogs.$inferInsert;

// ─── Comments ────────────────────────────────────────────────────────────────
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: varchar("entityId", { length: 100 }).notNull(),
  authorName: varchar("authorName", { length: 200 }),
  content: text("content").notNull(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

// ─── Goals / OKRs ────────────────────────────────────────────────────────────
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  owner: varchar("owner", { length: 200 }),
  status: mysqlEnum("status", ["Not Started", "In Progress", "At Risk", "Achieved", "Cancelled"]).default("Not Started").notNull(),
  startDate: date("startDate"),
  endDate: date("endDate"),
  progress: int("progress").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

export const keyResults = mysqlTable("keyResults", {
  id: int("id").autoincrement().primaryKey(),
  goalId: int("goalId").notNull(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  targetValue: decimal("targetValue", { precision: 10, scale: 2 }),
  currentValue: decimal("currentValue", { precision: 10, scale: 2 }).default("0"),
  unit: varchar("unit", { length: 50 }),
  status: mysqlEnum("status", ["Not Started", "In Progress", "At Risk", "Achieved"]).default("Not Started").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type KeyResult = typeof keyResults.$inferSelect;
export type InsertKeyResult = typeof keyResults.$inferInsert;

// ─── SLA Ticket Types ─────────────────────────────────────────────────────────
export const ticketTypes = mysqlTable("ticketTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  responseTimeHours: int("responseTimeHours").notNull(),
  resolutionTimeHours: int("resolutionTimeHours").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TicketType = typeof ticketTypes.$inferSelect;
export type InsertTicketType = typeof ticketTypes.$inferInsert;

// ─── SLA Tickets ──────────────────────────────────────────────────────────────
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  ticketTypeId: int("ticketTypeId").notNull(),
  idCode: varchar("idCode", { length: 20 }),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["Low", "Medium", "High", "Critical"]).default("Medium").notNull(),
  status: mysqlEnum("status", ["Open", "In Progress", "Waiting", "Resolved", "Closed"]).default("Open").notNull(),
  assigneeId: int("assigneeId"),
  assigneeName: varchar("assigneeName", { length: 200 }),
  reporterName: varchar("reporterName", { length: 200 }),
  respondedAt: timestamp("respondedAt"),
  resolvedAt: timestamp("resolvedAt"),
  slaResponseBreached: boolean("slaResponseBreached").default(false),
  slaResolutionBreached: boolean("slaResolutionBreached").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

// ─── SLA Priority Policies ────────────────────────────────────────────────────
export const slaPolicies = mysqlTable("slaPolicies", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  priority: mysqlEnum("priority", ["Critical", "High", "Medium", "Low"]).notNull(),
  responseTimeHours: int("responseTimeHours").notNull().default(4),
  resolutionTimeHours: int("resolutionTimeHours").notNull().default(24),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SlaPolicy = typeof slaPolicies.$inferSelect;
export type InsertSlaPolicy = typeof slaPolicies.$inferInsert;

// ─── Project Templates ────────────────────────────────────────────────────────
export const projectTemplates = mysqlTable("projectTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  snapshot: json("snapshot").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertProjectTemplate = typeof projectTemplates.$inferInsert;

// ─── Stakeholder Portal Tokens ────────────────────────────────────────────────
export const stakeholderPortalTokens = mysqlTable("stakeholderPortalTokens", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stakeholderId: int("stakeholderId").notNull(),
  token: varchar("token", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 200 }),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StakeholderPortalToken = typeof stakeholderPortalTokens.$inferSelect;
export type InsertStakeholderPortalToken = typeof stakeholderPortalTokens.$inferInsert;

// ─── Engagement Status History ─────────────────────────────────────────────────
export const engagementStatusHistory = mysqlTable("engagementStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  projectId: int("projectId").notNull(),
  statusType: mysqlEnum("statusType", ["current", "desired"]).notNull(),
  status: mysqlEnum("engagementStatus", ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).notNull(),
  assessedBy: varchar("assessedBy", { length: 200 }),
  assessmentDate: date("assessmentDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EngagementStatusHistory = typeof engagementStatusHistory.$inferSelect;
export type InsertEngagementStatusHistory = typeof engagementStatusHistory.$inferInsert;

// ─── Engagement Task Groups ────────────────────────────────────────────────────
export const engagementTaskGroups = mysqlTable("engagementTaskGroups", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  fromStatus: mysqlEnum("fromStatus", ["Unaware", "Resistant", "Neutral", "Supportive", "Leading", "Any"]).notNull(),
  toStatus: mysqlEnum("toStatus", ["Unaware", "Resistant", "Neutral", "Supportive", "Leading"]).notNull(),
  color: varchar("color", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EngagementTaskGroup = typeof engagementTaskGroups.$inferSelect;
export type InsertEngagementTaskGroup = typeof engagementTaskGroups.$inferInsert;

// ─── Engagement Tasks ──────────────────────────────────────────────────────────
export const engagementTasks = mysqlTable("engagementTasks", {
  id: int("id").autoincrement().primaryKey(),
  taskGroupId: int("taskGroupId").notNull(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description"),
  periodic: varchar("periodic", { length: 100 }), // e.g. Daily, Weekly, Monthly, Per Meeting
  sequence: int("sequence").default(0).notNull(), // order within the task group
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EngagementTask = typeof engagementTasks.$inferSelect;
export type InsertEngagementTask = typeof engagementTasks.$inferInsert;

// ─── Engagement Task Subjects ──────────────────────────────────────────────────
// Which stakeholders are subjects/targets of a task group
export const engagementTaskSubjects = mysqlTable("engagementTaskSubjects", {
  id: int("id").autoincrement().primaryKey(),
  taskGroupId: int("taskGroupId").notNull(),
  stakeholderId: int("stakeholderId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EngagementTaskSubject = typeof engagementTaskSubjects.$inferSelect;
export type InsertEngagementTaskSubject = typeof engagementTaskSubjects.$inferInsert;

// ─── Stakeholder Skills ────────────────────────────────────────────────────────
export const stakeholderSkills = mysqlTable("stakeholderSkills", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  level: mysqlEnum("skillLevel", ["Beginner", "Intermediate", "Advanced", "Expert"]).default("Intermediate").notNull(),
  linkedKpiId: int("linkedKpiId"),
  linkedSwotId: int("linkedSwotId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StakeholderSkill = typeof stakeholderSkills.$inferSelect;
export type InsertStakeholderSkill = typeof stakeholderSkills.$inferInsert;

// ─── Stakeholder SWOT ─────────────────────────────────────────────────────────
export const stakeholderSwot = mysqlTable("stakeholderSwot", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  quadrant: mysqlEnum("swotQuadrant", ["Strength", "Weakness", "Opportunity", "Threat"]).notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StakeholderSwot = typeof stakeholderSwot.$inferSelect;
export type InsertStakeholderSwot = typeof stakeholderSwot.$inferInsert;

// ─── Development Plans ────────────────────────────────────────────────────────
export const developmentPlans = mysqlTable("developmentPlans", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  goals: text("goals"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  status: mysqlEnum("devPlanStatus", ["Not Started", "In Progress", "Completed", "On Hold"]).default("Not Started").notNull(),
  linkedTaskGroupId: int("linkedTaskGroupId"),
  linkedSkillId: int("linkedSkillId"),
  linkedSwotId: int("linkedSwotId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DevelopmentPlan = typeof developmentPlans.$inferSelect;
export type InsertDevelopmentPlan = typeof developmentPlans.$inferInsert;

// ─── Team Charter ─────────────────────────────────────────────────────────────
export const teamCharter = mysqlTable("teamCharter", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  mission: text("mission"),
  scopeAndBoundaries: text("scopeAndBoundaries"),
  metricsOfSuccess: text("metricsOfSuccess"),
  coreValues: text("coreValues"),
  groundRules: text("groundRules"),
  restrictedViolations: text("restrictedViolations"),
  teamActivities: text("teamActivities"),
  internalCommunicationPlan: text("internalCommunicationPlan"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TeamCharter = typeof teamCharter.$inferSelect;
export type InsertTeamCharter = typeof teamCharter.$inferInsert;

// ─── Communication Plan Entries ────────────────────────────────────────────────
export const communicationPlanEntries = mysqlTable("communicationPlanEntries", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  stakeholderId: int("stakeholderId"),
  targetType: mysqlEnum("targetType", ["stakeholder", "role", "job"]),
  targetValue: varchar("targetValue", { length: 300 }),
  role: varchar("role", { length: 200 }),
  informationNeeded: text("informationNeeded"),
  preferredMethods: json("preferredMethods").$type<string[]>(),
  frequency: varchar("frequency", { length: 100 }),
  textNote: text("textNote"),
  escalationProcedures: text("escalationProcedures"),
  acknowledgmentNeeded: boolean("acknowledgmentNeeded").default(false),
  responsible: varchar("responsible", { length: 200 }),
  responsibleStakeholderId: int("responsibleStakeholderId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CommunicationPlanEntry = typeof communicationPlanEntries.$inferSelect;
export type InsertCommunicationPlanEntry = typeof communicationPlanEntries.$inferInsert;

// ─── Resource Calendar ────────────────────────────────────────────────────────
export const resourceCalendar = mysqlTable("resourceCalendar", {
  id: int("id").autoincrement().primaryKey(),
  stakeholderId: int("stakeholderId").notNull(),
  projectId: int("projectId").notNull(),
  date: date("date").notNull(),
  type: mysqlEnum("calType", ["Working", "Leave", "Holiday", "Training", "PartTime"]).default("Working").notNull(),
  availableHours: decimal("availableHours", { precision: 4, scale: 1 }).default("8.0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ResourceCalendar = typeof resourceCalendar.$inferSelect;
export type InsertResourceCalendar = typeof resourceCalendar.$inferInsert;

// ─── Communication Plan: Role & Job Options ───────────────────────────────────
// Managed dropdown options for "By Role" and "By Job" target types
export const commPlanRoleOptions = mysqlTable("commPlanRoleOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommPlanRoleOption = typeof commPlanRoleOptions.$inferSelect;
export type InsertCommPlanRoleOption = typeof commPlanRoleOptions.$inferInsert;

export const commPlanJobOptions = mysqlTable("commPlanJobOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommPlanJobOption = typeof commPlanJobOptions.$inferSelect;
export type InsertCommPlanJobOption = typeof commPlanJobOptions.$inferInsert;

// ─── Communication Plan: Entry Enhancements ───────────────────────────────────
// acknowledgmentNeeded stored on communicationPlanEntries (via ALTER)
// communicationNeededItems — per-entry line items
export const commPlanItems = mysqlTable("commPlanItems", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),          // FK → communicationPlanEntries.id
  projectId: int("projectId").notNull(),
  description: text("description").notNull(), // what we need from/to stakeholder
  commType: mysqlEnum("commType", ["Push", "Pull", "Interactive", "Other"]).default("Push").notNull(),
  periodic: varchar("periodic", { length: 100 }), // e.g. Daily, Weekly, Per Meeting
  sequence: int("sequence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CommPlanItem = typeof commPlanItems.$inferSelect;
export type InsertCommPlanItem = typeof commPlanItems.$inferInsert;

// ─── RBS Resource Types ───────────────────────────────────────────────────────
// Custom resource type definitions for the Resource Breakdown Structure.
// Built-in types (TeamMember, External, Stakeholder) always exist.
// Users can add project-specific types here (e.g. Vendor, Consultant, System).
export const rbsResourceTypes = mysqlTable("rbsResourceTypes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),       // e.g. "Vendor"
  color: varchar("color", { length: 50 }),                // optional hex/tailwind color
  description: text("description"),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(), // true for the 3 defaults
  sequence: int("sequence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RbsResourceType = typeof rbsResourceTypes.$inferSelect;
export type InsertRbsResourceType = typeof rbsResourceTypes.$inferInsert;

// ─── Stakeholder Position Options ─────────────────────────────────────────────
// Managed list of Position options that can be assigned to stakeholders.
export const stakeholderPositionOptions = mysqlTable("stakeholderPositionOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StakeholderPositionOption = typeof stakeholderPositionOptions.$inferSelect;
export type InsertStakeholderPositionOption = typeof stakeholderPositionOptions.$inferInsert;

// ─── Communication Plan Method Options ────────────────────────────────────────
// Managed list of preferred communication method types (e.g. Email, Meeting).
// Seeded with defaults on first use; users can add/remove per project.
export const commPlanMethodOptions = mysqlTable("commPlanMethodOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  label: varchar("label", { length: 200 }).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),
  sequence: int("sequence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommPlanMethodOption = typeof commPlanMethodOptions.$inferSelect;
export type InsertCommPlanMethodOption = typeof commPlanMethodOptions.$inferInsert;

// ─── Communication Plan Input Items (Inputs Needed from Stakeholder) ──────────
export const commPlanInputItems = mysqlTable("commPlanInputItems", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entryId").notNull(),
  projectId: int("projectId").notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  sequence: int("sequence").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CommPlanInputItem = typeof commPlanInputItems.$inferSelect;
export type InsertCommPlanInputItem = typeof commPlanInputItems.$inferInsert;

// ─── RBS Nodes ────────────────────────────────────────────────────────────────
// Hierarchical nodes in the Resource Breakdown Structure tree.
// Each node has a code (e.g. R1.1), name, resource type, optional parent, and description.
export const rbsNodes = mysqlTable("rbsNodes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),           // e.g. "R1.1"
  name: varchar("name", { length: 200 }).notNull(),
  resourceType: varchar("resourceType", { length: 100 }),    // e.g. "Human", "Equipment"
  parentId: int("parentId"),                                  // null = root node
  description: text("description"),
  sequence: int("sequence").default(0).notNull(),
  // Extended resource metadata
  stakeholderId: int("stakeholderId"),                        // links to stakeholders.id if this node IS a stakeholder
  unit: varchar("unit", { length: 50 }),                     // e.g. "Person", "Machine", "License"
  quantity: varchar("quantity", { length: 50 }),              // e.g. "1", "3"
  costRate: varchar("costRate", { length: 50 }),              // cost per unit
  availability: varchar("availability", { length: 20 }),     // e.g. "100%", "50%"
  isLeaf: int("isLeaf").default(0).notNull(),                // 1 = actual resource (leaf), 0 = category node
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RbsNode = typeof rbsNodes.$inferSelect;
export type InsertRbsNode = typeof rbsNodes.$inferInsert;

// ─── WBS Resource Assignments ─────────────────────────────────────────────────
// Maps RBS leaf-nodes (resources) to WBS elements with an optional allocation %.
export const wbsResourceAssignments = mysqlTable("wbsResourceAssignments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  wbsNodeId: int("wbsNodeId").notNull(),
  rbsNodeId: int("rbsNodeId").notNull(),
  allocationPct: decimal("allocationPct", { precision: 5, scale: 2 }).default("100.00"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WbsResourceAssignment = typeof wbsResourceAssignments.$inferSelect;
export type InsertWbsResourceAssignment = typeof wbsResourceAssignments.$inferInsert;

// ─── Task History (Recurring Task Snapshots) ──────────────────────────────────
// When a recurring task is auto-renewed, its previous state is saved here.
export const taskHistory = mysqlTable("taskHistory", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),                           // FK to tasks.id
  projectId: int("projectId").notNull(),
  taskIdCode: varchar("taskIdCode", { length: 50 }),         // e.g. "COMM-0001"
  description: text("description"),
  status: varchar("status", { length: 100 }),
  priority: varchar("priority", { length: 100 }),
  responsible: varchar("responsible", { length: 200 }),
  subject: varchar("subject", { length: 200 }),
  dueDate: varchar("dueDate", { length: 50 }),
  currentStatus: text("currentStatus"),
  statusUpdate: text("statusUpdate"),
  renewedAt: timestamp("renewedAt").defaultNow().notNull(),  // when the renewal happened
  periodLabel: varchar("periodLabel", { length: 100 }),      // e.g. "Week of 2026-03-10"
});
export type TaskHistory = typeof taskHistory.$inferSelect;
export type InsertTaskHistory = typeof taskHistory.$inferInsert;

// ─── Project Work-Week Settings ───────────────────────────────────────────────
// Per-project calendar configuration: which days are working days, work hours, etc.
export const projectWorkWeek = mysqlTable("projectWorkWeek", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().unique(),
  // Working days: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat (comma-separated)
  workingDays: varchar("workingDays", { length: 20 }).default("0,1,2,3,4").notNull(), // Sun-Thu default
  workStartHour: int("workStartHour").default(8).notNull(),   // 8 = 8:00 AM
  workEndHour: int("workEndHour").default(17).notNull(),       // 17 = 5:00 PM
  hoursPerDay: decimal("hoursPerDay", { precision: 4, scale: 1 }).default("8.0").notNull(),
  // End-of-week day for "weekly" recurring tasks (0-6, default 4 = Thursday)
  weekEndDay: int("weekEndDay").default(4).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectWorkWeek = typeof projectWorkWeek.$inferSelect;
export type InsertProjectWorkWeek = typeof projectWorkWeek.$inferInsert;

// ─── EEF (Enterprise Environmental Factors) ─────────────────────────────────────────────────────────────────────────────────────────
// Captures internal and external environmental factors that influence the project.
export const eefFactors = mysqlTable("eefFactors", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  eefId: varchar("eefId", { length: 50 }).notNull(),          // e.g. "EEF-0001"
  category: varchar("category", { length: 100 }).notNull(),   // "Internal" | "External"
  type: varchar("type", { length: 200 }).notNull(),            // e.g. "Organizational Culture"
  description: text("description"),
  impact: varchar("impact", { length: 50 }),                   // "Positive" | "Negative" | "Neutral"
  impactLevel: varchar("impactLevel", { length: 50 }),         // "High" | "Medium" | "Low"
  owner: varchar("owner", { length: 200 }),
  notes: text("notes"),
  linkedDocumentId: int("linkedDocumentId"),  // optional link to documents table
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EefFactor = typeof eefFactors.$inferSelect;
export type InsertEefFactor = typeof eefFactors.$inferInsert;

// ─── Lessons Learned Dropdown Options ────────────────────────────────────────
// Stores per-project customizable options for Category, Impact, Status, Phase
export const llDropdownOptions = mysqlTable("llDropdownOptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fieldType: varchar("fieldType", { length: 50 }).notNull(),  // "category" | "impact" | "status" | "phase"
  value: varchar("value", { length: 200 }).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type LlDropdownOption = typeof llDropdownOptions.$inferSelect;
export type InsertLlDropdownOption = typeof llDropdownOptions.$inferInsert;

// ─── External Parties ─────────────────────────────────────────────────────────
// Stores per-project external party organisations (contractors, vendors, etc.)
export const externalParties = mysqlTable("externalParties", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExternalParty = typeof externalParties.$inferSelect;
export type InsertExternalParty = typeof externalParties.$inferInsert;

// ─── WBS Nodes ────────────────────────────────────────────────────────────────
// Work Breakdown Structure hierarchy — each node can be linked to a Task
export const wbsNodes = mysqlTable("wbsNodes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  code: varchar("code", { length: 50 }).notNull(),          // e.g. "1.1.2"
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: int("parentId"),                                  // null = root node
  sequence: int("sequence").default(0).notNull(),
  deliverable: varchar("deliverable", { length: 255 }),      // deliverable/output label
  responsible: varchar("responsible", { length: 255 }),
  status: mysqlEnum("status", ["Not Started", "In Progress", "Complete", "On Hold"]).default("Not Started"),
  linkedTaskId: int("linkedTaskId"),                          // FK → tasks.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type WbsNode = typeof wbsNodes.$inferSelect;
export type InsertWbsNode = typeof wbsNodes.$inferInsert;

// ─── Comm RACI Matrix ─────────────────────────────────────────────────────────
// Stores RACI assignments for the communication plan matrix
export const commRaciMatrix = mysqlTable("comm_raci_matrix", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  commItemLabel: varchar("comm_item_label", { length: 500 }).notNull(),
  stakeholderId: int("stakeholder_id").notNull(),
  raciValue: varchar("raci_value", { length: 1 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});
export type CommRaciMatrix = typeof commRaciMatrix.$inferSelect;
export type InsertCommRaciMatrix = typeof commRaciMatrix.$inferInsert;

// ─── Communication Log ────────────────────────────────────────────────────────
// Records actual communications that happened for a project
export const communicationLog = mysqlTable("communication_log", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  logDate: date("log_date").notNull(),
  communicationType: varchar("communication_type", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  sentBy: varchar("sent_by", { length: 255 }),
  recipients: text("recipients"),
  method: varchar("method", { length: 100 }),
  summary: text("summary"),
  linkedCommPlanEntryId: int("linked_comm_plan_entry_id"),
  attachmentUrl: varchar("attachment_url", { length: 1000 }),
  notes: text("notes"),
  createdBy: int("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type CommunicationLog = typeof communicationLog.$inferSelect;

// Universal Dropdown Registry — every configurable select/dropdown in the system
export const dropdownRegistry = mysqlTable("dropdown_registry", {
  id: int("id").primaryKey().autoincrement(),
  projectId: int("project_id").notNull(),
  domain: varchar("domain", { length: 100 }).notNull(),
  fieldKey: varchar("field_key", { length: 100 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  color: varchar("color", { length: 50 }),
  icon: varchar("icon", { length: 50 }),
  sortOrder: int("sort_order").notNull().default(0),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});
export type InsertCommunicationLog = typeof communicationLog.$inferInsert;

// ─────────────────────────────────────────────────────────────
// User Stories — SAP Cloud ALM-style user stories linked to
// scope items and requirements.
// ─────────────────────────────────────────────────────────────
export const userStories = mysqlTable("userStories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  storyId: varchar("storyId", { length: 50 }).notNull(),           // US-0001
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),                                 // "As a [role], I want..."
  acceptanceCriteria: text("acceptanceCriteria"),
  priority: varchar("priority", { length: 50 }).default("Medium"), // Critical/High/Medium/Low
  status: varchar("status", { length: 100 }).default("New"),       // New/In Analysis/In Development/In Test/Done/Rejected
  storyPoints: int("storyPoints"),
  effortDays: decimal("effortDays", { precision: 5, scale: 1 }),
  scopeItemId: int("scopeItemId"),                                  // FK to scopeItems
  sprintId: int("sprintId"),                                        // optional link to sprint
  assignedToId: int("assignedToId"),                               // FK to stakeholders
  assignedTo: varchar("assignedTo", { length: 200 }),
  processStep: varchar("processStep", { length: 255 }),            // SAP process step / activity
  businessRole: varchar("businessRole", { length: 255 }),          // business role the story targets
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserStory = typeof userStories.$inferSelect;
export type InsertUserStory = typeof userStories.$inferInsert;

// Many-to-many: user stories ↔ requirements
export const userStoryRequirements = mysqlTable("userStoryRequirements", {
  id: int("id").autoincrement().primaryKey(),
  userStoryId: int("userStoryId").notNull(),
  requirementId: int("requirementId").notNull(),                   // FK to requirements.id
  projectId: int("projectId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserStoryRequirement = typeof userStoryRequirements.$inferSelect;

// Many-to-many: user stories ↔ tasks
export const userStoryTasks = mysqlTable("userStoryTasks", {
  id: int("id").autoincrement().primaryKey(),
  userStoryId: int("userStoryId").notNull(),
  taskId: int("taskId").notNull(),
  projectId: int("projectId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type UserStoryTask = typeof userStoryTasks.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM FIELDS
// ═══════════════════════════════════════════════════════════════════════════════
export const customFieldDefs = mysqlTable("customFieldDefs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  entityType: mysqlEnum("entityType", [
    "task", "issue", "risk", "requirement", "stakeholder",
    "deliverable", "milestone", "action_item", "change_request",
  ]).notNull(),
  fieldKey: varchar("fieldKey", { length: 100 }).notNull(),
  label: varchar("label", { length: 150 }).notNull(),
  fieldType: mysqlEnum("fieldType", [
    "text", "number", "date", "select", "multi_select",
    "checkbox", "url", "email", "textarea", "rating",
  ]).notNull().default("text"),
  options: json("options").$type<string[]>(),
  required: boolean("required").default(false),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomFieldDef = typeof customFieldDefs.$inferSelect;
export type InsertCustomFieldDef = typeof customFieldDefs.$inferInsert;

export const customFieldValues = mysqlTable("customFieldValues", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fieldDefId: int("fieldDefId").notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: varchar("entityId", { length: 100 }).notNull(),
  value: text("value"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CustomFieldValue = typeof customFieldValues.$inferSelect;
export type InsertCustomFieldValue = typeof customFieldValues.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PM PLAN SECTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const pmPlanSections = mysqlTable("pmPlanSections", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  sectionKey: varchar("sectionKey", { length: 60 }).notNull(),
  content: json("content").$type<Record<string, string>>().default({}),
  lastUpdatedBy: varchar("lastUpdatedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PmPlanSection = typeof pmPlanSections.$inferSelect;
export type InsertPmPlanSection = typeof pmPlanSections.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-CURRENCY
// ═══════════════════════════════════════════════════════════════════════════════
export const projectCurrencies = mysqlTable("projectCurrencies", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  currencyCode: varchar("currencyCode", { length: 10 }).notNull(),
  currencyName: varchar("currencyName", { length: 80 }).notNull(),
  symbol: varchar("symbol", { length: 10 }).notNull().default(""),
  isBase: boolean("isBase").notNull().default(false),
  sortOrder: int("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ProjectCurrency = typeof projectCurrencies.$inferSelect;
export type InsertProjectCurrency = typeof projectCurrencies.$inferInsert;

export const exchangeRates = mysqlTable("exchangeRates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fromCurrencyCode: varchar("fromCurrencyCode", { length: 10 }).notNull(),
  toCurrencyCode: varchar("toCurrencyCode", { length: 10 }).notNull(),
  baselineRate: decimal("baselineRate", { precision: 18, scale: 6 }).notNull().default("1"),
  currentRate: decimal("currentRate", { precision: 18, scale: 6 }).notNull().default("1"),
  predictedRate: decimal("predictedRate", { precision: 18, scale: 6 }).notNull().default("1"),
  effectiveDate: varchar("effectiveDate", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type InsertExchangeRate = typeof exchangeRates.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// EVM (EARNED VALUE MANAGEMENT)
// ═══════════════════════════════════════════════════════════════════════════════
export const evmBaseline = mysqlTable("evmBaseline", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  bac: decimal("bac", { precision: 18, scale: 2 }).notNull().default("0"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EvmBaseline = typeof evmBaseline.$inferSelect;
export type InsertEvmBaseline = typeof evmBaseline.$inferInsert;

export const evmSnapshots = mysqlTable("evmSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  periodLabel: varchar("periodLabel", { length: 100 }).notNull(),
  periodDate: date("periodDate").notNull(),
  pv: decimal("pv", { precision: 18, scale: 2 }).notNull().default("0"),
  ev: decimal("ev", { precision: 18, scale: 2 }).notNull().default("0"),
  ac: decimal("ac", { precision: 18, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EvmSnapshot = typeof evmSnapshots.$inferSelect;
export type InsertEvmSnapshot = typeof evmSnapshots.$inferInsert;

export const evmWbsEntries = mysqlTable("evmWbsEntries", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  wbsElementId: int("wbsElementId"),
  wbsCode: varchar("wbsCode", { length: 50 }),
  wbsTitle: varchar("wbsTitle", { length: 255 }),
  bac: decimal("bac", { precision: 18, scale: 2 }).default("0"),
  pv: decimal("pv", { precision: 18, scale: 2 }).default("0"),
  ev: decimal("ev", { precision: 18, scale: 2 }).default("0"),
  ac: decimal("ac", { precision: 18, scale: 2 }).default("0"),
  percentComplete: decimal("percentComplete", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EvmWbsEntry = typeof evmWbsEntries.$inferSelect;
export type InsertEvmWbsEntry = typeof evmWbsEntries.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURES, TEST PLANS, DEFECTS
// ═══════════════════════════════════════════════════════════════════════════════
export const features = mysqlTable("features", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  featureCode: varchar("featureCode", { length: 30 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("Draft"),
  priority: varchar("priority", { length: 20 }).default("Medium"),
  owner: varchar("owner", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Feature = typeof features.$inferSelect;
export type InsertFeature = typeof features.$inferInsert;

export const testPlans = mysqlTable("testPlans", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("Draft"),
  startDate: varchar("startDate", { length: 20 }),
  endDate: varchar("endDate", { length: 20 }),
  owner: varchar("owner", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TestPlan = typeof testPlans.$inferSelect;
export type InsertTestPlan = typeof testPlans.$inferInsert;

export const defects = mysqlTable("defects", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  defectCode: varchar("defectCode", { length: 30 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: varchar("severity", { length: 20 }).default("Medium"),
  priority: varchar("priority", { length: 20 }).default("Medium"),
  status: varchar("status", { length: 50 }).default("Open"),
  reportedBy: varchar("reportedBy", { length: 100 }),
  assignedTo: varchar("assignedTo", { length: 100 }),
  stepsToReproduce: text("stepsToReproduce"),
  expectedResult: text("expectedResult"),
  actualResult: text("actualResult"),
  resolution: text("resolution"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Defect = typeof defects.$inferSelect;
export type InsertDefect = typeof defects.$inferInsert;

export const testPlanTestCases = mysqlTable("testPlanTestCases", {
  id: int("id").autoincrement().primaryKey(),
  testPlanId: int("testPlanId").notNull(),
  testCaseId: int("testCaseId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const defectTestCases = mysqlTable("defectTestCases", {
  id: int("id").autoincrement().primaryKey(),
  defectId: int("defectId").notNull(),
  testCaseId: int("testCaseId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const featureRequirements = mysqlTable("featureRequirements", {
  id: int("id").autoincrement().primaryKey(),
  featureId: int("featureId").notNull(),
  requirementId: int("requirementId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// CUMULATIVE FLOW DIAGRAM — daily task status snapshots
// ═══════════════════════════════════════════════════════════════════════════════
export const taskStatusHistory = mysqlTable("taskStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  snapshotDate: date("snapshotDate").notNull(),
  statusOpen: int("statusOpen").default(0).notNull(),
  statusInProgress: int("statusInProgress").default(0).notNull(),
  statusBlocked: int("statusBlocked").default(0).notNull(),
  statusDone: int("statusDone").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TaskStatusHistory = typeof taskStatusHistory.$inferSelect;
export type InsertTaskStatusHistory = typeof taskStatusHistory.$inferInsert;
