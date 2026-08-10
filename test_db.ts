import { db } from "./src/db/db";
import { bankSoalFtb } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const data = await db.select().from(bankSoalFtb).limit(1);
    console.log("DB GET success:", data.length);
  } catch (err) {
    console.error("DB GET failed:", (err as Error).message);
  }
  process.exit(0);
}
run();
