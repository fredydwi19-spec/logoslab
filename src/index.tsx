import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { html } from "@elysiajs/html";
import { jwt } from "@elysiajs/jwt";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";

const app = new Elysia()
  .use(staticPlugin())
  .use(html())
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .get("/", () => Bun.file("public/index.html"))
  .onError(({ code, error }) => {
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
  .get("/health", async () => {
    try {
      await pool.query("SELECT 1");
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (e) {
      const err = e as Error;
      return new Response(
        JSON.stringify({ status: "error", message: err.message }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  })
  .use(authRoutes)
  .use(userRoutes)
  // Dashboard RBAC Group
  .group("/dashboard", (app) =>
    app
      .onBeforeHandle(async ({ jwt, cookie: { auth }, set }) => {
        if (!auth.value) {
          set.redirect = "/";
          return "/";
        }
        const payload = await jwt.verify(auth.value);
        if (!payload) {
          set.redirect = "/";
          return "/";
        }
      })
      .derive(async ({ jwt, cookie: { auth } }) => {
        const payload = await jwt.verify(auth.value);
        return { user: payload ? { ...payload } : null };
      })
      .get("/:role", ({ params, user }) => {
        if (!user || !(user as any).role) return "Unauthorized";
        
        const getRoleName = (r: string) => {
          switch (r) {
            case "KETUA_TIM": return "Ketua Tim";
            case "PEMBUAT_GAME": return "Pembuat Game";
            case "PEMBUAT_MATERI": return "Pembuat Materi";
            case "PAKAR": return "Pakar";
            default: return "Member";
          }
        };

        const roleName = getRoleName(userRole);

        return `
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Dashboard - Logos LAB</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
            <style>
              body { font-family: 'Inter', sans-serif; background-color: #f8fafc; }
              .sidebar { width: 280px; background: #ffffff; border-right: 1px solid #e2e8f0; height: 100vh; position: fixed; left: 0; top: 0; }
              .main-content { margin-left: 280px; padding: 2rem; }
              .nav-item { display: flex; align-items: center; padding: 0.75rem 1.5rem; color: #64748b; transition: all 0.2s; border-radius: 0.5rem; margin: 0.25rem 1rem; }
              .nav-item:hover, .nav-item.active { background: #eff6ff; color: #3b82f6; }
              .card { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; padding: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            </style>
          </head>
          <body>
            <div class="sidebar">
              <div class="p-8 flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">L</div>
                <span class="text-xl font-bold text-slate-800">Logos LAB</span>
              </div>
              
              <div class="mt-4">
                <p class="px-8 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</p>
                <a href="#" class="nav-item active">
                  <span class="mr-3">📊</span> Dashboard
                </a>
                <a href="#" class="nav-item">
                  <span class="mr-3">🎮</span> Game Proyek
                </a>
                <a href="#" class="nav-item">
                  <span class="mr-3">📚</span> Materi Proyek
                </a>
                <a href="#" class="nav-item">
                  <span class="mr-3">👥</span> Users
                </a>
              </div>

              <div class="absolute bottom-8 w-full px-4">
                <div class="bg-slate-50 p-4 rounded-xl flex items-center gap-3">
                  <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">${username.charAt(0).toUpperCase()}</div>
                  <div>
                    <p class="text-sm font-bold text-slate-800 truncate w-32">${username}</p>
                    <p class="text-xs text-slate-500">${roleName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="main-content">
              <header class="flex justify-between items-center mb-8">
                <h1 class="text-2xl font-bold text-slate-800">Dashboard ${roleName}</h1>
                <div class="flex items-center gap-4">
                  <div class="relative">
                    <input type="text" placeholder="Search..." class="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64">
                    <span class="absolute left-3 top-2.5 text-slate-400">🔍</span>
                  </div>
                  <button class="p-2 text-slate-400 hover:text-blue-600">🔔</button>
                  <a href="/api/auth/logout" class="text-sm font-medium text-red-500 hover:text-red-600">Logout</a>
                </div>
              </header>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="card">
                  <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-blue-50 text-blue-600 rounded-lg">👥</div>
                    <span class="text-emerald-500 text-xs font-bold">↑ 12%</span>
                  </div>
                  <p class="text-2xl font-bold text-slate-800">3,456</p>
                  <p class="text-sm text-slate-500">Total Users</p>
                </div>
                <div class="card">
                  <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-amber-50 text-amber-600 rounded-lg">🎮</div>
                    <span class="text-emerald-500 text-xs font-bold">↑ 5%</span>
                  </div>
                  <p class="text-2xl font-bold text-slate-800">124</p>
                  <p class="text-sm text-slate-500">Active Games</p>
                </div>
                <div class="card">
                  <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-emerald-50 text-emerald-600 rounded-lg">📚</div>
                    <span class="text-rose-500 text-xs font-bold">↓ 2%</span>
                  </div>
                  <p class="text-2xl font-bold text-slate-800">89</p>
                  <p class="text-sm text-slate-500">Materials</p>
                </div>
                <div class="card">
                  <div class="flex justify-between items-start mb-4">
                    <div class="p-2 bg-purple-50 text-purple-600 rounded-lg">⚖️</div>
                    <span class="text-emerald-500 text-xs font-bold">↑ 8%</span>
                  </div>
                  <p class="text-2xl font-bold text-slate-800">42</p>
                  <p class="text-sm text-slate-500">Validations</p>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card h-80 flex flex-col items-center justify-center border-dashed border-2">
                  <p class="text-slate-400">Chart Section (Coming Soon)</p>
                </div>
                <div class="card h-80 flex flex-col items-center justify-center border-dashed border-2">
                  <p class="text-slate-400">Activity Logs (Coming Soon)</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      })
  )
  .listen(3000);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);