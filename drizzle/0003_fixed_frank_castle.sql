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
