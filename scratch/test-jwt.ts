import { db } from "../src/db/db";
import { users } from "../src/db/schema";
import { jwt } from "@elysiajs/jwt";

async function test() {
  const [user] = await db.select().from(users).limit(1);
  console.log("User:", user.id);

  // We don't have the jwt secret easily here, so maybe we bypass?
  // Let's just run an elysia instance to generate jwt
}
test();
