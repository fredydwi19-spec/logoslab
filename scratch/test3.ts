import { db } from '../src/db/db';
import { projects } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const userIdNumber = 2;
  const userIdString = "2";
  
  const resNum = await db.select({ id: projects.id }).from(projects).where(eq(projects.idPembuat, userIdNumber));
  const resStr = await db.select({ id: projects.id }).from(projects).where(eq(projects.idPembuat, userIdString as any));
  
  console.log("With Number:", resNum);
  console.log("With String:", resStr);
  process.exit(0);
}
main();
