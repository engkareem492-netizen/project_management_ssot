ALTER TABLE `stakeholders` ADD COLUMN `costPerHour` decimal(10,2);
--> statement-breakpoint
ALTER TABLE `stakeholders` ADD COLUMN `costPerDay` decimal(10,2);
--> statement-breakpoint
ALTER TABLE `tasks` ADD COLUMN `manHours` decimal(10,2);
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
ALTER TABLE `requirements` ADD COLUMN `scopeItemId` int;
--> statement-breakpoint
ALTER TABLE `testCases` ADD COLUMN `scopeItemId` int;
--> statement-breakpoint
ALTER TABLE `changeRequests` ADD COLUMN `scopeItemId` int;
