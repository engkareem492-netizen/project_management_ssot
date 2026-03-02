CREATE TABLE `classOptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`value` varchar(100) NOT NULL,
	`label` varchar(100) NOT NULL,
	`description` text,
	`isDefault` boolean NOT NULL DEFAULT false,
	`usageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `classOptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `classOptions_value_unique` UNIQUE(`value`)
);
