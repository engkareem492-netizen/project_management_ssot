CREATE TABLE IF NOT EXISTS `comm_raci_matrix` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `comm_item_label` varchar(500) NOT NULL,
  `stakeholder_id` int NOT NULL,
  `raci_value` varchar(1),
  `updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `comm_raci_matrix_id` PRIMARY KEY(`id`)
);
CREATE INDEX `comm_raci_matrix_project_item_stakeholder` ON `comm_raci_matrix` (`project_id`, `comm_item_label`, `stakeholder_id`);
