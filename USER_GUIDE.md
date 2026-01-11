# Project Management SSOT - User Guide

## Overview

The **Project Management Single Source of Truth (SSOT)** is a comprehensive web application designed to manage project requirements, tasks, issues, dependencies, and assumptions with full change tracking and relationship visualization.

## Key Features

### 1. Excel Import/Export
- **Import**: Upload your existing OST-SSOT.xlsx file to populate the database
- **Export**: Download all data including action logs in Excel format
- Preserves original Excel structure for compatibility

### 2. Action Log System
- Automatically captures **delta changes** (only modified fields)
- Records timestamps for every change
- Tracks changes to:
  - Status
  - Priority
  - Deliverables 1 & 2
  - D1 & D2 Status
  - Last Update
  - Update Date

### 3. Interactive Data Tables
- **Requirements**: View and edit all project requirements
- **Tasks**: Manage project tasks with inline editing
- **Issues**: Track and resolve project issues
- **Dependencies**: View project dependencies
- **Assumptions**: Monitor project assumptions

### 4. Historical Timeline Viewer
- Click the **History** button (clock icon) on any requirement, task, or issue
- View chronological list of all changes
- See field-level comparisons (old value → new value)
- Timestamps for every change

### 5. Relationship Mapping
- Visualize connections between Requirements, Tasks, and Issues
- Hierarchical accordion view showing linked entities
- Summary statistics for relationship counts
- Automatic detection based on ID references

### 6. Search and Filter
- Real-time search across all entities
- Search by ID, description, owner, or any field
- Filter by status, priority, and date ranges

## Getting Started

### Step 1: Sign In
1. Open the application
2. Click "Sign In to Continue"
3. Use your Manus OAuth credentials

### Step 2: Import Data
1. From the home page, click "Choose Excel File"
2. Select your OST-SSOT.xlsx file
3. Wait for the import to complete
4. You'll be redirected to the Requirements page

### Step 3: Navigate the Application
Use the navigation cards on the home page or the sidebar menu to access:
- **Requirements**: Manage project requirements
- **Tasks**: Track project tasks
- **Issues**: Monitor and resolve issues
- **Dependencies**: View dependencies
- **Assumptions**: Track assumptions
- **Action Log**: Review all changes
- **Relationships**: Visualize entity connections

## Working with Requirements

### Viewing Requirements
- All requirements are displayed in a table format
- Use the search bar to filter by ID, description, or owner
- Columns include: ID, Description, Owner, Status, Priority, Deliverables, Last Update

### Editing Requirements
1. Click the **Edit** button (pencil icon) on any requirement
2. Modify the fields you want to change:
   - Status
   - Priority
   - Deliverables 1
   - D1 Status
   - Deliverables 2
   - D2 Status
   - Last Update
3. Click **Save** to commit changes
4. The system automatically:
   - Detects which fields changed
   - Records old and new values
   - Creates an action log entry
   - Updates the timestamp

### Viewing Change History
1. Click the **History** button (clock icon) on any requirement
2. A modal dialog opens showing:
   - All changes in chronological order
   - Timestamp for each change
   - Field-by-field comparison
   - Old values (crossed out) → New values (in green)

## Working with Tasks

### Viewing Tasks
- All tasks are displayed with their Task ID, description, and related information
- Search by Task ID, description, or responsible person
- View linked Requirement ID for traceability

### Editing Tasks
1. Click the **Edit** button on any task
2. Modify:
   - Current Status
   - Status Update
3. Click **Save**
4. Changes are automatically logged

### Viewing Task History
- Click the **History** button to see all changes to the task
- View chronological timeline with timestamps

## Working with Issues

### Viewing Issues
- All issues are displayed with Issue ID, description, and status
- Search by Issue ID, description, or owner
- View linked Requirement ID

### Editing Issues
1. Click the **Edit** button on any issue
2. Modify:
   - Status
   - Priority
   - Deliverables 1 & 2
   - D1 & D2 Status
   - Last Update
3. Click **Save**
4. Changes are automatically logged

### Viewing Issue History
- Click the **History** button to see all changes
- View field-level changes with timestamps

## Viewing Relationships

### Relationship Dashboard
1. Navigate to the **Relationships** page
2. View all requirements that have linked tasks or issues
3. Click on any requirement to expand and see:
   - All related tasks
   - All related issues
   - Details for each linked entity

### Relationship Summary
- View statistics at the bottom:
  - Total requirements with links
  - Total linked tasks
  - Total linked issues

### Understanding Relationships
- Relationships are automatically detected based on ID references
- A requirement is linked to a task if the task's "Requirement ID" matches the requirement's "ID-Code"
- A requirement is linked to an issue if the issue's "Requirement ID" matches the requirement's "ID-Code"

## Action Log

### Viewing All Changes
1. Navigate to the **Action Log** page
2. View a complete history of all changes across all entities
3. Information displayed:
   - Timestamp
   - Entity Type (requirement, task, or issue)
   - Entity ID
   - Changed Fields (as badges)
   - Before/After values for each field

### Understanding the Action Log
- Each row represents one save operation
- Only fields that actually changed are recorded
- Changes are never deleted, providing a complete audit trail

## Exporting Data

### Export to Excel
1. From the home page, click "Export to Excel"
2. The system generates a new Excel file containing:
   - All requirements (Requirements sheet)
   - All tasks (Tasks sheet)
   - All issues (Issue sheet)
   - All dependencies (Dependency sheet)
   - All assumptions (Assumptions sheet)
   - Complete action log (Action log sheet)
3. The file downloads automatically
4. Filename format: `SSOT-Export-YYYY-MM-DD.xlsx`

### Excel Export Structure
- The exported file maintains the same structure as the original import file
- All column names and data types are preserved
- The Action Log sheet includes:
  - Entity Type
  - Entity ID
  - Changed Fields (JSON format)
  - Timestamp

## Best Practices

### Data Entry
- Always update the "Last Update" field when making changes
- Use consistent status values (Open, Closed, Pending, Solved)
- Use consistent priority values (Very High, High, Medium, Low)

### Change Tracking
- Review the action log regularly to monitor project changes
- Use the history feature to understand the evolution of requirements
- Export data periodically for backup purposes

### Relationship Management
- Ensure Task IDs and Issue IDs reference valid Requirement IDs
- Use the Relationships page to verify all connections
- Update linked entities when requirements change

### Search and Filter
- Use specific search terms for faster results
- Combine search with filters for precise queries
- Search is case-insensitive

## Troubleshooting

### Import Issues
- Ensure your Excel file has the correct sheet names:
  - Requirements
  - Tasks
  - Issue (not Issues)
  - Dependency
  - Assumptions
- Verify column headers match exactly
- Check for special characters in data

### Missing Relationships
- Verify that Task "Requirement ID" matches Requirement "ID-Code"
- Verify that Issue "Requirement ID" matches Requirement "ID-Code"
- IDs are case-sensitive

### Changes Not Saving
- Ensure you click the "Save" button after editing
- Check for error messages in the toast notifications
- Verify you're signed in

### History Not Showing
- Changes only appear in history after they're saved
- The first import doesn't create action log entries
- Only subsequent edits are tracked

## Technical Details

### Delta Change Detection
The system compares the current state with the new state field-by-field:
- Only fields that have different values are recorded
- Both old and new values are stored
- Timestamps are automatically generated
- User ID is recorded for accountability

### Data Storage
- All data is stored in a MySQL/TiDB database
- Action logs are stored separately from entity data
- Relationships are computed dynamically based on ID references

### Security
- Authentication required via Manus OAuth
- All changes are attributed to the logged-in user
- Data is isolated per project

## Support

For technical issues or feature requests, please contact the project administrator.

---

**Version**: 1.0  
**Last Updated**: January 2026
