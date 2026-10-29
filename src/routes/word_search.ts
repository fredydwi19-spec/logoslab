import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, gameWordSearch, notifications, reviewsHistory } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { toLevel } from "../utils/level";

export const wordSearchRoutes = new Elysia({ prefix: "/api/word-search" })
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
    if (request.method === "GET" && path.match(/^\/api\/word-search\/\d+$/)) return;

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
  // Get Word Search Details (?level=N, bawaan Level 1)
  .get("/:projectId", async ({ params: { projectId }, query, user }) => {
    const pid = Number(projectId);
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    // removed invalid arguments[0] usage
    if (!user && project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const level = toLevel(query.level);
    const savedLevels = await db.select({ level: gameWordSearch.level }).from(gameWordSearch).where(eq(gameWordSearch.projectId, pid));
    const levelCount = Math.max(0, ...savedLevels.map(r => r.level));

    const [gameData] = await db.select().from(gameWordSearch)
      .where(and(eq(gameWordSearch.projectId, pid), eq(gameWordSearch.level, level)));

    if (!gameData) return { success: true, data: null, levelCount };

    return {
      success: true,
      levelCount,
      data: {
        ...gameData,
        words: JSON.parse(gameData.words),
        gridData: JSON.parse(gameData.gridData)
      }
    };
  })
  // Save/Update Questions
  .post("/:projectId/questions", async ({ params: { projectId }, body, user }) => {
    if (user.role !== "PEMBUAT_GAME" && user.role !== "KETUA_TIM") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const pid = Number(projectId);
    const { words, gridSize, difficulty, score, gridData } = body as any;

    // Check project status
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });
    
    // Otoritas check
    if (user.role === "PEMBUAT_GAME" && project.idPembuat !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden: Not your project" }), { status: 403 });
    }

    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
      return new Response(JSON.stringify({ error: "Project is read-only in current status" }), { status: 403 });
    }

    // Upsert per level: satu grid untuk setiap level
    const level = toLevel((body as any).level);
    const levelFilter = and(eq(gameWordSearch.projectId, pid), eq(gameWordSearch.level, level));
    const [existing] = await db.select().from(gameWordSearch).where(levelFilter);

    const values = {
        projectId: pid,
        level,
        words: JSON.stringify(words),
        gridSize,
        difficulty,
        score,
        gridData: JSON.stringify(gridData)
    };

    if (existing) {
        await db.update(gameWordSearch).set(values).where(levelFilter);
    } else {
        await db.insert(gameWordSearch).values(values);
    }

    return { success: true, message: "Word Search questions saved" };
  })
  // Submit Gameplay
  .post("/:projectId/submit", async ({ params: { projectId }, body }) => {
    const pid = Number(projectId);
    const { foundWordsCount, totalWords, difficulty } = body as any;

    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    // Scoring logic (Simplified)
    const pointsPerWord = difficulty === "EASY" ? 10 : difficulty === "MEDIUM" ? 20 : 50;
    const scoreEarned = foundWordsCount * pointsPerWord;

    // TODO: Integrate with user_scores table
    return { 
      success: true, 
      scoreEarned,
      message: `Selamat! Anda menemukan ${foundWordsCount}/${totalWords} kata.`
    };
  });
