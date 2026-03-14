CREATE TABLE `engagementStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`changedBy` varchar(200),
	`notes` text,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTaskGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`fromStatus` varchar(50),
	`toStatus` varchar(50),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagementTaskGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTaskSubjects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `engagementTaskSubjects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `engagementTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`groupId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`responsible` varchar(200),
	`responsibleId` int,
	`dueDate` date,
	`status` varchar(50) DEFAULT 'Not Started',
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `engagementTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderSwot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(20) NOT NULL,
	`description` text NOT NULL,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderSwot_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `department` varchar(200);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `remark` text;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `classification` varchar(50) DEFAULT 'stakeholder';--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `isPooledResource` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `stakeholderManagerId` int;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `workingSchedule` varchar(100);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `currentEngagementStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `desiredEngagementStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `includeInEngagementPlan` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `informationNeeded` text;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `escalationProcedure` text;