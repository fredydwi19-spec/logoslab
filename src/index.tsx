import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { userRoutes } from "./routes/users";
import { apiUserRoutes } from "./routes/api_user";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { wordSearchRoutes } from "./routes/word_search";
import { crosswordRoutes } from "./routes/crossword";
import { materiRoutes } from "./routes/materi";
import { aiRoutes } from "./routes/ai";
import { dashboardRoutes } from "./routes/dashboard";
import { bankSoalRoutes } from "./routes/bank_soal";
import { bankSoalUiRoutes } from "./routes/bank_soal_ui";
import { tagsRoute } from "./routes/elearning/tags";
import { reviewRoute } from "./routes/elearning/review";
import { adaptiveRecommendRoute } from "./routes/elearning/adaptive-recommend";
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";
import { Navbar } from "./views/components/Navbar";
import { OnboardingModal } from "./views/components/OnboardingModal";
import { PersonalizedGames } from "./views/components/PersonalizedGames";
import { GamesSection } from "./views/components/GamesSection";
import { PublicGamePlayer } from "./views/components/PublicGamePlayer";
import { ProfilePage } from "./views/pages/EditProfile";
import { db } from "./db/db";
import { users, projects, notifications, materiContents, materialSections, materialGlossary } from "./db/schema";
import { KetuaTimDashboard } from "./views/components/KetuaTimDashboard";
import { PembuatGameDashboard } from "./views/components/PembuatGameDashboard";
import { PembuatMateriDashboard } from "./views/components/PembuatMateriDashboard";
import { PakarDashboard } from "./views/components/PakarDashboard";
import { MemberDashboard } from "./views/components/MemberDashboard";
import { MemberAchievements } from "./views/components/MemberAchievements";
import { KetuaTimAllProjects } from "./views/components/KetuaTimAllProjects";
import { MateriSection } from "./views/components/MateriSection";
import { DashboardGamesPage } from "./views/components/DashboardGamesPage";
import { DashboardMateriPage } from "./views/components/DashboardMateriPage";
import { AdaptiveLearningPage } from "./views/components/AdaptiveLearningPage";
import { MateriViewer, MateriViewerScript } from "./views/components/MateriViewer";
import { eq, inArray, and, desc } from "drizzle-orm";

const app = new Elysia()
  .use(staticPlugin({
    assets: "public",
    prefix: "/public"
  }))
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .get("/", async ({ jwt, cookie }) => {
    let user: any = null;
    let personalizedGamesHtml = "";
    let onboardingModalHtml = "";
    const auth = cookie.auth;

    if (auth?.value) {
      const payload: any = await jwt.verify(auth.value as string);
      if (payload) {
        // Guest users: allow but no DB lookup
        if (payload.isGuest) {
          user = { username: 'Tamu', name: 'Tamu', role: 'GUEST', isGuest: true };
        } else {
          const [userData] = await db.select().from(users).where(eq(users.id, payload.id));
          user = userData;

          if (user) {
            if (user.role === "USER" && !user.hasOnboarded) {
              onboardingModalHtml = OnboardingModal();
            }
            if (user.role === "USER" && user.competencies) {
              const userCompetencies = user.competencies.split(",");
              const matchingGames = await db.select().from(projects).where(
                and(
                  inArray(projects.category, userCompetencies),
                  eq(projects.type, "GAME"),
                  eq(projects.status, "PUBLISHED")
                )
              ).limit(10);
              personalizedGamesHtml = PersonalizedGames({ games: matchingGames });
            }
          }
        }
      }
    }

    // If no valid session at all, redirect to login
    if (!user) {
      return Response.redirect("/login", 302);
    }

    // Fetch all games for the main section
    const allGames = await db.select().from(projects).where(
      and(
        eq(projects.type, "GAME"),
        eq(projects.status, "PUBLISHED")
      )
    ).limit(25);

    const allMateris = await db.select().from(projects).where(
      and(
        eq(projects.type, "MATERI"),
        eq(projects.status, "PUBLISHED")
      )
    ).limit(25);

    const popularGames = [...allGames].sort(() => 0.5 - Math.random()).slice(0, 10);
    const gamesSectionHtml = GamesSection({ allGames, popularGames });
    const materiSectionHtml = MateriSection({ allMateris });

    const html = await Bun.file("public/index.html").text();
    const navbarHtml = Navbar({ user });

    // Inject components
    let dynamicHtml = html.replace(
      /<nav class="header__nav">[\s\S]*?<\/nav>/,
      navbarHtml
    );

    // Replace static games section with dynamic one
    dynamicHtml = dynamicHtml.replace(
      /<section class="section games" id="games">[\s\S]*?<\/section>/,
      gamesSectionHtml + '\n' + materiSectionHtml
    );

    if (onboardingModalHtml) {
      dynamicHtml = dynamicHtml.replace("</body>", `${onboardingModalHtml}\n${PublicGamePlayer()}\n</body>`);
    } else {
      dynamicHtml = dynamicHtml.replace("</body>", `${PublicGamePlayer()}\n</body>`);
    }

    if (personalizedGamesHtml) {
      // Inject between Hero and Games Populer
      dynamicHtml = dynamicHtml.replace(
        /<\/section>\s*<!-- ========== GAMES CAROUSEL ========== -->/,
        `</section>${personalizedGamesHtml}<!-- ========== GAMES CAROUSEL ========== -->`
      );
    }

    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/html; charset=utf-8"
    };

    if (user) {
      responseHeaders["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate";
    }

    return new Response(dynamicHtml, {
      headers: responseHeaders
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
  .use(apiUserRoutes)
  .group("/api/elearning", (app) =>
    app
      .onBeforeHandle(async ({ jwt, cookie, set }) => {
        const auth = cookie.auth;
        if (!auth?.value) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        const payload = await jwt.verify(auth.value as string);
        if (!payload) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
      })
      .derive(async ({ jwt, cookie }) => {
        const auth = cookie.auth;
        const payload = await jwt.verify(auth!.value as string);
        return { user: payload };
      })
      .use(tagsRoute)
      .use(reviewRoute)
      .use(adaptiveRecommendRoute)
  )
  .group("/dashboard", (app) =>
    app
      .onBeforeHandle(async ({ jwt, cookie, set }) => {
        const auth = cookie.auth;
        if (!auth?.value) {
          return Response.redirect("/login", 302);
        }
        const payload = await jwt.verify(auth.value as string);
        if (!payload) {
          return Response.redirect("/login", 302);
        }
        // Block guests from dashboard
        if ((payload as any).isGuest) {
          return Response.redirect("/login", 302);
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
      .get("/projects", async ({ user }) => {
        if (!user || (user as any).role !== "KETUA_TIM") {
          return Response.redirect("/login", 302);
        }
        
        const username = (user as any).username as string;
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
          revisionCount: projects.revisionCount,
          deadline: projects.deadline,
          idPembuat: projects.idPembuat,
          idPakar: projects.idPakar,
          createdAt: projects.createdAt,
          updatedAt: projects.updatedAt
        };

        const allProjectsData = await db.select(projectSelectFields).from(projects);
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
          currentPage: "Manajemen Proyek Game — Ketua Tim"
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
      .get("/user/achievements", async ({ user }) => {
        if (!user || (user as any).role !== "USER") {
          return Response.redirect("/login", 302);
        }
        const username = (user as any).username as string;
        const userId = Number((user as any).id);
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
        
        const htmlResponse = Layout({
          title: "Pencapaian Saya",
          username,
          role: "USER",
          children: MemberAchievements(),
          notifications: userNotifications,
          currentPage: "Pencapaian Saya"
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
      // ── Adaptive Learning (USER only) ──
      .get("/adaptive-learning", async ({ user }) => {
        if (!user || (user as any).role !== "USER") {
          return Response.redirect("/login", 302);
        }
        const username = (user as any).username as string;
        const userId = Number((user as any).id);

        const [publishedMateris, publishedGames, userNotifications] = await Promise.all([
          db.select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            category: projects.category,
          }).from(projects).where(and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED"))),
          db.select({
            id: projects.id,
            title: projects.title,
            description: projects.description,
            category: projects.category,
          }).from(projects).where(and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED"))),
          db.select().from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt)),
        ]);

        const htmlResponse = Layout({
          title: "Adaptive Learning",
          username,
          role: "USER",
          children: AdaptiveLearningPage({ username, publishedMateris, publishedGames }),
          notifications: userNotifications,
          currentPage: "Adaptive Learning"
        });
        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      // ── Game Tersedia (semua role) ──
      .get("/games", async ({ user }) => {
        if (!user) return Response.redirect("/login", 302);
        const username = (user as any).username as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);

        const publishedGames = await db.select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          gameType: projects.gameType,
          category: projects.category,
          status: projects.status,
        }).from(projects).where(
          and(eq(projects.type, "GAME"), eq(projects.status, "PUBLISHED"))
        );

        const userNotifications = await db.select().from(notifications)
          .where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Game Tersedia",
          username,
          role: userRole,
          children: DashboardGamesPage({ games: publishedGames, username }),
          notifications: userNotifications,
          currentPage: "Game Tersedia"
        });
        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      // ── Materi Tersedia (semua role) ──
      .get("/materi-list", async ({ user }) => {
        if (!user) return Response.redirect("/login", 302);
        const username = (user as any).username as string;
        const userRole = (user as any).role as string;
        const userId = Number((user as any).id);

        const publishedMateris = await db.select({
          id: projects.id,
          title: projects.title,
          description: projects.description,
          materiType: projects.materiType,
          category: projects.category,
          status: projects.status,
        }).from(projects).where(
          and(eq(projects.type, "MATERI"), eq(projects.status, "PUBLISHED"))
        );

        const userNotifications = await db.select().from(notifications)
          .where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({
          title: "Materi Pembelajaran",
          username,
          role: userRole,
          children: DashboardMateriPage({ materis: publishedMateris }),
          notifications: userNotifications,
          currentPage: "Materi Pembelajaran"
        });
        return new Response(htmlResponse, {
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }
        });
      })
      .get("/:role", async ({ params, user }) => {
        if (!user || !(user as any).role) return "Unauthorized";

        const userRole = (user as any).role as string;
        const username = (user as any).username as string;
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
          // Active/in-progress: semua proyek milik user kecuali yang sudah PUBLISHED
          myProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(
              eq(projects.idPembuat, userId),
              inArray(projects.status, ["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA", "UNPUBLISHED"])
            )
          );
          // Semua Proyek Saya: hanya yang sudah PUBLISHED oleh Ketua Tim
          publishedProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(eq(projects.idPembuat, userId), eq(projects.status, "PUBLISHED"))
          );
          allUsersData = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
        } else if (userRole === "PAKAR") {
          // Active/in-progress: semua proyek yang ditugaskan ke pakar ini kecuali yang sudah PUBLISHED
          myProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(
              eq(projects.idPakar, userId),
              inArray(projects.status, ["REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA"])
            )
          );
          // Semua Proyek Saya: hanya yang sudah PUBLISHED oleh Ketua Tim dan pernah di-review pakar ini
          publishedProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(eq(projects.idPakar, userId), eq(projects.status, "PUBLISHED"))
          );
          allUsersData = await db.select({ id: users.id, name: users.name, role: users.role }).from(users);
        } else if (userRole === "USER") {
          allProjectsData = await db.select(projectSelectFields).from(projects).where(eq(projects.status, "PUBLISHED"));
        }


        const renderContent = () => {
          switch (userRole) {
            case "KETUA_TIM":
              return KetuaTimDashboard();

            case "PEMBUAT_GAME":
              return PembuatGameDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData });


            case "PEMBUAT_MATERI":
              return PembuatMateriDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData });

            case "PAKAR":
              return PakarDashboard({ myProjects: myProjectsData, publishedProjects: publishedProjectsData, allUsers: allUsersData });


            case "USER":
              return MemberDashboard({ publishedGames: allProjectsData, username });

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
          currentPage: aiCurrentPage
        });

        return new Response(htmlResponse, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
  )
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
  .get("/profile", async ({ cookie }) => {
    if (!cookie.auth?.value) return Response.redirect("/login", 302);
    return Bun.file("public/app.html");
  })
  .get("/app", () => Bun.file("public/app.html"))
  .listen(3000);

console.log("🚀 Logos LAB Server is running at localhost:3000");