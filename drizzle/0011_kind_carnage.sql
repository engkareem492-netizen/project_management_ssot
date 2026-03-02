CREATE TABLE `issueLinks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`issueId` int NOT NULL,
	`linkedEntityType` enum('requirement','task','dependency') NOT NULL,
	`linkedEntityId` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `issueLinks_id` PRIMARY KEY(`id`)
);
