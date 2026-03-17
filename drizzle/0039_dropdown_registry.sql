CREATE TABLE IF NOT EXISTS `dropdown_registry` (
  `id` int AUTO_INCREMENT NOT NULL,
  `project_id` int NOT NULL,
  `domain` varchar(100) NOT NULL,
  `field_key` varchar(100) NOT NULL,
  `value` varchar(255) NOT NULL,
  `color` varchar(50),
  `icon` varchar(50),
  `sort_order` int NOT NULL DEFAULT 0,
  `is_default` boolean NOT NULL DEFAULT false,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp DEFAULT (now()),
  CONSTRAINT `dropdown_registry_id` PRIMARY KEY(`id`)
);
CREATE INDEX `dr_project_domain_field` ON `dropdown_registry` (`project_id`, `domain`, `field_key`);
