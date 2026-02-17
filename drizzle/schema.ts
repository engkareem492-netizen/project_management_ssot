import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, date } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Projects table - stores multiple projects with password protection
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  password: varchar("password", { length: 255 }).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

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
 * Assumptions table - stores project assumptions
 */
export const assumptions = mysqlTable("assumptions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  assumptionId: varchar("assumptionId", { length: 50 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  ownerId: int("ownerId"),
  status: varchar("status", { length: 100 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

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
