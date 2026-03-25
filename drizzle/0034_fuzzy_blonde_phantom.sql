CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`entityType` varchar(50) NOT NULL,
	`entityId` varchar(100) NOT NULL,
	`authorName` varchar(200),
	`content` text NOT NULL,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`owner` varchar(200),
	`status` enum('Not Started','In Progress','At Risk','Achieved','Cancelled') NOT NULL DEFAULT 'Not Started',
	`startDate` date,
	`endDate` date,
	`progress` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `keyResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`goalId` int NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`targetValue` decimal(10,2),
	`currentValue` decimal(10,2) DEFAULT '0',
	`unit` varchar(50),
	`status` enum('Not Started','In Progress','At Risk','Achieved') NOT NULL DEFAULT 'Not Started',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keyResults_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sprints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`goal` text,
	`status` enum('Planning','Active','Completed','Cancelled') NOT NULL DEFAULT 'Planning',
	`startDate` date,
	`endDate` date,
	`capacity` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sprints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`responseTimeHours` int NOT NULL,
	`resolutionTimeHours` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticketTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`ticketTypeId` int NOT NULL,
	`idCode` varchar(20),
	`title` varchar(300) NOT NULL,
	`description` text,
	`priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
	`status` enum('Open','In Progress','Waiting','Resolved','Closed') NOT NULL DEFAULT 'Open',
	`assigneeId` int,
	`assigneeName` varchar(200),
	`reporterName` varchar(200),
	`respondedAt` timestamp,
	`resolvedAt` timestamp,
	`slaResponseBreached` boolean DEFAULT false,
	`slaResolutionBreached` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskId` int,
	`taskDescription` varchar(300),
	`loggedBy` varchar(200),
	`logDate` date NOT NULL,
	`hoursLogged` decimal(5,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tasks` ADD `sprintId` int;