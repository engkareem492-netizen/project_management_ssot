ALTER TABLE `tasks` ADD `isActionItem` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `tasks` ADD `actionSourceType` varchar(50);--> statement-breakpoint
ALTER TABLE `tasks` ADD `actionSourceId` varchar(50);--> statement-breakpoint
ALTER TABLE `tasks` ADD `actionNotes` text;