ALTER TABLE `idSequences` ADD `minNumber` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `maxNumber` int DEFAULT 9999 NOT NULL;--> statement-breakpoint
ALTER TABLE `idSequences` ADD `padLength` int DEFAULT 4 NOT NULL;