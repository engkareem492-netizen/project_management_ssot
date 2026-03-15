CREATE TABLE `actionItems` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `budgetEntries` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `budgetEntries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`documentId` varchar(50) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`description` text,
	`entityType` varchar(50),
	`entityId` varchar(50),
	`uploadedBy` varchar(255),
	`uploadedById` int,
	`tags` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lessonsLearned` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`lessonId` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`category` enum('Technical','Process','People','Commercial','Risk','Communication','Other') DEFAULT 'Process',
	`phase` varchar(100),
	`whatWentWell` text,
	`whatToImprove` text,
	`recommendation` text,
	`impact` enum('Low','Medium','High') DEFAULT 'Medium',
	`ownerId` int,
	`owner` varchar(255),
	`dateRecorded` date,
	`status` enum('Draft','Reviewed','Approved','Archived') DEFAULT 'Draft',
	`tags` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lessonsLearned_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`milestoneId` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`dueDate` date,
	`completedDate` date,
	`ragStatus` enum('Green','Amber','Red') DEFAULT 'Green',
	`status` enum('Upcoming','In Progress','Achieved','Missed','Deferred') DEFAULT 'Upcoming',
	`phase` varchar(100),
	`ownerId` int,
	`owner` varchar(255),
	`linkedDeliverableIds` json DEFAULT ('[]'),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `milestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`userId` int NOT NULL,
	`notificationType` enum('task_overdue','issue_escalated','cr_submitted','risk_high','task_assigned','decision_added','due_soon') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`entityType` varchar(50),
	`entityId` varchar(50),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectBudget` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`totalBudget` decimal(15,2) DEFAULT '0',
	`currency` varchar(10) DEFAULT 'USD',
	`notes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectBudget_id` PRIMARY KEY(`id`),
	CONSTRAINT `projectBudget_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `projectCharter` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectCharter_id` PRIMARY KEY(`id`),
	CONSTRAINT `projectCharter_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `resourceCapacity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`weekStart` date NOT NULL,
	`availableHours` decimal(5,1) DEFAULT '40',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resourceCapacity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scopeItems` (
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scopeItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`testCaseId` int NOT NULL,
	`runId` varchar(50) NOT NULL,
	`executedBy` varchar(255),
	`executedById` int,
	`executionDate` date,
	`status` enum('Not Executed','Passed','Failed','Blocked','Skipped') DEFAULT 'Not Executed',
	`environment` varchar(100),
	`actualResult` text,
	`defectIds` json DEFAULT ('[]'),
	`notes` text,
	`stepResults` json DEFAULT ('[]'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `changeRequests` ADD `scopeItemId` int;--> statement-breakpoint
ALTER TABLE `requirements` ADD `scopeItemId` int;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `costPerHour` decimal(10,2);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `costPerDay` decimal(10,2);--> statement-breakpoint
ALTER TABLE `tasks` ADD `manHours` decimal(10,2);--> statement-breakpoint
ALTER TABLE `testCases` ADD `scopeItemId` int;