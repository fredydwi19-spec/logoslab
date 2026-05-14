import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, gameCrossword, notifications, reviewsHistory, userScores } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";

export const crosswordRoutes = new Elysia({ prefix: "/api/crossword" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
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
  // Get Crossword Details
  .get("/:projectId", async ({ params: { projectId }, user }) => {
    const pid = Number(projectId);
    const [project] = await db.select().from(projects).where(eq(projects.id, pid));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    if (!user && project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const [gameData] = await db.select().from(gameCrossword).where(eq(gameCrossword.projectId, pid));
    
    if (!gameData) return { success: true, data: null };

    return { 
      success: true, 
      data: {
        ...gameData,
        clues: JSON.parse(gameData.clues),
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
    const { clues, gridSize, difficulty, score, gridData } = body as any;

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

    // Upsert logic
    const [existing] = await db.select().from(gameCrossword).where(eq(gameCrossword.projectId, pid));
    
    const values = {
        projectId: pid,
        clues: JSON.stringify(clues),
        gridSize,
        difficulty,
        score,
        gridData: JSON.stringify(gridData)
    };

    if (existing) {
        await db.update(gameCrossword).set(values).where(eq(gameCrossword.projectId, pid));
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

    // Save score to user_scores
    await db.insert(userScores).values({
        userId: user.id,
        projectId: pid,
        score: scoreEarned
    });

    return { 
      success: true, 
      scoreEarned,
      message: `Selamat! Skor Anda (${scoreEarned}) telah dicatat.`
    };
  });
