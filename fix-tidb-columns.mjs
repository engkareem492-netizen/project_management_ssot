import mysql from 'mysql2/promise';

// Use the TiDB Cloud connection from the server's environment
const DATABASE_URL = "mysql://2GbqVPLTWj5TAPg.root:fJLLPFB064P7hY2va0aj@gateway04.us-east-1.prod.aws.tidbcloud.com:4000/5FK4prUhhexLGmkgTTrwbh?ssl={\"rejectUnauthorized\":true}";

// Parse the URL
const url = new URL(DATABASE_URL.replace('mysql://', 'http://'));
const [user, password] = url.username ? [decodeURIComponent(url.username), decodeURIComponent(url.password)] : ['root', ''];
const host = url.hostname;
const port = parseInt(url.port) || 4000;
const database = url.pathname.slice(1).split('?')[0];

console.log(`Connecting to TiDB: ${host}:${port}/${database} as ${user}`);

const c = await mysql.createConnection({
  host, port, user, password, database,
  ssl: { rejectUnauthorized: true }
});

console.log('Connected to TiDB Cloud');

// ─── 1. Fix stakeholderPositionOptions ────────────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE stakeholderPositionOptions");
  const fields = cols.map(x => x.Field);
  console.log('stakeholderPositionOptions columns:', fields.join(', '));
  
  if (!fields.includes('label')) {
    await c.query("ALTER TABLE stakeholderPositionOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
    console.log('✓ Added label column to stakeholderPositionOptions');
  } else {
    console.log('✓ stakeholderPositionOptions.label already exists');
  }
} catch (e) {
  if (e.message.includes("doesn't exist")) {
    // Table doesn't exist — create it
    await c.query(`CREATE TABLE stakeholderPositionOptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      label VARCHAR(200) NOT NULL DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log('✓ Created stakeholderPositionOptions table');
  } else {
    console.error('stakeholderPositionOptions error:', e.message);
  }
}

// ─── 2. Fix commPlanRoleOptions ───────────────────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE commPlanRoleOptions");
  const fields = cols.map(x => x.Field);
  console.log('commPlanRoleOptions columns:', fields.join(', '));
  if (!fields.includes('label')) {
    await c.query("ALTER TABLE commPlanRoleOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
    console.log('✓ Added label to commPlanRoleOptions');
  } else {
    console.log('✓ commPlanRoleOptions.label already exists');
  }
} catch (e) {
  if (e.message.includes("doesn't exist")) {
    await c.query(`CREATE TABLE commPlanRoleOptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      label VARCHAR(200) NOT NULL DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log('✓ Created commPlanRoleOptions table');
  } else {
    console.error('commPlanRoleOptions error:', e.message);
  }
}

// ─── 3. Fix commPlanJobOptions ────────────────────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE commPlanJobOptions");
  const fields = cols.map(x => x.Field);
  console.log('commPlanJobOptions columns:', fields.join(', '));
  if (!fields.includes('label')) {
    await c.query("ALTER TABLE commPlanJobOptions ADD COLUMN label VARCHAR(200) NOT NULL DEFAULT '' AFTER projectId");
    console.log('✓ Added label to commPlanJobOptions');
  } else {
    console.log('✓ commPlanJobOptions.label already exists');
  }
} catch (e) {
  if (e.message.includes("doesn't exist")) {
    await c.query(`CREATE TABLE commPlanJobOptions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      label VARCHAR(200) NOT NULL DEFAULT '',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log('✓ Created commPlanJobOptions table');
  } else {
    console.error('commPlanJobOptions error:', e.message);
  }
}

// ─── 4. Check commPlanItems table ─────────────────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE commPlanItems");
  console.log('commPlanItems columns:', cols.map(x => x.Field).join(', '));
} catch (e) {
  if (e.message.includes("doesn't exist")) {
    await c.query(`CREATE TABLE commPlanItems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      entryId INT NOT NULL,
      projectId INT NOT NULL,
      description TEXT,
      commType VARCHAR(50),
      periodic VARCHAR(50),
      sequence INT DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log('✓ Created commPlanItems table');
  } else {
    console.error('commPlanItems error:', e.message);
  }
}

// ─── 5. Check rbsResourceTypes table ─────────────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE rbsResourceTypes");
  console.log('rbsResourceTypes columns:', cols.map(x => x.Field).join(', '));
} catch (e) {
  if (e.message.includes("doesn't exist")) {
    await c.query(`CREATE TABLE rbsResourceTypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      projectId INT NOT NULL,
      name VARCHAR(200) NOT NULL,
      color VARCHAR(50) DEFAULT '#6366f1',
      description TEXT,
      isBuiltIn TINYINT(1) DEFAULT 0 NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`);
    console.log('✓ Created rbsResourceTypes table');
  } else {
    console.error('rbsResourceTypes error:', e.message);
  }
}

// ─── 6. Check tasks table for required columns ────────────────────────────────
try {
  const [cols] = await c.query("DESCRIBE tasks");
  const fields = cols.map(x => x.Field);
  const required = ['sprintId','communicationStakeholderId','recurringType','recurringInterval','recurringEndDate','parentTaskId','followUpOfId','seriesId','manHours'];
  const missing = required.filter(f => !fields.includes(f));
  if (missing.length) {
    console.log('Tasks missing columns:', missing.join(', '));
    // Add missing columns
    for (const col of missing) {
      let def = '';
      if (col === 'sprintId') def = 'INT NULL';
      else if (col === 'communicationStakeholderId') def = 'INT NULL';
      else if (col === 'recurringType') def = "VARCHAR(50) NULL";
      else if (col === 'recurringInterval') def = 'INT NULL';
      else if (col === 'recurringEndDate') def = 'DATETIME NULL';
      else if (col === 'parentTaskId') def = 'INT NULL';
      else if (col === 'followUpOfId') def = 'INT NULL';
      else if (col === 'seriesId') def = 'VARCHAR(100) NULL';
      else if (col === 'manHours') def = 'DECIMAL(10,2) NULL';
      await c.query(`ALTER TABLE tasks ADD COLUMN ${col} ${def}`);
      console.log(`✓ Added tasks.${col}`);
    }
  } else {
    console.log('✓ tasks table has all required columns');
  }
} catch (e) {
  console.error('tasks error:', e.message);
}

// ─── 7. Check communicationPlanEntries for acknowledgmentNeeded ───────────────
try {
  const [cols] = await c.query("DESCRIBE communicationPlanEntries");
  const fields = cols.map(x => x.Field);
  if (!fields.includes('acknowledgmentNeeded')) {
    await c.query("ALTER TABLE communicationPlanEntries ADD COLUMN acknowledgmentNeeded TINYINT(1) DEFAULT 0 NOT NULL");
    console.log('✓ Added acknowledgmentNeeded to communicationPlanEntries');
  } else {
    console.log('✓ communicationPlanEntries.acknowledgmentNeeded exists');
  }
  if (!fields.includes('targetType')) {
    await c.query("ALTER TABLE communicationPlanEntries ADD COLUMN targetType VARCHAR(50) NULL");
    console.log('✓ Added targetType to communicationPlanEntries');
  }
  if (!fields.includes('targetValue')) {
    await c.query("ALTER TABLE communicationPlanEntries ADD COLUMN targetValue VARCHAR(500) NULL");
    console.log('✓ Added targetValue to communicationPlanEntries');
  }
  if (!fields.includes('responsibleStakeholderId')) {
    await c.query("ALTER TABLE communicationPlanEntries ADD COLUMN responsibleStakeholderId INT NULL");
    console.log('✓ Added responsibleStakeholderId to communicationPlanEntries');
  }
} catch (e) {
  console.error('communicationPlanEntries error:', e.message);
}

// Add PartTime to resourceCalendar calType enum
try {
  await c.query("ALTER TABLE resourceCalendar MODIFY COLUMN calType ENUM('Working','Leave','Holiday','Training','PartTime') NOT NULL DEFAULT 'Working'");
  console.log('✓ resourceCalendar calType enum updated to include PartTime');
} catch (e) { console.log('resourceCalendar calType update:', e.message); }

await c.end();
console.log('\nAll done!');
