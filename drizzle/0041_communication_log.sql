CREATE TABLE IF NOT EXISTS `communication_log` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `log_date` date NOT NULL,
  `communication_type` varchar(255),
  `subject` varchar(500) NOT NULL,
  `sent_by` varchar(255),
  `recipients` text,
  `method` varchar(100),
  `summary` text,
  `linked_comm_plan_entry_id` int,
  `attachment_url` varchar(1000),
  `notes` text,
  `created_by` int,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `communication_log_id` PRIMARY KEY(`id`)
);
