CREATE TABLE `evmBaseline` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`bac` decimal(18,2) NOT NULL DEFAULT '0',
	`startDate` date,
	`endDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evmBaseline_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evmSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`periodLabel` varchar(100) NOT NULL,
	`periodDate` date NOT NULL,
	`pv` decimal(18,2) NOT NULL DEFAULT '0',
	`ev` decimal(18,2) NOT NULL DEFAULT '0',
	`ac` decimal(18,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evmSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evmWbsEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`wbsElementId` int,
	`wbsCode` varchar(50),
	`wbsTitle` varchar(255),
	`bac` decimal(18,2) DEFAULT '0',
	`pv` decimal(18,2) DEFAULT '0',
	`ev` decimal(18,2) DEFAULT '0',
	`ac` decimal(18,2) DEFAULT '0',
	`percentComplete` decimal(5,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `evmWbsEntries_id` PRIMARY KEY(`id`)
);
