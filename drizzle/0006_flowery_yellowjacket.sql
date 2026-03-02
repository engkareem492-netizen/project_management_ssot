CREATE TABLE `issueGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`idCode` varchar(20),
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issueGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`password` varchar(255) NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`idCode` varchar(20),
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taskGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assumptions` DROP INDEX `assumptions_assumptionId_unique`;--> statement-breakpoint
ALTER TABLE `deliverables` DROP INDEX `deliverables_deliverableId_unique`;--> statement-breakpoint
ALTER TABLE `dependencies` DROP INDEX `dependencies_dependencyId_unique`;--> statement-breakpoint
ALTER TABLE `idSequences` DROP INDEX `idSequences_entityType_unique`;--> statement-breakpoint
ALTER TABLE `issues` DROP INDEX `issues_issueId_unique`;--> statement-breakpoint
ALTER TABLE `requirements` DROP INDEX `requirements_idCode_unique`;--> statement-breakpoint
ALTER TABLE `tasks` DROP INDEX `tasks_taskId_unique`;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `deliverables` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `dependencies` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `minNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `maxNumber` int DEFAULT 9999 NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `padLength` int DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE `issues` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `requirements` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `projectId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `assignDate` varchar(50);