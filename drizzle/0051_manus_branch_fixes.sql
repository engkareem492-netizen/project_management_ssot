-- Add missing columns to tasks table
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `subject` varchar(200);
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `devPlanId` int;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `devTaskSwotId` int;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `devTaskSkillId` int;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `manHours` decimal(10,2);
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `sprintId` int;

-- Create phases table if not exists
CREATE TABLE IF NOT EXISTS `phases` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text,
  `startDate` varchar(50),
  `endDate` varchar(50),
  `status` varchar(100) DEFAULT 'Planning',
  `order` int DEFAULT 0,
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `updatedAt` timestamp DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create taskStatusUpdates table if not exists
CREATE TABLE IF NOT EXISTS `taskStatusUpdates` (
  `id` int AUTO_INCREMENT NOT NULL,
  `taskId` int NOT NULL,
  `projectId` int NOT NULL,
  `status` varchar(100) NOT NULL,
  `note` text,
  `updatedBy` varchar(200),
  `updatedById` int,
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create businessCase table if not exists
CREATE TABLE IF NOT EXISTS `businessCase` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL UNIQUE,
  `problem` text,
  `opportunity` text,
  `proposedSolution` text,
  `alternatives` text,
  `costBenefitAnalysis` text,
  `risks` text,
  `recommendation` text,
  `approvalStatus` varchar(100) DEFAULT 'Draft',
  `approvedBy` varchar(200),
  `approvalDate` varchar(50),
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `updatedAt` timestamp DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create projectOKRs table if not exists
CREATE TABLE IF NOT EXISTS `projectOKRs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `objective` text NOT NULL,
  `keyResult` text NOT NULL,
  `targetValue` varchar(200),
  `currentValue` varchar(200),
  `unit` varchar(100),
  `dueDate` varchar(50),
  `status` varchar(100) DEFAULT 'On Track',
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `updatedAt` timestamp DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create closingReport table if not exists
CREATE TABLE IF NOT EXISTS `closingReport` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL UNIQUE,
  `executiveSummary` text,
  `objectivesAchieved` text,
  `deliverablesCompleted` text,
  `lessonsLearned` text,
  `outstandingIssues` text,
  `recommendations` text,
  `finalBudgetSummary` text,
  `teamAcknowledgements` text,
  `approvalStatus` varchar(100) DEFAULT 'Draft',
  `closedBy` varchar(200),
  `closedDate` varchar(50),
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  `updatedAt` timestamp DEFAULT NOW() ON UPDATE NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create commPlanInputItems table if not exists
CREATE TABLE IF NOT EXISTS `commPlanInputItems` (
  `id` int AUTO_INCREMENT NOT NULL,
  `projectId` int NOT NULL,
  `type` varchar(100) NOT NULL,
  `title` varchar(300) NOT NULL,
  `description` text,
  `sourceId` int,
  `createdAt` timestamp DEFAULT NOW() NOT NULL,
  PRIMARY KEY (`id`)
);

-- Create wbsElements table as alias for wbsNodes if not exists
-- (wbsNodes already exists, wbsElements is just referenced in some routers)
