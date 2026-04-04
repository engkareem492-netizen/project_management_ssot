-- Add linkedDocumentId column to knowledgeBase table (was in schema but missing from migrations)
ALTER TABLE `knowledgeBase` ADD COLUMN IF NOT EXISTS `linkedDocumentId` int;
