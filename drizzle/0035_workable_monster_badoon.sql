CREATE TABLE `commPlanItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entryId` int NOT NULL,
	`projectId` int NOT NULL,
	`description` text NOT NULL,
	`commType` enum('Push','Pull','Interactive','Other') NOT NULL DEFAULT 'Push',
	`periodic` varchar(100),
	`sequence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commPlanItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commPlanJobOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`label` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commPlanJobOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `commPlanRoleOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`label` varchar(200) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `commPlanRoleOptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `communicationPlanEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stakeholderId` int,
	`targetType` enum('stakeholder','role','job'),
	`targetValue` varchar(300),
	`role` varchar(200),
	`informationNeeded` text,
	`preferredMethods` json,
	`frequency` varchar(100),
	`textNote` text,
	`escalationProcedures` text,
	`responsible` varchar(200),
	`responsibleStakeholderId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `communicationPlanEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `developmentPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(200) NOT NULL,
	`description` text,
	`goals` text,
	`startDate` date,
	`endDate` date,
	`devPlanStatus` enum('Not Started','In Progress','Completed','On Hold') NOT NULL DEFAULT 'Not Started',
	`linkedTaskGroupId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `developmentPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`statusType` enum('current','desired') NOT NULL,
	`engagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
	`assessedBy` varchar(200),
	`assessmentDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTaskGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`fromStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading','Any') NOT NULL,
	`toStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading') NOT NULL,
	`color` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagementTaskGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTaskSubjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskGroupId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementTaskSubjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskGroupId` int NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`periodic` varchar(100),
	`sequence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagementTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resourceCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`date` date NOT NULL,
	`calType` enum('Working','Leave','Holiday','Training') NOT NULL DEFAULT 'Working',
	`availableHours` decimal(4,1) DEFAULT '8.0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resourceCalendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slaPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`priority` enum('Critical','High','Medium','Low') NOT NULL,
	`responseTimeHours` int NOT NULL DEFAULT 4,
	`resolutionTimeHours` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`skillLevel` enum('Beginner','Intermediate','Advanced','Expert') NOT NULL DEFAULT 'Intermediate',
	`linkedKpiId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderSwot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`swotQuadrant` enum('Strength','Weakness','Opportunity','Threat') NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderSwot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamCharter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`mission` text,
	`scopeAndBoundaries` text,
	`metricsOfSuccess` text,
	`coreValues` text,
	`groundRules` text,
	`restrictedViolations` text,
	`teamActivities` text,
	`internalCommunicationPlan` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamCharter_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamCharter_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `department` varchar(200);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `classification` enum('TeamMember','External','Stakeholder') DEFAULT 'Stakeholder';--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `isPooledResource` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `workingHoursPerDay` decimal(4,1) DEFAULT '8.0';--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `workingDaysPerWeek` int DEFAULT 5;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `stakeholderManagerId` int;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `currentEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading');--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `desiredEngagementStatus` enum('Unaware','Resistant','Neutral','Supportive','Leading');--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `communicationResponsibleId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `communicationStakeholderId` int;