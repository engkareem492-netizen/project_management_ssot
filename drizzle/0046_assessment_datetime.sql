-- Change assessmentDate from DATE to DATETIME to capture actual date and time
ALTER TABLE `stakeholderAssessments` MODIFY COLUMN `assessmentDate` DATETIME NOT NULL;
