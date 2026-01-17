import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Seed Status Options
const statusData = [
  { value: 'Open', label: 'Open', category: 'all', color: 'blue', isDefault: true },
  { value: 'In Progress', label: 'In Progress', category: 'all', color: 'yellow', isDefault: false },
  { value: 'Completed', label: 'Completed', category: 'all', color: 'green', isDefault: false },
  { value: 'Closed', label: 'Closed', category: 'all', color: 'gray', isDefault: false },
  { value: 'Pending', label: 'Pending', category: 'all', color: 'orange', isDefault: false },
  { value: 'Blocked', label: 'Blocked', category: 'all', color: 'red', isDefault: false },
  { value: 'Resolved', label: 'Resolved', category: 'issue', color: 'green', isDefault: false },
];

// Seed Priority Options
const priorityData = [
  { value: 'Low', label: 'Low', category: 'all', color: 'gray', level: 1, isDefault: false },
  { value: 'Medium', label: 'Medium', category: 'all', color: 'blue', level: 2, isDefault: true },
  { value: 'High', label: 'High', category: 'all', color: 'orange', level: 3, isDefault: false },
  { value: 'Very High', label: 'Very High', category: 'all', color: 'red', level: 4, isDefault: false },
];

// Seed Type Options (for Requirements)
const typeData = [
  { value: 'WRICEF', label: 'WRICEF', description: 'Workflow, Report, Interface, Conversion, Enhancement, Form', isDefault: true },
  { value: 'Functional', label: 'Functional', description: 'Functional requirement', isDefault: false },
  { value: 'Technical', label: 'Technical', description: 'Technical requirement', isDefault: false },
  { value: 'Business', label: 'Business', description: 'Business requirement', isDefault: false },
];

// Seed Category Options (for Requirements)
const categoryData = [
  { value: 'FICO', label: 'FICO', description: 'Financial Accounting and Controlling', isDefault: false },
  { value: 'SD', label: 'SD', description: 'Sales and Distribution', isDefault: false },
  { value: 'MM', label: 'MM', description: 'Materials Management', isDefault: false },
  { value: 'HXM', label: 'HXM', description: 'Human Experience Management', isDefault: false },
  { value: 'PP', label: 'PP', description: 'Production Planning', isDefault: false },
  { value: 'QM', label: 'QM', description: 'Quality Management', isDefault: false },
];

try {
  console.log('Seeding dropdown options...');
  
  // Insert status options
  for (const status of statusData) {
    await connection.execute(
      `INSERT INTO statusOptions (value, label, category, color, isDefault, usageCount) 
       VALUES (?, ?, ?, ?, ?, 0) 
       ON DUPLICATE KEY UPDATE label=VALUES(label), category=VALUES(category), color=VALUES(color)`,
      [status.value, status.label, status.category, status.color, status.isDefault]
    );
  }
  console.log('✓ Status options seeded');

  // Insert priority options
  for (const priority of priorityData) {
    await connection.execute(
      `INSERT INTO priorityOptions (value, label, category, color, level, isDefault, usageCount) 
       VALUES (?, ?, ?, ?, ?, ?, 0) 
       ON DUPLICATE KEY UPDATE label=VALUES(label), category=VALUES(category), color=VALUES(color), level=VALUES(level)`,
      [priority.value, priority.label, priority.category, priority.color, priority.level, priority.isDefault]
    );
  }
  console.log('✓ Priority options seeded');

  // Insert type options
  for (const type of typeData) {
    await connection.execute(
      `INSERT INTO typeOptions (value, label, description, isDefault, usageCount) 
       VALUES (?, ?, ?, ?, 0) 
       ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description)`,
      [type.value, type.label, type.description, type.isDefault]
    );
  }
  console.log('✓ Type options seeded');

  // Insert category options
  for (const category of categoryData) {
    await connection.execute(
      `INSERT INTO categoryOptions (value, label, description, isDefault, usageCount) 
       VALUES (?, ?, ?, ?, 0) 
       ON DUPLICATE KEY UPDATE label=VALUES(label), description=VALUES(description)`,
      [category.value, category.label, category.description, category.isDefault]
    );
  }
  console.log('✓ Category options seeded');

  console.log('\n✅ All dropdown options seeded successfully!');
} catch (error) {
  console.error('❌ Error seeding options:', error);
} finally {
  await connection.end();
}
