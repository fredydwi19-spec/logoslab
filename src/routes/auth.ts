import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users, verificationTokens } from "../db/schema";
import { sendVerificationEmail } from "../utils/mailer";
import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const authRoutes = new Elysia()
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  // ---- Serve standalone login page ----
  .get("/login", async ({ jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (auth?.value) {
      const payload = await jwt.verify(auth.value as string);
      if (payload) {
        return Response.redirect("/", 302);
      }
    }
    const file = await Bun.file("public/login.html").text();
    return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  })
  // ---- Login ----
  .post(
    "/api/auth/login",
    async ({ body, jwt, set, cookie }) => {
      const { username, password } = body;

      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, username)));

      if (!user || !user.password) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      if (!user.isVerified) {
        set.status = 403;
        return { error: "Tolong cek email Anda untuk verifikasi" };
      }

      const token = await jwt.sign({
        id: user.id,
        role: user.role,
        username: user.username,
      });

      cookie.auth!.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
      });

      // Redirect langsung ke dashboard sesuai role
      let redirectUrl = "/dashboard/user";
      switch (user.role) {
        case "KETUA_TIM":     redirectUrl = "/dashboard/ketua"; break;
        case "PEMBUAT_GAME":  redirectUrl = "/dashboard/game";  break;
        case "PEMBUAT_MATERI":redirectUrl = "/dashboard/materi";break;
        case "PAKAR":         redirectUrl = "/dashboard/pakar"; break;
        default:              redirectUrl = "/dashboard/user";
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
  // ---- Google OAuth ----
  .get("/api/auth/google", () => {
    const clientId = Bun.env.GOOGLE_CLIENT_ID;
    const redirectUri = Bun.env.GOOGLE_REDIRECT_URI;

    if (!clientId) {
      console.error("Missing GOOGLE_CLIENT_ID in Bun.env");
      return "Error: GOOGLE_CLIENT_ID is not set in .env. Please restart your server.";
    }

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&response_type=code&scope=openid%20profile%20email`;

    console.log("--- Google OAuth Debug ---");
    console.log("Client ID:", clientId);
    console.log("Redirect URI:", redirectUri);
    console.log("Final URL:", url);
    console.log("--------------------------");

    return Response.redirect(url);
  })
  .get("/api/auth/google/callback", async ({ query, jwt, cookie, set }) => {
    const { code } = query;
    if (!code) {
      set.redirect = "/login";
      return;
    }

    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code: code as string,
          client_id: Bun.env.GOOGLE_CLIENT_ID!,
          client_secret: Bun.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: Bun.env.GOOGLE_REDIRECT_URI!,
          grant_type: "authorization_code",
        }),
      });

      const tokenData: any = await tokenResponse.json();
      if (tokenData.error) throw new Error(tokenData.error_description);

      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser: any = await userResponse.json();

      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));

      if (!user) {
        const result = await db.insert(users).values({
          name: googleUser.name,
          email: googleUser.email,
          username: googleUser.email.split("@")[0] + Math.floor(Math.random() * 1000),
          role: "USER",
          googleId: googleUser.id,
          profilePicture: googleUser.picture,
        });

        const insertedId = (result[0] as any).insertId;
        [user] = await db.select().from(users).where(eq(users.id, insertedId));
      }

      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }

      const token = await jwt.sign({
        id: user.id,
        role: user.role,
        username: user.username,
      });

      cookie.auth!.set({
        value: token,
        httpOnly: true,
        maxAge: 7 * 86400,
        path: "/",
      });

      console.log(`✅ User ${user.email} logged in successfully as ${user.role}`);
      // Redirect ke dashboard sesuai role
      let googleRedirect = "/dashboard/user";
      switch (user.role) {
        case "KETUA_TIM":     googleRedirect = "/dashboard/ketua"; break;
        case "PEMBUAT_GAME":  googleRedirect = "/dashboard/game";  break;
        case "PEMBUAT_MATERI":googleRedirect = "/dashboard/materi";break;
        case "PAKAR":         googleRedirect = "/dashboard/pakar"; break;
        default:              googleRedirect = "/dashboard/user";
      }
      return Response.redirect(googleRedirect);
    } catch (error) {
      console.error("❌ Google Auth Error:", error);
      return Response.redirect("/login?error=google_auth_failed");
    }
  })
  // ---- Logout ----
  .get("/api/auth/logout", ({ cookie }) => {
    cookie.auth!.remove();
    return Response.redirect("/login", 302);
  })
  // ---- Guest login ----
  .post("/api/auth/guest", async ({ jwt, cookie }) => {
    const token = await jwt.sign({
      id: 0,
      role: "GUEST",
      username: "tamu",
      isGuest: true,
    });
    cookie.auth!.set({
      value: token,
      httpOnly: true,
      maxAge: 3 * 3600,
      path: "/",
    });
    return { message: "Masuk sebagai tamu berhasil", redirect: "/" };
  })
  // ---- Sign up ----
  .post(
    "/api/auth/signup",
    async ({ body, set }) => {
      const { name, email, password } = body;

      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        set.status = 400;
        return { error: "Email already exists" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const username = (email?.split("@")[0] || "user") + Math.floor(Math.random() * 1000);

      const result = await db.insert(users).values({
        name,
        email,
        username,
        password: hashedPassword,
        role: "USER",
        isVerified: false,
      });

      const userId = (result[0] as any).insertId;
      const token = crypto.randomUUID();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await db.insert(verificationTokens).values({
        userId,
        token,
        expiresAt,
      });

      try {
        await sendVerificationEmail(email, token);
      } catch (err) {
        console.error("Email error, but user created:", err);
      }

      return { message: "Sign up successful. Please check your email to verify your account." };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  // ---- Email verify ----
  .get("/api/auth/verify", async ({ query, set }) => {
    const { token } = query;
    if (!token) {
      set.status = 400;
      return "Token is missing";
    }

    const [verifToken] = await db
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, token as string));

    if (!verifToken) {
      set.status = 400;
      return "Invalid token";
    }

    if (new Date() > new Date(verifToken.expiresAt)) {
      set.status = 400;
      return "Token has expired";
    }

    await db.update(users).set({ isVerified: true }).where(eq(users.id, verifToken.userId));
    await db.delete(verificationTokens).where(eq(verificationTokens.id, verifToken.id));

    return Response.redirect("/login?verified=true", 302);
  });
