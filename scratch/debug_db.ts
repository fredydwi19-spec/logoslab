import { db } from "../src/db/db";
import { users, projects } from "../src/db/schema";

async function debug() {
  const allUsers = await db.select().from(users);
  console.log("Users:", allUsers.map(u => ({ id: u.id, role: u.role, interests: u.interests, hasOnboarded: u.hasOnboarded })));
  
  const allProjects = await db.select().from(projects);
  console.log("Projects:", allProjects.map(p => ({ id: p.id, title: p.title, category: p.category, type: p.type })));
  
  process.exit(0);
}

debug();
