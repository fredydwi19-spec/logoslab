import { db } from '../src/db/db';
import { projects, users, notifications } from '../src/db/schema';

async function main() {
  const p = await db.select({
    id: projects.id,
    title: projects.title,
    idPembuat: projects.idPembuat,
    idPakar: projects.idPakar,
    status: projects.status
  }).from(projects);
  
  const u = await db.select({
    id: users.id,
    name: users.name,
    role: users.role
  }).from(users);
  
  console.log(JSON.stringify({projects: p, users: u}, null, 2));
  process.exit(0);
}
main();
