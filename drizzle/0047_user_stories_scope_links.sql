-- Migration: User Stories + Scope Item links
-- Adds userStories table, userStoryRequirements junction,
-- and scopeItemId FK to issues table.

-- ──────────────────────────────────────────────────────────────
-- 1. Add scopeItemId to issues
-- ──────────────────────────────────────────────────────────────
ALTER TABLE `issues`
  ADD COLUMN `scopeItemId` INT NULL;

-- ──────────────────────────────────────────────────────────────
-- 2. User Stories
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `userStories` (
  `id`                 INT          NOT NULL AUTO_INCREMENT,
  `projectId`          INT          NOT NULL,
  `storyId`            VARCHAR(50)  NOT NULL,
  `title`              VARCHAR(500) NOT NULL,
  `description`        TEXT         NULL,
  `acceptanceCriteria` TEXT         NULL,
  `priority`           VARCHAR(50)  NULL DEFAULT 'Medium',
  `status`             VARCHAR(100) NULL DEFAULT 'New',
  `storyPoints`        INT          NULL,
  `effortDays`         DECIMAL(5,1) NULL,
  `scopeItemId`        INT          NULL,
  `sprintId`           INT          NULL,
  `assignedToId`       INT          NULL,
  `assignedTo`         VARCHAR(200) NULL,
  `processStep`        VARCHAR(255) NULL,
  `businessRole`       VARCHAR(255) NULL,
  `notes`              TEXT         NULL,
  `createdAt`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────────────────────
-- 3. User Story ↔ Requirements junction
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `userStoryRequirements` (
  `id`            INT       NOT NULL AUTO_INCREMENT,
  `userStoryId`   INT       NOT NULL,
  `requirementId` INT       NOT NULL,
  `projectId`     INT       NOT NULL,
  `createdAt`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_us_req` (`userStoryId`, `requirementId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
