CREATE TABLE `eefFactors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('Internal','External') NOT NULL DEFAULT 'Internal',
	`category` varchar(100) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`impact` enum('High','Medium','Low') DEFAULT 'Medium',
	`influence` enum('Positive','Negative','Neutral') DEFAULT 'Neutral',
	`source` varchar(255),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `eefFactors_id` PRIMARY KEY(`id`)
);
