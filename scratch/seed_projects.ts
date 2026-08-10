import { db } from "../src/db/db";
import { projects, users } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function seedProjects() {
  const [admin] = await db.select().from(users).limit(1);
  if (!admin) {
    console.log("No users found to assign as creator.");
    process.exit(1);
  }

  const sampleProjects = [
    { title: "Kuis Sejarah Alkitab", type: "GAME", category: "Biblical Knowledge", status: "PUBLISHED", idPembuat: admin.id },
    { title: "Puzzle Hermeneutik", type: "GAME", category: "Eksegesis & Hermeneutik", status: "PUBLISHED", idPembuat: admin.id },
    { title: "Trivia Teologi Dasar", type: "GAME", category: "Biblical Theory", status: "PUBLISHED", idPembuat: admin.id },
    { title: "Simulasi Khotbah", type: "GAME", category: "Homiletika", status: "PUBLISHED", idPembuat: admin.id },
    { title: "Game Apologetika", type: "GAME", category: "Apologetika", status: "PUBLISHED", idPembuat: admin.id },
    { title: "Materi Kitab Kejadian", type: "MATERI", category: "Biblical Knowledge", status: "PUBLISHED", idPembuat: admin.id },
  ];

  for (const p of sampleProjects) {
    await db.insert(projects).values(p as any);
  }

  console.log("Sample projects seeded successfully.");
  process.exit(0);
}

seedProjects();
