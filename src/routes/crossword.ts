import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, gameCrossword, notifications, reviewsHistory, userScores } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { toLevel, firstEditableLevel, isProjectTeam, publicCrosswordClues, publicCrosswordGrid } from "../utils/level";

export const crosswordRoutes = new Elysia({ prefix: "/api/crossword" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .onBeforeHandle(async ({ jwt, cookie, request }) => {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Allow public access to gameplay routes
    if (request.method === "GET" && path.match(/^\/api\/crossword\/\d+$/)) return;

    const auth = cookie.auth;
    if (!auth?.value) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const payload = await jwt.verify(auth.value as string);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  })
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  // Get Crossword Details (?level=N, bawaan Level 1)
  .get("/:projectId", async ({ params: { projectId }, query, user }) => {
    const pid = Number(projectId);
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    // Selain anggota tim proyek, hanya game terbit dan level yang sudah terbit yang bisa diambil
    const isTeam = isProjectTeam(user, project);
    if (!isTeam && project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const level = toLevel(query.level);
    const savedLevels = await db.select({ level: gameCrossword.level }).from(gameCrossword).where(eq(gameCrossword.projectId, pid));
    const levelCount = isTeam ? Math.max(0, ...savedLevels.map(r => r.level)) : project.publishedLevelCount;
    if (!isTeam && level > project.publishedLevelCount) return { success: true, data: null, levelCount };

    const [gameData] = await db.select().from(gameCrossword)
      .where(and(eq(gameCrossword.projectId, pid), eq(gameCrossword.level, level)));

    if (!gameData) return { success: true, data: null, levelCount };

    return {
      success: true,
      levelCount,
      data: {
        ...gameData,
        // Pemain tidak menerima huruf jawaban; jawaban dicek lewat /api/projects/:id/levels/:level/answer
        clues: isTeam ? JSON.parse(gameData.clues) : publicCrosswordClues(JSON.parse(gameData.clues)),
        gridData: isTeam ? JSON.parse(gameData.gridData) : publicCrosswordGrid(JSON.parse(gameData.gridData))
      } 
    };
  })
  // Save/Update Questions
  .post("/:projectId/questions", async ({ params: { projectId }, body, user }) => {
    if (user.role !== "PEMBUAT_GAME" && user.role !== "KETUA_TIM") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const pid = Number(projectId);
    const { clues, gridSize, difficulty, score, gridData } = body as any;

    // Check project status
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });
    
    // Otoritas check
    if (user.role === "PEMBUAT_GAME" && project.idPembuat !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden: Not your project" }), { status: 403 });
    }

    const minLevel = firstEditableLevel(project);
    if (minLevel === null) {
      return new Response(JSON.stringify({ error: "Project is read-only in current status" }), { status: 403 });
    }

    // Upsert per level: satu grid untuk setiap level
    const level = toLevel((body as any).level);
    if (level < minLevel) {
        return new Response(JSON.stringify({ error: `Level ${level} sudah terbit dan dikunci.` }), { status: 403 });
    }
    const levelFilter = and(eq(gameCrossword.projectId, pid), eq(gameCrossword.level, level));
    const [existing] = await db.select().from(gameCrossword).where(levelFilter);

    const values = {
        projectId: pid,
        level,
        clues: JSON.stringify(clues),
        gridSize,
        difficulty,
        score,
        gridData: JSON.stringify(gridData)
    };

    if (existing) {
        await db.update(gameCrossword).set(values).where(levelFilter);
    } else {
        await db.insert(gameCrossword).values(values);
    }

    return { success: true, message: "Crossword questions saved" };
  })
  // Submit Gameplay
  .post("/:projectId/submit", async ({ params: { projectId }, body, user }) => {
    const pid = Number(projectId);
    const { scoreEarned } = body as any;

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    // Skor tidak lagi disimpan di sini (angka dari browser bisa diakali).
    // Skor resmi per level dinilai & disimpan oleh POST /api/projects/:id/levels/:level/finish (routes/levels.ts).
    return {
      success: true,
      scoreEarned,
      message: `Selamat! Skor Anda: ${scoreEarned}.`
    };
  });
