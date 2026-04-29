import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authRoutes = new Elysia({ prefix: "/api/auth" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .post(
    "/login",
    async ({ body, jwt, set, cookie: { auth } }) => {
      const { username, password } = body;

      // Find user
      const [user] = await db.select().from(users).where(eq(users.username, username));

      if (!user || !user.password) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      // Generate JWT
      const token = await jwt.sign({
        id: user.id,
        role: user.role,
        username: user.username,
      });

      auth.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400, // 7 days
        path: "/",
      });

      // Redirect logic based on role
      let redirectUrl = "/dashboard/member";
      switch (user.role) {
        case "KETUA_TIM":
          redirectUrl = "/dashboard/ketua";
          break;
        case "PEMBUAT_GAME":
          redirectUrl = "/dashboard/game";
          break;
        case "PEMBUAT_MATERI":
          redirectUrl = "/dashboard/materi";
          break;
        case "PAKAR":
          redirectUrl = "/dashboard/pakar";
          break;
        default:
          redirectUrl = "/dashboard/member";
      }

      return {
        message: "Login successful",
        redirect: redirectUrl,
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/google", ({ set }) => {
    // Mock Google OAuth Redirect
    // In real implementation, this would redirect to Google login
    set.redirect = "https://accounts.google.com/o/oauth2/v2/auth?...";
  })
  .get("/google/callback", async ({ query, jwt, cookie: { auth }, set }) => {
    // Mock Callback Logic
    // 1. Exchange code for user info
    // 2. Check if user exists in DB
    // 3. Create if not, then sign JWT
    
    set.redirect = "/dashboard/member"; // Default
  })
  .get("/logout", ({ cookie: { auth }, set }) => {
    auth.remove();
    set.redirect = "/";
  });
