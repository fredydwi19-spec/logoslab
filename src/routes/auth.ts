import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users, verificationTokens } from "../db/schema";
import { sendVerificationEmail } from "../utils/mailer";
import { eq, or } from "drizzle-orm";
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
    async ({ body, jwt, set, cookie }) => {
      const { username, password } = body;

      // Find user by username or email
      const [user] = await db
        .select()
        .from(users)
        .where(or(eq(users.username, username), eq(users.email, username)));

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

      // Check if verified
      if (!user.isVerified) {
        set.status = 403;
        return { error: "Tolong cek email Anda untuk verifikasi" };
      }

      // Generate JWT
      const token = await jwt.sign({
        id: user.id,
        role: user.role,
        username: user.username,
      });

      cookie.auth!.set({
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
        redirect: "/",
      };
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    }
  )
  .get("/google", () => {
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
  .get("/google/callback", async ({ query, jwt, cookie, set }) => {
    const { code } = query;
    if (!code) {
      set.redirect = "/";
      return;
    }

    try {
      // 1. Tukar code dengan access token
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

      // 2. Ambil profil user dari Google
      const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser: any = await userResponse.json();

      // 3. Cari atau buat user di database
      let [user] = await db.select().from(users).where(eq(users.email, googleUser.email));
      
      if (!user) {
        // Buat user baru dengan role default "USER"
        const result = await db.insert(users).values({
          name: googleUser.name,
          email: googleUser.email,
          username: googleUser.email.split('@')[0] + Math.floor(Math.random() * 1000),
          role: "USER", // Default role sesuai permintaan
          googleId: googleUser.id,
          profilePicture: googleUser.picture
        });
        
        const insertedId = (result[0] as any).insertId;
        [user] = await db.select().from(users).where(eq(users.id, insertedId));
      }

      if (!user) {
        throw new Error("Failed to create or retrieve user");
      }

      // 4. Generate JWT
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

      // 5. Redirect ke landing page (/)
      console.log(`✅ User ${user.email} logged in successfully as ${user.role}`);
      return Response.redirect("/");
      
    } catch (error) {
      console.error("❌ Google Auth Error:", error);
      return Response.redirect("/?error=google_auth_failed");
    }
  })
  .get("/logout", ({ cookie }) => {
    cookie.auth!.remove();
    return Response.redirect("/", 302);
  })
  .post(
    "/signup",
    async ({ body, set }) => {
      const { name, email, password } = body;
      
      const existingUser = await db.select().from(users).where(eq(users.email, email));
      if (existingUser.length > 0) {
        set.status = 400;
        return { error: "Email already exists" };
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const username = (email?.split('@')[0] || 'user') + Math.floor(Math.random() * 1000);
      
      const result = await db.insert(users).values({
        name,
        email,
        username,
        password: hashedPassword,
        role: "USER",
        isVerified: false
      });
      
      const userId = (result[0] as any).insertId;
      const token = crypto.randomUUID();
      
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry
      
      await db.insert(verificationTokens).values({
        userId,
        token,
        expiresAt
      });
      
      try {
        await sendVerificationEmail(email, token);
      } catch(err) {
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
  .get("/verify", async ({ query, set }) => {
    const { token } = query;
    if (!token) {
      set.status = 400;
      return "Token is missing";
    }
    
    const [verifToken] = await db.select().from(verificationTokens).where(eq(verificationTokens.token, token as string));
    
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
    
    return Response.redirect("/?verified=true", 302);
  });
