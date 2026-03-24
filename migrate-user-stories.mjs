import mysql from 'mysql2/promise';

const DATABASE_URL = "mysql://2GbqVPLTWj5TAPg.root:fJLLPFB064P7hY2va0aj@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/5FK4prUhhexLGmkgTTrwbh?ssl={\"rejectUnauthorized\":true}";
const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
const [user, password] = [decodeURIComponent(url.username), decodeURIComponent(url.password)];

const c = await mysql.createConnection({
  host: url.hostname,
  port: parseInt(url.port) || 4000,
  user, password,
  database: url.pathname.slice(1).split('?')[0],
  ssl: { rejectUnauthorized: true }
});

const stmts = [
  // 1. Add scopeItemId to issues
  `ALTER TABLE \`issues\` ADD COLUMN \`scopeItemId\` INT NULL`,

  // 2. Create userStories table
  `CREATE TABLE IF NOT EXISTS \`userStories\` (
    \`id\`                 INT          NOT NULL AUTO_INCREMENT,
    \`projectId\`          INT          NOT NULL,
    \`storyId\`            VARCHAR(50)  NOT NULL,
    \`title\`              VARCHAR(500) NOT NULL,
    \`description\`        TEXT         NULL,
    \`acceptanceCriteria\` TEXT         NULL,
    \`priority\`           VARCHAR(50)  NULL DEFAULT 'Medium',
    \`status\`             VARCHAR(100) NULL DEFAULT 'New',
    \`storyPoints\`        INT          NULL,
    \`effortDays\`         DECIMAL(5,1) NULL,
    \`scopeItemId\`        INT          NULL,
    \`sprintId\`           INT          NULL,
    \`assignedToId\`       INT          NULL,
    \`assignedTo\`         VARCHAR(200) NULL,
    \`processStep\`        VARCHAR(255) NULL,
    \`businessRole\`       VARCHAR(255) NULL,
    \`notes\`              TEXT         NULL,
    \`createdAt\`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\`          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,

  // 3. Create junction table
  `CREATE TABLE IF NOT EXISTS \`userStoryRequirements\` (
    \`id\`            INT       NOT NULL AUTO_INCREMENT,
    \`userStoryId\`   INT       NOT NULL,
    \`requirementId\` INT       NOT NULL,
    \`projectId\`     INT       NOT NULL,
    \`createdAt\`     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`uq_us_req\` (\`userStoryId\`, \`requirementId\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
];

for (const stmt of stmts) {
  try {
    await c.query(stmt);
    console.log('OK:', stmt.slice(0, 60).replace(/\s+/g, ' ').trim());
  } catch (e) {
    if (e.code === 'ER_TABLE_EXISTS_ERROR' || e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
      console.log('SKIP (already exists):', stmt.slice(0, 60).replace(/\s+/g, ' ').trim());
    } else {
      console.error('ERROR:', e.message);
    }
  }
}

await c.end();
console.log('Done.');
