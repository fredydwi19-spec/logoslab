import { db } from '../src/db/db';
import { projects } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  const userId = 2; // Pembuat Game
  const myProjectsData = await db.select({
    id: projects.id,
    title: projects.title,
    idPembuat: projects.idPembuat,
    status: projects.status
  }).from(projects).where(eq(projects.idPembuat, userId));
  
  console.log("myProjectsData for Pembuat Game:", myProjectsData);
  process.exit(0);
}
main();
