CREATE TABLE `projectTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`snapshot` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderPortalTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`token` varchar(64) NOT NULL,
	`label` varchar(200),
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderPortalTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `stakeholderPortalTokens_token_unique` UNIQUE(`token`)
);
