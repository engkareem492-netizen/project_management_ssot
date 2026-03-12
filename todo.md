# Project Management SSOT - TODO

## Core Features

- [x] Multi-project support with password protection
- [x] Project selection/creation interface
- [x] Database schema with all tables (projects, requirements, tasks, issues, etc.)
- [x] Today Dashboard as main landing page
- [x] Excel import/export in sidebar
- [x] Requirements management with auto-generated IDs
- [x] Task management linked to requirements
- [x] Issue tracking
- [x] Stakeholder management
- [x] Deliverables tracking
- [x] Dependencies management
- [x] Assumptions tracking
- [x] Action logging for audit trail
- [x] Settings management for dropdown options
- [x] Dashboard layout with sidebar navigation
- [x] Authentication integration with Manus OAuth
- [x] Project switching functionality

## Future Enhancements (Optional)

- [ ] Add project-level permissions and roles
- [ ] Implement project archiving functionality
- [ ] Add project cloning feature
- [ ] Export project data as backup
- [ ] Project activity dashboard
- [ ] Project collaboration features
- [ ] Advanced filtering and search across projects

## Bug Fixes / Improvements

- [x] Add demo/bypass authentication mode for testing without OAuth
- [x] Fix invalid hook call in Requirements.tsx (useProject called inside callback)
- [x] Fix invalid hook call in Deliverables.tsx
- [x] Fix invalid hook call in Issues.tsx
- [x] Fix invalid hook call in Stakeholders.tsx
- [x] Fix invalid hook call in Tasks.tsx

## New Feature Requests

- [x] Update Requirement structure with new fields: Task Group, Issue Group, Source Type, External Source, Last Update
- [x] Fix projectId error in Requirement creation (expected number, received undefined)
- [x] Apply Oracle Database theme (professional dark/red theme)
- [x] Fix Settings tab for dynamic number ranges configuration
- [x] Update Requirements page UI to display all new fields in order: ID | Task Group | Issue Group | Priority | Creation Date | Type | Category | Owner | Description | Source Type | External Source | Status | Last Update
- [x] Add history tracking for Last Update field
## Testing Completed (Jan 25, 2026)

- [x] Fix project password verification (updated hash in database)
- [x] Verify ID Configuration in Settings works with dynamic number ranges
- [x] Test requirement creation with new field structure (Q-0001 created successfully)
- [x] Verify Oracle theme applied to UI

## New Feature Requests (Jan 25, 2026 - Batch 2)

### Requirements Enhancements
- [x] Task Group and Issue Group should link to Tasks & Issues tabs (dropdown selection)
- [x] Allow manual control of Creation Date in Requirements
- [x] Add option to create new Type directly from Requirements form (SelectWithCreate component)
- [x] Add option to create new Owner (Stakeholder) directly from Requirements form (SelectWithCreate component)
- [x] Add option to create new Category directly from Requirements form (SelectWithCreate component)
- [x] Add option to create new Status directly from Requirements form (SelectWithCreate component)

### Tasks Enhancements
- [x] Add Task Groups field with dropdown selection from Requirements
- [x] Add RACI People field (Responsible, Accountable, Consulted, Informed)
- [x] Add ETD/Due Date field for Today Dashboard integration
- [x] Add Assign Date field

### Issues Enhancements
- [x] Add Issue Group field with dropdown selection from Requirements

### Today Dashboard
- [x] Update to use ETD/Due Date from Tasks for scheduling

## Bug Fixes (Jan 25, 2026 - Batch 3)

- [x] Fix Task Group in Requirements - Should be dropdown linked to Tasks entity (not text input)
- [x] Fix Task Group in Tasks page - Should be dropdown populated from Tasks entity
- [x] Fix Issue Group in Requirements - Should be dropdown linked to Issues entity (not text input)
- [x] Fix Issue Group in Issues page - Should be dropdown populated from Issues entity, remove custom input option
- [x] Fix History/Updates display - Change from text format to Excel-like sheet/table format showing field changes

## Bug Fixes (Jan 25, 2026 - Batch 4)

- [x] Add "+" button to Task Group dropdown in Requirements for inline creation
- [x] Add "+" button to Issue Group dropdown in Requirements for inline creation
- [x] Enlarge History dialog to display changes properly (increase max-width from 2xl to 5xl)
- [x] Fix Task creation dialog messy layout (restructured with sections: Basic Information, RACI Assignment, Dates, Status & Priority)

## Bug Fixes (Jan 25, 2026 - Batch 5)

- [x] Fix Task Group + button to create persistent groups in database (created taskGroups table)
- [x] Fix Issue Group + button to create persistent groups in database (created issueGroups table)
- [x] Make History screen even bigger (full-width 90vw, 70vh height) to display all changes properly
- [x] Add theme toggle option (light/dark mode) in Settings > Theme tab

## Bug Fixes (Jan 25, 2026 - Batch 6)

- [x] Unify Edit and View dialogs into single full-screen dialog with editable mode
- [x] View button opens full-screen detail dialog (read-only)
- [x] Edit button opens same full-screen dialog but with all fields editable
- [x] Apply unified dialog to Requirements page
- [x] Apply unified dialog to Tasks page
- [x] Apply unified dialog to Issues page

## Bug Fixes (Jan 25, 2026 - Batch 7)

- [x] Fix controlled/uncontrolled input error in Requirements page (added missing createdAt field to reset state)

## Feature Requests (Jan 25, 2026 - Batch 8)

- [x] Remove Custom Task Group field from Task creation dialog
- [x] Add ID number range control for Task Groups in Settings (TG-XXXX format)
- [x] Add ID number range control for Issue Groups in Settings (IG-XXXX format)
- [x] Enable Task creation from Requirement detail view Tasks tab with Task Group dropdown and RACI fields
- [x] Enable Issue creation from Requirement detail view Issues tab with Issue Group dropdown

## Feature Requests (Jan 25, 2026 - Batch 9)

- [x] Add Task Groups and Issue Groups management tab in Settings
- [x] Display all existing Task Groups with their IDs and names
- [x] Display all existing Issue Groups with their IDs and names
- [x] Implement edit functionality to rename groups
- [x] Implement delete functionality to remove unused groups
- [ ] Show usage count (how many requirements/tasks/issues use each group)

## Feature Requests (Jan 25, 2026 - Batch 10)

- [x] Rename "Job" field to "Department" in Stakeholder edit/create dialog
- [x] Add "+" button to Task Group dropdown in Create Task dialog for inline group creation
- [x] Add "+" button to Issue Group dropdown in Create Issue dialog for inline group creation

## Feature Requests (Jan 25, 2026 - Batch 11)

- [x] Replace browser prompt() with custom dialog for Task Group creation in Tasks page
- [x] Replace browser prompt() with custom dialog for Issue Group creation in Issues page

## Feature Requests (Jan 26, 2026 - Batch 12)

- [x] Add "+" buttons to RACI fields (Responsible, Accountable, Consulted, Informed) in Tasks create dialog for inline stakeholder creation (already implemented with SelectWithCreate component)
- [x] Combine Current Status, Last Update, and Status Update columns into a single "Update Status" action cell in Tasks table
- [x] Implement status update dialog that captures status change and automatically records timestamp
- [x] Save status updates to action history for tracking changes over time (statusUpdate field includes timestamp)

## Bug Fixes (Jan 27, 2026)

- [x] Fix Requirements page update mutation error - missing idCode and data parameters

## Feature Requests (Jan 27, 2026 - Batch 12)

- [x] Add "Forgot Password?" link on Project Selection page that redirects to Manus OAuth password reset page

## Feature Requests (Jan 28, 2026 - Batch 13)

- [x] Add project password reset feature for when users forget their project password
- [x] Add project deletion feature to remove unwanted projects
- [x] Add backend procedure to reset project password
- [x] Add backend procedure to delete project and all associated data

## Feature Requests (Jan 29, 2026 - Batch 14)

- [x] Fix Requirements page theme to match the rest of the application (already using semantic theme classes)
- [x] Add multiple color theme options (Red, Blue, Green, Purple, Teal, Orange)
- [x] Create theme selector component for users to switch between themes
- [x] Persist theme selection in localStorage or user preferences

## Bug Fixes (Jan 29, 2026 - Batch 15)

- [x] Fix newly created Task Groups not appearing in dropdown immediately after creation in Tasks page
- [x] Fix newly created Issue Groups not appearing in dropdown immediately after creation in Issues page
- [x] Fix newly created Task Groups not appearing in dropdown immediately after creation in Requirements page

## Bug Fixes (Jan 30, 2026 - Batch 16)

- [x] Fix Tasks page mutation error - projectId is undefined when creating Task Groups

## Bug Fixes (Jan 31, 2026 - Batch 17)

- [x] Fix all remaining instances where projectId is undefined in Tasks page mutations

## Bug Fixes (Jan 31, 2026 - Batch 18)

- [x] Fix Issues page mutation error - projectId is undefined when creating issues

## Bug Fixes (Mar 3, 2026 - Batch 19)

- [x] Fix Task Group not persisting when editing a task - deliverableId was being sent as string instead of number, causing Zod validation error that silently failed the entire update
- [x] Simplify Status Updates section in Task edit dialog - removed separate Last Update and Status Update fields, now shows Current Status (read-only from history) and New Update (editable textarea) in the same edit form
- [x] Expand changedFields tracking in tasks.update router to include all important fields (taskGroup, status, priority, description, requirementId, deliverableId, issueId, RACI fields, dates)
- [x] Install missing bcrypt package that was causing server startup errors

## Feature Requests (Mar 3, 2026 - Batch 20)

- [x] Make project password optional — allow creating projects without a password
- [x] Show lock/unlock icon in project list based on whether project has a password
- [x] Open password-less projects directly without password entry screen
- [x] Allow project creator to add/remove/change password from project settings (in-app)
- [x] Update backend: make password field nullable in DB schema and router
- [x] Update backend: add setPassword procedure to enable/disable password protection
- [x] Update frontend: add "Enable Password" toggle in Create Project form
- [x] Update frontend: skip password screen for projects without a password
- [x] Update frontend: add "Manage Password" option in project settings for creator

## Bug Fixes (Mar 4, 2026 - Batch 21)

- [x] Fix Excel import not working (label had pointer-events-none on inner button; fixed to use label directly; also fixed deleteAll functions to scope by projectId)

## Bug Fixes (Mar 4, 2026 - Batch 22)

- [x] Fix duplicate React key error on /weekly-report page (empty/non-unique keys in list rendering)

## Bug Fixes (Mar 4, 2026 - Batch 23)

- [x] Fix Tasks Today status dropdown showing only "Open" instead of full status list (seeded 10 standard statuses into statusOptions DB table)
- [x] Fix Tasks Today: treat "Closed" status as completed (not overdue) — expanded DONE_STATUSES to include Closed, Solved, Done, Cancelled, Approved, Passed in both frontend and server-side weekly report logic

## Feature: Status "Is Complete" Flag (Mar 4, 2026 - Batch 24)

- [x] Add isComplete boolean field to statusOptions DB schema
- [x] Seed Completed, Closed, Solved, Done, Approved, Passed as isComplete=true
- [x] Update Status Options settings UI to show isComplete toggle per status
- [x] Update Add/Edit status dialogs to include isComplete toggle
- [x] Update overdue logic (Today.tsx + traceability.router.ts) to use isComplete from DB

## Feature: Multi-Select & Bulk Actions (Mar 4, 2026 - Batch 25)

- [x] Add bulkDelete procedure to tasks, requirements, issues routers
- [x] Add bulkUpdateStatus procedure to tasks, requirements, issues routers
- [x] Add multi-select checkboxes + bulk toolbar to Tasks page
- [x] Add multi-select checkboxes + bulk toolbar to Requirements page
- [x] Add multi-select checkboxes + bulk toolbar to Issues page

## Feature: Traceability Matrix Add/Assign Actions (Mar 4, 2026 - Batch 26)

- [x] Add Test Cases table to DB schema (testCases: id, testCaseId, projectId, requirementId, description, status, priority, assignedTo, createdAt)
- [x] Add test cases router with list, create, update, delete, linkToRequirement procedures
- [x] Add linkToRequirement procedures to tasks and issues routers
- [x] Update Traceability Matrix: add action buttons per requirement row to add/assign Task, Issue, Test Case
- [x] Add "Create New Task" quick-form dialog in Traceability Matrix
- [x] Add "Assign Existing Task" dialog (select from project tasks) in Traceability Matrix
- [x] Add "Create New Issue" quick-form dialog in Traceability Matrix
- [x] Add "Assign Existing Issue" dialog (select from project issues) in Traceability Matrix
- [x] Add "Create New Test Case" quick-form dialog in Traceability Matrix
- [x] Add "Assign Existing Test Case" dialog in Traceability Matrix

## Bug Fixes (Mar 4, 2026 - Batch 27)

- [x] Fix duplicate React key error on /traceability page (empty/non-unique keys in list rendering)

## Bug Fixes (Mar 4, 2026 - Batch 28)

- [x] Fix empty SelectItem value error on /test-cases page (Select.Item must not have empty string value)

## Bug Fixes (Mar 4, 2026 - Batch 29)

- [x] Fix empty SelectItem value error on /issues, /tasks, and /requirements pages (filter out items with empty name/value/idCode before rendering SelectItem)

## Feature: Full Create Forms in Traceability Matrix (Mar 5, 2026)

- [x] Expand New Task form in Traceability Matrix to match standalone Tasks create form (all fields)
- [x] Expand New Issue form in Traceability Matrix to match standalone Issues create form (all fields)
- [x] Expand New Test Case form in Traceability Matrix to match standalone Test Cases create form (all fields)

## Feature: Link Issue/Risk Owner to Stakeholders (Mar 7, 2026)

- [x] Add ownerId (FK to stakeholders) column to issues table in DB schema (already existed)
- [x] Update issues router: create and update procedures to accept ownerId, list to return ownerName via JOIN
- [x] Update Issues.tsx: replace owner free-text input with stakeholder dropdown (ownerId) in edit form
- [x] Update TraceabilityMatrix.tsx: replace owner free-text input with stakeholder dropdown (ownerId)
- [x] Display owner name (from stakeholder) in Issues table and detail view
- [x] Fix updateIssue db helper to resolve ownerId to owner name on update (was missing, now fixed)

## Feature: Inline Task Group creation in Risk create/edit forms (Mar 7, 2026)

- [x] Add "+" button next to Contingency Plan (Task Group) dropdown in Risk create form
- [x] Add "+" button next to Contingency Plan (Task Group) dropdown in Risk edit form
- [x] Wire button to open quick-create Task Group dialog (name input + save)
- [x] On save, refresh task groups list and auto-select the newly created group
- [x] Also added Contingency Plan + Response Strategy fields to edit dialog (were missing)

## Feature: Inline Stakeholder creation in Risk Owner field (Mar 7, 2026)

- [x] Add "+" button next to Risk Owner dropdown in Risk create form
- [x] Add "+" button next to Risk Owner dropdown in Risk edit form
- [x] Wire button to open quick-create Stakeholder dialog (Full Name, Email, Phone, Position, Role, Job Title)
- [x] On save, refresh stakeholders list and auto-select the new stakeholder as Risk Owner
- [x] Also added missing Risk Owner + Identified On fields to the Edit Risk dialog

## Feature: Rebuild Assumptions Module (Mar 7, 2026)

- [x] Auto-generated Assumption ID (e.g. ASM-001)
- [x] Status dropdown with inline "+" create
- [x] Category dropdown with inline "+" create
- [x] Impact Level dropdown with inline "+" create
- [x] Owner linked to Stakeholders with inline "+" create
- [x] Link to Requirement (FK)
- [x] Link to Task (FK)
- [x] Change history log (who changed what and when)
- [x] History panel in detail/edit view
- [x] Edit dialog with all fields pre-populated
- [x] DB migration: assumptionCategories, assumptionStatuses, assumptionImpactLevels, assumptionHistory tables

## Feature: Bulk Excel Import/Export for All 9 Modules (Mar 7, 2026)

- [x] Install xlsx (SheetJS) on server for Excel generation/parsing
- [x] Server: template download endpoint (returns pre-formatted xlsx with correct headers)
- [x] Server: bulk import endpoint with mode=append|replace for each module
- [x] Modules covered: Requirements, Tasks, Issues, Dependencies, Assumptions, Stakeholders, Deliverables, Knowledge Base, Risk Register
- [x] Client: reusable ImportExportToolbar component (Download Template + Upload button + Append/Replace toggle)
- [x] Wire toolbar into Requirements page
- [x] Wire toolbar into Tasks page
- [x] Wire toolbar into Issues page
- [x] Wire toolbar into Dependencies page
- [x] Wire toolbar into Assumptions page
- [x] Wire toolbar into Stakeholders page
- [x] Wire toolbar into Deliverables page
- [x] Wire toolbar into Knowledge Base page
- [x] Wire toolbar into Risk Register page

## Bug Fixes (Mar 8, 2026 - Batch 30)

- [x] Tasks template/export: add Requirement Code and Task Group columns to tasks sheet
- [x] Tasks template/export: include a second "Task Groups" sheet in the same workbook for upload/export
- [x] Stakeholders template: fix Department column name (was exported as "job", now "department")
- [x] Tasks page: make Tasks-by-Responsible chart bars clickable to filter the task list to that person
- [x] Tasks page: added filter badge below search bar showing active responsible filter with clear button

## Bug Fix: Bulk Import Append ID Sequencing

- [x] Fix bulk import append mode: IDs must continue from the last existing ID in the DB, not restart from 001 per row
- [x] Fix chart bar click: clicking a bar in Tasks-by-Responsible chart must filter the main task list (moved onClick from BarChart to Bar component)

## Bug Fix: Replace Mode ID Reset

- [x] Fix bulk import replace mode: after purging data, reset the ID sequence counter to 0 so first imported row gets ID 001

## Bug Fix: Risk Replace Mode ID Reset (duplicate sequence rows)

- [x] Fix: risks have two idSequences rows ('RISK' and 'risk') — purgeModule now uses LOWER(entityType) = LOWER(target) to reset all case variants in one SQL statement

## Bug Fix: Tasks Due Date / Assigned Date Format

- [x] Fix garbled date display in Tasks table — root cause was toLocaleDateString() with ISO strings; now uses regex parse to DD/MM/YYYY without timezone shift

## Feature: Recurring Tasks, Sub-Tasks, Follow-up Tasks + Short-Term Improvements (Mar 8, 2026)

### Task Enhancements
- [ ] DB schema: add parentTaskId (sub-tasks), followUpOfId (follow-up), recurringType, recurringInterval, recurringEndDate, seriesId to tasks table
- [ ] Server: createSubTask, createFollowUpTask procedures
- [ ] Server: recurring task auto-generation (create next occurrence on completion)
- [ ] Server: badge counts query (overdue tasks, open issues, high-severity risks)
- [ ] Tasks UI: sub-task indentation with progress bar on parent task row
- [ ] Tasks UI: "Add Sub-task" button on each task row / detail panel
- [ ] Tasks UI: "Create Follow-up" button on completed/closed tasks
- [ ] Tasks UI: Recurring config panel (frequency, interval, end date) in create/edit form
- [ ] Tasks UI: recurring badge on task rows (e.g. "↻ Weekly")

### Short-Term Improvements
- [x] Global date fix: apply formatDate helper to Issues, Risks, Assumptions, Deliverables, Meetings pages
- [x] Import validation summary: show dialog after upload with imported/skipped counts and per-row errors (already implemented in ImportExportToolbar)
- [x] Empty states: add meaningful empty-state UI to all 9 module list pages (EmptyState component)
- [x] Global search: search bar in sidebar header that searches across all modules (Ctrl+K shortcut)
- [x] Sidebar badges: overdue task count, open issue count, high-severity risk count on sidebar items
- [x] Sidebar drag-to-reorder: users can drag sidebar items to customize order (persisted in localStorage)

## Feature: Stakeholder Management Overhaul (Mar 8, 2026)

### DB Schema
- [x] Add isInternalTeam (boolean), powerLevel (int 1-5), interestLevel (int 1-5), engagementStrategy (varchar), communicationFrequency (varchar), communicationChannel (varchar), communicationMessage (text), communicationResponsible (varchar) to stakeholders table
- [x] Create stakeholderTaskGroups table (stakeholderId, taskGroupId) for Internal Team dev plan links
- [x] Create stakeholderKpis table (id, stakeholderId, projectId, name, target, unit, weight, description)
- [x] Create stakeholderAssessments table (id, stakeholderId, projectId, assessmentDate, notes, overallScore)
- [x] Create stakeholderKpiScores table (id, assessmentId, kpiId, score, notes)

### Backend
- [x] Update stakeholders create/update router to accept new fields
- [x] Add stakeholderKpis router (list, create, update, delete)
- [x] Add stakeholderAssessments router (list, create with scores, getDetail)
- [x] Add stakeholderTaskGroups router (link/unlink task groups)

### Frontend - Stakeholders Page
- [x] Add "Internal Team" toggle in create/edit stakeholder form
- [x] Add Power/Interest sliders in create/edit form
- [x] Add Engagement Strategy dropdown in create/edit form
- [x] Add Communication Plan fields in create/edit form
- [x] Add "Internal Team" tab in Stakeholders page showing team members with their linked Task Groups
- [x] Add "Development Plan" sub-view: for each Internal Team member, show their Task Groups and associated tasks
- [x] Add KPI management tab per stakeholder (add/edit/delete KPIs)
- [x] Add Assessment dialog: score each KPI, add notes, calculate weighted score
- [x] Add Assessment history view per stakeholder

### Frontend - Relationships Page (repurposed)
- [x] Replace Relationships page with Stakeholder Engagement Map
- [x] Power/Interest 2x2 grid showing all stakeholders positioned by their scores
- [x] Color-coded quadrants: Manage Closely (red), Keep Satisfied (orange), Keep Informed (blue), Monitor (gray)
- [x] Communication Plan table below the grid
- [x] Update sidebar label from "Relationships" to "Engagement Map"

## Feature: Tasks Compact View + No Horizontal Scroll (Mar 8, 2026)

- [x] Add compact/normal view toggle button in Tasks page toolbar (persisted in localStorage)
- [x] Normal view: current layout but columns fit within viewport width (no horizontal scroll)
- [x] Compact view: smaller row height, fewer visible columns (ID, Task Group, Description, Responsible, Status, Due Date, Actions), dense typography
- [x] Fix main Tasks table to never require horizontal scroll — use flexible column widths that fill available space
- [x] Collapse less-critical columns (RACI details, Requirement, Deliverable) into a popover/tooltip in compact mode

## Merge: Claude Branch Features (Mar 9, 2026)

- [x] Executive KPI Dashboard page with health score, 6 KPI cards, bar/pie charts
- [x] Decisions CRUD page with action items checklist and status tracking
- [x] Calendar view with color-coded events (tasks, issues, deliverables, risks)
- [x] Budget & Cost Tracking page with total budget, entries, and spending summary
- [x] Resource Management page with workload view and capacity settings
- [x] NotificationBell component wired into mobile header
- [x] DB tables: decisions, notifications, projectBudget, budgetEntries, resourceCapacity
- [x] tRPC routers: decisions, notifications, budget, resources
- [x] New sidebar items: Dashboard, Decisions, Calendar, Budget, Resources

## Merge: Claude Branch Phase 3 & 4 (Mar 9, 2026)

- [x] Sidebar: combined Stakeholders + Resources into collapsible "Team" tree group
- [x] Action Log: full rewrite with entity type filter, date range, search, expandable field diffs, pagination
- [x] Deliverables: added Timeline tab with milestone view, progress bar, color-coded nodes
- [x] Risk Register: added Heat Map tab (5×5 probability/impact matrix)
- [x] Resources: Team Overview enhancements

## Fix: Tasks Full-Width Layout (Mar 9, 2026)

- [x] Match Requirements page layout: full viewport width table, no card-style rows, all columns fit on screen
- [x] Keep compact view toggle (original + compact)
- [x] Original view: all columns visible without any horizontal scroll
- [x] Compact view: dense single-line rows, fewer columns

## Fix: Stakeholder Name Display (Mar 9, 2026)
- [x] Find all pages showing "Stakeholder XXXXXX" codes instead of actual names
- [x] Fix stakeholder display to show fullName (with role/position as subtitle) — fixed in SelectWithCreate trigger and db.ts update helpers
- [x] Ensure fallback to code if stakeholder record not found

## Fix: Completed Task Visual Style + Resources Workload Name (Mar 9, 2026)

- [x] Tasks page: completed tasks (status with isComplete=true) must be visually distinct — dimmed row opacity, strikethrough on description, muted badge color
- [x] Resources Workload tab: show stakeholder fullName instead of raw ID code ("Stakeholder 390027")

## Feature: Communication Responsible as Stakeholder + Auto Recurring Task (Mar 9, 2026)

- [ ] DB schema: add communicationResponsibleId (FK to stakeholders) to stakeholders table
- [ ] Update stakeholders create/update router to accept communicationResponsibleId and auto-create recurring task
- [ ] Stakeholders form: replace communicationResponsible free-text with stakeholder dropdown (communicationResponsibleId)
- [ ] Auto-create recurring task: title = "Communicate with [Stakeholder Name]", assigned to responsible, recurrence = communication frequency, linked to project
- [ ] Map frequency values (Daily/Weekly/Bi-weekly/Monthly/Quarterly) to recurringType/recurringInterval on the task
- [ ] Avoid duplicate task creation: if a recurring task already exists for this stakeholder+responsible combo, skip creation

## Feature: Communication Responsible as Stakeholder (Mar 9, 2026)

- [x] Change Communication Responsible field from free-text Input to a Stakeholder Select dropdown
- [x] Add communicationResponsibleId (FK to stakeholders) to stakeholders schema
- [x] Run db:push to add communicationResponsibleId column
- [x] Update stakeholders create router to accept communicationResponsibleId and resolve to name
- [x] Update stakeholders update router to accept communicationResponsibleId and resolve to name
- [x] Auto-create a recurring task when communication frequency + responsible are set on create
- [x] Auto-create a recurring task when communication frequency + responsible are updated (edit)
- [x] Task description: "Communicate with [Stakeholder Name] ([Frequency] via [Channel])"
- [x] Task responsible = communicationResponsibleId, recurringType mapped from frequency
- [x] Frequency mapping: Daily→daily/1, Weekly→weekly/1, Bi-weekly→weekly/2, Monthly→monthly/1, Quarterly→monthly/3

## Bug Fix: Duplicate Communication Tasks & ID Reuse (Mar 9, 2026)

- [x] Fix: duplicate communication tasks created on every stakeholder save (create + update both fire)
- [x] Fix: add deduplication check — skip task creation if a communication task already exists for this stakeholder (uses communicationStakeholderId FK)
- [x] Fix: task ID generator reuses IDs from closed/completed tasks — getNextId now always syncs with actual max before incrementing

## Merge: Claude Branch Phase 3&4 Part 2 (Mar 10, 2026)

- [x] MS Project-style Gantt Chart rewrite (GanttChart.tsx overhaul)
- [x] New Periodic Report page (PeriodicReport.tsx)
- [x] Decisions merged into Meetings page (separate Decisions sidebar item removed)
- [x] Tasks: link tasks to decisions, RACI contact cards on hover
- [x] Nav updates in App.tsx and DashboardLayout.tsx
- [x] Fix: Tasks.tsx decisionDate Date→string type error after merge

## Pillar 1 — Universal Graphical Interaction (Mar 2026)
- [x] Kanban Board view for Tasks (drag cards between status columns)
- [x] Kanban Board view for Issues
- [x] Kanban Board view for Risks
- [x] Stakeholder drag-and-drop engagement matrix (pool → quadrant) — upgraded with richer cards, power/interest bars, unassigned pool
- [x] Gantt resize handles (left/right edge drag to change start/end dates)
- [x] Gantt dependency arrow drawing (already existed)
- [x] Gantt baseline overlay (toggle button + ghost bars)
- [x] Calendar view for Tasks (month/week, priority color coding, click to open detail)

## Pillar 2 — Deep Customization Engine (Mar 2026)
- [x] Custom fields engine (DB schema: customFieldDefs + customFieldValues, backend router, Settings UI page)
- [x] Custom workflow statuses per entity type (already fully implemented in Settings)
- [x] Saved views and filters per module (SavedViews component + quick-filter chips: Overdue, High Priority, Open, My Tasks)
## Action Items → Tasks Merge (Mar 11, 2026)
- [x] DB migration: added isActionItem, actionSourceType, actionSourceId, actionNotes fields to tasks table
- [x] Applied DB migration via SQL (columns added to remote DB)
- [x] Backend router: tasks.create and tasks.update already handle action item fields
- [x] Tasks.tsx: added "Action Items" quick-filter chip
- [x] Tasks.tsx: added action item badge (⚡ AI) in normal view task rows
- [x] Tasks.tsx: added action item badge in compact view task rows
- [x] Tasks.tsx: added "Action Item" section in create task dialog with source type/id/notes
- [x] Tasks.tsx: added action item info panel in task detail view
- [x] DashboardLayout.tsx: removed standalone "Action Items" sidebar entry
- [x] App.tsx: /action-items route now redirects to /tasks

## Custom Fields Renderer in Entity Dialogs (Mar 11, 2026)
- [x] Created reusable CustomFieldsSection component
- [x] Tasks.tsx: added CustomFieldsSection to task detail/edit view
- [x] Issues.tsx: added CustomFieldsSection to issue detail/edit view
- [x] Requirements.tsx: added CustomFieldsSection to requirement detail/edit view
- [x] RiskRegister.tsx: added CustomFieldsSection to risk edit dialog
- [x] Stakeholders.tsx: added CustomFieldsSection to stakeholder edit dialog

## Gantt & Stakeholder Matrix Enhancements (Mar 11, 2026)
- [x] Gantt: rectangular bars with prominent resize grips
- [x] Gantt: drag-to-move bars (shifts dates, persisted on drop)
- [x] Gantt: resize start/end by dragging left/right grip
- [x] Gantt: orthogonal MS-Project style dependency arrows
- [x] Gantt: purple connection handles on hover to drag-create dependencies
- [x] Gantt: critical path deps shown in red arrows
- [x] Stakeholders: redesigned 2x2 Power/Interest matrix with axis labels
- [x] Stakeholders: improved card design with avatar, power/interest bars, P/I badge
- [x] Stakeholders: drag-and-drop cards update engagementStrategy in DB immediately

## Engagement Map Differentiation (Mar 11, 2026)
- [x] Replace Power/Interest Grid tab in Relationships.tsx with a true SVG scatter-plot bubble chart (X=Interest 1-5, Y=Power 1-5, bubble size=influence, color=strategy)
- [x] Add quadrant background shading and axis labels on the scatter plot
- [x] Add tooltip on hover showing stakeholder details
- [x] Keep Communication Plan tab (already distinct from Stakeholders page)
- [x] Keep Engagement Summary analytics tab
- [x] Move Engagement Map into Team sidebar group (under Stakeholders)
- [x] Add Engagement Matrix (drag-and-drop board) as first tab in Engagement Map page

## Bug Fixes (Mar 11, 2026 - Batch 22)
- [x] Fix Engagement Matrix: strategy changes now use optimistic updates + full invalidate so Bubble Map and Stakeholder Register reflect updates immediately
- [x] Gantt Chart: clicking a task bar opens a full edit dialog (description, dates, status, priority, group, notes, % complete, dependencies)

## Bubble Map Interactive Drag (Mar 11, 2026)
- [x] Make SVG bubbles draggable on the scatter plot
- [x] On drag, show live coordinate tooltip with new Power/Interest values
- [x] On drop, save new powerLevel and interestLevel to DB via stakeholders.update
- [x] Auto-derive engagementStrategy from quadrant (High P + High I = Manage Closely, etc.)
- [x] Update Engagement Matrix board to reflect new strategy after bubble drop

## Engagement Matrix ↔ Bubble Map Sync Fix (Mar 11, 2026)
- [x] When dropping a card into a quadrant in the Engagement Matrix, also update powerLevel and interestLevel to match the quadrant's range
- [x] Manage Closely → P=5, I=5 | Keep Satisfied → P=5, I=2 | Keep Informed → P=2, I=5 | Monitor → P=2, I=2
- [x] Unassigned drop → only clear strategy, leave scores unchanged

## Dashboard Enhancement & RAID Sidebar Group (Mar 11, 2026)
- [x] Group Requirements, Issues, Assumptions, Dependencies, RAID Log under RAID tree in sidebar
- [x] Enhance dashboard: project health ring, RAID summary panel (tabbed: risks/issues/assumptions/dependencies), deliverables status, stakeholder count
- [x] Add tasks by status donut chart
- [x] Add 5x5 risk matrix heatmap widget
- [x] Add upcoming milestones summary widget
- [x] Improve activity feed with entity icons and timestamps
- [x] Add Tasks by Person bar chart and Completion by Dimension radar chart
- [x] Add Budget utilization bar and Due This Week widget

## Bug Fix: Dashboard Text Visibility (Mar 11, 2026)
- [x] Fix "Project Dashboard" header text invisible in dark mode (RAG banner bg-green-50 had no dark variant)
- [x] Add dark:bg-green/amber/red-950/30 variants to RAG_BG color map for proper dark mode contrast
- [x] Add explicit text-foreground class to dashboard h1 heading

## Bug Fixes (Mar 11, 2026 - Batch 23)
- [x] Fix date formatting bug on Today/Dashboard page — "Due Today" subtitle shows "112026/3/" instead of "11/03/2026"
- [x] Fix Relationship Map — nodes render off-screen (only one node visible far right); need to fit all nodes within viewport on load

## Bug Fix: All Dropdowns Must Use Editable Settings (Mar 11, 2026)
- [x] Audit all hardcoded dropdown arrays across all pages (requirement types, task statuses, priorities, risk levels, etc.)
- [x] Fix Requirements page: type dropdown reads from settings DB (already did)
- [x] Fix cascade: updateTypeOption, updateCategoryOption, updateStatusOption, updatePriorityOption now update both value+label columns and cascade rename to requirements, tasks, issues, deliverables
- [x] Ensure Settings page edits take effect immediately everywhere (cascade confirmed working)

## Phase 1 Implementation: Charter, PM Plan, WBS (Mar 12, 2026)

### Schema
- [x] Add projectCharters table (title, purpose, objectives, scope, sponsor, budget, contractType, startDate, endDate, ragStatus) — already existed
- [x] Add pmPlanSections table (projectId, sectionKey, content, lastUpdatedBy)
- [x] Add wbsElements table (projectId, code, title, description, parentId, level, deliverableId, responsible, cost, status)

### Server
- [x] Add charter router (get, create, update) — already existed
- [x] Add pmPlan router (getAll, upsertSection)
- [x] Add wbs router (list, create, update, delete with cascade)

### UI
- [x] Project Charter page with full form — already existed
- [x] Integrated PM Plan page with 9 tabbed sections (Scope, Schedule, Cost, Quality, Resource, Comms, Risk, Procurement, Stakeholder) with per-section completion tracking
- [x] WBS Builder page with tree table (expand/collapse, add child, edit, delete, cost summary, WBS code auto-generation)
- [x] Wire all three pages in sidebar under new "Planning" group
- [x] Add vitest tests for PM Plan section keys and WBS tree/code logic (6/6 passing)

## Sidebar Restructure & EEF Page (Mar 12, 2026)
- [x] Fix DB migration: force-create wbsElements and pmPlanSections tables in remote DB (used webdev_execute_sql directly)
- [x] Move Scope Items into Planning sidebar group (Charter, PM Plan, WBS, Scope Items)
- [x] Create OPA sidebar group: Document Library, Knowledge Base, Lessons Learned
- [x] Add EEF (Enterprise Environmental Factors) as new section under OPA group
- [x] Build EEF page: list Internal and External factors with category, description, impact level, source, PMBOK context card, summary stats
- [x] Add eefFactors table to schema and push migration (also created directly in remote DB)
- [x] Add EEF router (list, create, update, delete)
- [x] Register /eef route in App.tsx

## Multi-Currency Budget Configuration (Mar 12, 2026)
- [x] Add projectCurrencies table (projectId, currencyCode, currencyName, symbol, isBase, sortOrder)
- [x] Add exchangeRates table (projectId, fromCurrency, toCurrency, baselineRate, currentRate, predictedRate, effectiveDate, notes)
- [x] Create remote DB tables directly (webdev_execute_sql)
- [x] Build currencies router (list, setBase, addCurrency, removeCurrency, upsertExchangeRate, deleteRate)
- [x] Build Currency Settings page with: base currency selector, additional currencies list, exchange rate table (Baseline / Current / Predicted columns with variance indicators)
- [x] Add Budget group to sidebar (Budget Overview + Currency Settings)
- [x] Register /currency-settings route in App.tsx
- [x] Redesign EEF page to match app visual style (consistent with Risks/Issues/Tasks pages)
- [x] Kill stale tsc watcher process (PID 1787, running since Mar 2) — tsc now compiles with 0 errors

## Bug Fix: Currencies Router (Mar 12, 2026)
- [x] Fix currencies router — getDb() is async, all 7 procedures were missing `await` before getDb() call; fixed to `await getDb()`

## Bug Fix: Budget Page Currency Symbol (Mar 12, 2026)
- [x] Budget page shows hardcoded "USD" / "$" — replaced with dynamic base currency from projectCurrencies table (auto-syncs on load via useEffect)

## Phase 2: EVM Dashboard (Mar 12, 2026)

- [x] Create EVM database schema: evmBaseline, evmSnapshots, evmWbsEntries tables
- [x] Push EVM schema migration to database
- [x] Build EVM tRPC router with full KPI calculation logic (SV, CV, SPI, CPI, EAC, ETC, VAC, TCPI)
- [x] Implement getDashboard procedure returning all KPIs + trend series + WBS breakdown
- [x] Implement upsertBaseline procedure for BAC and project dates
- [x] Implement CRUD for period snapshots (createSnapshot, updateSnapshot, deleteSnapshot, listSnapshots)
- [x] Implement syncFromWbs procedure to pull cost data from WBS elements
- [x] Build EVM Dashboard UI page (client/src/pages/EVM.tsx)
- [x] KPI cards: BAC, % Complete, EAC, VAC, SPI, CPI, ETC, TCPI with color-coded status
- [x] PV / EV / AC current period summary cards
- [x] S-Curve chart (Recharts LineChart with PV/EV/AC lines and BAC reference line)
- [x] WBS Breakdown table with per-element KPIs and progress bars
- [x] Period Snapshots table with inline edit/delete and KPI preview
- [x] EVM Formula Reference table (PMBOK 7 compliant)
- [x] Set Baseline dialog with BAC, start/end dates, notes
- [x] Add/Edit Snapshot dialog with live KPI preview
- [x] Sync from WBS button to auto-populate EVM entries from WBS cost data
- [x] Register /evm route in App.tsx
- [x] Add "EVM Dashboard" to Budget sidebar group in DashboardLayout
- [x] Write 32 Vitest unit tests for EVM KPI calculation logic (all passing)
