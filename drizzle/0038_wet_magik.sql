CREATE TABLE `customFieldDefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`entityType` enum('task','issue','risk','requirement','stakeholder','deliverable','milestone','action_item','change_request') NOT NULL,
	`fieldKey` varchar(100) NOT NULL,
	`label` varchar(150) NOT NULL,
	`fieldType` enum('text','number','date','select','multi_select','checkbox','url','email','textarea','rating') NOT NULL DEFAULT 'text',
	`options` json,
	`required` boolean DEFAULT false,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customFieldDefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customFieldValues` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fieldDefId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` varchar(100) NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customFieldValues_id` PRIMARY KEY(`id`)
);
