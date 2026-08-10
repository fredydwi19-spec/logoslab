import { db } from "./src/db/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixPasswords() {
  const accounts = [
    { username: "testagent2", password: "user1234" },
    { username: "testagent", password: "pakar1234" }
  ];

  for (const acc of accounts) {
    const hashedPassword = await bcrypt.hash(acc.password, 10);
    await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, acc.username));
    console.log(`Updated password for ${acc.username}`);
  }
}

await fixPasswords();
process.exit(0);
