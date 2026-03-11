CREATE TABLE `pmPlanSections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`sectionKey` varchar(60) NOT NULL,
	`content` json DEFAULT ('{}'),
	`lastUpdatedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pmPlanSections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wbsElements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`parentId` int,
	`code` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`level` int NOT NULL DEFAULT 1,
	`responsible` varchar(255),
	`estimatedCost` decimal(15,2),
	`actualCost` decimal(15,2),
	`status` enum('Not Started','In Progress','Complete','On Hold') DEFAULT 'Not Started',
	`deliverableId` int,
	`milestoneId` int,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wbsElements_id` PRIMARY KEY(`id`)
);
