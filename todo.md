# Project Management SSOT - TODO

## Phase 1: Database Schema & Data Model
- [x] Design database schema for Requirements table
- [x] Design database schema for Tasks table
- [x] Design database schema for Issues table
- [x] Design database schema for Dependencies table
- [x] Design database schema for Assumptions table
- [x] Design database schema for Action Log table
- [x] Implement database migrations

## Phase 2: Excel Upload & Import
- [x] Create Excel file upload component
- [x] Implement Excel parser for Requirements sheet
- [x] Implement Excel parser for Tasks sheet
- [x] Implement Excel parser for Issues sheet
- [x] Implement Excel parser for Dependencies sheet
- [x] Implement Excel parser for Assumptions sheet
- [x] Create data validation and error handling
- [x] Store parsed data in database

## Phase 3: Action Log System
- [x] Implement delta change detection algorithm
- [x] Create automatic timestamp tracking
- [x] Build action log recording for Requirements
- [x] Build action log recording for Tasks
- [x] Build action log recording for Issues
- [x] Track specific fields: Deliverables 1, D1 Status, Deliverables 2, D2 Status, Last Update, Update Date, Status

## Phase 4: Interactive Data Tables
- [x] Create Requirements data table with inline editing
- [x] Create Tasks data table with inline editing
- [x] Create Issues data table with inline editing
- [x] Create Dependencies data table
- [x] Implement real-time validation
- [x] Add save/cancel functionality

## Phase 5: Historical Timeline Viewer
- [x] Design pop-up modal for timeline view
- [x] Implement chronological change history display
- [x] Show field-level changes with timestamps
- [x] Add user-friendly change comparison view

## Phase 6: Relationship Mapping
- [x] Build relationship detection system (Requirement ID, Task ID, Issue ID)
- [x] Create relationship mapping dashboard
- [x] Implement hierarchical view of linked entities
- [x] Add visual relationship diagram
- [x] Create relationship report generator

## Phase 7: Search, Filter & Export
- [x] Implement search across all entities by ID
- [x] Add filter by status, priority, owner
- [x] Add date range filtering
- [x] Create Excel export functionality
- [x] Include action log data in export
- [x] Preserve original Excel structure

## Phase 8: Testing & Documentation
- [x] Write unit tests for delta change detection
- [x] Write integration tests for Excel import/export
- [x] Test all CRUD operations
- [x] Create user documentation
- [x] Test relationship mapping accuracy

## Phase 9: Delivery
- [x] Final testing and bug fixes
- [x] Create checkpoint
- [x] Deliver application to user

## Enhancement: Full CRUD Operations

### Phase 1: Create/Add Functionality
- [x] Add "Create New Requirement" button and form dialog
- [x] Add "Create New Task" button and form dialog
- [x] Add "Create New Issue" button and form dialog
- [x] Add "Create New Dependency" button and form dialog
- [x] Add "Create New Assumption" button and form dialog
- [x] Implement form validation for all create forms
- [x] Add backend procedures for creating new entities

### Phase 2: Delete Functionality
- [x] Add delete button to Requirements table
- [x] Add delete button to Tasks table
- [x] Add delete button to Issues table
- [x] Add delete button to Dependencies table
- [x] Add delete button to Assumptions table
- [x] Implement confirmation dialogs for delete operations
- [x] Add backend procedures for deleting entities

### Phase 3: Bulk Operations (SKIPPED per user request)
- [-] Add checkbox selection to Requirements table
- [-] Add checkbox selection to Tasks table
- [-] Add checkbox selection to Issues table
- [-] Implement bulk delete functionality
- [-] Implement bulk status update functionality
- [-] Add "Select All" / "Deselect All" functionality

### Phase 4: Testing & Delivery
- [x] Test create operations for all entities
- [x] Test delete operations with confirmation
- [x] Verify inline editing still works
- [x] Create checkpoint
- [x] Deliver enhanced application

## Enhancement V2: Next Level Features

### Phase 1: Automatic IDs and Sorting
- [x] Implement auto-generated IDs for Requirements (Q-XXXX format)
- [x] Implement auto-generated IDs for Tasks (T-XXXX format)
- [x] Implement auto-generated IDs for Issues (I-XXXX format)
- [x] Implement auto-generated IDs for Dependencies (D-XXXX format)
- [x] Implement auto-generated IDs for Assumptions (A-XXXX format)
- [x] Add sorting by ID for all entity tables
- [x] Remove manual ID input from create forms (frontend)
### Phase 2: Stakeholder Register
- [x] Create stakeholders database table
- [x] Create Stakeholder Register page with CRUD operations
- [x] Add Full Name, Email, Position, Role, Job, Phone fields
- [ ] Integrate stakeholders as dropdown options for Owner/Responsible/Accountable/Informed/Consultedakeholder dropdown for Owner field in Tasks
- [ ] Integrate stakeholder dropdown for Owner field in Issues
- [ ] Integrate stakeholder dropdown for Responsible field in Dependencies

### Phase 3: Deliverables System
- [x] Create deliverables database table
- [x] Create deliverable_links table for many-to-many relationships
- [x] Create Deliverables page with CRUD operations
- [x] Implement linking to Requirements, Tasks, Dependencies
- [ ] Add ability to create deliverables from Tasks/Requirements/Dependencies pagesrables to Dependencies
- [ ] Add ability to create deliverables from within Requirements/Tasks

### Phase 4: Navigation and Accessibility
- [x] Fix 404 error on Page 2 (updated navigation menu)
- [ ] Improve sidebar navigation with proper routing
- [ ] Add breadcrumb navigation
- [ ] Ensure all pages are accessible from navigation

### Phase 5: Requirement-Task Integration
- [x] Add "Create Task" button within Requirement edit/view
- [x] Auto-link created tasks to parent requirement
- [x] Create Requirement Detail popup showing all linked items
- [x] Show linked Tasks with status in popup
- [x] Show linked Issues with status in popup
- [ ] Show linked Deliverables with status in popup
- [x] Reflect task creation in Tasks page automatically

### Phase 6: Testing and Delivery
- [x] Test automatic ID generation
- [x] Test stakeholder integration
- [x] Test deliverables relationships
- [x] Test navigation fixes
- [x] Test requirement-task linking
- [x] Create checkpoint
- [x] Deliver enhanced application

## Enhancement V3: Comprehensive Improvements

### ID Configuration
- [x] Create ID Configuration backend router
- [x] Create Settings page for ID configuration
- [x] Add Settings to navigation menu
- [ ] Test ID configuration changes

### Stakeholder Integration
- [ ] Add stakeholder dropdown for Owner in Requirements
- [ ] Add stakeholder dropdown for Owner in Issues  
- [ ] Add stakeholder dropdown for Responsible/Accountable in Tasks
- [ ] Add stakeholder dropdown for Responsible in Dependencies

### Status & Priority Dropdowns
- [ ] Add Status dropdown with predefined options (Open, Pending, Closed, In Progress)
- [ ] Add Priority dropdown with predefined options (Low, Medium, High, Very High)
- [ ] Apply to Requirements, Tasks, Issues

### Deliverables Integration
- [ ] Show linked Deliverables from database in Requirements popup (not Excel fields)
- [ ] Add "Create Deliverable" button in Requirements
- [ ] Add "Create Deliverable" button in Tasks
- [ ] Update Deliverables page to show linked Requirements/Tasks

### Bidirectional Linking
- [ ] Show parent Requirement in Tasks table/detail view
- [ ] Show parent Requirement in Issues table/detail view
- [ ] Add "Create Issue" button in Requirements

### Last Update Field
- [ ] Make Last Update field prominently editable
- [ ] Auto-update Last Update on any change

### Testing & Delivery
- [ ] Test all dropdown integrations
- [ ] Test deliverables linking
- [ ] Test bidirectional navigation
- [ ] Create checkpoint
- [ ] Deliver V3 enhancements

## Bugs
- [x] Fix Select.Item empty value error in Tasks page
