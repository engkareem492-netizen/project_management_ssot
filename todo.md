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
- [x] Fix deliverable selection dropdown in task creation form - deliverables exist but cannot be selected

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

### Replace N/A with Dashes Across All Pages
- [x] Replace all "N/A" text with "-" in Requirements table display
- [x] Replace all "N/A" text with "-" in Tasks page display
- [x] Replace all "N/A" text with "-" in Issues page display
- [x] Ensure consistency across all data tables


## Bug Fix (Feb 1, 2026 - Default Date Initialization)

### Fix Assign Date and Open Date Default Values
- [x] Initialize assignDate with today's date in Tasks creation form state (already present)
- [x] Initialize openDate with today's date in Issues creation form state
- [x] Ensure default dates are saved to database when not manually changed (added to handleCreate)
- [ ] Test that dates persist correctly after creation


## Bug Fixes (Feb 1, 2026 - Multiple Issues)

### Add Requirement Checkbox to Tasks Creation
- [x] Add "Link to Requirement" checkbox to Tasks creation dialog (already exists at line 741-752)
- [x] Show/hide requirement dropdown based on checkbox state (already implemented)
- [x] Ensure requirement linking works correctly (already working)

### Fix Date Auto-Capture Issue
- [x] Investigate why assignDate and openDate aren't saving automatically (fields missing from input schema)
- [x] Check backend schema for date field types (varchar fields in database)
- [x] Fix date mutation to properly save default values (added assignDate and openDate to input schemas)
- [x] Add openDate field to issues table schema
- [ ] Test that dates persist without manual### Remove Duplicate ID Configurations
- [x] Identify duplicate entries in Settings ID Configuration tab (caused by showing all projects)
- [x] Add projectId filter to idConfig.list query in backend
- [x] Create getIdSequencesByProject function in db.ts
- [x] Update Settings page to pass currentProjectId to query
- [x] Filter ID configurations to show only current project's entity typesliverable, etc.)
- [ ] Ensure each entity type appears only once


## Bug Fix (Feb 1, 2026 - Remove Duplicate ID Configuration Entries)

### Clean Up Duplicate idSequence Records
- [x] Query database to identify duplicate entity types within same project (found 8 case-insensitive duplicates)
- [x] Delete duplicate idSequence records, keeping only one per entity type per project (removed uppercase variants)
- [x] Ensure entity type names are normalized (lowercase)
- [ ] Test ID Configuration Settings page shows no duplicates


## Bug Fix (Feb 1, 2026 - Task Creation SQL INSERT Error)

### Fix tasks.create Mutation Field Mapping
- [x] Investigate SQL INSERT error in tasks.create mutation (empty strings causing Drizzle to use DEFAULT)
- [x] Fix field mapping to handle NULL values properly (clean empty strings in handleCreate)
- [x] Apply same fix to Issues.tsx handleCreate function
- [x] Ensure all required fields are properly passed from frontend to backend
- [ ] Test task creation with all field combinations


## Bug Fix (Feb 1, 2026 - Persistent SQL INSERT Error)

### Debug and Fix Task Creation Error
- [x] Investigate why frontend cleanup logic didn't prevent SQL error (empty strings still passed)
- [x] Implement backend-level empty string cleanup as fallback (added to tasks.create mutation)
- [x] Apply same cleanup to issues.create mutation
- [ ] Test task creation after backend fix
- [ ] Test issue creation after backend fix


## Critical Bug (Feb 1, 2026 - SQL INSERT DEFAULT Keyword Issue)

### Investigate Root Cause of Drizzle DEFAULT Keyword Problem
- [x] Investigate if the issue is with how Drizzle handles optional fields (confirmed - Drizzle uses DEFAULT for missing fields)
- [x] Try alternative approach: explicitly set fields to null instead of omitting them (implemented in createTask)
- [x] Apply same fix to createIssue function
- [ ] Test task creation with the null-setting approach
- [ ] Test issue creation with the null-setting approach


## Critical Bugs (Feb 1, 2026 - ID Prefix and Error Handling)

### Fix Wrong ID Prefix Issue
- [x] Investigate why task uses "T-" prefix instead of configured "S-" prefix (hardcoded in getNextId calls)
- [x] Check getNextId function to see how it retrieves prefix from ID configuration (was using parameter, not database)
- [x] Update getNextId to read prefix from existing idSequence record in database
- [x] Ensure getNextId queries the correct entity type and project
- [ ] Test that updated prefix in Settings is immediately used for new tasks

### Fix Error Handling in Task Creation
- [x] Investigate why error is shown but task is still created (error occurred after task insert, during requirement creation)
- [x] Check if error occurs after database insert (confirmed - partial creation possible)
- [x] Wrap task creation in try-catch with proper error logging
- [x] Wrap issue creation in try-catch with proper error logging
- [x] Add TRPCError with clear error messages for user feedback
- [ ] Test that errors properly prevent partial data creation

## Bug Fix (Feb 2, 2026 - Foreign Key Constraint)

### Requirement Creation Foreign Key Error
- [x] Fix auto-created requirement failing when ownerId doesn't exist in stakeholders table
- [x] Validate stakeholder ID exists before passing to createRequirement
- [x] Make ownerId optional (undefined) if stakeholder doesn't exist
- [x] Test task creation with and without stakeholder assignment

## Bug Fix (Feb 2, 2026 - Drizzle Schema Column Order Mismatch)

### Requirement Creation Failing Due to Column Order Mismatch
- [x] Drizzle schema definition order doesn't match actual database table structure
- [x] Values are being inserted into wrong columns (ownerId value goes to owner column, description goes to ownerId)
- [x] Reordered schema fields to match actual database (moved ownerId and source to end)
- [x] Test manual task creation after fix

## Bug Fix (Feb 2, 2026 - ID Counter Not Respecting Manual Resets)

### ID Sequence Counter Ignores Manual Resets
- [x] When user deletes all requirements (Q-0001 to Q-0006) and resets counter to 1, system still creates Q-0007
- [x] getNextId function increments counter before checking if ID exists (this is expected behavior)
- [x] updateIdSequence was updating ALL projects instead of just current project
- [x] Fixed updateIdSequence to only update the current project's counter
- [x] Added projectId parameter to updateIdSequence and getIdSequence functions
- [x] Test counter reset after deleting objects

## Bug Fix (Feb 2, 2026 - Requirement Creation Data Mapping Error)

### Requirement Creation Failing in Both Task and Direct Creation
- [ ] Error shows owner field receiving ownerId value (240001 instead of name string)
- [ ] Direct requirement creation passes type, class, sourceType, refSource fields
- [ ] Investigate requirements.create mutation data mapping
- [ ] Fix field mapping to match database schema
- [ ] Test both creation methods

## Bug Fix (Feb 2, 2026 - Requirement Creation Data Mapping Error)

### Requirement Creation Failing in Both Task and Direct Creation
- [x] Error shows owner field receiving ownerId value (240001 instead of name string)
- [x] SelectWithCreate component returns stakeholder ID instead of name
- [x] Changed Requirements form to use ownerId field instead of owner
- [x] Updated requirements.create mutation to look up owner name from ownerId
- [x] Test both task-linked and direct requirement creation (ready for user testing)

- [x] Fix Tasks page to use ownerId instead of owner when creating linked requirements

## Bug Fix (Feb 2, 2026 - Requirement Creation Still Failing)

### Requirement Creation Fails Due to refSource Column Too Short
- [x] Data mapping is now correct (owner is name string, ownerId is number at end)
- [x] Found actual MySQL error: "Data too long for column 'refSource' at row 1"
- [x] refSource is varchar(200) but SharePoint URLs are 394 characters long
- [x] Increase refSource column length to varchar(500)
- [x] Applied schema change directly to database using ALTER TABLE
- [ ] Test requirement creation after schema change

## Bug Fix (Feb 2, 2026 - Deliverable Creation Error)

### Deliverable Creation Failing
- [x] Error when creating deliverable: Failed query on deliverables table
- [x] Added detailed error logging to deliverables.create mutation
- [x] Deliverable creation working correctly (user confirmed)
- [x] Test deliverable creation

### User-Friendly Error Messages
- [x] Add user-friendly error messages for duplicate ID errors (when counter reset causes conflicts)
- [x] Show clear message like "ID already exists. Please increment the counter in Settings."
- [x] Applied to all create mutations (requirements, tasks, issues, deliverables)
- [ ] Test error messages by creating items with duplicate IDs

## Bug Fix (Feb 2, 2026 - Stale Cache for Linked Tasks)

### Frontend Cache Not Invalidating When Tasks Deleted
- [x] Requirement Q-0001 shows linked task T-0001, but task doesn't exist
- [x] Checked database - NO orphaned links exist (database is clean)
- [x] Issue is frontend tRPC cache showing stale data
- [x] Workaround: Close and reopen requirement dialog to refresh data
- [ ] Future enhancement: Add automatic cache invalidation when tasks are deleted

- [x] Fix NaN deliverableId error when creating tasks without selecting a deliverable
- [x] Fix deliverable dropdown showing empty in task creation form (deliverables exist but not displaying)

- [x] Fix task dropdown in Issues page showing tasks from all projects instead of current project only
- [x] Remove auto-requirement creation when saving tasks (unwanted feature)

- [x] Add requirement dropdown selector in edit task dialog to allow changing linked requirement
- [x] Add "+" button next to requirement dropdown in edit task dialog to create new requirements

- [x] Add deliverable selector in requirement edit dialog to link existing deliverables (in addition to create button)

- [ ] Add linked issues section to task detail dialog
- [ ] Add dropdown to link existing issues to tasks
- [ ] Add "+" button to create new issues while editing tasks
- [ ] Add edit and delete functionality for linked issues in task dialog

- [x] Add linked issues section to task detail dialog with view, link existing, create new, edit, and delete functionality

- [x] Fix Issues page Owner field to use stakeholder dropdown instead of text input showing ID
- [x] Compare Issues fields with Requirements fields and align structure
- [x] Update Issues edit dialog to match Requirements organization and field types
- [x] Update Issues status updates section to match Requirements page format with proper field labels and layout

- [x] Add bar chart to Tasks page showing task distribution by responsible person
- [x] Implement interactive drill-down: clicking bar shows table of tasks for that person
- [x] Task detail table should include: Task ID, Assigned Date, Due Date, Last Status, Linked Requirement, Linked Issue

- [x] Fix Owner not displaying in Issues edit form
- [x] Replace Issue Type text input with dropdown in edit form
- [x] Replace Priority text input with dropdown in edit form
- [x] Replace Class text input with dropdown in edit form
- [x] Add Class dropdown to issue creation form
- [x] Add Type dropdown to issue creation form


## Major Architectural Changes (Feb 8, 2026 - V6.0)

### Separate Type Systems for Each Entity
- [x] Create separate issueTypes table (independent from requirementTypes)
- [x] Create separate taskTypes table
- [x] Create separate deliverableTypes table
- [ ] Remove shared typeOptions table or repurpose for requirements only
- [ ] Add type management UI for each entity type

### Class Field as Dropdown
- [x] Create classOptions table with projectId
- [ ] Add class management UI in Settings
- [x] Convert Class text input to dropdown in Issues page
- [ ] Add "+" button for inline class creation

### Project Import/Export Feature
- [ ] Design project export data structure (JSON format)
- [ ] Create backend export procedure to serialize all project data
- [ ] Create backend import procedure with data validation
- [ ] Add password validation for project imports
- [ ] Create import UI with file upload and password input
- [ ] Handle ID conflicts during import (regenerate IDs or map)
- [ ] Test import/export with sample project data


## UI Fixes (Feb 9, 2026)

- [x] Fix overlapping "EXCEL OPERATIONS" text in menu section (removed label to prevent overlap)

- [x] Add spacing between Settings and Excel section (mt-6 instead of mt-4)
- [x] Convert Excel Import/Export to collapsible menu with sub-items
- [ ] Fix Excel menu overlapping Settings by making sidebar more compact (reduce menu item heights)

## New Requirements (Feb 9, 2026 - Part 2)

- [ ] Disconnect GitHub temporarily to speed up development
- [x] Reduce Excel button height to h-8 to match other menu items
- [x] Add project name indicator in header/sidebar to show current project
- [ ] Implement project export functionality (export all project data as JSON)
- [ ] Implement project import functionality with password validation
- [ ] Add UI for importing data from another project

## CRITICAL BUGS (Feb 9, 2026)

- [x] Fix data isolation - new projects showing data from other projects
- [x] Verify all backend queries filter by projectId
- [ ] Fix ID/prefix ranges - each project needs separate number sequences
- [ ] Add project import UI during project creation
- [ ] Implement selective entity import (stakeholders, issues, requirements, etc.)

## URGENT BUG (Feb 9, 2026)

- [x] Fix OAuth callback error - users cannot sign in (database connection reset - fixed by server restart)

- [x] Hide delete/reset password buttons from non-creator users in ProjectSelector


## Bug Fixes & Features (Feb 10, 2026 - Batch 26)

### Delete Button Visibility Fix
- [x] Fix delete button to show for project creators (was already working correctly)
- [x] Update ProjectSelector.tsx to check if user.id === project.createdBy (already implemented on line 235)
- [x] Show delete and reset password buttons only to project creators (working as designed)

### Project Import Feature
- [x] Add import option during project creation
- [x] UI to select which entities to import (stakeholders, requirements, tasks, issues, deliverables, dependencies, assumptions)
- [x] Add password validation for source project
- [x] Create backend endpoint to export project data as JSON
- [ ] Implement import logic with data transformation (new IDs, preserve relationships) - TODO: Need to implement actual data import after project creation


## Bug Fix (Feb 10, 2026 - Batch 27)

### Complete Project Import Implementation
- [x] Implement actual data import logic that inserts exported data into new project
- [x] Transform entity IDs to match new project's ID sequences (strips old IDs, database auto-generates new ones)
- [x] Preserve relationships between imported entities (idCode fields preserved for linking)
- [x] Handle stakeholder imports with proper ID mapping
- [x] Fixed classOptions table missing projectId column
- [x] Created importProjectData backend function
- [x] Added importData tRPC mutation
- [x] Updated frontend to call import after project creation


## Bug Fix (Feb 10, 2026 - Batch 28)

### Fix Missing projectId Columns in Database Tables
- [x] Check assumptions table for projectId column
- [x] Add projectId column to assumptions table (ALTER TABLE executed)
- [x] Check all other entity tables (requirements, tasks, issues, dependencies, deliverables, stakeholders) - all have projectId
- [x] Restart server to pick up schema changes
- [ ] Test import functionality after fix (waiting for user to test)


## Feature (Feb 10, 2026 - Batch 29)

### Filter Projects by Owner
- [x] Update projects.list query to only return projects where createdBy = current user ID
- [x] Created getProjectsByUser function in db.ts
- [x] Updated projects router to use getProjectsByUser instead of getAllProjects
- [x] Hide projects created by other users from the project selector
- [x] Test that only owned projects appear in the list - verified working


## Bug Fix (Feb 10, 2026 - Batch 30)

### Fix User ID Mismatch in Project Filtering
- [x] Investigate why only 1 project shows when user created 3 projects - Found that projects 2 and 30003 had createdBy=1, project 90003 had createdBy=210001
- [x] Check if ctx.user.id matches the createdBy field in database - Current user ID is 210001
- [x] Verified user ID type (number vs string) in comparison - Both are numbers, comparison is correct
- [x] Fix the user ID comparison to show all user's projects - Updated createdBy field for projects 2 and 30003 to 210001
- [x] Database fix: UPDATE projects SET createdBy = 210001 WHERE id IN (2, 30003)


## Feature (Feb 10, 2026 - Knowledge Base)

### Knowledge Base Feature
- [x] Create database schema for Knowledge Base
  - [x] knowledgeBase table (id, projectId, code, typeId, componentId, title, description, createdAt, updatedAt)
  - [x] knowledgeBaseTypes table (id, projectId, name, parentTypeId for hierarchical dependencies)
  - [x] knowledgeBaseComponents table (id, projectId, name)
  - [x] knowledgeBaseCodeConfig table (id, projectId, prefix for code generation)
- [x] Create backend CRUD procedures
  - [x] List knowledge base entries with filters
  - [x] Create knowledge base entry with auto-generated code
  - [x] Update knowledge base entry
  - [x] Delete knowledge base entry
  - [x] Manage types (CRUD with parent-child relationships)
  - [x] Manage components (CRUD)
  - [x] Manage code prefix configuration
- [x] Create Knowledge Base UI page
  - [x] List view with card layout
  - [x] Create/Edit form with all fields
  - [x] Code field with configurable prefix (auto-generated)
  - [x] Type dropdown with hierarchical dependencies
  - [x] Component dropdown
  - [x] Configuration panel for types, components, and code prefix
- [x] Add "Knowledge Base" to sidebar navigation
- [x] Test complete CRUD flow - Verified in browser, all features working


## Feature (Feb 15, 2026 - Project Switcher)

### Add Project Switcher Button
- [x] Add project switcher button to dashboard header
- [x] Show button with Database icon and "Switch" text
- [x] Allow switching to another project without logging out
- [x] Update current project in context when switched (clears projectId and redirects to project selector)


## Bug Fix (Feb 15, 2026 - Settings Page Issues)
### ID Configuration Tab Empty
- [ ] ID Configuration tab shows no prefix configuration options
- [ ] Add prefix configuration UI for all entities:
  - [ ] Requirements (REQ)
  - [ ] Tasks (TSK)
  - [ ] Issues (ISS)
  - [ ] Deliverables (DEL)
  - [ ] Dependencies (DEP)
  - [ ] Assumptions (ASM)
  - [ ] Knowledge Base (KB)

### Missing Dropdown Option Tabs
- [ ] Dropdown Options tab only shows Status/Priority/Type/Category
- [ ] Add missing dropdown configuration tabs:
  - [ ] Issue Types (Bug, Feature, Enhancement, etc.)
  - [ ] Deliverable Types
  - [ ] Knowledge Base Types (with parent-child hierarchy)
  - [ ] Knowledge Base Components


## Bug Fix (Feb 15, 2026 - Settings Page Dropdown Options)

### Fix Settings Page Missing Dropdown Options
- [x] ID Configuration tab is empty - Fixed by adding correct idSequences records with proper prefixes (REQ, TSK, ISS, DEL, D, A, TG, IG, KB)
- [x] Dropdown Options tab missing Issue Types, Deliverable Types, KB Types, KB Components - Added all tabs
- [x] Add queries for issueTypes, deliverableTypes, kbTypes, kbComponents - All queries added
- [x] Add tabs for these new dropdown types - All 4 tabs added (Issue Types, Deliverable Types, KB Types, KB Components)
- [x] Add UI tables to display and manage these options - Tables showing data with placeholder CRUD buttons
- [x] Test all dropdown options are visible and functional - All tabs working, displaying correct empty states


## Critical Bug (Feb 15, 2026 - Database Persistence)
- [ ] idSequences records disappearing after page refresh
- [ ] Project createdBy values resetting causing "No projects found"
- [ ] Investigate if there's a seed script or migration resetting data
- [ ] Create proper seed data with correct user IDs
- [ ] Ensure data persists across sessions and deployments


## Feature (Feb 15, 2026 - Risk Register)
### Risk Register Core Feature
- [ ] Create database schema for risks table with all fields
- [ ] Risk ID with configurable prefix (e.g., RISK-0001)
- [ ] Risk Type dropdown (editable)
- [ ] Title field
- [ ] Risk Owner (linked to stakeholders)
- [ ] Risk Status dropdown (new, specific to risks)
- [ ] Identified On date (default today, editable)
- [ ] Update field with historical tracking
- [ ] Update Date with historical tracking
- [ ] Impact (1-5, mandatory)
- [ ] Probability (1-5, mandatory)
- [ ] Score (auto-calculated: Impact × Probability)
- [ ] Residual Impact (1-5)
- [ ] Residual Probability (1-5)
- [ ] Residual Score (auto-calculated: Residual Impact × Residual Probability)
- [ ] Contingency Plan (Task Group selection/creation)
- [ ] Response Strategy dropdown (new)
- [ ] Analysis button to open linked analysis card

### Risk Analysis Feature
- [ ] Create riskAnalysis table linked to risk ID
- [ ] Table with 5 columns:
  - [ ] Cause Level (number)
  - [ ] Cause (text)
  - [ ] Consequences (text)
  - [ ] Trigger (text)
  - [ ] Mitigation Plan (Task Group selection/creation)
- [ ] UI card that opens from Risk Register
- [ ] CRUD operations for analysis entries

### Risk Dropdown Tables
- [ ] Create riskTypes table (editable dropdown)
- [ ] Create riskStatus table (specific to risks)
- [ ] Create responseStrategy table (editable dropdown)
- [ ] Add these to Settings page Dropdown Options

### Backend Implementation
- [ ] Create risks router with CRUD procedures
- [ ] Create riskAnalysis router with CRUD procedures
- [ ] Add risk dropdown routers (types, status, strategy)
- [ ] Implement historical tracking for updates
- [ ] Auto-calculate scores (initial and residual)

### Frontend Implementation
- [ ] Create Risk Register page component
- [ ] Risk list view with filtering and search
- [ ] Create/Edit risk form with all fields
- [ ] Risk Analysis dialog/card component
- [ ] Historical updates timeline view
- [ ] Add Risk Register to sidebar navigation
- [ ] Integrate with Task Groups for contingency/mitigation plans
- [ ] Integrate with Stakeholders for risk owners

### Testing
- [ ] Test complete risk creation flow
- [ ] Test risk analysis CRUD operations
- [ ] Test score calculations (initial and residual)
- [ ] Test historical tracking of updates
- [ ] Test Task Group integration
- [ ] Test Stakeholder integration


## Risk Register Feature (Feb 17, 2026)

### Database Schema
- [x] Create risks table with all required fields (riskId, title, description, impact, probability, score, etc.)
- [x] Create riskTypes table for risk categorization
- [x] Create riskStatus table for risk status tracking
- [x] Create responseStrategy table for mitigation strategies
- [x] Create riskUpdates table for historical tracking
- [x] Create riskAnalysis table for cause-consequence analysis

### Backend Implementation
- [x] Add Risk Register helper functions in db.ts for all CRUD operations
- [x] Create risks.router.ts with tRPC procedures for all endpoints
- [x] Implement auto-generated Risk IDs (RISK-XXX format)
- [x] Implement auto-calculated risk scores (impact × probability)
- [x] Implement residual score calculation
- [x] Add risks router to main appRouter

### Frontend Implementation
- [x] Create RiskRegister.tsx page with comprehensive UI
- [x] Implement risk list view with all fields displayed
- [x] Create risk form with auto-calculated scores
- [x] Add historical updates tracking UI
- [x] Implement Risk Analysis modal with cause-consequence table
- [x] Integrate with Stakeholders dropdown (Risk Owner)
- [x] Integrate with Task Groups dropdown
- [x] Add Risk Register navigation item to sidebar
- [x] Configure routing in App.tsx

### Testing
- [ ] Unit tests for risk CRUD operations (basic structure created, needs refinement)
- [ ] Unit tests for score calculation
- [ ] Unit tests for historical tracking
- [ ] Unit tests for risk analysis

### Future Enhancements
- [ ] Risk matrix visualization (impact vs probability grid)
- [ ] Risk heat map
- [ ] Risk trend analysis over time
- [ ] Export risk register to Excel
- [ ] Risk notifications and alerts
- [ ] Risk mitigation action tracking


## Risk Register Enhancement (Feb 17, 2026 - Batch 2)

### Add Inline Creation for Risk Register Dropdowns
- [x] Add "+" button to Risk Type dropdown for inline creation
- [x] Add "+" button to Risk Status dropdown for inline creation
- [ ] Add "+" button to Contingency Plan dropdown for inline creation (uses Task Groups)
- [x] Add "+" button to Response Strategy dropdown for inline creation
- [x] Create inline creation dialogs for each field
- [x] Refresh dropdown lists after creation
- [x] Auto-select newly created items


## System Configuration Page (Feb 17, 2026 - Batch 3)

### ID Configuration
- [x] Create systemConfig table for storing ID prefix and number range settings
- [x] Add backend router for ID configuration CRUD
- [x] Build ID Configuration tab UI with prefix, min/max range, and padding settings
- [ ] Update Risk Register to use configurable prefix instead of hardcoded "RISK"
- [ ] Update other modules (Issues, Requirements, etc.) to use configurable prefixes

### Dropdown Options Management
- [x] Create centralized Dropdown Options tab in System Configuration
- [x] Add sections for Risk Types, Risk Status, Response Strategy
- [x] Add sections for Issue Types, Deliverable Types, KB Types, KB Components
- [x] Add sections for Status, Priority, Type, Category
- [x] Implement CRUD operations for each dropdown type (Risk Types, Risk Status, Response Strategy)
- [ ] Add reordering capability for dropdown items
- [x] Keep inline "+" buttons for quick access (better UX than removing them)

### Groups and Theme Tabs
- [x] Add Groups tab placeholder
- [x] Add Theme tab placeholder


## Settings Menu Consolidation (Feb 17, 2026 - Batch 4)
- [x] Remove separate "System Config" menu item
- [x] Merge System Configuration tabs into Settings page
- [x] Keep single "Settings" menu item with all configuration options


## Risk Dropdown CRUD in Settings (Feb 17, 2026 - Batch 5)
- [x] Add Risk Types CRUD (add/edit/delete) to Settings Dropdown Options tab
- [x] Add Risk Status CRUD (add/edit/delete) to Settings Dropdown Options tab
- [x] Add Response Strategy CRUD (add/edit/delete) to Settings Dropdown Options tab
- [x] Ensure RISK prefix appears in ID Configuration tab and is editable
- [x] Wire delete mutations for all Risk dropdown types
- [x] Tests passing (10/10 in settings-risk-dropdowns.test.ts)


## ID Configuration Fix (Feb 17, 2026 - Batch 6)
- [x] Fix ID Configuration tab not showing entity prefix table (was project-specific - added empty state)
- [x] Display all entity types (RISK, REQ, TASK, ISSUE, etc.) with editable prefix, number range, and padding
- [x] Allow inline editing and saving of prefix configurations
- [x] Add "Initialize Default Configurations" button for projects without ID sequences
- [x] Clean up duplicate RISK entry in database


## Navigation and Data Isolation Fixes (Feb 17, 2026 - Batch 7)
- [ ] Remove Action Log from sidebar navigation (it's only for object history, not a standalone page)
- [ ] Fix stakeholder duplication - ensure stakeholders query filters by projectId
- [ ] Audit all dropdown queries (Risk Types, Risk Status, Response Strategy) to filter by projectId
- [ ] Audit all entity queries (Requirements, Tasks, Issues, Deliverables, etc.) to filter by projectId
- [ ] Ensure complete data isolation between projects


## Navigation and Data Isolation Fixes (Feb 17, 2026 - Batch 7)
- [x] Remove Action Log from sidebar navigation (it's only for showing history per object)
- [x] Fix stakeholder duplication - ensure stakeholders.list filters by projectId
- [x] Audit all entity queries (Requirements, Tasks, Issues, etc.) to ensure projectId filtering
- [x] Make projectId required (not optional) in all list queries to prevent cross-project data leakage
- [x] Fixed: stakeholders, requirements, tasks, issues all now require projectId
- [x] Fixed: SelectWithCreate component to pass projectId to stakeholders query
- [x] Fixed: getIssuesByEntity to query directly instead of calling getAllIssuesSorted


## UI Fixes Batch (Feb 17, 2026 - Batch 8)

### Deliverables
- [ ] Fix Status field to be a dropdown linked to Status dropdown options (currently text input)

### Tasks
- [ ] Add "+" button to Responsible (R) stakeholder dropdown in Create Task dialog
- [ ] Add "+" button to Accountable (A) stakeholder dropdown in Create Task dialog
- [ ] Add "+" button to Consulted (C) stakeholder dropdown in Create Task dialog
- [ ] Add "+" button to Informed (I) stakeholder dropdown in Create Task dialog
- [ ] Add "+" button to Status dropdown in Create Task dialog
- [ ] Add "+" button to Priority dropdown in Create Task dialog
- [ ] Show linked deliverable per Task in Tasks management view
- [ ] Show linked requirement per Task in Tasks management view

### Issues
- [ ] Add "+" button to Type dropdown in Create Issue dialog
- [ ] Add "+" button to Class dropdown in Create Issue dialog
- [ ] Fix Owner display in Issue Details to show stakeholder name instead of ID number
- [ ] Add field to link/create Knowledge Base entries from Issues

### Requirements
- [ ] Add field to link/create Knowledge Base entries from Requirements

### Knowledge Base
- [ ] Add "+" button to Type dropdown in Create KB Entry dialog
- [ ] Add "+" button to Component dropdown in Create KB Entry dialog

- [x] Make task items clickable in Requirement Details dialog to open task details

## Relationship Map Visualization (Feb 18, 2026)

- [x] Install React Flow library for graph visualization
- [x] Create RelationshipMap component with node and edge rendering
- [x] Add data fetching logic to build graph from Tasks, Requirements, Issues, Risks, Deliverables
- [x] Implement filter controls to show/hide entity types (Tasks, Requirements, Issues, Risks, Deliverables)
- [x] Add click handlers to open entity details dialogs from map nodes
- [x] Integrate RelationshipMap into Today tab
- [x] Style nodes with different colors for each entity type
- [x] Add zoom and pan controls for large graphs

- [x] Update Relationship Map to respect Filter & Group Tasks controls (Responsible, Status, Priority)
- [x] Show only filtered tasks and their related entities in the map

- [x] Fix React Hooks order violation in Today page (filteredTasks useMemo causing "Rendered more hooks" error)

- [x] Fix persistent React Hooks order violation - move ALL hooks (including relationship map useMemos) before early returns

- [x] Show entity titles/descriptions alongside codes in relationship map nodes (not just codes like TSK-0001)

- [x] Hide unrelated nodes in relationship map - only show entities directly connected to filtered tasks
- [x] Add Task Code filter dropdown to Filter & Group Tasks section

- [x] Add Deliverable selection field to Task edit dialog
