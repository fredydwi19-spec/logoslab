import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

let pool: mysql.Pool;

try {
  pool = mysql.createPool({
    uri: process.env.DATABASE_URL!,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test koneksi saat startup
  const conn = await pool.getConnection();
  console.log("✅ Database connected successfully");
  conn.release();
} catch (error) {
  const err = error as Error;
  console.error(`❌ Failed to connect to database: ${err.message}`);
  console.error(`   Check your DATABASE_URL in .env`);
  process.exit(1);
}

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
