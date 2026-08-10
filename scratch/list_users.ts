import { db } from "./src/db";
import { users } from "./src/db/schema";

const allUsers = await db.select().from(users);
console.log(JSON.stringify(allUsers, null, 2));
process.exit(0);
