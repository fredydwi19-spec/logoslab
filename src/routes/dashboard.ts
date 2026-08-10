import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { getDashboardKpiSummary, getUserDashboardSummary } from "../services/dashboardService";
import { getUserAchievements } from "../services/achievementService";
import { db } from "../db/db";
import { projects } from "../db/schema";
import { eq, and } from "drizzle-orm";
export const dashboardRoutes = new Elysia({ prefix: "/api/dashboard" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  /**
   * GET /api/dashboard/kpi-summary
   * Menyuplai semua data statistik KPI Cards, Spider Chart, Funnel Chart, dan Heatmap.
   * Akses: KETUA_TIM only.
   */
  .get("/kpi-summary", async ({ user }) => {
    // RBAC Guard: hanya ketua_tim yang boleh mengakses
    if (!user || user.role !== "KETUA_TIM") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Akses hanya untuk Ketua Tim" }),
        { status: 403 }
      );
    }

    try {
      const summary = await getDashboardKpiSummary();
      return { success: true, data: summary };
    } catch (err: any) {
      console.error("[dashboard/kpi-summary] Error:", err.message);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data KPI", detail: err.message }),
        { status: 500 }
      );
    }
  })
  /**
   * GET /api/dashboard/user-summary
   * Menyuplai data dashboard siswa/user (Spider Chart, KPI)
   */
  .get("/user-summary", async ({ user }) => {
    if (!user || user.role !== "USER") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Akses hanya untuk User/Siswa" }),
        { status: 403 }
      );
    }
    try {
      const summary = await getUserDashboardSummary(user.id);
      return { success: true, data: summary };
    } catch (err: any) {
      console.error("[dashboard/user-summary] Error:", err.message);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data dashboard user", detail: err.message }),
        { status: 500 }
      );
    }
  })
  /**
   * GET /api/dashboard/achievements
   * Data pencapaian dan gamifikasi user
   */
  .get("/achievements", async ({ user }) => {
    if (!user || user.role !== "USER") {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403 }
      );
    }
    try {
      const achievements = await getUserAchievements(user.id);
      return { success: true, data: achievements };
    } catch (err: any) {
      console.error("[dashboard/achievements] Error:", err.message);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data pencapaian", detail: err.message }),
        { status: 500 }
      );
    }
  })
  /**
   * GET /api/dashboard/published-materi
   * Mengembalikan semua proyek materi berstatus PUBLISHED
   */
  .get("/published-materi", async () => {
    try {
      const publishedMateri = await db.select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        materiType: projects.materiType,
        thumbnailUrl: projects.thumbnailUrl,
        category: projects.category,
        status: projects.status,
      }).from(projects).where(
        and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED"))
      );
      
      return { success: true, data: publishedMateri };
    } catch (err: any) {
      console.error("[dashboard/published-materi] Error:", err.message);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data materi", detail: err.message }),
        { status: 500 }
      );
    }
  })
  /**
   * GET /api/dashboard/published-games
   * Mengembalikan semua proyek game berstatus PUBLISHED
   */
  .get("/published-games", async () => {
    try {
      const publishedGames = await db.select({
        id: projects.id,
        title: projects.title,
        description: projects.description,
        gameType: projects.gameType,
        thumbnailUrl: projects.thumbnailUrl,
        category: projects.category,
        status: projects.status,
      }).from(projects).where(
        and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED"))
      );
      
      return { success: true, data: publishedGames };
    } catch (err: any) {
      console.error("[dashboard/published-games] Error:", err.message);
      return new Response(
        JSON.stringify({ error: "Gagal mengambil data game", detail: err.message }),
        { status: 500 }
      );
    }
  });
