import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json } from "drizzle-orm/mysql-core";

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
 * Requirements table - stores all project requirements
 */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  idCode: varchar("idCode", { length: 50 }).notNull().unique(),
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
  refSource: varchar("refSource", { length: 200 }),
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
});

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = typeof requirements.$inferInsert;

/**
 * Tasks table - stores all project tasks
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 50 }).notNull().unique(),
  taskGroup: varchar("taskGroup", { length: 100 }),
  dependencyId: varchar("dependencyId", { length: 50 }),
  requirementId: varchar("requirementId", { length: 50 }),
  description: text("description"),
  responsible: varchar("responsible", { length: 200 }),
  accountable: varchar("accountable", { length: 200 }),
  informed: varchar("informed", { length: 200 }),
  consulted: varchar("consulted", { length: 200 }),
  dueDate: varchar("dueDate", { length: 50 }),
  currentStatus: text("currentStatus"),
  statusUpdate: text("statusUpdate"),
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
  issueId: varchar("issueId", { length: 50 }).notNull().unique(),
  issueGroup: varchar("issueGroup", { length: 100 }),
  taskGroup: varchar("taskGroup", { length: 100 }),
  requirementId: varchar("requirementId", { length: 50 }),
  type: varchar("type", { length: 100 }),
  class: varchar("class", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  status: varchar("status", { length: 100 }),
  description: text("description"),
  sourceType: varchar("sourceType", { length: 100 }),
  refSource: varchar("refSource", { length: 200 }),
  createdAt: varchar("createdAt", { length: 50 }),
  priority: varchar("priority", { length: 100 }),
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
  dependencyId: varchar("dependencyId", { length: 50 }).notNull().unique(),
  depGroup: varchar("depGroup", { length: 100 }),
  taskId: varchar("taskId", { length: 50 }),
  requirementId: varchar("requirementId", { length: 50 }),
  description: text("description"),
  responsible: varchar("responsible", { length: 200 }),
  accountable: varchar("accountable", { length: 200 }),
  informed: varchar("informed", { length: 200 }),
  consulted: varchar("consulted", { length: 200 }),
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
  assumptionId: varchar("assumptionId", { length: 50 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  owner: varchar("owner", { length: 200 }),
  status: varchar("status", { length: 100 }),
  importedAt: timestamp("importedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

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
