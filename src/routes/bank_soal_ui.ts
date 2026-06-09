import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { Layout } from "../views/layouts/Layout";
import { db } from "../db/db";
import { notifications } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { BankSoalQuizUI } from "../views/components/BankSoalQuiz";
import { BankSoalFtbUI } from "../views/components/BankSoalFtb";
import { BankSoalTtsUI } from "../views/components/BankSoalTts";

export const bankSoalUiRoutes = new Elysia({ prefix: "/dashboard/bank-soal" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "super-secret-key" }))
  .onBeforeHandle(async ({ jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (!auth?.value) return Response.redirect("/", 302);
    const payload = await jwt.verify(auth.value as string);
    if (!payload) return Response.redirect("/", 302);
    
    const role = (payload as any).role;
    if (role !== "KETUA_TIM" && role !== "PEMBUAT_GAME") {
      return Response.redirect("/dashboard/" + role.toLowerCase().split('_')[0], 302);
    }
  })
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  .get("/quiz", async ({ user }) => {
    const username = user.username;
    const userId = Number(user.id);
    const userRole = user.role;
    const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    
    return new Response(Layout({
      title: "Bank Soal Quiz",
      username,
      role: userRole,
      children: BankSoalQuizUI(),
      notifications: userNotifications,
      currentPage: "Bank Soal Quiz"
    }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  })
  .get("/ftb", async ({ user }) => {
    const username = user.username;
    const userId = Number(user.id);
    const userRole = user.role;
    const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    
    return new Response(Layout({
      title: "Bank Soal FTB",
      username,
      role: userRole,
      children: BankSoalFtbUI(),
      notifications: userNotifications,
      currentPage: "Bank Soal FTB"
    }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  })
  .get("/tts", async ({ user }) => {
    const username = user.username;
    const userId = Number(user.id);
    const userRole = user.role;
    const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    
    return new Response(Layout({
      title: "Bank Soal TTS",
      username,
      role: userRole,
      children: BankSoalTtsUI(),
      notifications: userNotifications,
      currentPage: "Bank Soal TTS"
    }), { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  });
