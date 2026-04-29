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
        if (!auth.value) return (set.redirect = "/");
        const payload = await jwt.verify(auth.value);
        if (!payload) {
          return (set.redirect = "/");
        }
      })
      .derive(async ({ jwt, cookie: { auth } }) => {
        const payload = await jwt.verify(auth.value);
        if (!payload) return { user: null };
        // Clone payload to avoid readonly issues
        return { user: { ...payload } as any };
      })
      .get("/:role", ({ params, user, set }) => {
        if (!user || !user.role) return "Unauthorized";
        
        const roleParam = params.role.toUpperCase();
        const userRole = (user as any).role as string;
        
        return (
          <Layout
            title={`Dashboard ${roleParam}`}
            username={(user as any).username as string}
            role={userRole}
          >
            <div class="space-y-6">
              <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-lg font-bold mb-2">Selamat Datang, {(user as any).username}!</h2>
                <p class="text-slate-600">Ini adalah halaman dashboard khusus untuk {userRole.replace('_', ' ')}.</p>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-blue-600 p-6 rounded-xl text-white">
                  <div class="text-3xl font-bold mb-1">0</div>
                  <div class="text-blue-100 text-sm">Proyek Aktif</div>
                </div>
                <div class="bg-emerald-600 p-6 rounded-xl text-white">
                  <div class="text-3xl font-bold mb-1">0</div>
                  <div class="text-emerald-100 text-sm">Selesai</div>
                </div>
                <div class="bg-amber-600 p-6 rounded-xl text-white">
                  <div class="text-3xl font-bold mb-1">0</div>
                  <div class="text-amber-100 text-sm">Review</div>
                </div>
              </div>
            </div>
          </Layout>
        );
      })
  )
  .listen(3000);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);