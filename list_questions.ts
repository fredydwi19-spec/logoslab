import { db } from "./src/db/db";
import { questionBank } from "./src/db/schema";
import { eq } from "drizzle-orm";

const allQuestions = await db.select().from(questionBank).where(eq(questionBank.projectId, 1));
console.log(JSON.stringify(allQuestions, null, 2));
process.exit(0);
