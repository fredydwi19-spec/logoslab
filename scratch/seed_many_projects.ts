import { db } from "../src/db/db";
import { projects, users } from "../src/db/schema";

async function seedManyProjects() {
  const [admin] = await db.select().from(users).limit(1);
  if (!admin) {
    console.log("No users found.");
    process.exit(1);
  }

  const categories = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  // Delete existing to start fresh
  // await db.delete(projects); 

  const newProjects = [];
  for (let i = 1; i <= 35; i++) {
    const isGame = i <= 25 || Math.random() > 0.5;
    newProjects.push({
      title: isGame ? `Game Alkitab #${i}` : `Materi Pembelajaran #${i}`,
      type: isGame ? "GAME" : "MATERI",
      category: categories[Math.floor(Math.random() * categories.length)],
      status: "PUBLISHED",
      idPembuat: admin.id
    });
  }

  for (const p of newProjects) {
    await db.insert(projects).values(p as any);
  }

  console.log("35 projects seeded successfully.");
  process.exit(0);
}

seedManyProjects();
