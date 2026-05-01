import { db } from "./src/db/db";
import { users } from "./src/db/schema";
import bcrypt from "bcryptjs";

async function seed() {
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  await db.insert(users).values({
    name: "Ketua Tim",
    email: "ketua@logoslab.com",
    username: "ketuatim",
    password: hashedPassword,
    role: "KETUA_TIM"
  });

  console.log("✅ Test user created!");
  console.log("Username: ketuatim");
  console.log("Password: password123");
  process.exit(0);
}

seed();
