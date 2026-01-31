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


## Feature Requests (Jan 31, 2026 - Batch 19 - V5.0)

### Requirements Auto-Creation from Tasks
- [x] When creating a Task, automatically create a linked Requirement
- [x] Requirement should be created with Task description and inherit Task Group
- [x] Requirement should be linked to the Task that created it

### Deliverable-Task Linking
- [x] Add deliverableId field to tasks table
- [ ] Add dropdown in Task edit dialog to select/link a Deliverable (UI enhancement)
- [ ] Display linked Deliverable in Task view (UI enhancement)

### Task Status Management
- [ ] Enable Status update directly in Task edit dialog
- [ ] Status should be editable alongside other Task fields
- [ ] Save status changes to action history

### Simplify Status Display
- [ ] Remove "Last Update" and "Status Update" columns from Tasks table
- [ ] Keep only "Current Status" column (read-only)
- [ ] Display Last Update text from the last history entry in the detail view
- [ ] Show history of all status changes in the detail dialog

### Task Dashboard with Responsible Segregation
- [x] Create new Task Dashboard page showing task distribution by Responsible
- [x] Display count of tasks per Responsible person
- [x] Show breakdown by Status (Open, In Progress, Completed, etc.)
- [x] Add charts/visualizations for task distribution (bar chart and pie chart)
- [ ] Link to filter tasks by Responsible person (future enhancement)


## Critical Bug Fix (Jan 31, 2026 - Batch 20)

### Router projectId Parameter Issue
- [ ] Fix all tRPC routers to pass projectId from context to database functions
- [ ] Update stakeholders.list router to pass projectId
- [ ] Update requirements.list router to pass projectId
- [ ] Update tasks.list router to pass projectId
- [ ] Update idSequences queries to use projectId from context
- [ ] Test all routers with projectId filtering


## Critical Database Schema Fix (Jan 31, 2026 - Batch 21)

### Add projectId Column to All Tables
- [x] Add projectId column to requirements table
- [x] Add projectId column to tasks table
- [x] Add projectId column to issues table
- [x] Add projectId column to dependencies table
- [x] Add projectId column to deliverables table
- [x] Add projectId column to stakeholders table
- [x] Test all queries after adding projectId columns


## idSequences Initialization Fix (Jan 31, 2026 - Batch 22)

### Initialize idSequences for All Entity Types
- [x] Add missing columns (minNumber, maxNumber, padLength) to idSequences table
- [x] Insert idSequences records for Task Group entity type
- [x] Insert idSequences records for Issue Group entity type
- [x] Insert idSequences records for all other entity types (Requirement, Task, Issue, Dependency, Deliverable)
- [x] Test Task Group creation after initialization

### Create Missing Tables
- [x] Create taskGroups table with proper schema (id, projectId, idCode, name, description, timestamps)
- [x] Create issueGroups table with proper schema (id, projectId, idCode, name, description, timestamps)

### Fix Unique Constraint Issue
- [x] Drop old unique constraint on entityType only
- [x] Add composite unique constraint on (entityType, projectId)
- [x] Insert idSequences records for project 1 (Finance Project)


### Fix Tasks Page Query
- [x] Updated Tasks.tsx to pass projectId parameter to tasks.list query
- [x] Fixed duplicate currentProjectId declaration error
- [x] Tasks page now properly filters by current project


## Bug Fix (Jan 31, 2026 - Batch 23)

### Task Creation Error - Stakeholder Names vs IDs
- [x] Fix Tasks.tsx create mutation to send stakeholder IDs instead of names
- [x] Update SelectWithCreate component to return stakeholder IDs
- [x] Update newTask state to use ID fields (responsibleId, accountableId, etc.)
- [x] Remove name-to-ID conversion logic from handleCreate
- [ ] Test task creation with RACI fields (Responsible, Accountable, Informed, Consulted)

### Add Requirement Creation from Task Dialog
- [x] Add + button beside Requirement dropdown in task creation dialog
- [x] Create inline requirement creation dialog with description, type, category fields
- [x] Add createRequirementMutation to handle requirement creation
- [x] Refresh requirement list after creation
- [x] Auto-select newly created requirement


## Enhancement (Jan 31, 2026 - Batch 24)

### Enhance Requirement Creation Dialog
- [x] Check Requirements page for all required fields
- [x] Add all requirement fields to creation dialog (Task Group, Issue Group, Priority, Type, Category, Owner, Source Type, Ref Source, Status, Creation Date)
- [x] Use SelectWithCreate for dropdown fields
- [x] Update mutation to pass all fields
- [ ] Test requirement creation with all fields

### Add Deliverable Linking to Tasks
- [x] Add Deliverable dropdown to task creation dialog
- [x] Add + button beside Deliverable dropdown
- [x] Create deliverable creation dialog with description, status, due date
- [x] Add deliverables query to Tasks page
- [x] Create deliverable mutation with auto-select
- [ ] Test deliverable creation and linking


## Bug Fix (Jan 31, 2026 - Database Schema Mismatch)

### Tasks Table Schema Error
- [x] Check if tasks table has stakeholder name columns (responsible, accountable, informed, consulted, owner) - CONFIRMED: columns exist
- [x] Verify database schema matches Drizzle schema definition - MATCH CONFIRMED
- [x] Fix createTask function to populate stakeholder names from IDs before insertion
- [x] Restart server to apply fix
- [ ] Test task creation with RACI assignments
- [ ] Test task listing after fix


## Bug Fix (Jan 31, 2026 - Persistent Task Creation Error)

### Task Insertion Still Failing
- [x] Check actual database column names and types for tasks table - FOUND: missing columns
- [x] Compare database structure with Drizzle schema definition - MISMATCH FOUND
- [x] Add missing assignDate column to tasks table
- [x] Add missing updateDate column to tasks table
- [x] Verify SELECT query works after adding columns
- [ ] Test task creation after fix


## Bug Fix (Jan 31, 2026 - Type Mismatch and Requirements Table)

### DeliverableId Type Mismatch
- [x] Fix Tasks.tsx to convert deliverableId from string to number using parseInt
- [x] Fix createDeliverableMutation to use data.id instead of data.deliverableId
- [ ] Test task creation with deliverable selection

### Requirements Table Missing Columns
- [x] Check requirements table for missing columns - CONFIRMED: all columns exist
- [x] Apply same undefined value filtering fix to createRequirement function
- [ ] Test requirement creation from task dialog


## Feature Enhancement (Jan 31, 2026 - Simplify Status Tracking)

### Make Current Status Read-Only and Auto-Populated
- [x] Remove "Last Update" and "Status Update" fields from task detail view
- [x] Make "Current Status" field read-only in task view
- [x] Remove currentStatus, lastUpdate, statusUpdate from editFormData
- [x] Update getAllTasksSorted to fetch latest action log for each task
- [x] Auto-populate currentStatus from action log's changedFields.currentStatus.newValue
- [x] Fallback to task.currentStatus or 'No updates' if no action log exists
- [ ] Test status display after creating and updating tasks


## Feature Enhancement (Jan 31, 2026 - Optional Requirement Linking)

### Add Checkbox to Control Requirement Linking
- [x] Add "Link to Requirement" checkbox in task creation form
- [x] When unchecked, disable/dim the requirement dropdown and + button
- [x] When checked, enable requirement dropdown and + button
- [x] Default checkbox to unchecked (no requirement linking by default)
- [x] Update handleCreate to only include requirementId when checkbox is checked
- [x] Reset linkRequirement checkbox after successful task creation
- [ ] Test task creation with and without requirement linking


## Bug Fixes & Enhancements (Jan 31, 2026 - Today Dashboard & Assign Date)

### Fix Assign Date Not Saving Default Value
- [x] Investigate why assign date defaults to today but saves as empty when not changed - Found: `|| undefined` was converting value to undefined
- [x] Ensure default assign date value is included in task creation mutation - Removed `|| undefined` logic
- [ ] Test task creation with default assign date (not manually changed)

### Adjust Card Colors for Dark/Light Mode
- [x] Update upcoming tasks card background color for visibility in both modes
- [x] Use semantic Tailwind color tokens (amber-50/50 for light, amber-950/30 for dark)
- [x] Remove conflicting className and inline style - replaced with theme-aware classes
- [ ] Test visibility in both dark and light themes

### Enhance Today Dashboard with Filtering
- [x] Add filter controls for Responsible, Status, Priority
- [x] Add grouping options dropdown (by Responsible, by Status, by Priority, or None)
- [x] Implement filtering logic that applies to all task categories (Today, Overdue, Upcoming)
- [x] Add Clear Filters button that appears when filters are active
- [x] Extract unique values from tasks for filter dropdowns
- [ ] Implement grouping display logic (currently dropdown exists but grouping not applied)
- [ ] Show task counts per group/filter
- [ ] Persist filter/group preferences in local storage


## Feature Enhancement (Jan 31, 2026 - Display Requirement & Deliverable in Tasks)

### Show Requirement and Deliverable in Task Table
- [x] Add Requirement column to task table showing requirement ID code
- [x] Add Deliverable column to task table showing deliverable ID (formatted as DL-XXXX)
- [x] Add info icon button ("i") next to requirement that opens detail dialog
- [x] Add info icon button ("i") next to deliverable that opens detail dialog
- [x] Create handleViewRequirementDetails handler to find and display requirement
- [x] Create handleViewDeliverableDetails handler to find and display deliverable
- [x] Display requirement details in dialog (ID, description, type, category, status, priority, owner, source type, ref source)
- [x] Display deliverable details in dialog (ID, description, status, due date)
- [ ] Test requirement and deliverable info dialogs


## UI/UX Improvement (Jan 31, 2026 - Task Table Readability)

### Restructure Task Table for Better Readability
- [x] Change table layout from single-row to two-line per task
- [x] Line 1: Task ID (bold), Task Group badge, Description (full text), Action buttons
- [x] Line 2: Requirement badge with info button, Deliverable badge with info button, Responsible, Due Date, Status badge
- [x] Add proper text wrapping - description shows full text without truncation
- [x] Ensure Current Status displays as badge without overflow
- [ ] Test table responsiveness and readability


## Feature Enhancement (Jan 31, 2026 - Inline Task/Issue Group Creation)

### Add + Buttons for Task Group and Issue Group in Requirement Creation
- [x] Add + button next to Task Group dropdown in requirement creation dialog (Tasks page)
- [x] Add + button next to Issue Group dropdown in requirement creation dialog (Tasks page)
- [x] Create Task Group inline creation dialog with name and description fields
- [x] Create Issue Group inline creation dialog with name and description fields
- [x] Add mutations for creating Task Group and Issue Group from requirement dialog
- [x] Auto-select newly created Task Group/Issue Group in requirement form
- [x] Apply same functionality to Requirements page requirement creation dialog
- [x] Replace prompt-based creation with Dialog components
- [x] Update mutations to close dialogs and reset state
- [x] Add Task Group and Issue Group creation dialogs to Requirements page
- [ ] Test Task Group and Issue Group creation from both pages


## UI/UX Improvement (Jan 31, 2026 - Vertical Field Layout)

### Restructure Task Display with Vertical Fields
- [x] Change second line from horizontal row to vertical column layout using grid-cols-1
- [x] Display each field below the other (Requirement, Deliverable, Responsible, Due Date, Status)
- [x] Add left border and padding for visual separation
- [x] Set minimum width for labels (100px) for consistent alignment
- [x] Keep action buttons on the right side
- [ ] Test vertical layout on different screen sizes


## UI/UX Improvement (Feb 1, 2026 - Issues Page Enhancement)

### Apply Tasks Page Features to Issues Page
- [x] Add two-line vertical field layout to Issues table (same as Tasks)
- [x] Add optional requirement linking with checkbox control
- [x] Add + button for inline Issue Group creation
- [x] Add + button for inline Requirement creation
- [x] Add + button for inline Deliverable creation
- [x] Add info buttons (i) to view Requirement and Deliverable details
- [x] Add deliverable dropdown and linking to Issues
- [x] Add deliverableId column to issues table in database
- [ ] Test all features on Issues page


## Feature Enhancement (Feb 1, 2026 - Task Creation from Issues)

### Add Task Creation and Linking to Issues Page
- [x] Add taskId field to issues table schema and database
- [x] Add task dropdown to Issue creation dialog
- [x] Add + button for inline Task creation from Issue dialog
- [x] Create comprehensive task creation dialog with all fields (Task Group, Description, RACI, Dates, Status, Priority)
- [x] Auto-select newly created task in issue form
- [x] Add task field display in Issues table with info button
- [x] Add task detail dialog to view full task information
- [ ] Test task creation and linking from Issues page


## UI/UX Improvement (Feb 1, 2026 - Theme Settings Accessibility)

### Move Theme Selector to Settings Menu
- [x] Add Theme option to DashboardLayout settings dropdown menu (user avatar dropdown)
- [x] Create theme settings dialog/panel accessible from settings menu
- [x] Include color palette selector in theme settings (ThemeSelector component)
- [x] Ensure theme selector is accessible at all screen sizes (not just mobile)
- [ ] Test theme changes persist across page navigation


## UI/UX Improvement (Feb 1, 2026 - Theme Selector & Visual Consistency)

### Add Color Palette Selector to Settings Theme Tab
- [x] Add ThemeSelector component to Settings page Theme tab
- [x] Display all color themes (Rose, Blue, Green, etc.) in Settings
- [ ] Test theme selection works from Settings page

### Apply Vertical Layout to Requirements Page
- [x] Update Requirements table to use two-line vertical field layout
- [x] Match Tasks and Issues page display format
- [x] Add info buttons for linked entities

### Add Colored Header Ribbons to All Pages
- [x] Identify the colored ribbon style from Requirements page (bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20)
- [x] Apply colored header ribbon to Tasks page
- [x] Apply colored header ribbon to Issues page
- [x] Apply colored header ribbon to Deliverables page
- [x] Apply colored header ribbon to Stakeholders page
- [ ] Apply colored header ribbon to Dependencies page
- [ ] Apply colored header ribbon to Assumptions page
- [ ] Apply colored header ribbon to Action Log page
- [ ] Apply colored header ribbon to Relationships page
- [ ] Ensure consistent color scheme across all pages


## UI/UX Improvement (Feb 1, 2026 - Text Formatting Consistency)

### Replace N/A with Dashes in Requirements Table
- [x] Replace all "N/A" text with "-" in Requirements table display
- [x] Ensure consistency with Tasks and Issues pages formatting
