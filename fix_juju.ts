import { db } from "./src/db/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixJuju() {
  const hashedPassword = await bcrypt.hash("user1234", 10);
  await db.update(users)
    .set({ password: hashedPassword, isVerified: true })
    .where(eq(users.username, "jujukalase732"));
  console.log("Updated Juju Kalase password and verified status.");
}

await fixJuju();
process.exit(0);
