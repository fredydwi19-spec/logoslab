import { db } from "../src/db/db";
import { sql } from "drizzle-orm";

async function test() {
  try {
    const result = await db.execute(sql`SHOW TABLES`);
    console.log("Tables:", result);
  } catch (error) {
    console.error("DB Error:", error);
  }
  process.exit(0);
}

test();
