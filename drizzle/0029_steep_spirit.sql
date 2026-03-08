ALTER TABLE `tasks` ADD `parentTaskId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `followUpOfId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `seriesId` int;--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurringType` enum('none','daily','weekly','monthly','custom') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurringInterval` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `tasks` ADD `recurringEndDate` varchar(50);