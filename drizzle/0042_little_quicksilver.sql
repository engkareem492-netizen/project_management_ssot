CREATE TABLE `exchangeRates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fromCurrencyCode` varchar(10) NOT NULL,
	`toCurrencyCode` varchar(10) NOT NULL,
	`baselineRate` decimal(18,6) NOT NULL DEFAULT '1',
	`currentRate` decimal(18,6) NOT NULL DEFAULT '1',
	`predictedRate` decimal(18,6) NOT NULL DEFAULT '1',
	`effectiveDate` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exchangeRates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projectCurrencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`currencyCode` varchar(10) NOT NULL,
	`currencyName` varchar(80) NOT NULL,
	`symbol` varchar(10) NOT NULL DEFAULT '',
	`isBase` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projectCurrencies_id` PRIMARY KEY(`id`)
);
