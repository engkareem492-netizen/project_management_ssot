CREATE TABLE `wbsResourceAssignments` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `projectId` int NOT NULL,
  `wbsNodeId` int NOT NULL,
  `rbsNodeId` int NOT NULL,
  `allocationPct` decimal(5,2) DEFAULT 100.00,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT NOW(),
  `updatedAt` timestamp NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);
