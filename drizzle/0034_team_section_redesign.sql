-- ─── Team Section Redesign Migration ─────────────────────────────────────────
-- Adds classification system, engagement tracking, and all new Team section tables

-- 1. Add new columns to stakeholders table
ALTER TABLE `stakeholders`
  ADD COLUMN `department` varchar(200) AFTER `phone`,
  ADD COLUMN `classification` enum('TeamMember','External','Stakeholder') DEFAULT 'Stakeholder' AFTER `department`,
  ADD COLUMN `isPooledResource` tinyint(1) DEFAULT 0 AFTER `isInternalTeam`,
  ADD COLUMN `workingHoursPerDay` decimal(4,1) DEFAULT '8.0' AFTER `isPooledResource`,
  ADD COLUMN `workingDaysPerWeek` int DEFAULT 5 AFTER `workingHoursPerDay`,
  ADD COLUMN `stakeholderManagerId` int AFTER `workingDaysPerWeek`,
  ADD COLUMN `currentEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') AFTER `engagementStrategy`,
  ADD COLUMN `desiredEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') AFTER `currentEngagementStatus`;

-- 2. Engagement Status History
CREATE TABLE `engagementStatusHistory` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `projectId` int NOT NULL,
  `statusType` enum('current','desired') NOT NULL,
  `engagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
  `assessedBy` varchar(200),
  `assessmentDate` date NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_esh_stakeholder` (`stakeholderId`),
  KEY `idx_esh_project` (`projectId`)
);

-- 3. Engagement Task Groups
CREATE TABLE `engagementTaskGroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `projectId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `fromStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading','Any') NOT NULL,
  `toStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
  `color` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_etg_project` (`projectId`)
);

-- 4. Engagement Tasks
CREATE TABLE `engagementTasks` (
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
  PRIMARY KEY (`id`),
  KEY `idx_et_group` (`taskGroupId`),
  KEY `idx_et_project` (`projectId`)
);

-- 5. Engagement Task Subjects (which stakeholders are targets of a task group)
CREATE TABLE `engagementTaskSubjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `taskGroupId` int NOT NULL,
  `stakeholderId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_ets_unique` (`taskGroupId`, `stakeholderId`)
);

-- 6. Stakeholder Skills
CREATE TABLE `stakeholderSkills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `skillLevel` enum('Beginner','Intermediate','Advanced','Expert') NOT NULL DEFAULT 'Intermediate',
  `linkedKpiId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ss_stakeholder` (`stakeholderId`)
);

-- 7. Stakeholder SWOT
CREATE TABLE `stakeholderSwot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `swotQuadrant` enum('Strength','Weakness','Opportunity','Threat') NOT NULL,
  `description` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_swot_stakeholder` (`stakeholderId`)
);

-- 8. Development Plans
CREATE TABLE `developmentPlans` (
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
  PRIMARY KEY (`id`),
  KEY `idx_dp_stakeholder` (`stakeholderId`),
  KEY `idx_dp_project` (`projectId`)
);

-- 9. Team Charter (one per project)
CREATE TABLE `teamCharter` (
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

-- 10. Communication Plan Entries
CREATE TABLE `communicationPlanEntries` (
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
  PRIMARY KEY (`id`),
  KEY `idx_cpe_project` (`projectId`)
);

-- 11. Resource Calendar
CREATE TABLE `resourceCalendar` (
  `id` int NOT NULL AUTO_INCREMENT,
  `stakeholderId` int NOT NULL,
  `projectId` int NOT NULL,
  `date` date NOT NULL,
  `calType` enum('Working','Leave','Holiday','Training') NOT NULL DEFAULT 'Working',
  `availableHours` decimal(4,1) DEFAULT '8.0',
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rc_stakeholder` (`stakeholderId`),
  KEY `idx_rc_date` (`date`)
);
