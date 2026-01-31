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
	`projectId` int NOT NULL,
	`assumptionId` varchar(50) NOT NULL,
	`description` text,
	`category` varchar(100),
	`owner` varchar(200),
	`ownerId` int,
	`status` varchar(100),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assumptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categoryOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categoryOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `categoryOptions_value_unique` UNIQUE(`value`)
);
--> statement-breakpoint
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
	`projectId` int NOT NULL,
	`deliverableId` varchar(50) NOT NULL,
	`description` text,
	`status` varchar(100),
	`dueDate` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliverables_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dependencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`dependencyId` varchar(50) NOT NULL,
	`depGroup` varchar(100),
	`taskId` varchar(50),
	`requirementId` varchar(50),
	`description` text,
	`responsible` varchar(200),
	`responsibleId` int,
	`accountable` varchar(200),
	`accountableId` int,
	`informed` varchar(200),
	`informedId` int,
	`consulted` varchar(200),
	`consultedId` int,
	`dueDate` varchar(50),
	`currentStatus` text,
	`statusUpdate` text,
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dependencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `idSequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`prefix` varchar(10) NOT NULL,
	`currentNumber` int NOT NULL DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `idSequences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`issueId` varchar(50) NOT NULL,
	`issueGroup` varchar(100),
	`taskGroup` varchar(100),
	`requirementId` varchar(50),
	`type` varchar(100),
	`class` varchar(100),
	`owner` varchar(200),
	`ownerId` int,
	`status` varchar(100),
	`description` text,
	`source` varchar(20),
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
	CONSTRAINT `issues_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `priorityOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`color` varchar(50),
	`level` int NOT NULL,
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `priorityOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `priorityOptions_value_unique` UNIQUE(`value`)
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
CREATE TABLE `requirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`idCode` varchar(50) NOT NULL,
	`taskGroup` varchar(100),
	`issueGroup` varchar(100),
	`createdAt` varchar(50),
	`type` varchar(100),
	`class` varchar(100),
	`category` varchar(100),
	`agreement` varchar(100),
	`owner` varchar(200),
	`ownerId` int,
	`description` text,
	`source` varchar(20),
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
	CONSTRAINT `requirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
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
CREATE TABLE `statusOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`category` varchar(50) NOT NULL,
	`color` varchar(50),
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `statusOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `statusOptions_value_unique` UNIQUE(`value`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskId` varchar(50) NOT NULL,
	`taskGroup` varchar(100),
	`dependencyId` varchar(50),
	`requirementId` varchar(50),
	`description` text,
	`responsible` varchar(200),
	`responsibleId` int,
	`accountable` varchar(200),
	`accountableId` int,
	`informed` varchar(200),
	`informedId` int,
	`consulted` varchar(200),
	`consultedId` int,
	`dueDate` varchar(50),
	`currentStatus` text,
	`statusUpdate` text,
	`owner` varchar(200),
	`ownerId` int,
	`status` varchar(100),
	`priority` varchar(100),
	`lastUpdate` text,
	`updateDate` varchar(50),
	`importedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `typeOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `typeOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `typeOptions_value_unique` UNIQUE(`value`)
);
