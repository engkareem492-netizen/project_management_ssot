ALTER TABLE `engagementTasks` MODIFY COLUMN `groupId` int NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `engagementTasks` ADD `stakeholderId` int;--> statement-breakpoint
ALTER TABLE `engagementTasks` ADD `targetStatus` varchar(50);--> statement-breakpoint
ALTER TABLE `engagementTasks` ADD `frequency` varchar(50);--> statement-breakpoint
ALTER TABLE `engagementTasks` ADD `notes` text;