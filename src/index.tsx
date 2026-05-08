import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { projectRoutes } from "./routes/projects";
import { wordSearchRoutes } from "./routes/word_search";
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";
import { Navbar } from "./views/components/Navbar";
import { OnboardingModal } from "./views/components/OnboardingModal";
import { PersonalizedGames } from "./views/components/PersonalizedGames";
import { GamesSection } from "./views/components/GamesSection";
import { ProfilePage } from "./views/pages/EditProfile";
import { db } from "./db/db";
import { users, projects, notifications } from "./db/schema";
import { KetuaTimDashboard } from "./views/components/KetuaTimDashboard";
import { PembuatGameDashboard } from "./views/components/PembuatGameDashboard";
import { PakarDashboard } from "./views/components/PakarDashboard";
import { MemberDashboard } from "./views/components/MemberDashboard";
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

    const popularGames = [...allGames].sort(() => 0.5 - Math.random()).slice(0, 10);
    const gamesSectionHtml = GamesSection({ allGames, popularGames });
    
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
      gamesSectionHtml
    );

    if (onboardingModalHtml) {
      dynamicHtml = dynamicHtml.replace("</body>", `${onboardingModalHtml}</body>`);
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
        let pakarData: any[] = [];
        let myProjectsData: any[] = [];

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
          pakarData = await db.select().from(users).where(eq(users.role, "PAKAR"));
        } else if (userRole === "PEMBUAT_GAME") {
          myProjectsData = await db.select(projectSelectFields).from(projects).where(eq(projects.idPembuat, userId));
        } else if (userRole === "PAKAR") {
          myProjectsData = await db.select(projectSelectFields).from(projects).where(
            and(
              eq(projects.idPakar, userId),
              inArray(projects.status, ["REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR"])
            )
          );
        } else if (userRole === "USER") {
          allProjectsData = await db.select(projectSelectFields).from(projects).where(eq(projects.status, "PUBLISHED"));
        }

        const renderContent = () => {
          switch (userRole) {
            case "KETUA_TIM":
              return KetuaTimDashboard({ allProjects: allProjectsData, pembuatGames: pembuatGamesData, pakars: pakarData });

            case "PEMBUAT_GAME":
              return PembuatGameDashboard({ myProjects: myProjectsData });

            case "PEMBUAT_MATERI":
              return `
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-800 mb-6">Proyek Saya (Materi)</h2>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-slate-100 text-slate-400 text-sm">
                          <th class="pb-4 font-semibold">ID</th>
                          <th class="pb-4 font-semibold">Nama Materi</th>
                          <th class="pb-4 font-semibold">Format</th>
                          <th class="pb-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody class="text-slate-600">
                        <tr class="border-b border-slate-50">
                          <td class="py-4">#M205</td>
                          <td class="py-4 font-medium text-slate-800">Kitab Mazmur v3</td>
                          <td class="py-4 font-medium">Video</td>
                          <td class="py-4"><span class="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs font-bold">Draft</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              `;

            case "PAKAR":
              return PakarDashboard({ myProjects: myProjectsData });

            case "USER":
              return MemberDashboard({ publishedGames: allProjectsData, username });

            default:
              return '<div class="p-8 text-center text-slate-500">Halaman Dashboard belum dikonfigurasi.</div>';
          }
        };

        const dashboardContent = renderContent();
        
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));

        const htmlResponse = Layout({ 
          title: "Dashboard", 
          username, 
          role: userRole, 
          children: dashboardContent,
          notifications: userNotifications
        });

        return new Response(htmlResponse, {
          headers: { 
            "Content-Type": "text/html; charset=utf8",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate"
          }
        });
      })
  )
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