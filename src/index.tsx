import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { wordSearchRoutes } from "./routes/word_search";
import { crosswordRoutes } from "./routes/crossword";
import { materiRoutes } from "./routes/materi";
import { aiRoutes } from "./routes/ai";
import { dashboardRoutes } from "./routes/dashboard";
import { bankSoalRoutes } from "./routes/bank_soal";
import { bankSoalUiRoutes } from "./routes/bank_soal_ui";
import { chatRoutes, projectChatRoutes } from "./routes/chat";
import { userDashboardRoutes } from "./routes/userDashboard";
import { quizDuelsRoutes } from "./routes/quizDuels";
import { journalsRoutes } from "./routes/journals";
import { levelRoutes, cleanupStaleAttempts, buildCatalogInfo } from "./routes/levels";
import { adventureRoutes } from "./routes/adventure";
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";
import { Navbar } from "./views/components/Navbar";
import { OnboardingModal } from "./views/components/OnboardingModal";
import { PersonalizedGames } from "./views/components/PersonalizedGames";
import { GamesSection } from "./views/components/GamesSection";
import { PublicGamePlayer } from "./views/components/PublicGamePlayer";
import { ProfilePage } from "./views/pages/EditProfile";
import { LandingPage } from "./views/pages/LandingPage";
import { db } from "./db/db";
import { users, projects, notifications, materiContents, materialSections, materialGlossary, gamePlayLogs, materialAccessLogs } from "./db/schema";
import { KetuaTimDashboard } from "./views/components/KetuaTimDashboard";
import { PembuatGameDashboard } from "./views/components/PembuatGameDashboard";
import { PembuatMateriDashboard } from "./views/components/PembuatMateriDashboard";
import { PakarDashboard } from "./views/components/PakarDashboard";
import { UserDashboard } from "./views/components/UserDashboard";
import { KetuaTimAllProjects } from "./views/components/KetuaTimAllProjects";
import { MateriViewer, MateriViewerScript } from "./views/components/MateriViewer";
import { DuelHubPage } from "./views/pages/DuelHubPage";
import { DuelArenaPage } from "./views/pages/DuelArenaPage";
import { UserGamesPage } from "./views/pages/UserGamesPage";
import { UserMaterialsPage } from "./views/pages/UserMaterialsPage";
import { UserJournalPage } from "./views/pages/UserJournalPage";
import { eq, inArray, and, desc, sql } from "drizzle-orm";

const app = new Elysia()
  .use(staticPlugin({
    assets: "public",
    prefix: "/public"
  }))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/", async ({ jwt, cookie: { auth } }) => {
    let user: any = null;
    if (auth?.value) {
      const payload: any = await jwt.verify(auth.value as string);
      if (payload) {
        const [userData] = await db.select().from(users).where(eq(users.id, payload.id));
        user = userData;
      }
    }

    // Game dan materi terbit untuk halaman depan (terbaru lebih dulu)
    const publicGames = await db.select().from(projects)
      .where(and(eq(projects.status, "PUBLISHED"), eq(projects.type, "GAME")))
      .orderBy(desc(projects.id)).limit(6);
    const publicMaterials = await db.select().from(projects)
      .where(and(eq(projects.status, "PUBLISHED"), eq(projects.type, "MATERI")))
      .orderBy(desc(projects.id)).limit(4);

    // Statistik halaman depan: semua angka diambil dari database (tanpa angka tambahan)
    const [playerRow] = await db.select({ total: sql<number>`count(*)` }).from(users).where(eq(users.role, "USER"));
    const playsByType = await db.select({ gameType: projects.gameType, total: sql<number>`count(*)` })
      .from(gamePlayLogs)
      .innerJoin(projects, eq(gamePlayLogs.projectId, projects.id))
      .groupBy(projects.gameType);
    const stats = {
      players: Number(playerRow?.total ?? 0),
      // Hanya log yang proyeknya masih ada (log lama milik proyek terhapus tidak dihitung)
      plays: playsByType.reduce((sum, r) => sum + Number(r.total), 0),
      playsByType: playsByType.map(r => ({ gameType: r.gameType ?? "LAINNYA", total: Number(r.total) })).sort((a, b) => b.total - a.total),
    };

    const html = LandingPage({ games: publicGames, materials: publicMaterials, user, stats });
    
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  })
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        status: 404,
        error: "Resource not found",
        code: "NOT_FOUND"
      };
    }

    console.error(`[Error] ${code}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "";
    return {
      status: 500,
      error: message,
      stack: stack,
      code: code
    };
  })
  .use(userRoutes)
  .use(authRoutes)
  .use(projectRoutes)
  .use(wordSearchRoutes)
  .use(crosswordRoutes)
  .use(materiRoutes)
  .use(aiRoutes)
  .use(bankSoalRoutes)
  .use(bankSoalUiRoutes)
  .use(dashboardRoutes)
  .use(chatRoutes)
  .use(projectChatRoutes)
  .use(userDashboardRoutes)
  .use(quizDuelsRoutes)
  .use(journalsRoutes)
  .use(levelRoutes)
  .use(adventureRoutes)
  .group("/dashboard", (app) =>
    app
      .onBeforeHandle(async ({ jwt, cookie, set }) => {
        const auth = cookie.auth;
        if (!auth?.value) {
          return Response.redirect("/", 302);
        }
        const payload = await jwt.verify(auth.value as string);
        if (!payload) {
          return Response.redirect("/", 302);
        }

        // Security: Prevent browser back to dashboard after logout
        set.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
        set.headers["Pragma"] = "no-cache";
        set.headers["Expires"] = "0";
      })
      .derive(async ({ jwt, cookie }) => {
        const auth = cookie.auth;
        const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
        return { user: payload ? { ...payload } : null };
      })
      .get("/profil", async ({ user }) => {
        if (!user) return Response.redirect("/", 302);
        
        // Fetch full user data to get interests, etc.
        const [fullUser] = await db.select().from(users).where(eq(users.id, Number((user as any).id)));
        
        return new Response(ProfilePage({ user: fullUser }), {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
      .get("/duels", async ({ user }) => {
        if (!user) return Response.redirect("/", 302);
        
        const username = ((user as any).name || (user as any).username) as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
        
        const htmlResponse = Layout({
          title: "Hub Duel 1v1",
          username,
          role: userRole,
          children: DuelHubPage({ username, userId }),
          notifications: userNotifications,
          currentPage: "Mode Duel 1v1",
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
      .get("/journal", async ({ user }) => {
        if (!user) return Response.redirect("/", 302);
        
        const username = ((user as any).name || (user as any).username) as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Jurnal Saya",
          username,
          role: userRole,
          children: UserJournalPage(),
          notifications: userNotifications,
          currentPage: "Jurnal Saya",
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      .get("/games", async ({ user }) => {
        if (!user) return Response.redirect("/", 302);
        
        const username = ((user as any).name || (user as any).username) as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
        
        const publishedGames = await db.select().from(projects).where(and(eq(projects.status, "PUBLISHED"), eq(projects.type, "GAME")));
        // Info katalog: jumlah level & soal serta progres pemain ini
        const catalogInfo = await buildCatalogInfo(publishedGames, userId);
        const games = publishedGames.map(g => ({
          id: g.id, title: g.title, description: g.description, gameType: g.gameType, thumbnailUrl: g.thumbnailUrl,
          ...catalogInfo.get(g.id),
        }));

        const htmlResponse = Layout({
          title: "Jelajah Game",
          username,
          role: userRole,
          children: UserGamesPage({ games }),
          notifications: userNotifications,
          currentPage: "Jelajah Game",
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      .get("/materials", async ({ user }) => {
        if (!user) return Response.redirect("/", 302);
        
        const username = ((user as any).name || (user as any).username) as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
        
        const materials = await db.select().from(projects).where(and(eq(projects.status, "PUBLISHED"), eq(projects.type, "MATERI")));

        const htmlResponse = Layout({
          title: "Materi Belajar",
          username,
          role: userRole,
          children: UserMaterialsPage({ materials }),
          notifications: userNotifications,
          currentPage: "Materi Belajar",
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      .get("/projects", async ({ user }) => {
        if (!user || (user as any).role !== "KETUA_TIM") {
          return Response.redirect("/", 302);
        }
        
        const username = ((user as any).name || (user as any).username) as string;
        const projectSelectFields = {
          id: projects.id,
          title: projects.title,
          description: projects.description,
          instructions: projects.instructions,
          gameType: projects.gameType,
          materiType: projects.materiType,
          type: projects.type,
          category: projects.category,
          status: projects.status,
          publishedLevelCount: projects.publishedLevelCount,
          levelReviewStatus: projects.levelReviewStatus,
          revisionCount: projects.revisionCount,
          deadline: projects.deadline,
          idPembuat: projects.idPembuat,
          idPakar: projects.idPakar,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt
        };

        const allProjectsData = await db.select(projectSelectFields).from(projects);
        console.log("LOG KETUA TIM - JUMLAH PROYEK DITEMUKAN:", allProjectsData.length);
        const pembuatGamesData = await db.select().from(users).where(eq(users.role, "PEMBUAT_GAME"));
        const pembuatMaterisData = await db.select().from(users).where(eq(users.role, "PEMBUAT_MATERI"));
        const pakarData = await db.select().from(users).where(eq(users.role, "PAKAR"));
        
        const dashboardContent = KetuaTimAllProjects({ allProjects: allProjectsData, pembuatGames: pembuatGamesData, pembuatMateris: pembuatMaterisData, pakars: pakarData });
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Semua Proyek",
          username,
          role: "KETUA_TIM",
          children: dashboardContent,
          notifications: userNotifications,
          currentPage: "Manajemen Proyek Game — Ketua Tim",
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
      .get("/:role", async ({ params, user }) => {
        if (!user || !(user as any).role) return "Unauthorized";

        const userRole = (user as any).role as string;
        const username = ((user as any).name || (user as any).username) as string;
        const userId = Number((user as any).id);
        const rolePath = userRole.toLowerCase().split('_')[0];

        if (params.role !== rolePath) {
          return Response.redirect(`/dashboard/${rolePath}`);
        }

        let allProjectsData: any[] = [];
        let pembuatGamesData: any[] = [];
        let pembuatMaterisData: any[] = [];
        let pakarData: any[] = [];
        let myProjectsData: any[] = [];
        let publishedProjectsData: any[] = [];
        let allUsersData: any[] = [];
        let analyticsData: any = null;

        const projectSelectFields = {
          id: projects.id,
          title: projects.title,
          description: projects.description,
          instructions: projects.instructions,
          gameType: projects.gameType,
          materiType: projects.materiType,
          type: projects.type,
          category: projects.category,
          status: projects.status,
          publishedLevelCount: projects.publishedLevelCount,
          levelReviewStatus: projects.levelReviewStatus,
          revisionCount: projects.revisionCount,
          deadline: projects.deadline,
          idPembuat: projects.idPembuat,
          idPakar: projects.idPakar,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt
        };

        if (userRole === "KETUA_TIM") {
          allProjectsData = await db.select(projectSelectFields).from(projects);
          pembuatGamesData = await db.select().from(users).where(eq(users.role, "PEMBUAT_GAME"));
          pembuatMaterisData = await db.select().from(users).where(eq(users.role, "PEMBUAT_MATERI"));
          pakarData = await db.select().from(users).where(eq(users.role, "PAKAR"));
        } else if (userRole === "PEMBUAT_GAME" || userRole === "PEMBUAT_MATERI") {
          myProjectsData = await db.select(projectSelectFields).from(projects).where(
            eq(projects.idPembuat, userId)
          );
          // Semua Proyek Saya: hanya yang sudah PUBLISHED oleh Ketua Tim
          publishedProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(eq(projects.idPembuat, userId), eq(projects.status, "PUBLISHED"))
          );
          allUsersData = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
          
          if (userRole === "PEMBUAT_GAME") {
            const allPublishedGames = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED")));
            const allPublishedMaterials = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED")));
            
            const creatorGames = await db.select().from(projects).where(and(eq(projects.type, "GAME"), eq(projects.idPembuat, userId)));
            const activeGamesCount = creatorGames.filter(g => ["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA", "UNPUBLISHED"].includes(g.status)).length;
            
            let totalMinutes = 0;
            let completedGamesCount = 0;
            let speedRankedProjects: any[] = [];
            
            creatorGames.forEach(g => {
              if (g.startedAt && g.completedAt) {
                const durationMs = new Date(g.completedAt).getTime() - new Date(g.startedAt).getTime();
                if (durationMs > 0) {
                  completedGamesCount++;
                  const mins = Math.floor(durationMs / 60000);
                  totalMinutes += mins;
                  
                  speedRankedProjects.push({
                    id: g.id,
                    title: g.title,
                    durationMins: mins,
                    durationFormatted: `${Math.floor(mins / 1440)} Hari ${Math.floor((mins % 1440) / 60)} Jam ${mins % 60} Menit`
                  });
                }
              }
            });
            
            const avgMins = completedGamesCount > 0 ? Math.floor(totalMinutes / completedGamesCount) : 0;
            const avgCompletionTimeFormatted = `${Math.floor(avgMins / 1440)} Hari ${Math.floor((avgMins % 1440) / 60)} Jam ${avgMins % 60} Menit`;
            
            const totalRevisions = creatorGames.reduce((acc, g) => acc + (g.revisionCount || 0), 0);
            const avgRevisionCount = creatorGames.length > 0 ? (totalRevisions / creatorGames.length).toFixed(1) : 0;
            
            speedRankedProjects.sort((a, b) => a.durationMins - b.durationMins);
            
            const topPlayedRes = await db.select({ 
              title: projects.title, 
              playCount: sql<number>`count(${gamePlayLogs.id})` 
            }).from(gamePlayLogs)
              .innerJoin(projects, eq(gamePlayLogs.projectId, projects.id))
              .where(eq(projects.idPembuat, userId))
              .groupBy(projects.id)
              .orderBy(desc(sql`count(${gamePlayLogs.id})`))
              .limit(5);

            analyticsData = {
              globalStats: {
                totalPublishedGames: allPublishedGames[0]?.count || 0,
                totalPublishedMaterials: allPublishedMaterials[0]?.count || 0,
                myPublishedGames: creatorGames.filter(g => g.status === "PUBLISHED").length
              },
              creatorKpi: {
                totalAssignedGames: creatorGames.length,
                activeGamesCount,
                avgCompletionTimeFormatted,
                avgRevisionCount,
                speedRankedProjects
              },
              popularityStats: {
                topPlayedGames: topPlayedRes
              }
            };
          } else if (userRole === "PEMBUAT_MATERI") {
            const allPublishedGames = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED")));
            const allPublishedMaterials = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED")));
            
            const creatorMaterials = await db.select().from(projects).where(and(eq(projects.type, "MATERI"), eq(projects.idPembuat, userId)));
            const activeMaterialsCount = creatorMaterials.filter(m => ["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA", "UNPUBLISHED"].includes(m.status)).length;
            
            let totalMinutes = 0;
            let completedMaterialsCount = 0;
            let speedRankedMaterials: any[] = [];
            
            creatorMaterials.forEach(m => {
              if (m.startedAt && m.completedAt) {
                const durationMs = new Date(m.completedAt).getTime() - new Date(m.startedAt).getTime();
                if (durationMs > 0) {
                  completedMaterialsCount++;
                  const mins = Math.floor(durationMs / 60000);
                  totalMinutes += mins;
                  
                  speedRankedMaterials.push({
                    id: m.id,
                    title: m.title,
                    durationMins: mins,
                    durationFormatted: `${Math.floor(mins / 1440)} Hari ${Math.floor((mins % 1440) / 60)} Jam ${mins % 60} Menit`
                  });
                }
              }
            });
            
            const avgMins = completedMaterialsCount > 0 ? Math.floor(totalMinutes / completedMaterialsCount) : 0;
            const avgCompletionTimeFormatted = `${Math.floor(avgMins / 1440)} Hari ${Math.floor((avgMins % 1440) / 60)} Jam ${avgMins % 60} Menit`;
            
            const totalRevisions = creatorMaterials.reduce((acc, m) => acc + (m.revisionCount || 0), 0);
            const avgRevisionCount = creatorMaterials.length > 0 ? (totalRevisions / creatorMaterials.length).toFixed(1) : 0;
            
            speedRankedMaterials.sort((a, b) => a.durationMins - b.durationMins);

            const topAccessedRes = await db.select({ 
              title: projects.title, 
              accessCount: sql<number>`count(${materialAccessLogs.id})` 
            }).from(materialAccessLogs)
              .innerJoin(projects, eq(materialAccessLogs.projectId, projects.id))
              .where(eq(projects.idPembuat, userId))
              .groupBy(projects.id)
              .orderBy(desc(sql`count(${materialAccessLogs.id})`))
              .limit(5);

            analyticsData = {
              globalStats: {
                totalPublishedGames: allPublishedGames[0]?.count || 0,
                totalPublishedMaterials: allPublishedMaterials[0]?.count || 0,
                myPublishedMaterials: creatorMaterials.filter(m => m.status === "PUBLISHED").length
              },
              creatorKpi: {
                totalAssignedMaterials: creatorMaterials.length,
                activeMaterialsCount,
                avgCompletionTimeFormatted,
                avgRevisionCount,
                speedRankedMaterials
              },
              popularityStats: {
                topAccessedMaterials: topAccessedRes
              }
            };
          }

        } else if (userRole === "PAKAR") {
          myProjectsData = await db.select(projectSelectFields).from(projects).where(
            eq(projects.idPakar, userId)
          );
          // Semua Proyek Saya: hanya yang sudah PUBLISHED oleh Ketua Tim dan pernah di-review pakar ini
          publishedProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(eq(projects.idPakar, userId), eq(projects.status, "PUBLISHED"))
          );
          allUsersData = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);

          const pakarProjects = await db.select().from(projects).where(eq(projects.idPakar, userId));
          const pendingReviewsCount = pakarProjects.filter(p => ["REVIEW_PAKAR", "REVISI_PAKAR"].includes(p.status)).length;
          const completedReviewsCount = pakarProjects.filter(p => !["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR"].includes(p.status)).length;
          const approvedCount = pakarProjects.filter(p => ["ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA", "PUBLISHED"].includes(p.status)).length;
          const approvalRatePercentage = pakarProjects.length > 0 ? Math.round((approvedCount / pakarProjects.length) * 100) : 0;

          let totalMinutes = 0;
          let speedRankedReviews: any[] = [];
          let timeTrackedCount = 0;
          
          pakarProjects.forEach(p => {
            const start = p.startedAt || p.createdAt;
            const end = p.completedAt || p.updatedAt;
            if (start && end && start !== end) {
              const durationMs = new Date(end).getTime() - new Date(start).getTime();
              if (durationMs > 0) {
                timeTrackedCount++;
                const mins = Math.floor(durationMs / 60000);
                totalMinutes += mins;
                speedRankedReviews.push({
                  id: p.id,
                  title: p.title,
                  durationMins: mins,
                  durationFormatted: `${Math.floor(mins / 1440)} Hari ${Math.floor((mins % 1440) / 60)} Jam ${mins % 60} Menit`
                });
              }
            }
          });

          const totalRevisions = pakarProjects.reduce((acc, p) => acc + (p.revisionCount || 0), 0);
          const avgRevisionPerProject = pakarProjects.length > 0 ? (totalRevisions / pakarProjects.length).toFixed(1) : 0;

          const avgMins = timeTrackedCount > 0 ? Math.floor(totalMinutes / timeTrackedCount) : 0;
          const avgReviewTimeFormatted = `${Math.floor(avgMins / 1440)} Hari ${Math.floor((avgMins % 1440) / 60)} Jam ${avgMins % 60} Menit`;
          speedRankedReviews.sort((a, b) => a.durationMins - b.durationMins);

          const allPublishedGames = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED")));
          const allPublishedMaterials = await db.select({ count: sql<number>`count(*)` }).from(projects).where(and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED")));

          const topPlayedRes = await db.select({ 
            title: projects.title, 
            playCount: sql<number>`count(${gamePlayLogs.id})` 
          }).from(gamePlayLogs)
            .innerJoin(projects, eq(gamePlayLogs.projectId, projects.id))
            .where(eq(projects.idPakar, userId))
            .groupBy(projects.id)
            .orderBy(desc(sql`count(${gamePlayLogs.id})`))
            .limit(5);

          const topAccessedRes = await db.select({ 
            title: projects.title, 
            accessCount: sql<number>`count(${materialAccessLogs.id})` 
          }).from(materialAccessLogs)
            .innerJoin(projects, eq(materialAccessLogs.projectId, projects.id))
            .where(eq(projects.idPakar, userId))
            .groupBy(projects.id)
            .orderBy(desc(sql`count(${materialAccessLogs.id})`))
            .limit(5);

          analyticsData = {
            globalMetrics: {
              totalPublishedGames: allPublishedGames[0]?.count || 0,
              totalPublishedMaterials: allPublishedMaterials[0]?.count || 0
            },
            reviewerKpi: {
              totalAssignedReviews: pakarProjects.length,
              pendingReviewsCount,
              completedReviewsCount,
              avgReviewTimeFormatted,
              avgRevisionPerProject,
              approvalRatePercentage,
              speedRankedReviews
            },
            popularityMetrics: {
              topPlayedGames: topPlayedRes,
              topAccessedMaterials: topAccessedRes
            }
          };

        } else if (userRole === "USER") {
          allProjectsData = await db.select(projectSelectFields).from(projects).where(eq(projects.status, "PUBLISHED"));
        }


        const renderContent = () => {
          switch (userRole) {
            case "KETUA_TIM":
              return KetuaTimDashboard();

            case "PEMBUAT_GAME":
              return PembuatGameDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData, analytics: analyticsData });


            case "PEMBUAT_MATERI":
              return PembuatMateriDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData, analytics: analyticsData });

            case "PAKAR":
              return PakarDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData, analytics: analyticsData });


            case "USER":
              return UserDashboard({ username });

            default:
              return '<div class="p-8 text-center text-slate-500">Halaman Dashboard belum dikonfigurasi.</div>';
          }
        };

        const dashboardContent = renderContent();

        // Derive currentPage label for the AI widget from role
        const pageContextMap: Record<string, string> = {
          KETUA_TIM: 'Manajemen Proyek Game — Ketua Tim',
          PEMBUAT_GAME: 'Proyek Saya — Pembuat Game',
          PEMBUAT_MATERI: 'Workspace Konten — Pembuat Materi',
          PAKAR: 'Review Proyek — Pakar',
          USER: 'Dashboard Member',
        };
        const aiCurrentPage = pageContextMap[userRole] || "Dashboard";

        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Dashboard",
          username,
          role: userRole,
          children: dashboardContent,
          notifications: userNotifications,
          currentPage: aiCurrentPage,
          email: (user as any).email,
          avatarUrl: (user as any).avatarUrl || (user as any).profilePicture
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
  )
  .post("/profile/update", async ({ body, cookie, jwt }) => {
    const auth = cookie.auth;
    if (!auth?.value) return new Response("Unauthorized", { status: 401 });
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) return new Response("Unauthorized", { status: 401 });
    
    const { name, interests, profile_picture } = body as any;
    let avatarUrl = payload.avatarUrl;
    
    if (profile_picture && profile_picture.size > 0) {
      // Hanya gambar JPG/PNG/WebP maksimal 2 MB; nama file dibuat ulang agar tidak bisa menyisipkan file berbahaya
      const allowedTypes: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const extension = allowedTypes[profile_picture.type];
      if (!extension) {
        return new Response(JSON.stringify({ error: "Foto profil harus berformat JPG, PNG, atau WebP." }), { status: 400 });
      }
      if (profile_picture.size > 2 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "Ukuran foto profil maksimal 2 MB." }), { status: 400 });
      }
      const fileName = `avatar-${payload.id}-${Date.now()}.${extension}`;
      const path = `./public/uploads/avatars/${fileName}`;
      await Bun.write(path, profile_picture);
      avatarUrl = `/public/uploads/avatars/${fileName}`;
    }
    
    const interestsString = interests ? (Array.isArray(interests) ? interests.join(",") : interests) : "";
    
    await db.update(users)
      .set({ 
        name, 
        interests: interestsString,
        ...(avatarUrl !== payload.avatarUrl ? { avatarUrl } : {})
      })
      .where(eq(users.id, payload.id));
      
    const newToken = await jwt.sign({ ...payload, name, avatarUrl });
    cookie.auth!.value = newToken;
    cookie.auth!.maxAge = 7 * 86400;
    cookie.auth!.path = '/';
      
    return { success: true };
  })
  .get("/materi/:id", async ({ params, jwt, cookie, set }) => {
    // Auth check
    const auth = cookie.auth;
    let user = null;
    if (auth?.value) {
      const payload = await jwt.verify(auth.value as string);
      if (payload) user = payload;
    }

    // Fetch project and contents
    const projectId = Number(params.id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project || project.type !== "MATERI") {
      set.status = 404;
      return "Materi tidak ditemukan";
    }
    const contents = await db.select().from(materiContents).where(eq(materiContents.projectId, projectId)).orderBy(materiContents.sortOrder);

    // Fetch sections and glossary for MANUAL materi
    const sections = project.materiType === 'MANUAL'
      ? await db.select().from(materialSections).where(eq(materialSections.projectId, projectId)).orderBy(materialSections.sortOrder)
      : [];
    const glossary = project.materiType === 'MANUAL'
      ? await db.select().from(materialGlossary).where(eq(materialGlossary.projectId, projectId))
      : [];

    // Attach sections and glossary to project object for Alpine
    const projectWithSections = { ...project, materialSections: sections, materialGlossary: glossary };

    const pageHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.title} - Logos Lab</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/public/js/tailwind-config.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
      </head>
      <body class="bg-slate-100 font-sans antialiased h-screen flex flex-col">
        ${Navbar({ user })}
        <main class="flex-1 overflow-hidden">
          ${MateriViewer({ projectVar: 'activeMateri', contentVar: 'materiContents' })}
        </main>
        
        <script>
          window.activeMateri = ${JSON.stringify({ ...project, materialSections: sections, materialGlossary: glossary }).replace(/</g, '\\u003c')};
          window.materiContents = ${JSON.stringify(contents).replace(/</g, '\\u003c')};
        </script>
        ${MateriViewerScript()}
      </body>
      </html>
    `;

    return new Response(pageHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  })
  .get("/play/:id", async ({ params, jwt, cookie, set }) => {
    // Auth check
    const auth = cookie.auth;
    let user = null;
    if (auth?.value) {
      const payload = await jwt.verify(auth.value as string);
      if (payload) user = payload;
    }

    const projectId = Number(params.id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project || project.type !== "GAME") {
      set.status = 404;
      return "Game tidak ditemukan";
    }

    // Insert to gamePlayLogs
    // played_at diisi MySQL (jam lokal), sama seperti kolom waktu lainnya
    await db.insert(gamePlayLogs).values({ projectId });

    const pageHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${project.title} - Logos Lab</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/public/js/tailwind-config.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
      </head>
      <body class="bg-slate-100 font-sans antialiased h-screen flex flex-col">
        ${Navbar({ user })}
        <main class="flex-1 overflow-hidden">
          ${PublicGamePlayer()}
        </main>
        
        <script>
          document.addEventListener('alpine:initialized', () => {
             // Delay slightly to ensure component is fully mounted
             setTimeout(() => {
                if (typeof window.triggerPublicGame === 'function') {
                    window.triggerPublicGame(${projectId});
                }
             }, 100);
          });
        </script>
      </body>
      </html>
    `;

    return new Response(pageHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  })
  .get("/duel/:id", async ({ params, jwt, cookie, set }) => {
    const auth = cookie.auth;
    let user = null;
    if (auth?.value) {
      const payload = await jwt.verify(auth.value as string);
      if (payload) user = payload;
    }

    const pageHtml = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Arena Duel - Logos Lab</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="/public/js/tailwind-config.js"></script>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
      </head>
      <body class="bg-slate-100 font-sans antialiased h-screen flex flex-col">
        ${Navbar({ user })}
        <main class="flex-1 overflow-hidden">
          ${DuelArenaPage({ duelId: params.id, currentUser: user })}
        </main>
      </body>
      </html>
    `;

    return new Response(pageHtml, {
      headers: { "Content-Type": "text/html; charset=utf-8" }
    });
  })
  .group("/profile", (app) =>
    app
      .onBeforeHandle(async ({ jwt, cookie, set }) => {
        const auth = cookie.auth;
        if (!auth?.value) return Response.redirect("/", 302);
        const payload = await jwt.verify(auth.value as string);
        if (!payload) return Response.redirect("/", 302);

        set.headers["Cache-Control"] = "no-store";
      })
      .get("/", async ({ jwt, cookie }) => {
        const payload: any = await jwt.verify(cookie.auth!.value as string);
        const [user] = await db.select().from(users).where(eq(users.id, payload.id));
        
        if (!user) {
          return Response.redirect("/", 302);
        }

        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, payload.id)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Pengaturan Profil",
          username: user.name || user.username || "",
          role: user.role || "USER",
          children: ProfilePage({ user }),
          notifications: userNotifications,
          currentPage: "Pengaturan Profil",
          email: user.email,
          avatarUrl: user.avatarUrl || user.profilePicture || undefined
        });

        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      })
      .post("/onboarding", async ({ body, jwt, cookie }) => {
        const payload: any = await jwt.verify(cookie.auth!.value as string);
        const { interests } = body as { interests: string[] };

        await db.update(users).set({
          interests: interests.join(","),
          hasOnboarded: true
        }).where(eq(users.id, payload.id));

        return { success: true, message: "Onboarding berhasil" };
      })
  )
  .listen(3000);

console.log("🚀 Logos LAB Server is running at localhost:3000");

// Bersihkan sesi main yang sudah tidak dipakai: saat server menyala, lalu setiap 1 jam
const runAttemptCleanup = () => cleanupStaleAttempts()
  .then(count => { if (count > 0) console.log(`🧹 ${count} sesi main lama dihapus`); })
  .catch(err => console.error("Gagal membersihkan sesi main:", err));
runAttemptCleanup();
setInterval(runAttemptCleanup, 60 * 60 * 1000);