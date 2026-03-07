CREATE TABLE `assumptionCategories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assumptionCategories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assumptionHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assumptionId` int NOT NULL,
	`changedFields` json NOT NULL,
	`changedBy` int,
	`changedByName` varchar(200),
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assumptionHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assumptionImpactLevels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assumptionImpactLevels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assumptionStatuses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assumptionStatuses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `assumptions` ADD `categoryId` int;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `statusId` int;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `impactLevelId` int;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `requirementId` int;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `taskId` int;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `validatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `assumptions` ADD `validatedBy` int;