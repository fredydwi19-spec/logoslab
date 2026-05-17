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
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";
import { Navbar } from "./views/components/Navbar";
import { OnboardingModal } from "./views/components/OnboardingModal";
import { PersonalizedGames } from "./views/components/PersonalizedGames";
import { GamesSection } from "./views/components/GamesSection";
import { PublicGamePlayer } from "./views/components/PublicGamePlayer";
import { ProfilePage } from "./views/pages/EditProfile";
import { db } from "./db/db";
import { users, projects, notifications, materiContents } from "./db/schema";
import { KetuaTimDashboard } from "./views/components/KetuaTimDashboard";
import { PembuatGameDashboard } from "./views/components/PembuatGameDashboard";
import { PembuatMateriDashboard } from "./views/components/PembuatMateriDashboard";
import { PakarDashboard } from "./views/components/PakarDashboard";
import { MemberDashboard } from "./views/components/MemberDashboard";
import { MateriSection } from "./views/components/MateriSection";
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
  .get("/", async ({ jwt, cookie: { auth } }) => {
    let user: any = null;
    let personalizedGamesHtml = "";
    let onboardingModalHtml = "";

    if (auth?.value) {
      const payload: any = await jwt.verify(auth.value as string);
      if (payload) {
        const [userData] = await db.select().from(users).where(eq(users.id, payload.id));
        user = userData;

        if (user) {
          if (user.role === "USER" && !user.hasOnboarded) {
            onboardingModalHtml = OnboardingModal();
          }

          if (user.role === "USER" && user.interests) {
            const userInterests = user.interests.split(",");
            const matchingGames = await db.select().from(projects).where(
              and(
                inArray(projects.category, userInterests),
                eq(projects.type, "GAME"),
                eq(projects.status, "PUBLISHED")
              )
            ).limit(10); // Ensure at least up to 10 for carousel
            personalizedGamesHtml = PersonalizedGames({ games: matchingGames });
          }
        }
      }
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
      "Content-Type": "text/html; charset=utf8"
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
              return KetuaTimDashboard({ allProjects: allProjectsData, pembuatGames: pembuatGamesData, pembuatMateris: pembuatMaterisData, pakars: pakarData });

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
            "Content-Type": "text/html; charset=utf8",
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
          window.activeMateri = ${JSON.stringify(project)};
          window.materiContents = ${JSON.stringify(contents)};
        </script>
        ${MateriViewerScript()}
      </body>
      </html>
    `;
    
    return new Response(pageHtml, {
      headers: { "Content-Type": "text/html; charset=utf8" }
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

        return new Response(ProfilePage({ user }), {
          headers: { "Content-Type": "text/html; charset=utf8" }
        });
      })
      .post("/update", async ({ body, jwt, cookie }) => {
        const payload: any = await jwt.verify(cookie.auth!.value as string);
        const { name, interests } = body as { name: string, interests?: string[] };

        const updateData: any = { name };
        if (interests) {
          updateData.interests = interests.join(",");
        }

        await db.update(users).set(updateData).where(eq(users.id, payload.id));

        return { success: true, message: "Profil berhasil diperbarui" };
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