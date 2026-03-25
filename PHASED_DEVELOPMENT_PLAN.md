# Project Management SSOT — Phased Development Master Plan
**Date:** 2026-03-17
**Reference:** PMBOK® 8th Edition, PMI Standards, PMO Best Practices
**Goal:** Integrated, standalone, single source of truth for project managers — trace, report, and manage everything, with full tailoring/customization on every dropdown, type, and selection.

---

## Branch Feature Inventory

| Feature Area | moaazhomaid | main | MANUS | Claude Branch |
|---|:---:|:---:|:---:|:---:|
| Requirements / Tasks / Issues | ✅ | ✅ | ✅ | ✅ |
| Risk Register | ✅ | ✅ | ✅ | ✅ |
| Gantt Chart | ✅ | ✅ (drag+baseline) | ✅ | ✅ |
| Kanban Board | ❌ | ✅ | ✅ | ✅ |
| Calendar View | ❌ | ✅ | ✅ | ✅ |
| Saved Views | ❌ | ✅ | ✅ | ✅ |
| Custom Fields Engine | ❌ | ✅ | ✅ | ✅ |
| Stakeholder Basic | ✅ | ✅ | ✅ | ✅ |
| Stakeholder Classification | ❌ | ❌ | ✅ | ✅ |
| Engagement Planning | ❌ | ❌ | ✅ | ✅ |
| Communication Plan | ❌ | ❌ | ✅ | ✅ |
| Project Charter | ❌ | ✅ | ✅ | ✅ |
| Milestones | ❌ | ✅ | ✅ | ✅ |
| Budget Management | ❌ | ✅ | ✅ | ✅ |
| WBS | ❌ | ❌ | ✅ | ✅ |
| RBS | ❌ | ❌ | ✅ | ✅ |
| Knowledge Base | ✅ | ✅ | ✅ | ✅ |
| Lessons Learned | ❌ | ✅ | ✅ | ✅ |
| EEF | ❌ | ❌ | ✅ | ✅ |
| OPA (Documents + KB + LL + EEF) | ❌ | partial | ✅ | ✅ |
| Goals / OKRs | ❌ | ❌ | ✅ | ✅ |
| Sprints | ❌ | ❌ | ✅ | ✅ |
| SLA / Tickets | ❌ | ❌ | ✅ | ✅ |
| Time Tracking | ❌ | ❌ | ✅ | ✅ |
| Team Charter | ❌ | ❌ | ✅ | ✅ |
| Portfolio | ❌ | ❌ | ✅ | ✅ |
| Resource Capacity Planning | ❌ | ❌ | partial | partial |
| Dynamic Dropdowns (tailoring) | ❌ | partial | ✅ | ✅ |
| PMO Dashboard / Widgets | ❌ | partial | ✅ | ✅ |
| Earned Value Management (EVM) | ❌ | ❌ | ❌ | ❌ |
| Procurement Management | ❌ | ❌ | ❌ | ❌ |
| Quality Management | ❌ | ❌ | ❌ | ❌ |
| Benefits Realization | ❌ | ❌ | ❌ | ❌ |
| Project Health Scorecard | ❌ | ❌ | ❌ | ❌ |
| Change Control Board (CCB) | ❌ | partial | ❌ | ❌ |
| Document Version Control | ❌ | ❌ | ❌ | ❌ |
| Notifications | ❌ | ✅ | ✅ | ✅ |
| AI Assistant | ❌ | ✅ | ✅ | ✅ |

---

## PMBOK® Knowledge Areas Coverage Analysis

| PMBOK Knowledge Area | Current State | Gap |
|---|---|---|
| **1. Integration Management** | Charter, Change Requests | No integrated change control board, no project plan versioning |
| **2. Scope Management** | Requirements, WBS, Scope Items | No scope baseline locking, no scope creep tracking |
| **3. Schedule Management** | Gantt, Milestones, Tasks | No baseline comparison, no critical path, no SPI |
| **4. Cost Management** | Budget | No EVM (EV/PV/AC/CPI/SPI/EAC/VAC/ETC) |
| **5. Quality Management** | Test Cases only | No quality plan, quality metrics, process audits, defect trends |
| **6. Resource Management** | Team members, RBS, capacity | No resource leveling, no allocation % tracking |
| **7. Communication Management** | Comm Plan | No formal communication matrix, no distribution list mgmt |
| **8. Risk Management** | Risk Register | No quantitative risk analysis (Monte Carlo concept), no response tracking |
| **9. Procurement Management** | None | Entire domain missing — contracts, vendors, RFP, PO, SOW |
| **10. Stakeholder Management** | Full engagement | No power/interest matrix export, no stakeholder register report |

---

## Phased Development Plan

---

### PHASE 1 — Foundation & Branch Consolidation
**Target:** Merge the best of all branches into one stable, unified codebase
**Duration:** 2-3 weeks

#### 1.1 Core Merge (from MANUS/Claude as base)
- Take MANUS/Claude branch as the base (most complete: 91 tables, 50 pages)
- Bring over from `main`:
  - Kanban board view with color-coded priority pills
  - Saved Views component with quick-filter chips
  - Task calendar (month/week view)
  - Custom Fields engine (definitions + values)
  - Gantt drag-to-move + resize handles + baseline overlay
  - Compact vs. detail task list toggle
  - Notifications system + notification bell
  - Global Search dialog
  - AI Chat box (AIChatBox)
  - Weekly Report PDF generator
  - Traceability Matrix

#### 1.2 Universal Tailoring Engine (all dropdowns customizable)
**Every select/dropdown in the system must be backed by a settings-managed option list.**
- Create a central `dropdownRegistry` table: `{ projectId, domain, fieldKey, value, color, icon, sortOrder, isDefault, isActive }`
- Domains cover every page: tasks, issues, risks, requirements, stakeholders, comm-plan, LL, EEF, etc.
- Settings page: "Customize Options" section per domain
- Default seed values loaded per project on creation
- UI: All `<Select>` components auto-load from registry, with inline "+ Add option" in dropdowns
- Covers: Task Status, Task Priority, Task Type, Issue Status, Issue Priority, Issue Type, Risk Level, Risk Category, Risk Status, Stakeholder Classification, Engagement Status, Communication Frequency, Communication Channel, LL Category/Impact/Status/Phase, EEF Category/Impact, Requirement Status/Priority, Deliverable Type/Status, Decision Status, Change Request Status/Impact, Budget Category, Milestone Status, Resource Type, Procurement Status

#### 1.3 Sidebar & Navigation Cleanup
- Organize sidebar into clear PMP domain sections:
  - **Initiation**: Project Charter, Team Charter, Stakeholders, Goals
  - **Planning**: WBS, RBS, Scope Items, Requirements, Milestones, Gantt, Risk Register, Budget, Resource Plan, Communication Plan, Procurement Plan, Quality Plan
  - **Execution**: Tasks, Issues, Sprints, Change Requests, Meetings, Action Items, Time Tracking
  - **Monitoring & Control**: Dashboard, Engagement Plan, Traceability Matrix, RAID Log, Periodic Report, Weekly Report, Health Scorecard
  - **Closure**: Lessons Learned, Project Closure Checklist
  - **OPA**: Document Library, Knowledge Base, EEF
  - **Settings**: Members, Dropdowns, Custom Fields, Work Week, Notifications

#### 1.4 Project Templates
- Save any project as a template (structure only, no data)
- Templates include: dropdown options, custom fields, comm plan templates, risk categories, WBS structure
- Apply template on new project creation

---

### PHASE 2 — Planning Domain (Complete)
**Target:** Full PMBOK Planning knowledge area coverage
**Duration:** 3-4 weeks

#### 2.1 WBS (Work Breakdown Structure) — Enhanced
- Interactive tree editor (drag-and-drop reordering, parent-child indent)
- WBS nodes: code (1.0, 1.1, 1.1.1), name, description, responsible, estimated effort, linked deliverables
- Link WBS nodes → Requirements → Tasks (traceability chain)
- WBS Dictionary: per-node description, acceptance criteria, assumptions
- Export WBS to PDF / Excel
- **Tailoring:** WBS code format customizable (1.0 vs. 1-1 vs. custom prefix)

#### 2.2 Scope Baseline & Scope Creep Tracker
- Lock scope baseline (Requirements + WBS snapshot) at planning approval
- Scope creep dashboard: count of Change Requests that added scope, % scope increase
- Scope items linked to Change Requests for full audit trail

#### 2.3 Schedule Baseline & Critical Path
- Gantt: lock schedule baseline (planned start/end per task)
- Baseline overlay: planned bars vs. actual bars on same Gantt row
- Critical Path Method (CPM): auto-detect longest path, highlight critical tasks in red
- Float/Slack display per task
- Schedule Variance (SV = EV - PV) per milestone
- Schedule Performance Index (SPI = EV / PV)

#### 2.4 Earned Value Management (EVM) — NEW MODULE
**This is the biggest missing PMP feature.**
- **EVM Setup** per project: define BAC (Budget at Completion)
- **Planned Value (PV)**: auto-calculated from task planned effort × resource rate × % complete by date
- **Earned Value (EV)**: % complete of tasks × BAC portion
- **Actual Cost (AC)**: pulled from Time Tracking logs × resource rates
- **Calculated Metrics:**
  - Cost Variance: CV = EV - AC (positive = under budget)
  - Schedule Variance: SV = EV - PV (positive = ahead of schedule)
  - Cost Performance Index: CPI = EV / AC
  - Schedule Performance Index: SPI = EV / PV
  - Estimate at Completion: EAC = BAC / CPI
  - Estimate to Complete: ETC = EAC - AC
  - Variance at Completion: VAC = BAC - EAC
  - To-Complete Performance Index: TCPI = (BAC - EV) / (BAC - AC)
- **EVM Dashboard**: S-curve chart (PV vs EV vs AC over time), CPI/SPI trend line, EAC forecast
- **Tailoring:** CPI/SPI thresholds for RAG status customizable

#### 2.5 Resource Planning & Capacity Management — Enhanced
- Resource demand view: per resource, per week/month, total hours planned
- Capacity vs. Demand chart (bar chart: available hours vs. assigned hours)
- Over-allocation alerts (red highlight when assigned > capacity)
- Resource rate cards: cost per hour per resource type (already in schema, surface in UI)
- Pooled resources: shared across projects, cross-project capacity view
- **Tailoring:** Working days per week, holidays calendar, hours per day — all per project

#### 2.6 Procurement Management — NEW MODULE
- **Procurement Plan**: list of items to procure (goods/services), type, justification, planned date
- **Vendor Registry**: vendor name, contact, category, rating, status, linked documents
- **RFP / RFQ Tracker**: title, status (Draft → Issued → Received → Evaluated → Awarded), closing date, linked vendors
- **Contracts**: contract #, vendor, type (Fixed Price / T&M / Cost-Plus), value, start/end date, status, key deliverables, penalties
- **Purchase Orders (POs)**: PO #, vendor, items, amount, status (Draft → Approved → Delivered → Closed)
- **Procurement Audit Log**: every status change tracked with timestamp + user
- Link procurement items → Budget lines → Tasks
- **Tailoring:** Procurement types, vendor categories, contract types, PO status — all customizable

#### 2.7 Quality Management Plan — NEW MODULE
- **Quality Plan**: quality standards, quality objectives, quality metrics per project
- **Quality Metrics**: metric name, measurement method, acceptable range, current value, status (Green/Yellow/Red)
- **Process Audits**: audit title, scope, auditor, date, findings, status (Open/Closed)
- **Quality Checklists**: linked to deliverables or test cases, checklist items with pass/fail
- **Defect Tracking**: defect ID, description, severity, linked issue, resolution, trend chart
- Quality Metrics Dashboard: trend charts per metric over time
- **Tailoring:** Quality standards list, audit types, defect severity levels — all customizable

---

### PHASE 3 — Execution & Monitoring Domain
**Target:** Full execution tracking, escalation, and control
**Duration:** 3-4 weeks

#### 3.1 Project Health Scorecard — NEW MODULE
- One-page project health view (RAG status per domain):
  - Schedule Health (SPI)
  - Cost Health (CPI)
  - Scope Health (% scope change)
  - Risk Health (open high risks count)
  - Quality Health (defect rate, test pass %)
  - Stakeholder Health (avg engagement level)
  - Team Health (resource utilization %)
- Each indicator: current value, threshold (Green/Yellow/Red), trend arrow (↑↓→)
- **Tailoring:** RAG thresholds configurable per project

#### 3.2 Formal Change Control Board (CCB) — Enhanced
- Change Request workflow: Draft → Submitted → CCB Review → Approved/Rejected → Implemented → Closed
- CCB Members: assign reviewers per project, automatic notification on submission
- Approval record: who approved/rejected, date, comments
- Impact assessment fields: cost impact, schedule impact, scope impact, risk impact
- Link CR → affected requirements, tasks, milestones, risks
- CCB Meeting integration: CRs can be added to meeting agenda items

#### 3.3 Issue Escalation & Resolution
- Escalation matrix: define escalation levels (L1/L2/L3) with responsible roles and SLA hours
- Auto-escalate issues overdue past SLA
- Escalation history log per issue
- **Tailoring:** Escalation levels, SLA hours per severity — customizable

#### 3.4 Risk Response Tracking — Enhanced
- Each risk response gets: action item, owner, due date, status, completion %
- Risk response actions linked to Tasks (auto-create task from risk response)
- Risk trend chart: count of risks by status over time
- Residual risk assessment after response implementation
- Quantitative risk score: Probability × Impact matrix (customize scale 1-3, 1-5, 1-10)
- **Tailoring:** Risk categories, probability/impact scales, response strategy types — all customizable

#### 3.5 Issue-Risk-Decision Traceability
- Full bidirectional links:
  - Issue → Root Cause → Risk (if risk was raised to issue)
  - Issue → Decision (decision made to resolve issue)
  - Decision → Change Request (decision triggered a change)
  - Risk → Action Item → Task
- Visual traceability map for any item

#### 3.6 RAID Log — Enhanced (Risks + Assumptions + Issues + Dependencies)
- Consolidated RAID view: all 4 types in one table with type filter
- Cross-link: Assumption → Issue (if assumption proved wrong)
- Dependency blockers: flag dependency as blocking, auto-flag linked tasks as blocked
- Export RAID to Excel/PDF

#### 3.7 Periodic Report — Enhanced
- Auto-generate report from live data: EVM metrics, milestone status, risks, issues, decisions, budget
- Report templates: Executive Summary, Detailed Status, EVM Report, Stakeholder Report
- Schedule reports: weekly/bi-weekly/monthly auto-generation
- Export to PDF with project branding (logo, colors)
- Share via link (stakeholder portal) or email
- **Tailoring:** Report sections and their order are customizable per template

---

### PHASE 4 — Stakeholder & Communication Domain
**Target:** World-class stakeholder engagement aligned with PMBOK Stakeholder Management
**Duration:** 2-3 weeks

#### 4.1 Stakeholder Register — Complete
- All PMBOK fields: name, organization, role, contact, classification, influence, interest, impact
- Power/Interest matrix: visual quadrant chart (Keep Satisfied / Manage Closely / Monitor / Keep Informed)
- Current vs. Desired engagement level: Unaware → Resistant → Neutral → Supportive → Leading
- Stakeholder register export as PDF/Excel
- **Tailoring:** Classification types, engagement status labels, influence/interest scale — customizable

#### 4.2 Stakeholder Engagement Assessment Matrix
- Grid view: stakeholders × engagement levels, mark current (C) and desired (D)
- Gap analysis: highlight where current ≠ desired
- History: track engagement level changes over time with trend indicator
- Auto-generate engagement action items from gaps

#### 4.3 Communication Management Plan — Enhanced
- RACI-based communication matrix:
  - Rows: Information/Report type
  - Columns: Stakeholders
  - Cells: R (Responsible to send) / A (Accountable) / C (Consulted) / I (Informed)
- Communication entry fields: what, to whom, when, how (channel), who is responsible, format
- Auto-generate recurring tasks from comm plan entries
- Distribution list management per communication type
- Communication log: record of actual communications sent (date, method, notes)
- **Tailoring:** Communication methods, frequencies, formats — all customizable

#### 4.4 Stakeholder Skills & Development Plans
- Skills matrix: stakeholders × skills, rated 1-5
- Skills gap analysis vs. project requirements
- Development plan: objectives, training, timeline, status
- Team SWOT per stakeholder (Strengths / Weaknesses / Opportunities / Threats)

#### 4.5 External Parties & Vendor Contact Directory
- External party registry: name, type (Client/Vendor/Regulator/Partner/Consultant), contact persons, notes
- Link external parties to stakeholders, procurement contracts, and communications
- **Tailoring:** External party types — customizable

---

### PHASE 5 — Reporting & Intelligence Domain
**Target:** PMO-grade dashboards, analytics, and export suite
**Duration:** 3-4 weeks

#### 5.1 PMO Executive Dashboard — Enhanced
- Configurable widget grid (drag-and-drop layout per user)
- Widget types:
  - KPI Card (single metric with RAG status + trend arrow)
  - Bar Chart (tasks by status, issues by priority, etc.)
  - Pie Chart (budget allocation, risk distribution)
  - S-Curve (EVM — PV/EV/AC over time)
  - Burndown Chart (sprint/milestone progress)
  - Gantt Mini-View (upcoming milestones)
  - Heatmap (resource utilization by week)
  - Table Widget (top risks, overdue tasks, open issues)
  - Status Ring (% complete, health ring)
- Role-based defaults: PM view, Executive view, Team Member view
- **Tailoring:** Any metric thresholds for RAG indicators configurable

#### 5.2 EVM Dashboard & Reports
- S-Curve: Planned Value vs. Earned Value vs. Actual Cost over project timeline
- CPI Trend Chart: cost performance index per reporting period
- SPI Trend Chart: schedule performance index per reporting period
- EAC/ETC Forecast table
- Variance Analysis table: per deliverable/WBS node
- Export as PDF report with charts

#### 5.3 Resource Utilization Reports
- Workload heatmap: team member × week, color-coded by utilization %
- Over/under allocation flagging
- Capacity planning chart: available vs. committed hours per month
- Time log reports: actual hours per person per task per period
- Cost reports: actual cost vs. planned cost per resource

#### 5.4 Custom Report Builder
- Drag-and-drop report builder:
  - Select data source (Tasks / Issues / Risks / Budget / Stakeholders / etc.)
  - Choose fields to display
  - Apply filters and grouping
  - Choose visualization (table / bar / pie / line)
- Save and schedule reports
- Share reports via link or export (PDF / Excel / CSV)

#### 5.5 Audit & Traceability Reports
- Requirements traceability matrix: Requirement → WBS → Task → Test Case → Deliverable
- Change impact report: all changes and their downstream effects
- Decision log report: decisions, rationale, owners, linked CRs
- Full audit trail: every record change logged with user, timestamp, old value, new value

#### 5.6 Benefits Realization Tracker — NEW MODULE
- Define project benefits: benefit name, description, type (Financial/Operational/Strategic), owner
- KPI per benefit: metric name, baseline value, target value, measurement method, frequency
- Benefit realization schedule: when will benefit be measured
- Actual vs. Target tracking: log actual values over time
- Benefits realization report: dashboard showing benefit achievement %
- **Tailoring:** Benefit types, KPI measurement frequencies — customizable

---

### PHASE 6 — Enterprise & Configuration Domain
**Target:** Multi-project portfolio, templates, full white-labeling, enterprise tailoring
**Duration:** 3-4 weeks

#### 6.1 Portfolio & Program Management
- Portfolio view: all projects in a grid with health scorecards, EVM metrics, resource utilization
- Portfolio health dashboard: aggregated KPIs across all projects
- Program grouping: group related projects under a program
- Cross-project dependencies: link tasks across projects
- Resource pool management: share team members across projects, conflict detection
- Portfolio timeline (multi-project Gantt)
- Budget consolidation: total portfolio budget vs. actuals

#### 6.2 Project Templates Engine — Enhanced
- Full template library: save/restore complete project structure
- Template contents: WBS, RBS, risk register seeds, comm plan, quality metrics, custom fields, dropdown options, resource types
- Template categories: Software Development, Construction, IT Infrastructure, Consulting, etc.
- Import/export templates as JSON

#### 6.3 Universal Tailoring Center (Settings)
**Every dropdown, status, type, and label in the system is customizable per project.**
- **Global Defaults**: system-wide defaults for all option lists
- **Project Override**: each project can override any global default
- **Field Labels**: rename any field label (e.g., "Issues" → "Defects", "Tasks" → "Activities")
- **Page Visibility**: show/hide any section per project type
- **Custom Status Workflows**: define custom status transitions (e.g., task can only go from In Progress → Review before Done)
- **Custom Priority Scales**: 3-level, 5-level, or custom labels
- **Custom ID Formats**: configure prefix and padding per entity (e.g., TASK-001, PRJ-DEL-001)
- Audit log of all settings changes

#### 6.4 Document Version Control — Enhanced
- Document versions: upload multiple versions of same document
- Version comparison: side-by-side diff for text documents
- Approval workflow: draft → review → approved → published
- Approval signatures: assigned reviewers must approve before publishing
- Document register: full registry with version history, status, owner, review date
- Link documents to any record (risk, issue, task, deliverable, procurement)
- **Tailoring:** Document types, review cycles, approval levels — all customizable

#### 6.5 Stakeholder Portal — Self-Service
- Token-based access for external stakeholders (no login required)
- View-only dashboard tailored per stakeholder: their tasks, issues assigned to them, comm plan
- Submit feedback / issues via portal form
- Engagement survey: stakeholder rates their own engagement level
- Portal branding: project logo and color theme

#### 6.6 Project Closure Module
- Closure checklist: auto-generated from project type, with items for each domain
- Closure report: final EVM metrics, milestone achievement, lessons learned summary, quality summary
- Administrative closure: archive project, transfer documents, release resources
- Post-project review: schedule review meeting, capture final lessons
- Benefits handover: transfer benefits tracking to operations team

#### 6.7 Notifications & Automation
- Smart notifications: task due soon (3-day, 1-day warning), overdue alerts, risk status change, budget threshold breached, SPI/CPI below threshold
- Automation rules (trigger → action):
  - "When task status = Completed AND linked deliverable has no other open tasks → notify PM"
  - "When CPI < 0.9 → create alert in dashboard"
  - "When risk probability = High AND impact = High → auto-create action item"
  - "When Change Request approved → auto-update linked tasks"
- Configurable notification channels: in-app, email
- **Tailoring:** All automation rules configurable per project

---

## Non-Functional Requirements (Across All Phases)

### Performance
- Page load < 2 seconds for tables up to 10,000 rows (virtual scrolling)
- Gantt renders up to 500 tasks without lag
- Dashboard widgets lazy-load independently

### Accessibility & UX
- Keyboard navigation throughout
- Dark/Light theme toggle (already exists)
- Mobile-responsive layout for key views (dashboard, tasks, issues)
- Inline editing: click any cell to edit without opening a dialog
- Bulk actions: select multiple rows → bulk update status/assignee/priority

### Data Integrity
- Audit trail on every table: created_by, created_at, updated_by, updated_at, deleted_at (soft delete)
- Optimistic locking: prevent concurrent edit overwrites
- Data validation on all forms with inline error messages

### Export & Integration
- Excel import/export on every table (already exists on some — extend to all)
- PDF export for all reports and forms
- REST API documentation (auto-generated Swagger/OpenAPI)
- Webhook support: push events to external systems on record changes

---

## Priority Feature Backlog (Quick Wins to Ship Between Phases)

| Priority | Feature | Phase | Effort |
|---|---|---|---|
| P0 | Universal Tailoring Engine (all dropdowns customizable) | 1 | High |
| P0 | Earned Value Management (EVM) dashboard | 2 | High |
| P0 | Project Health Scorecard (RAG) | 3 | Medium |
| P1 | Procurement Management module | 2 | High |
| P1 | Quality Management module | 2 | Medium |
| P1 | CCB workflow (approval chain for CRs) | 3 | Medium |
| P1 | RACI Communication Matrix | 4 | Medium |
| P1 | Benefits Realization Tracker | 5 | Medium |
| P1 | Custom Report Builder | 5 | High |
| P2 | Document Version Control | 6 | Medium |
| P2 | Portfolio Dashboard | 6 | High |
| P2 | Automation Rules Engine | 6 | High |
| P2 | Stakeholder Portal | 6 | Medium |
| P2 | Project Closure Module | 6 | Low |

---

## Database Tables to Add (New Modules)

```
-- EVM
evmSnapshots (projectId, snapshotDate, pv, ev, ac, cpi, spi, eac, etc, vac, bac)

-- Procurement
procurementPlanItems (id, projectId, title, type, justification, plannedDate, status, budgetLineId)
vendors (id, projectId, name, category, contact, rating, status, notes)
rfpRfq (id, projectId, title, type, status, closingDate, issuedDate, linkedVendors[])
contracts (id, projectId, vendorId, number, type, value, startDate, endDate, status, deliverables, penalties)
purchaseOrders (id, projectId, contractId, vendorId, number, items, amount, status)

-- Quality
qualityPlan (id, projectId, standards, objectives, notes)
qualityMetrics (id, projectId, name, method, baseline, target, currentValue, status, trend)
qualityAudits (id, projectId, title, scope, auditor, scheduledDate, conductedDate, findings, status)
qualityChecklists (id, projectId, linkedEntityType, linkedEntityId, items[{text, result}])

-- Health Scorecard
healthSnapshots (id, projectId, date, scheduleHealth, costHealth, scopeHealth, riskHealth, qualityHealth, stakeholderHealth, teamHealth, overall)

-- Benefits
benefits (id, projectId, name, description, type, owner, status)
benefitKpis (id, benefitId, metricName, baseline, target, measurementMethod, frequency)
benefitMeasurements (id, benefitKpiId, date, actualValue, notes, measuredBy)

-- Communication Log
communicationLog (id, projectId, commPlanEntryId, date, method, participants, summary, notes, recordedBy)

-- Document Versions
documentVersions (id, documentId, version, uploadedBy, uploadedAt, fileUrl, status, approvedBy, approvedAt, changeNotes)
documentApprovals (id, documentVersionId, reviewerId, status, comments, reviewedAt)

-- Audit Trail
auditLog (id, projectId, entityType, entityId, fieldName, oldValue, newValue, changedBy, changedAt, action)

-- Automation
automationRules (id, projectId, name, trigger, conditions, action, isActive)
automationLog (id, ruleId, firedAt, result, details)

-- Project Closure
closureChecklists (id, projectId, itemText, category, status, completedBy, completedAt, notes)
```

---

## Sources & References

- [PMBOK® Guide — PMI Standards](https://www.pmi.org/standards/pmbok)
- [10 PMBOK Knowledge Areas — ProjectManager](https://www.projectmanager.com/blog/10-project-management-knowledge-areas)
- [PMBOK 7th/8th Edition Guide — PMTI](https://www.4pmti.com/learn/pmbok-guide-7th-ed/)
- [PMO Dashboard Best Practices — Triskell](https://triskellsoftware.com/blog/pmo-dashboards/)
- [35 Essential PMO KPIs — Triskell](https://triskellsoftware.com/blog/pmo-kpis-metrics/)
- [Integrated PM SSOT — Celoxis](https://www.celoxis.com/article/pmo-software-tool-guide)
- [Process Groups Practice Guide — PMI](https://www.pmi.org/standards/process-groups)
