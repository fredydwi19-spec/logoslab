import { db } from "./src/db/db";
import { projects } from "./src/db/schema";

const allProjects = await db.select().from(projects);
console.log(JSON.stringify(allProjects, null, 2));
process.exit(0);
