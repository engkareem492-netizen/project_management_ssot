CREATE TABLE `slaPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`priority` enum('Critical','High','Medium','Low') NOT NULL,
	`responseTimeHours` int NOT NULL DEFAULT 4,
	`resolutionTimeHours` int NOT NULL DEFAULT 24,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaPolicies_id` PRIMARY KEY(`id`),
	CONSTRAINT `slaPolicies_project_priority_unique` UNIQUE(`projectId`, `priority`)
);
