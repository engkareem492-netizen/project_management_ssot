CREATE TABLE `deliverableLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` int NOT NULL,
	`linkedEntityType` enum('requirement','task','dependency') NOT NULL,
	`linkedEntityId` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deliverableLinks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliverables` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliverableId` varchar(50) NOT NULL,
	`description` text,
	`status` varchar(100),
	`dueDate` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`),
	CONSTRAINT `deliverables_deliverableId_unique` UNIQUE(`deliverableId`)
);
--> statement-breakpoint
CREATE TABLE `idSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`prefix` varchar(10) NOT NULL,
	`currentNumber` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `idSequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `idSequences_entityType_unique` UNIQUE(`entityType`)
);
--> statement-breakpoint
CREATE TABLE `stakeholders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fullName` varchar(200) NOT NULL,
	`email` varchar(320),
	`position` varchar(200),
	`role` varchar(200),
	`job` varchar(200),
	`phone` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stakeholders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assumptions` ADD `ownerId` int;--> statement-breakpoint
ALTER TABLE `dependencies` ADD `responsibleId` int;--> statement-breakpoint
ALTER TABLE `dependencies` ADD `accountableId` int;--> statement-breakpoint
ALTER TABLE `dependencies` ADD `informedId` int;--> statement-breakpoint
ALTER TABLE `dependencies` ADD `consultedId` int;--> statement-breakpoint
ALTER TABLE `issues` ADD `ownerId` int;--> statement-breakpoint
ALTER TABLE `requirements` ADD `ownerId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `responsibleId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `accountableId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `informedId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `consultedId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `owner` varchar(200);--> statement-breakpoint
ALTER TABLE `tasks` ADD `ownerId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `status` varchar(100);--> statement-breakpoint
ALTER TABLE `tasks` ADD `priority` varchar(100);