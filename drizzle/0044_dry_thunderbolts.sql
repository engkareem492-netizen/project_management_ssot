CREATE TABLE `defectTestCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`defectId` int NOT NULL,
	`testCaseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `defectTestCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `defects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`defectCode` varchar(30),
	`title` varchar(255) NOT NULL,
	`description` text,
	`severity` varchar(20) DEFAULT 'Medium',
	`priority` varchar(20) DEFAULT 'Medium',
	`status` varchar(50) DEFAULT 'Open',
	`reportedBy` varchar(100),
	`assignedTo` varchar(100),
	`stepsToReproduce` text,
	`expectedResult` text,
	`actualResult` text,
	`resolution` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `defects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `featureRequirements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`featureId` int NOT NULL,
	`requirementId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `featureRequirements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`featureCode` varchar(30),
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(50) DEFAULT 'Draft',
	`priority` varchar(20) DEFAULT 'Medium',
	`owner` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `features_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirementTestCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirementId` int NOT NULL,
	`testCaseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requirementTestCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `requirementUserStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requirementId` int NOT NULL,
	`userStoryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `requirementUserStories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `taskStatusHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`snapshotDate` date NOT NULL,
	`statusOpen` int NOT NULL DEFAULT 0,
	`statusInProgress` int NOT NULL DEFAULT 0,
	`statusBlocked` int NOT NULL DEFAULT 0,
	`statusDone` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskStatusHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testPlanTestCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`testPlanId` int NOT NULL,
	`testCaseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `testPlanTestCases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `testPlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`planCode` varchar(30),
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` varchar(50) DEFAULT 'Draft',
	`startDate` date,
	`endDate` date,
	`owner` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testPlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`storyCode` varchar(30),
	`featureId` int,
	`title` varchar(255) NOT NULL,
	`asA` varchar(255),
	`iWant` text,
	`soThat` text,
	`acceptanceCriteria` text,
	`status` varchar(50) DEFAULT 'Backlog',
	`priority` varchar(20) DEFAULT 'Medium',
	`storyPoints` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userStories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userStoryTestCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userStoryId` int NOT NULL,
	`testCaseId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userStoryTestCases_id` PRIMARY KEY(`id`)
);
