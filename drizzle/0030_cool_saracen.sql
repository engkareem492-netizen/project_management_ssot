CREATE TABLE `stakeholderAssessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`assessmentDate` date NOT NULL,
	`assessorName` varchar(200),
	`notes` text,
	`overallScore` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderAssessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderKpiScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assessmentId` int NOT NULL,
	`kpiId` int NOT NULL,
	`score` int NOT NULL,
	`notes` text,
	CONSTRAINT `stakeholderKpiScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderKpis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`target` varchar(100),
	`unit` varchar(50),
	`weight` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderKpis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderTaskGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`taskGroupId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderTaskGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `isInternalTeam` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `powerLevel` int DEFAULT 3;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `interestLevel` int DEFAULT 3;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `engagementStrategy` varchar(100);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `communicationFrequency` varchar(100);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `communicationChannel` varchar(100);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `communicationMessage` text;--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `communicationResponsible` varchar(200);--> statement-breakpoint
ALTER TABLE `stakeholders` ADD `notes` text;