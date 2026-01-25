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
