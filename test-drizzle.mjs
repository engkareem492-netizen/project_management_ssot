import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { eq } from 'drizzle-orm';
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from 'drizzle-orm/mysql-core';

const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin", "master"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

async function test() {
  try {
    const pool = mysql.createPool('mysql://pmuser:pmpass123@localhost:3306/pm_ssot');
    const db = drizzle(pool, { mode: 'default' });
    console.log('DB created');
    const result = await db.select().from(users).where(eq(users.email, 'eng.kareem492@gmail.com')).limit(1);
    console.log('Result:', JSON.stringify(result));
    await pool.end();
  } catch(e) {
    console.error('Error:', e.message);
    if (e.cause) console.error('Cause:', e.cause.message, e.cause.code);
  }
}
test();
