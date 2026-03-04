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
