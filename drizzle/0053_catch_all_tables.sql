-- ─── Catch-all: create all tables missing from earlier migrations ──────────────
-- Uses IF NOT EXISTS everywhere so it is safe to run on any database state.

CREATE TABLE IF NOT EXISTS `projectCharter` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `objectives` text,
  `scopeStatement` text,
  `outOfScope` text,
  `successCriteria` text,
  `constraints` text,
  `methodology` varchar(100) DEFAULT 'Waterfall',
  `projectStartDate` date,
  `projectEndDate` date,
  `phase` varchar(100),
  `ragStatus` enum('Green','Amber','Red') DEFAULT 'Green',
  `ragJustification` text,
  `sponsorId` int,
  `projectManagerId` int,
  `budget` decimal(15,2),
  `currency` varchar(10) DEFAULT 'USD',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projectCharter_projectId_unique` (`projectId`)
);

CREATE TABLE IF NOT EXISTS `teamCharter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `mission` text,
  `scopeAndBoundaries` text,
  `metricsOfSuccess` text,
  `coreValues` text,
  `groundRules` text,
  `restrictedViolations` text,
  `teamActivities` text,
  `internalCommunicationPlan` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teamCharter_projectId_unique` (`projectId`)
);

CREATE TABLE IF NOT EXISTS `engagementStatusHistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `projectId` int NOT NULL,
  `statusType` enum('current','desired') NOT NULL,
  `engagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
  `assessedBy` varchar(200),
  `assessmentDate` date NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `engagementTaskGroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `fromStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading','Any') NOT NULL,
  `toStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
  `color` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `engagementTasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taskGroupId` int NOT NULL,
  `projectId` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `responsibleId` int,
  `dueDate` date,
  `engTaskStatus` enum('Pending','In Progress','Done','Cancelled') NOT NULL DEFAULT 'Pending',
  `engTaskPriority` enum('Low','Medium','High') NOT NULL DEFAULT 'Medium',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `engagementTaskSubjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taskGroupId` int NOT NULL,
  `stakeholderId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ets_unique` (`taskGroupId`, `stakeholderId`)
);

CREATE TABLE IF NOT EXISTS `stakeholderSkills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `skillLevel` enum('Beginner','Intermediate','Advanced','Expert') NOT NULL DEFAULT 'Intermediate',
  `linkedKpiId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `stakeholderSwot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `swotQuadrant` enum('Strength','Weakness','Opportunity','Threat') NOT NULL,
  `description` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `developmentPlans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `projectId` int NOT NULL,
  `title` varchar(200) NOT NULL,
  `description` text,
  `goals` text,
  `startDate` date,
  `endDate` date,
  `devPlanStatus` enum('Not Started','In Progress','Completed','On Hold') NOT NULL DEFAULT 'Not Started',
  `linkedTaskGroupId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `communicationPlanEntries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `stakeholderId` int,
  `role` varchar(200),
  `informationNeeded` text,
  `preferredMethods` json,
  `frequency` varchar(100),
  `textNote` text,
  `escalationProcedures` text,
  `responsible` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `resourceCalendar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `projectId` int NOT NULL,
  `date` date NOT NULL,
  `calType` enum('Working','Leave','Holiday','Training') NOT NULL DEFAULT 'Working',
  `availableHours` decimal(4,1) DEFAULT '8.0',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `budgetEntries` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `estimatedCost` decimal(15,2) DEFAULT '0',
  `actualCost` decimal(15,2) DEFAULT '0',
  `entityType` varchar(50),
  `entityId` varchar(50),
  `budgetStatus` enum('Planned','Committed','Spent','Cancelled') NOT NULL DEFAULT 'Planned',
  `entryDate` date,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `userId` int NOT NULL,
  `notificationType` enum('task_overdue','issue_escalated','cr_submitted','risk_high','task_assigned','decision_added','due_soon') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `entityType` varchar(50),
  `entityId` varchar(50),
  `read` boolean NOT NULL DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `projectBudget` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `totalBudget` decimal(15,2) DEFAULT '0',
  `currency` varchar(10) DEFAULT 'USD',
  `notes` text,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `projectBudget_projectId_unique` (`projectId`)
);

CREATE TABLE IF NOT EXISTS `resourceCapacity` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `stakeholderId` int NOT NULL,
  `weekStart` date NOT NULL,
  `availableHours` decimal(5,1) DEFAULT '40',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `actionItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `actionItemId` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `ownerId` int,
  `owner` varchar(255),
  `dueDate` date,
  `status` enum('Open','In Progress','Done','Cancelled') DEFAULT 'Open',
  `priority` enum('Low','Medium','High','Critical') DEFAULT 'Medium',
  `sourceType` varchar(50),
  `sourceId` varchar(50),
  `meetingId` int,
  `notes` text,
  `completedDate` date,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `scopeItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `idCode` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `phase` varchar(100),
  `processArea` varchar(100),
  `category` varchar(100),
  `status` varchar(50) DEFAULT 'Active',
  `priority` varchar(50),
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `slaPolicies` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `priority` enum('Critical','High','Medium','Low') NOT NULL,
  `responseTimeHours` int NOT NULL DEFAULT 4,
  `resolutionTimeHours` int NOT NULL DEFAULT 24,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slaPolicies_project_priority_unique` (`projectId`, `priority`)
);

CREATE TABLE IF NOT EXISTS `comments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `entityType` varchar(50) NOT NULL,
  `entityId` varchar(100) NOT NULL,
  `authorName` varchar(200),
  `content` text NOT NULL,
  `parentId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `goals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `owner` varchar(200),
  `status` enum('Not Started','In Progress','At Risk','Achieved','Cancelled') NOT NULL DEFAULT 'Not Started',
  `startDate` date,
  `endDate` date,
  `progress` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `keyResults` (
  `id` int AUTO_INCREMENT NOT NULL,
  `goalId` int NOT NULL,
  `projectId` int NOT NULL,
  `title` varchar(300) NOT NULL,
  `targetValue` decimal(10,2),
  `currentValue` decimal(10,2) DEFAULT '0',
  `unit` varchar(50),
  `status` enum('Not Started','In Progress','At Risk','Achieved') NOT NULL DEFAULT 'Not Started',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `sprints` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `goal` text,
  `status` enum('Planning','Active','Completed','Cancelled') NOT NULL DEFAULT 'Planning',
  `startDate` date,
  `endDate` date,
  `capacity` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `timeLogs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `taskId` int,
  `taskDescription` varchar(300),
  `loggedBy` varchar(200),
  `logDate` date NOT NULL,
  `hoursLogged` decimal(5,2) NOT NULL,
  `description` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `projectTemplates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `createdBy` int NOT NULL,
  `snapshot` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `customFieldDefs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `entityType` enum('task','issue','risk','requirement','stakeholder','deliverable','milestone','action_item','change_request') NOT NULL,
  `fieldKey` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  `fieldType` enum('text','number','date','select','multi_select','checkbox','url','email','textarea','rating') NOT NULL DEFAULT 'text',
  `options` json,
  `required` boolean DEFAULT false,
  `sortOrder` int DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `customFieldValues` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `fieldDefId` int NOT NULL,
  `entityType` varchar(50) NOT NULL,
  `entityId` varchar(100) NOT NULL,
  `value` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

-- ─── Missing columns (IF NOT EXISTS — safe to run on any state) ───────────────
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `communicationResponsibleId` int;
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `department` varchar(200);
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `classification` enum('TeamMember','External','Stakeholder') DEFAULT 'Stakeholder';
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `isPooledResource` tinyint(1) DEFAULT 0;
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `workingHoursPerDay` decimal(4,1) DEFAULT '8.0';
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `workingDaysPerWeek` int DEFAULT 5;
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `stakeholderManagerId` int;
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `currentEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading');
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `desiredEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading');
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `costPerHour` decimal(10,2);
ALTER TABLE `stakeholders` ADD COLUMN IF NOT EXISTS `costPerDay` decimal(10,2);
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `communicationStakeholderId` int;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `sprintId` int;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `manHours` decimal(10,2);
ALTER TABLE `changeRequests` ADD COLUMN IF NOT EXISTS `scopeItemId` int;
ALTER TABLE `requirements` ADD COLUMN IF NOT EXISTS `scopeItemId` int;
ALTER TABLE `knowledgeBase` ADD COLUMN IF NOT EXISTS `linkedDocumentId` int;

-- projectCharter extended columns (Business Case, Governance, Need Assessment tabs)
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `businessCaseCause` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `businessCaseSummary` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `feasibilityStudy` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `governanceStructure` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `pmResponsibilities` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `escalationPath` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `decisionAuthority` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `needAssessment` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `benefitsManagementPlan` text;
ALTER TABLE `projectCharter` ADD COLUMN IF NOT EXISTS `expectedBenefits` json;
