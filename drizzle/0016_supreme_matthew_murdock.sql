CREATE TABLE `responseStrategy` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responseStrategy_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskId` int NOT NULL,
	`causeLevel` int NOT NULL,
	`cause` text NOT NULL,
	`consequences` text NOT NULL,
	`trigger` text NOT NULL,
	`mitigationPlanId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskTypes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `riskTypes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `riskUpdates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`riskId` int NOT NULL,
	`update` text NOT NULL,
	`updateDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `riskUpdates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `risks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`riskId` varchar(50) NOT NULL,
	`riskTypeId` int,
	`title` text NOT NULL,
	`riskOwnerId` int,
	`riskStatusId` int,
	`identifiedOn` date NOT NULL,
	`impact` int NOT NULL,
	`probability` int NOT NULL,
	`score` int NOT NULL,
	`residualImpact` int,
	`residualProbability` int,
	`residualScore` int,
	`contingencyPlanId` int,
	`responseStrategyId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risks_id` PRIMARY KEY(`id`)
);
