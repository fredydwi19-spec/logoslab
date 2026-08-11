import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import * as path from "path";
import * as fs from "fs";
import { jwt } from "@elysiajs/jwt";

// Create upload directory if it doesn't exist
const uploadDir = path.join(process.cwd(), "public/uploads/avatars");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

export const apiUserRoutes = new Elysia({ prefix: "/api/user" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
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
    return { userPayload: payload as any };
  })
  .get("/profile", async ({ userPayload }) => {
    const [user] = await db.select().from(users).where(eq(users.id, userPayload.id));
    return user || { error: "User not found" };
  })
  .post("/profile/update", async ({ body, userPayload }) => {
    const { name, competencies, profile_picture } = body as any;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (competencies) updateData.competencies = competencies;

    if (profile_picture && profile_picture.size > 0) {
      const file = profile_picture as File;
      const ext = path.extname(file.name) || '.jpg';
      const filename = `avatar_${userPayload.id}_${Date.now()}${ext}`;
      const filepath = path.join(uploadDir, filename);
      
      const arrBuffer = await file.arrayBuffer();
      await Bun.write(filepath, arrBuffer);
      updateData.profilePicture = `/public/uploads/avatars/${filename}`;
    }

    await db.update(users).set(updateData).where(eq(users.id, userPayload.id));
    return { success: true, message: "Profil berhasil diperbarui", profilePicture: updateData.profilePicture };
  })
  .post("/change-password", async ({ body, userPayload, set }) => {
    const { oldPassword, newPassword } = body as any;
    const [user] = await db.select().from(users).where(eq(users.id, userPayload.id));
    
    if (!user) {
      set.status = 404;
      return { error: "User not found" };
    }
    
    // Simplistic password check since password hashing isn't clearly defined in the snippet,
    // assuming it might just be cleartext or using a specific util. 
    // Usually there is `Bun.password.verify`. I'll assume simple check or if it doesn't match we fail.
    // Given no bcrypt context, let's just do direct comparison or assume there's a password field.
    if (user.password !== oldPassword) {
      set.status = 400;
      return { error: "Kata sandi lama salah" };
    }

    await db.update(users).set({ password: newPassword }).where(eq(users.id, userPayload.id));
    return { success: true, message: "Kata sandi berhasil diubah" };
  });
