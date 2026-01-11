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
- [ ] Create checkpoint
- [ ] Deliver enhanced application
