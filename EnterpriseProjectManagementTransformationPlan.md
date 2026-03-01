# Enterprise Project Management Transformation Plan
## From SSOT to SAP S/4HANA Implementation Command Center

---

## Context

The current application is a **42-table, 167-function** project management SSOT built with React 19 + tRPC + Drizzle ORM + MySQL. It already covers requirements, tasks, issues, risks, change requests, meetings, decisions, test cases, knowledge base, Gantt charts, traceability matrix, and more.

**The goal**: Transform it into an enterprise-grade tool capable of managing a **$50M+ SAP S/4HANA digital transformation** (migrating legacy Oracle/BRITON ERP to SAP S/4HANA, SuccessFactors, Ariba) with 200+ consultants and external SI teams.

---

## Current State Audit

### What EXISTS (42 tables, 29 pages):
- Projects, Requirements, Tasks (RACI), Issues, Dependencies, Assumptions, Deliverables
- Risk Register (5x5 scoring, analysis, response strategies)
- Change Requests (7-state workflow), Meetings, Decisions, Test Cases
- Knowledge Base (hierarchical), Stakeholders, Action Logs (audit trail)
- Gantt Chart, Traceability Matrix, Relationship Map, Weekly Report
- Customizable dropdowns (status/priority/type per project), ID sequences
- JWT + OAuth auth, project invitations, Excel import/export

### What's MISSING (41 gaps identified):

| Category | Missing Features |
|----------|-----------------|
| **Core** | Sub-tasks, task checklists, comments/discussions, entity attachments, tags, global search |
| **Auth** | SSO (SAML/OIDC), passwordless (magic links/WebAuthn), fine-grained RBAC |
| **Collaboration** | In-app notifications, activity feed, real-time (WebSocket) |
| **PMO** | Time tracking, resource management, budget/cost, phases/waves, Kanban, calendar, RACI matrix view, templates, recurring tasks |
| **Process** | SLA/SLO engine, ticketing with SLA timers, workflow engine, generalized approvals, bulk operations |
| **SAP-Specific** | SAP Activate methodology, fit-gap analysis, WRICEF register, data migration tracking, cutover planning, training management, OCM, go-live readiness |
| **Platform** | Custom fields engine, dashboard builder, program/portfolio management, vendor management, compliance, reporting engine, webhooks, i18n |

---

## Implementation Plan (6 Phases)

### PHASE 1: Foundation
**Goal**: Build the substrate that all subsequent phases depend on.

#### 1.1 Sub-Tasks / Task Hierarchy
**Modify** `tasks` table in `drizzle/schema.ts`:
```
+ parentTaskId: int (nullable, self-referential)
+ hierarchyLevel: int (default 0, max 3 levels)
```
- DB functions: `getChildTasks()`, `getTaskHierarchy()` (recursive CTE), `moveTask()`
- UI: Tree-view mode in Tasks page, "Add Sub-task" button, breadcrumb chain
- Update Gantt chart for parent/child summary bars

#### 1.2 Comments / Discussion Threads
**New table** `comments`:
```
id, projectId, entityType (varchar50), entityId (int), parentCommentId (int),
authorId (int), body (text/markdown), isEdited, createdAt, updatedAt
```
- Works on ALL entities (requirement, task, issue, risk, CR, meeting, etc.)
- Threaded replies (max 2 levels), @mention support
- Reusable `<CommentsPanel entityType entityId />` component

#### 1.3 Entity Attachments (Generalized)
**New table** `attachments`:
```
id, projectId, entityType, entityId, fileName, fileSize, mimeType,
storageKey, storageUrl, uploadedBy, createdAt
```
- Reuses existing `storagePut` from `server/storage.ts`
- Drag-and-drop `<AttachmentsPanel />` component for all entity detail views

#### 1.4 Tags / Labels System
**New tables** `tags` + `entityTags`:
```
tags: id, projectId, name, color (hex), createdAt
entityTags: id, tagId, entityType, entityId, createdAt
```
- Tag management in Settings, color-coded pills on list/detail views
- Filter-by-tag on all list pages

#### 1.5 Task Checklists
**New table** `taskChecklists`:
```
id, taskId, title, isCompleted, sortOrder, completedAt, completedBy, createdAt, updatedAt
```
- Drag-to-reorder checklist in task detail
- Progress bar (completed/total percentage) as badge in task list

#### 1.6 In-App Notifications
**New tables** `notifications` + `notificationPreferences`:
```
notifications: id, userId, projectId, type, title, body, entityType, entityId, isRead, readAt, createdAt
notificationPreferences: id, userId, notificationType, inApp, email, createdAt
```
- Types: comment_mention, task_assigned, status_changed, due_date_approaching, approval_requested, etc.
- Server-side `notificationService.ts` with `createNotification()`, `notifyMentionedUsers()`, `notifyAssignees()`
- Bell icon in header, notification dropdown with unread count
- Phase 1: polling (30s interval). Phase 2: WebSocket push

#### 1.7 Global Search
- API: `search.global` - parallel LIKE queries across all entity tables
- UI: Command palette (Cmd+K / Ctrl+K) with results grouped by entity type
- Recent searches in localStorage

---

### PHASE 2: Enterprise Auth & Collaboration

#### 2.1 Advanced RBAC (Fine-Grained Permissions)
**New tables** `roles` + `permissions`:
```
roles: id, projectId, name, description, isSystem, createdAt
permissions: id, roleId, resource (varchar), action (varchar), createdAt
```
- Modify `projectMembers` to add `roleId` column
- Default roles: Project Admin, Workstream Lead, Consultant, Viewer, Stakeholder
- New `permissionProcedure(resource, action)` middleware factory in `trpc.ts`

#### 2.2 SSO (SAML 2.0 / OIDC)
**New table** `ssoConfigurations`:
```
id, name, protocol (saml/oidc), entityId, ssoUrl, certificate,
oidcIssuer, oidcClientId, oidcClientSecret, isActive, autoProvision, defaultRoleId
```
- Packages: `@node-saml/node-saml`, `openid-client`
- Express routes for SAML/OIDC callbacks
- SSO config UI in Settings (admin), "Sign in with SSO" on login page

#### 2.3 Activity Feed
**New table** `activityFeed`:
```
id, projectId, userId, action, entityType, entityId, entityIdCode, metadata (JSON), createdAt
```
- Extends existing `actionLogs` to project-wide activity stream
- Timeline view page with filters (entity type, user, date range)

#### 2.4 Real-Time Collaboration (WebSocket)
- `ws` library on existing Express HTTP server
- Rooms per project: `project:${projectId}`
- Events: `entity:created/updated/deleted`, `comment:new`, `notification:new`
- Client: React Query cache invalidation on WebSocket events

#### 2.5 Passwordless Auth
**New table** `magicLinks`:
```
id, email, token (unique), expiresAt, usedAt, createdAt
```
- Email-based magic link (6-min expiry), reuses existing JWT session creation
- Future: WebAuthn/FIDO2 via `@simplewebauthn/server`

---

### PHASE 3: PMO Best Practices

#### 3.1 Project Phases / Waves
**New table** `projectPhases`:
```
id, projectId, phaseId, name, description, type (phase/wave/sprint),
parentPhaseId, startDate, endDate, status, sortOrder,
gateStatus, gateApprovedBy, gateApprovedAt
```
- Add `phaseId` column to `tasks` table
- Phase management page, phase-based Gantt grouping, phase progress bars

#### 3.2 Time Tracking
**New table** `timeEntries`:
```
id, projectId, taskId, userId, date, hours, minutes, description,
billable, approved, approvedBy, createdAt
```
- Time log button on tasks, weekly timesheet page, time reports
- Manager approval workflow

#### 3.3 Resource Management
**New table** `resourceAllocations`:
```
id, projectId, userId, stakeholderId, phaseId, role, allocationPercentage (0-100),
startDate, endDate, dailyRate (cents), currency, createdAt
```
- Resource heatmap/calendar, capacity planning view, utilization reports

#### 3.4 Budget / Cost Management
**New tables** `budgetLines` + `costEntries`:
```
budgetLines: id, projectId, phaseId, category, description, budgetedAmount, actualAmount, forecastAmount, currency
costEntries: id, projectId, budgetLineId, amount, date, description, vendor, invoiceRef, createdBy
```
- Budget vs. Actual vs. Forecast variance analysis
- EVM calculations: CPI, SPI, EAC, ETC
- Budget burn-down chart

#### 3.5 Kanban Board
**Modify** `tasks` table: add `kanbanColumn`, `kanbanOrder`
- Drag-and-drop columns (mapped from status options)
- Swimlanes by task group/phase/responsible, WIP limits

#### 3.6 Calendar View
- Month/Week/Day views showing tasks (dueDate), meetings (meetingDate)
- Click date to create task/meeting, color-code by entity type

#### 3.7 RACI Matrix View
- Cross-reference matrix: rows = tasks, columns = stakeholders, cells = R/A/C/I
- Click-to-assign, filter by phase/group, export to Excel

#### 3.8 Templates
**New table** `templates`:
```
id, projectId, name, type, description, templateData (JSON), createdBy, isPublic
```
- "Save as Template" / "Create from Template" on entity dialogs

#### 3.9 Recurring Tasks
**Modify** `tasks`: add `isRecurring`, `recurrenceRule` (iCal RRULE), `recurrenceEndDate`, `parentRecurringTaskId`
- Server-side scheduler generates task instances from recurrence rules

---

### PHASE 4: SLA / Ticketing / Workflow Engine

#### 4.1 Configurable Workflow Engine
**New tables** `workflowDefinitions` + `workflowStates` + `workflowTransitions`:
```
workflowDefinitions: id, projectId, name, entityType, isActive
workflowStates: id, workflowId, name, type (initial/intermediate/terminal), color, sortOrder
workflowTransitions: id, workflowId, fromStateId, toStateId, name, requiredRoleId, requiresComment, requiresApproval
```
- Replaces hardcoded status enums; existing values preserved for backward compatibility
- Visual workflow designer (node-edge graph using existing ReactFlow)

#### 4.2 SLA/SLO Management
**New tables** `slaDefinitions` + `slaTracking`:
```
slaDefinitions: id, projectId, name, entityType, priority, responseTimeMinutes, resolutionTimeMinutes,
  escalationTimeMinutes, businessHoursOnly, businessHoursStart/End, businessDays
slaTracking: id, slaDefinitionId, entityType, entityId, responseDeadline, resolutionDeadline,
  firstResponseAt, resolvedAt, responseBreached, resolutionBreached, pausedAt, totalPausedMinutes
```
- Business hours calculation, pause/resume (waiting on customer), breach alerts via notifications

#### 4.3 Ticketing System with SLA Timers
**New table** `tickets`:
```
id, projectId, ticketId, title, description, category, priority, status,
reportedBy, assignedTo, assignedTeam, linkedIssueId, linkedTaskId,
slaTrackingId, resolvedAt, closedAt, closureNotes
```
- SLA countdown timers (red when breached), conversation thread via comments system
- Escalation buttons: create Issue or Task from ticket

#### 4.4 Generalized Approval Workflows
**New tables** `approvalRequests` + `approvalDecisions`:
```
approvalRequests: id, projectId, entityType, entityId, requestedBy, approverIds (JSON),
  approvalType (any/all/sequential), status, resolvedAt
approvalDecisions: id, approvalRequestId, approverId, decision, comment, decidedAt
```
- Works on any entity, extends the existing CR-only approval pattern

#### 4.5 Bulk Operations
- Add `bulkUpdate`, `bulkDelete`, `bulkAssign`, `bulkChangeStatus`, `bulkAddTag` to all entity routers
- Multi-select checkboxes + bulk action toolbar on all list views

---

### PHASE 5: SAP-Specific Modules

#### 5.1 SAP Activate Methodology
- Uses Phase system (3.1) with SAP-specific defaults: Discover, Prepare, Explore, Realize, Deploy, Run
- **New table** `phaseGateCriteria`: id, phaseId, criterion, status (not_started/in_progress/met/waived), evidence, evaluatedBy, sortOrder
- Phase gate review page with traffic-light status, Go/No-Go decision via approval system

#### 5.2 Fit-Gap Analysis Module
**New table** `fitGapItems`:
```
id, projectId, fitGapId, requirementId, processArea, subProcess, description,
fitStatus (Fit/Gap/Partial Fit), gapType, resolution, resolutionType,
sapModule (FI/CO/MM/SD/PP/HCM/Ariba/SF), priority, effort, estimatedDays,
assignedTo, status, linkedWricefId
```
- Summary dashboard: Fit vs. Gap vs. Partial by module (pie/bar charts)
- Links to requirements and WRICEF items

#### 5.3 WRICEF Register
**New table** `wricefItems`:
```
id, projectId, wricefId, type (Workflow/Report/Interface/Conversion/Enhancement/Form),
title, description, sapModule, functionalSpec, technicalSpec,
complexity (Simple/Medium/Complex), estimatedEffortDays, actualEffortDays,
status (Draft→Spec→Development→Test→UAT→Production),
developer, developerId, functionalOwner, functionalOwnerId,
fitGapId, requirementId, transportNumber
```
- Tabbed views by WRICEF type, status pipeline, effort tracking

#### 5.4 Data Migration Tracking
**New tables** `dataMigrationObjects` + `dataMigrationRuns`:
```
dataMigrationObjects: id, projectId, objectId, name, sourceSystem, targetModule,
  migrationMethod (LSMW/BODS/Migration Cockpit), dataVolume, complexity, owner, status
  (Planned→Mapping→Rules→Mock1→Mock2→DressRehearsal→ProductionLoad)
dataMigrationRuns: id, objectId, runNumber, runType, startedAt, completedAt,
  totalRecords, successRecords, errorRecords, errorLog, executedBy
```

#### 5.5 Cutover Planning
**New table** `cutoverTasks`:
```
id, projectId, cutoverTaskId, category, description, sequence, estimatedDurationMinutes,
actualDurationMinutes, responsible, predecessorTaskId, status,
startedAt, completedAt, isGoNoGo, goNoGoDecision, goNoGoDecidedBy
```
- Sequential timeline, Go/No-Go checkpoints, elapsed time tracking

#### 5.6 Training Management
**New tables** `trainingCourses` + `trainingEnrollments`:
```
trainingCourses: id, projectId, courseId, name, sapModule, targetAudience,
  deliveryMethod, durationHours, materialUrl, status
trainingEnrollments: id, courseId, userId, stakeholderId, scheduledDate,
  completedDate, status, score
```

#### 5.7 Organizational Change Management (OCM)
**New tables** `changeImpacts` + `readinessSurveys` + `surveyResponses`:
```
changeImpacts: id, projectId, impactId, processArea, currentState, futureState,
  impactLevel, affectedRoles (JSON), affectedHeadcount, readinessScore, mitigationPlan
readinessSurveys: id, projectId, title, questions (JSON)
surveyResponses: id, surveyId, respondentId, answers (JSON), submittedAt
```

#### 5.8 Go-Live Readiness Dashboard
- Composite page aggregating: phase gates, open critical issues, test pass rate, migration status, cutover %, training completion, open CRs, high risks, outstanding approvals
- Traffic-light dashboard with drill-down links

---

### PHASE 6: Advanced Platform Features

#### 6.1 Custom Fields Engine
**New tables** `customFieldDefinitions` + `customFieldValues`:
```
definitions: id, projectId, entityType, fieldName, fieldLabel,
  fieldType (text/number/date/select/multiselect/checkbox/url/user), options (JSON), isRequired, defaultValue
values: id, fieldDefinitionId, entityType, entityId, value (text), createdAt
```
- Dynamic form rendering in all entity creation/edit dialogs

#### 6.2 Dashboard Builder
**New table** `dashboards`: id, projectId, name, layout (JSON: widget positions/configs), createdBy, isDefault
- Widget types: pie charts, metrics, filtered tables, timelines, heatmaps

#### 6.3 Program / Portfolio Management
**New tables** `programs` + `programProjects`
- Program-level dashboard aggregating KPIs from constituent projects
- Cross-project dependency tracking

#### 6.4 Vendor / Contractor Management
**New table** `vendors`: id, projectId, name, type (SI/Subcontractor/Software/Hosting), contact info, contract details, value, performanceRating

#### 6.5 Additional Features
- **Compliance**: `complianceRequirements` table
- **Webhooks**: `outboundWebhooks` table + dispatcher middleware
- **i18n**: `react-i18next` + JSON translation files
- **Favorites**: `favorites` table (userId, entityType, entityId)

---

## Summary: Scale of Changes

| Phase | New Tables | Modified Tables | New Pages | Priority |
|-------|-----------|----------------|-----------|----------|
| **1: Foundation** | 7 | 1 (tasks) | 0 (components only) | CRITICAL |
| **2: Enterprise Auth** | 5 | 1 (projectMembers) | 2 (Activity Feed, SSO Config) | HIGH |
| **3: PMO** | 6 | 1 (tasks) | 6 (Timesheet, Calendar, Kanban, RACI, Budget, Resources) | HIGH |
| **4: SLA/Workflow** | 8 | 0 | 3 (Tickets, Workflow Designer, SLA Config) | MEDIUM |
| **5: SAP-Specific** | 11 | 0 | 8 (FitGap, WRICEF, Migration, Cutover, Training, OCM, Readiness, Phase Gates) | HIGH |
| **6: Advanced** | 6+ | 1 (users) | 4+ (Dashboard Builder, Programs, Vendors, Custom Fields) | MEDIUM |
| **TOTAL** | **~43 new tables** | 4 modified | **~23 new pages** | |

**The system grows from 42 to ~85 tables, from 29 to ~52 pages.**

---

## Critical Files to Modify

| File | Purpose |
|------|---------|
| `drizzle/schema.ts` | All new table definitions (Drizzle ORM) |
| `server/db.ts` | New CRUD functions for every new table (~200+ new functions) |
| `server/routers.ts` | Register all new tRPC sub-routers into appRouter |
| `server/routers/*.router.ts` | New router files per module |
| `server/_core/trpc.ts` | Permission middleware for RBAC |
| `client/src/App.tsx` | New page routes |
| `client/src/components/DashboardLayout.tsx` | Sidebar navigation (18 items → ~35 items, needs grouping) |

---

## Architectural Decisions

1. **Polymorphic linking** via `entityType + entityId` for comments, attachments, tags, notifications, custom fields (consistent with existing `deliverableLinks`/`issueLinks` pattern)
2. **Keep varchar idCode linking** (task.requirementId = "REQ-0001") for backward compatibility
3. **Separate router files** per module (existing pattern in `server/routers/`)
4. **No breaking changes** - all additions are nullable columns with defaults
5. **Drizzle migrations** via `pnpm db:push` (existing pattern, 24 migration files)
6. **WebSocket** via `ws` library on existing Express HTTP server (Phase 2+)

---

## Verification Plan

For each phase:
1. **Schema**: Run `pnpm db:push` - verify migration applies cleanly
2. **API**: Test all new tRPC endpoints via client console or HTTP
3. **UI**: Navigate to every new page, test CRUD operations, verify sidebar navigation
4. **Integration**: Verify cross-entity links work (comments on tasks, tags on requirements, etc.)
5. **Regression**: Existing 29 pages continue to function normally
6. **Performance**: Test with realistic data volumes (1000+ tasks, 500+ requirements)

---

## Implementation Strategy

**Approach**: Phase-by-phase with working checkpoints. Each phase is fully completed (schema + DB functions + API + UI), verified, and committed before moving to the next.

**Priority order**: Phase 1 (Foundation) first - it unblocks all subsequent phases since comments, notifications, attachments, and tags are needed by SAP modules and PMO features.

**Sidebar**: Add navigation items incrementally as pages are built (no upfront reorganization).

**Phase 1 implementation order** (within the phase):
1. Sub-tasks / Task Hierarchy (modify existing tasks table + UI)
2. Comments system (new table + reusable component)
3. Entity Attachments (new table + reusable component)
4. Tags / Labels (new tables + filter integration)
5. Task Checklists (new table + task detail UI)
6. In-App Notifications (new tables + header bell icon + service)
7. Global Search (API endpoint + Cmd+K command palette)

Each sub-feature within Phase 1 will be committed independently so we can verify before proceeding.
