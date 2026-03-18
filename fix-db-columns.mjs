import mysql from 'mysql2/promise';

const c = await mysql.createConnection({
  host: 'localhost', user: 'pmuser', password: 'pmpass123', database: 'pm_ssot'
});

// Fix stakeholderPositionOptions - add missing label column
try {
  await c.query("ALTER TABLE stakeholderPositionOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
  console.log('Added label column to stakeholderPositionOptions');
} catch (e) { console.log('stakeholderPositionOptions.label:', e.message); }

// Fix commPlanRoleOptions - add label if missing
const [rCols] = await c.query('DESCRIBE commPlanRoleOptions');
const hasRoleLabel = rCols.some(x => x.Field === 'label');
if (!hasRoleLabel) {
  await c.query("ALTER TABLE commPlanRoleOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
  console.log('Added label to commPlanRoleOptions');
} else {
  console.log('commPlanRoleOptions.label already exists');
}

// Fix commPlanJobOptions - add label if missing
const [jCols] = await c.query('DESCRIBE commPlanJobOptions');
const hasJobLabel = jCols.some(x => x.Field === 'label');
if (!hasJobLabel) {
  await c.query("ALTER TABLE commPlanJobOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
  console.log('Added label to commPlanJobOptions');
} else {
  console.log('commPlanJobOptions.label already exists');
}

// Verify tasks table
const [tCols] = await c.query('DESCRIBE tasks');
const taskFields = tCols.map(x => x.Field);
const required = ['sprintId','communicationStakeholderId','recurringType','recurringInterval','recurringEndDate','parentTaskId','followUpOfId','seriesId','manHours'];
const missing = required.filter(f => !taskFields.includes(f));
console.log('Tasks missing columns:', missing.length ? missing.join(', ') : 'none - all good');

// Try a test query on tasks
try {
  const [rows] = await c.query('SELECT id, sprintId, communicationStakeholderId FROM tasks LIMIT 1');
  console.log('Tasks test query OK, rows:', rows.length);
} catch (e) {
  console.log('Tasks test query FAILED:', e.message);
}

// Add PartTime to resourceCalendar calType enum
try {
  await c.query("ALTER TABLE resourceCalendar MODIFY COLUMN calType ENUM('Working','Leave','Holiday','Training','PartTime') NOT NULL DEFAULT 'Working'");
  console.log('resourceCalendar calType enum updated to include PartTime');
} catch (e) { console.log('resourceCalendar calType update:', e.message); }

await c.end();
console.log('Done');
