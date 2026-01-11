CREATE TABLE `actionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` enum('requirement','task','issue') NOT NULL,
	`entityId` varchar(50) NOT NULL,
	`entityInternalId` int NOT NULL,
	`changedFields` json NOT NULL,
	`changedBy` int NOT NULL,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assumptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assumptionId` varchar(50) NOT NULL,
	`description` text,
	`category` varchar(100),
	`owner` varchar(200),
	`status` varchar(100),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assumptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `assumptions_assumptionId_unique` UNIQUE(`assumptionId`)
);
--> statement-breakpoint
CREATE TABLE `dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dependencyId` varchar(50) NOT NULL,
	`depGroup` varchar(100),
	`taskId` varchar(50),
	`requirementId` varchar(50),
	`description` text,
	`responsible` varchar(200),
	`accountable` varchar(200),
	`informed` varchar(200),
	`consulted` varchar(200),
	`dueDate` varchar(50),
	`currentStatus` text,
	`statusUpdate` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dependencies_id` PRIMARY KEY(`id`),
	CONSTRAINT `dependencies_dependencyId_unique` UNIQUE(`dependencyId`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` varchar(50) NOT NULL,
	`issueGroup` varchar(100),
	`taskGroup` varchar(100),
	`requirementId` varchar(50),
	`type` varchar(100),
	`class` varchar(100),
	`owner` varchar(200),
	`status` varchar(100),
	`description` text,
	`sourceType` varchar(100),
	`refSource` varchar(200),
	`createdAt` varchar(50),
	`priority` varchar(100),
	`deliverables1` text,
	`d1Status` varchar(100),
	`deliverables2` text,
	`d2Status` varchar(100),
	`lastUpdate` text,
	`updateDate` varchar(50),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `issues_id` PRIMARY KEY(`id`),
	CONSTRAINT `issues_issueId_unique` UNIQUE(`issueId`)
);
--> statement-breakpoint
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idCode` varchar(50) NOT NULL,
	`taskGroup` varchar(100),
	`issueGroup` varchar(100),
	`createdAt` varchar(50),
	`type` varchar(100),
	`class` varchar(100),
	`category` varchar(100),
	`agreement` varchar(100),
	`owner` varchar(200),
	`description` text,
	`sourceType` varchar(100),
	`refSource` varchar(200),
	`status` varchar(100),
	`priority` varchar(100),
	`deliverables1` text,
	`d1Status` varchar(100),
	`deliverables2` text,
	`d2Status` varchar(100),
	`lastUpdate` text,
	`updateDate` varchar(50),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`),
	CONSTRAINT `requirements_idCode_unique` UNIQUE(`idCode`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` varchar(50) NOT NULL,
	`taskGroup` varchar(100),
	`dependencyId` varchar(50),
	`requirementId` varchar(50),
	`description` text,
	`responsible` varchar(200),
	`accountable` varchar(200),
	`informed` varchar(200),
	`consulted` varchar(200),
	`dueDate` varchar(50),
	`currentStatus` text,
	`statusUpdate` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`),
	CONSTRAINT `tasks_taskId_unique` UNIQUE(`taskId`)
);
