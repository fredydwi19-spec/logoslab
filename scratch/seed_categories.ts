import { db } from "../src/db/db";
import { projects } from "../src/db/schema";
import { sql } from "drizzle-orm";

async function seed() {
  const categories = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  // Update existing projects with random categories
  const allProjects = await db.select().from(projects);
  for (const p of allProjects) {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    await db.update(projects).set({ category: randomCat }).where(sql`${projects.id} = ${p.id}`);
  }
  
  console.log("Projects updated with categories.");
  process.exit(0);
}

seed();
