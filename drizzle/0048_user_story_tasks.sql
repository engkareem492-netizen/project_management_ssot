CREATE TABLE `userStoryTasks` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userStoryId` int NOT NULL,
  `taskId` int NOT NULL,
  `projectId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `userStoryTasks_id` PRIMARY KEY(`id`)
);
