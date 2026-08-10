import { db } from '../src/db/db';
import { projects } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { PembuatGameDashboard } from '../src/views/components/PembuatGameDashboard';
import fs from 'fs';

async function main() {
  const userId = 2; // TESTAGENT2
  const projectSelectFields = {
    id: projects.id,
    title: projects.title,
    description: projects.description,
    instructions: projects.instructions,
    gameType: projects.gameType,
    type: projects.type,
    category: projects.category,
    status: projects.status,
    revisionCount: projects.revisionCount,
    deadline: projects.deadline,
    idPembuat: projects.idPembuat,
    idPakar: projects.idPakar,
    createdAt: projects.createdAt,
    updatedAt: projects.updatedAt
  };

  try {
    const myProjectsData = await db.select(projectSelectFields).from(projects).where(eq(projects.idPembuat, userId));
    const html = PembuatGameDashboard({ 
      myProjects: myProjectsData,
      publishedProjects: [],
      allUsers: []
    });
    
    fs.writeFileSync('scratch/pembuat_dashboard_rendered.html', html);
    console.log("Written HTML to scratch/pembuat_dashboard_rendered.html");
  } catch (e) {
    console.error("Rendering error:", e);
  }
  process.exit(0);
}

main();
