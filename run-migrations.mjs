import 'dotenv/config';
import mysql from 'mysql2/promise';
import { readFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const journal = JSON.parse(readFileSync('./drizzle/meta/_journal.json', 'utf8'));

async function main() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    // Get applied migrations
    const [applied] = await conn.query('SELECT hash FROM __drizzle_migrations');
    const appliedHashes = new Set(applied.map(r => r.hash));
    console.log(`Applied: ${appliedHashes.size}, Total in journal: ${journal.entries.length}`);

    let ran = 0;
    for (const entry of journal.entries) {
      const sqlFile = `./drizzle/${entry.tag}.sql`;
      if (!existsSync(sqlFile)) {
        console.log(`SKIP (no file): ${entry.tag}`);
        continue;
      }
      const content = readFileSync(sqlFile, 'utf8');
      const hash = createHash('sha256').update(content).digest('hex');
      
      if (appliedHashes.has(hash)) {
        continue; // already applied
      }

      console.log(`Applying: ${entry.tag}`);
      
      // Split by statement-breakpoint and execute each statement
      const statements = content
        .split('--> statement-breakpoint')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await conn.query(stmt);
        } catch (e) {
          // Ignore "already exists" and "duplicate column" errors
          if (e.code === 'ER_TABLE_EXISTS_ERROR' || 
              e.code === 'ER_DUP_FIELDNAME' ||
              e.code === 'ER_DUP_KEYNAME' ||
              (e.message && e.message.includes('already exists'))) {
            console.log(`  SKIP (already exists): ${stmt.substring(0, 60)}...`);
          } else {
            console.error(`  ERROR in ${entry.tag}: ${e.message}`);
            console.error(`  SQL: ${stmt.substring(0, 100)}`);
          }
        }
      }

      // Record migration as applied
      await conn.query(
        'INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)',
        [hash, Date.now()]
      );
      ran++;
    }

    console.log(`Done. Applied ${ran} new migrations.`);
  } finally {
    await conn.end();
  }
}

main().catch(e => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
