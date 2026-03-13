CREATE TABLE `taskStatusUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`taskId` varchar(50) NOT NULL,
	`taskDbId` int NOT NULL,
	`updateText` text NOT NULL,
	`updatedBy` int NOT NULL,
	`updatedByName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `taskStatusUpdates_id` PRIMARY KEY(`id`)
);
