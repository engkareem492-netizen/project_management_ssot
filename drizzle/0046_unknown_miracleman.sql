CREATE TABLE `phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`phaseCode` varchar(30),
	`name` varchar(200) NOT NULL,
	`description` text,
	`status` varchar(50) DEFAULT 'Planned',
	`startDate` date,
	`endDate` date,
	`order` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phases_id` PRIMARY KEY(`id`)
);
