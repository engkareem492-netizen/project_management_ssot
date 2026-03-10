ALTER TABLE `documents` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `lessonsLearned` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `milestones` MODIFY COLUMN `linkedDeliverableIds` json;--> statement-breakpoint
ALTER TABLE `testRuns` MODIFY COLUMN `defectIds` json;--> statement-breakpoint
ALTER TABLE `testRuns` MODIFY COLUMN `stepResults` json;