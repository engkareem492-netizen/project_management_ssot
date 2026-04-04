import { readFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { createConnection } from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

export async function runMigrations(): Promise<void> {
  const journalPath = path.join(ROOT, "drizzle/meta/_journal.json");
  if (!existsSync(journalPath)) {
    console.log("[Migrations] No journal found, skipping.");
    return;
  }

  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  const conn = await createConnection(process.env.DATABASE_URL!);

  try {
    // Ensure migrations table exists
    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        id INT AUTO_INCREMENT PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT
      )
    `);

    const [applied] = await conn.query("SELECT hash FROM __drizzle_migrations") as any[];
    const appliedHashes = new Set((applied as any[]).map((r: any) => r.hash));
    console.log(`[Migrations] Applied: ${appliedHashes.size}, Journal entries: ${journal.entries.length}`);

    let ran = 0;
    for (const entry of journal.entries) {
      const sqlFile = path.join(ROOT, `drizzle/${entry.tag}.sql`);
      if (!existsSync(sqlFile)) continue;

      const content = readFileSync(sqlFile, "utf8");
      const hash = createHash("sha256").update(content).digest("hex");

      if (appliedHashes.has(hash)) continue;

      console.log(`[Migrations] Applying: ${entry.tag}`);

      const statements = content
        .split("--> statement-breakpoint")
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      for (const stmt of statements) {
        try {
          await conn.query(stmt);
        } catch (e: any) {
          if (
            e.code === "ER_TABLE_EXISTS_ERROR" ||
            e.code === "ER_DUP_FIELDNAME" ||
            e.code === "ER_DUP_KEYNAME" ||
            (e.message && e.message.includes("already exists"))
          ) {
            // Safe to ignore — table/column already exists
          } else {
            console.error(`[Migrations] ERROR in ${entry.tag}: ${e.message}`);
            console.error(`[Migrations] SQL: ${stmt.substring(0, 120)}`);
          }
        }
      }

      await conn.query(
        "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
        [hash, Date.now()]
      );
      ran++;
    }

    if (ran > 0) {
      console.log(`[Migrations] Done. Applied ${ran} new migration(s).`);
    } else {
      console.log(`[Migrations] All up to date.`);
    }
  } finally {
    await conn.end();
  }
}
