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
