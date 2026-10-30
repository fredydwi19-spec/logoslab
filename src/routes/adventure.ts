import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { projects, gameAdventureScenes } from "../db/schema";
import { eq, and, asc } from "drizzle-orm";
import { toLevel, firstEditableLevel, isProjectTeam } from "../utils/level";
import { toAdventureScene, validateAdventure, type AdventureScene } from "../utils/adventure";

// Scene satu level dari database, dalam bentuk yang sama dengan editor
export async function loadAdventureScenes(projectId: number, level: number): Promise<AdventureScene[]> {
  const rows = await db.select().from(gameAdventureScenes)
    .where(and(eq(gameAdventureScenes.projectId, projectId), eq(gameAdventureScenes.level, level)))
    .orderBy(asc(gameAdventureScenes.sortOrder), asc(gameAdventureScenes.id));
  return rows.map(toAdventureScene);
}

export const adventureRoutes = new Elysia({ prefix: "/api/adventure" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  // Cerita satu level untuk editor dan Preview (hanya anggota tim proyek). Pemain memakai /api/projects/:id/levels/...
  .get("/:projectId", async ({ params: { projectId }, query, user, set }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(projectId)));
    if (!project || project.gameType !== "ADVENTURE") {
      set.status = 404;
      return { error: "Game Adventure tidak ditemukan" };
    }
    if (!isProjectTeam(user, project)) {
      set.status = 403;
      return { error: "Hanya tim proyek yang bisa membuka isi cerita." };
    }
    const level = toLevel(query.level);
    const levelRows = await db.select({ level: gameAdventureScenes.level }).from(gameAdventureScenes).where(eq(gameAdventureScenes.projectId, project.id));
    const scenes = await loadAdventureScenes(project.id, level);
    return {
      success: true,
      level,
      levelCount: Math.max(1, ...levelRows.map(r => r.level)),
      scenes,
      errors: validateAdventure(scenes, project.passPercentage),
    };
  })
  // Simpan seluruh scene satu level (draf boleh belum lengkap; pemeriksa alur dicek lagi saat Kirim ke Pakar)
  .post("/:projectId/scenes", async ({ params: { projectId }, body, user, set }) => {
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(projectId)));
    if (!project || project.gameType !== "ADVENTURE") {
      set.status = 404;
      return { error: "Game Adventure tidak ditemukan" };
    }
    if (!user || user.role !== "PEMBUAT_GAME" || user.id !== project.idPembuat) {
      set.status = 403;
      return { error: "Hanya Pembuat Game yang ditugaskan yang bisa menyimpan cerita." };
    }
    const minLevel = firstEditableLevel(project);
    if (minLevel === null) {
      set.status = 403;
      return { error: "Proyek sedang direview atau sudah terbit, jadi cerita tidak bisa diubah." };
    }
    const data = (body ?? {}) as any;
    const level = toLevel(data.level);
    if (level < minLevel) {
      set.status = 403;
      return { error: `Level ${level} sudah terbit dan dikunci.` };
    }
    if (!Array.isArray(data.scenes)) {
      set.status = 400;
      return { error: "Data scene tidak valid." };
    }

    const scenes = data.scenes.map(toAdventureScene);
    const keys = scenes.map((s: AdventureScene) => s.sceneKey);
    if (keys.some((k: string) => !/^[A-Za-z0-9_-]{1,20}$/.test(k)) || new Set(keys).size !== keys.length) {
      set.status = 400;
      return { error: "Kode scene kosong, tidak valid, atau dipakai lebih dari sekali." };
    }

    await db.transaction(async (tx) => {
      await tx.delete(gameAdventureScenes).where(and(eq(gameAdventureScenes.projectId, project.id), eq(gameAdventureScenes.level, level)));
      if (scenes.length > 0) {
        await tx.insert(gameAdventureScenes).values(scenes.map((s: AdventureScene, i: number) => ({
          ...s,
          projectId: project.id,
          level,
          choices: JSON.stringify(s.choices),
          sortOrder: i,
        })));
      }
    });
    return { success: true, errors: validateAdventure(scenes, project.passPercentage) };
  });
