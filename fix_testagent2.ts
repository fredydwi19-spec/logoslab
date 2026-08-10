import { db } from "./src/db/db";
import { users } from "./src/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixTestAgent2() {
  const hashedPassword = await bcrypt.hash("user1234", 10);
  
  // Update both username and password and role
  await db.update(users)
    .set({ 
      username: "testagent2", 
      password: hashedPassword,
      role: "PEMBUAT_GAME" 
    })
    .where(eq(users.id, 2));
    
  console.log("Updated testagent2 (ID 2): Renamed, Hashed, and set as PEMBUAT_GAME");
}

await fixTestAgent2();
process.exit(0);
