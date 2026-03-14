CREATE TABLE `businessCase` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`projectJustification` text,
	`problemStatement` text,
	`alternativesConsidered` text,
	`recommendedSolution` text,
	`strategicObjectives` text,
	`alignmentRationale` text,
	`estimatedCost` decimal(15,2),
	`estimatedBenefit` decimal(15,2),
	`roi` decimal(8,2),
	`paybackPeriodMonths` int,
	`costBenefitDetails` json,
	`successMeasures` text,
	`reportSections` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `businessCase_id` PRIMARY KEY(`id`),
	CONSTRAINT `businessCase_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `closingReport` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`objectivesStatus` json,
	`initialBudget` decimal(15,2),
	`finalCost` decimal(15,2),
	`budgetVariance` decimal(15,2),
	`fundingNotes` text,
	`closureCriteria` json,
	`closureJustification` text,
	`lessonsLearnedSummary` text,
	`handoverNotes` text,
	`closedDate` date,
	`closedById` int,
	`closedBy` varchar(200),
	`status` enum('Draft','Under Review','Approved','Archived') DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `closingReport_id` PRIMARY KEY(`id`),
	CONSTRAINT `closingReport_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `projectOKRs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`okrCode` varchar(30),
	`objective` varchar(500) NOT NULL,
	`keyResults` json,
	`linkedReportSection` varchar(200),
	`owner` varchar(200),
	`ownerId` int,
	`dueDate` date,
	`status` enum('On Track','At Risk','Behind','Achieved','Cancelled') DEFAULT 'On Track',
	`progressPct` int DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectOKRs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resourceBreakdownStructure` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`parentId` int,
	`code` varchar(50),
	`name` varchar(200) NOT NULL,
	`type` enum('Human','Material','Equipment','Financial','Other') DEFAULT 'Human',
	`description` text,
	`unit` varchar(50),
	`estimatedQuantity` decimal(10,2),
	`unitCost` decimal(12,2),
	`level` int DEFAULT 1,
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resourceBreakdownStructure_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resourceCalendar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`stakeholderId` int NOT NULL,
	`entryDate` date NOT NULL,
	`availabilityPct` int DEFAULT 100,
	`type` enum('Working','Leave','Holiday','Training','Partial') DEFAULT 'Working',
	`notes` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `resourceCalendar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `resourceManagementPlan` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`acquisitionStrategy` text,
	`releaseStrategy` text,
	`trainingNeeds` text,
	`recognitionRewards` text,
	`complianceRequirements` text,
	`safetyConsiderations` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resourceManagementPlan_id` PRIMARY KEY(`id`),
	CONSTRAINT `resourceManagementPlan_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderSkills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`skillName` varchar(200) NOT NULL,
	`category` varchar(100),
	`proficiencyLevel` enum('Beginner','Intermediate','Advanced','Expert') DEFAULT 'Intermediate',
	`developmentPlanNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stakeholderSkills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stakeholderSuccession` (
	`id` int AUTO_INCREMENT NOT NULL,
	`stakeholderId` int NOT NULL,
	`projectId` int NOT NULL,
	`requiresSuccessionPlan` boolean DEFAULT false,
	`requiresDelegation` boolean DEFAULT false,
	`successorId` int,
	`successorName` varchar(200),
	`delegateName` varchar(200),
	`delegateId` int,
	`successionNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stakeholderSuccession_id` PRIMARY KEY(`id`),
	CONSTRAINT `stakeholderSuccession_stakeholderId_unique` UNIQUE(`stakeholderId`)
);
--> statement-breakpoint
CREATE TABLE `teamCharter` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`coreValues` json,
	`communicationProtocol` text,
	`meetingCadence` text,
	`decisionMakingAuthority` text,
	`groundRules` json,
	`violations` json,
	`responsibilityMatrix` text,
	`conflictResolution` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teamCharter_id` PRIMARY KEY(`id`),
	CONSTRAINT `teamCharter_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `businessCaseCause` varchar(100);--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `businessCaseSummary` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `feasibilityStudy` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `governanceStructure` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `pmResponsibilities` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `escalationPath` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `decisionAuthority` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `needAssessment` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `benefitsManagementPlan` text;--> statement-breakpoint
ALTER TABLE `projectCharter` ADD `expectedBenefits` json;