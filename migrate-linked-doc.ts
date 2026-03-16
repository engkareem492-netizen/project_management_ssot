import { getDb } from "./server/db";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  // Check if column already exists
  const checkCol = async (table: string) => {
    const [rows] = await db.execute(`SHOW COLUMNS FROM \`${table}\` LIKE 'linkedDocumentId'`);
    return (rows as any[]).length > 0;
  };

  // knowledgeBase
  const kbHas = await checkCol("knowledgeBase");
  console.log("knowledgeBase has linkedDocumentId:", kbHas);
  if (!kbHas) {
    try {
      await db.execute("ALTER TABLE `knowledgeBase` ADD COLUMN `linkedDocumentId` int DEFAULT NULL");
      console.log("knowledgeBase: added OK");
    } catch (e: any) {
      console.error("knowledgeBase error:", e.sqlMessage ?? e.message);
    }
  }

  // lessonsLearned
  const llHas = await checkCol("lessonsLearned");
  console.log("lessonsLearned has linkedDocumentId:", llHas);
  if (!llHas) {
    try {
      await db.execute("ALTER TABLE `lessonsLearned` ADD COLUMN `linkedDocumentId` int DEFAULT NULL");
      console.log("lessonsLearned: added OK");
    } catch (e: any) {
      console.error("lessonsLearned error:", e.sqlMessage ?? e.message);
    }
  }

  // eefFactors
  const eefHas = await checkCol("eefFactors");
  console.log("eefFactors has linkedDocumentId:", eefHas);
  if (!eefHas) {
    try {
      await db.execute("ALTER TABLE `eefFactors` ADD COLUMN `linkedDocumentId` int DEFAULT NULL");
      console.log("eefFactors: added OK");
    } catch (e: any) {
      console.error("eefFactors error:", e.sqlMessage ?? e.message);
    }
  }

  process.exit(0);
}

main();
