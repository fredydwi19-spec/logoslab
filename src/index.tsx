import { Elysia, t } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { jwt } from "@elysiajs/jwt";
import { userRoutes } from "./routes/users";
import { authRoutes } from "./routes/auth";
import { pool } from "./db/db";
import { Layout } from "./views/layouts/Layout";
import { Navbar } from "./views/components/Navbar";
import { EditProfilePage } from "./views/pages/EditProfile";
import { db } from "./db/db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";

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
    let user = null;
    if (auth?.value) {
      user = await jwt.verify(auth.value as string);
    }
    
    const html = await Bun.file("public/index.html").text();
    const navbarHtml = Navbar({ user });
    
    // Replace the static navbar with the dynamic one
    const dynamicHtml = html.replace(
      /<nav class="header__nav">[\s\S]*?<\/nav>/,
      navbarHtml
    );
    
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
  .use(userRoutes)
  .use(authRoutes)
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
      .get("/:role", ({ params, user }) => {
        if (!user || !(user as any).role) return "Unauthorized";
        
        const userRole = (user as any).role as string;
        const username = (user as any).username as string;
        const rolePath = userRole.toLowerCase().split('_')[0];

        if (params.role !== rolePath) {
          return Response.redirect(`/dashboard/${rolePath}`);
        }

        const renderContent = () => {
          switch (userRole) {
            case "KETUA_TIM":
              return `
                <div class="space-y-8">
                  <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-center mb-6">
                      <h2 class="text-lg font-bold text-slate-800">Tabel Proyek Game</h2>
                      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Tambah Proyek Game</button>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left">
                        <thead>
                          <tr class="border-b border-slate-100 text-slate-400 text-sm">
                            <th class="pb-4 font-semibold">ID</th>
                            <th class="pb-4 font-semibold">Judul Game</th>
                            <th class="pb-4 font-semibold">Status</th>
                            <th class="pb-4 font-semibold">Pembuat</th>
                            <th class="pb-4 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody class="text-slate-600">
                          <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td class="py-4 font-medium">#G001</td>
                            <td class="py-4 text-slate-800 font-medium">Bible Trivia Quest</td>
                            <td class="py-4"><span class="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">Published</span></td>
                            <td class="py-4">Andi Game</td>
                            <td class="py-4 text-right">
                              <button class="text-blue-600 hover:underline mr-3 font-medium">Edit</button>
                              <button class="text-red-500 font-medium">Hapus</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex justify-between items-center mb-6">
                      <h2 class="text-lg font-bold text-slate-800">Tabel Proyek Materi</h2>
                      <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">+ Tambah Proyek Materi</button>
                    </div>
                    <div class="overflow-x-auto">
                      <table class="w-full text-left">
                        <thead>
                          <tr class="border-b border-slate-100 text-slate-400 text-sm">
                            <th class="pb-4 font-semibold">ID</th>
                            <th class="pb-4 font-semibold">Judul Materi</th>
                            <th class="pb-4 font-semibold">Tipe</th>
                            <th class="pb-4 font-semibold">Status</th>
                            <th class="pb-4 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody class="text-slate-600">
                          <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td class="py-4 font-medium">#M001</td>
                            <td class="py-4 text-slate-800 font-medium">Sejarah Israel Kuno</td>
                            <td class="py-4 text-sm font-medium px-2 py-0.5 bg-blue-50 text-blue-600 rounded inline-block">PDF</td>
                            <td class="py-4"><span class="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold">In Review</span></td>
                            <td class="py-4 text-right">
                              <button class="text-blue-600 hover:underline mr-3 font-medium">Edit</button>
                              <button class="text-red-500 font-medium">Hapus</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              `;

            case "PEMBUAT_GAME":
              return `
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-800 mb-6">Proyek Saya (Game)</h2>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-slate-100 text-slate-400 text-sm">
                          <th class="pb-4 font-semibold">ID</th>
                          <th class="pb-4 font-semibold">Nama Proyek</th>
                          <th class="pb-4 font-semibold">Deadline</th>
                          <th class="pb-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody class="text-slate-600">
                        <tr class="border-b border-slate-50">
                          <td class="py-4">#G102</td>
                          <td class="py-4 font-medium text-slate-800">Petualangan Nuh</td>
                          <td class="py-4 text-sm">15 Mei 2026</td>
                          <td class="py-4"><span class="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">Sedang Dikerjakan</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              `;

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
              return `
                <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h2 class="text-lg font-bold text-slate-800 mb-6">Proyek Review (Materi)</h2>
                  <div class="overflow-x-auto">
                    <table class="w-full text-left">
                      <thead>
                        <tr class="border-b border-slate-100 text-slate-400 text-sm">
                          <th class="pb-4 font-semibold">ID</th>
                          <th class="pb-4 font-semibold">Materi</th>
                          <th class="pb-4 font-semibold">Review</th>
                          <th class="pb-4 font-semibold">Aksi</th>
                        </tr>
                      </thead>
                      <tbody class="text-slate-600">
                        <tr class="border-b border-slate-50">
                          <td class="py-4">#R99</td>
                          <td class="py-4 font-medium text-slate-800">Tafsir Roma 1-8</td>
                          <td class="py-4"><span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">Belum Direview</span></td>
                          <td class="py-4"><button class="bg-blue-600 text-white px-3 py-1 rounded text-sm">Review Sekarang</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              `;

            case "USER":
              return `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                    <div class="text-3xl mb-4">⭐</div>
                    <h3 class="text-lg font-bold">Level 12</h3>
                    <p class="text-blue-100 text-sm">Pelajar Alkitab Setia</p>
                  </div>
                  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="text-3xl mb-4">🎮</div>
                    <h3 class="text-lg font-bold text-slate-800">15 Game</h3>
                    <p class="text-slate-500 text-sm">Telah diselesaikan</p>
                  </div>
                  <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="text-3xl mb-4">📖</div>
                    <h3 class="text-lg font-bold text-slate-800">8 Materi</h3>
                    <p class="text-slate-500 text-sm">Telah dipelajari</p>
                  </div>
                </div>
              `;

            default:
              return '<div class="p-8 text-center text-slate-500">Halaman Dashboard belum dikonfigurasi.</div>';
          }
        };

        const dashboardContent = renderContent();

        const htmlResponse = Layout({ 
          title: "Dashboard", 
          username, 
          role: userRole, 
          children: dashboardContent 
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
      .get("/edit", async ({ jwt, cookie }) => {
        const payload: any = await jwt.verify(cookie.auth!.value as string);
        const [user] = await db.select().from(users).where(eq(users.id, payload.id));
        
        // Render Edit Profile Page (I will create this view next)
        return new Response(EditProfilePage({ user }), {
          headers: { "Content-Type": "text/html; charset=utf8" }
        });
      })
      .post("/edit", async ({ body, jwt, cookie }) => {
        const payload: any = await jwt.verify(cookie.auth!.value as string);
        const { name } = body as { name: string };
        
        await db.update(users).set({ name }).where(eq(users.id, payload.id));
        
        return { success: true, message: "Profil berhasil diperbarui" };
      })
  )
  .listen(3000);

console.log("🚀 Logos LAB Server is running at localhost:3000");