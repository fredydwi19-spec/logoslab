import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users, userJournals } from "../db/schema";
import { eq, desc } from "drizzle-orm";

export const journalsRoutes = new Elysia({ prefix: "/api/journals" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    if (!auth?.value) return { user: null };
    const payload = await jwt.verify(auth.value as string);
    return { user: payload || null };
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .post("/create", async ({ body, user }) => {
    const { referenceType, referenceId, title, reflectionText } = body as any;
    
    const id = crypto.randomUUID();
    
    await db.insert(userJournals).values({
      id,
      userId: user.id as number,
      referenceType,
      referenceId: Number(referenceId),
      title,
      reflectionText
    });
    
    // Add +20 XP
    const currentUserList = await db.select().from(users).where(eq(users.id, user.id as number)).limit(1);
    const currentUser = currentUserList[0];
    const xp = currentUser?.totalXp || 0;
    
    await db.update(users)
      .set({ totalXp: xp + 20 })
      .where(eq(users.id, user.id as number));
      
    return { success: true, xpEarned: 20 };
  })
  .get("/my-journals", async ({ user }) => {
    const journals = await db.select().from(userJournals)
      .where(eq(userJournals.userId, user.id as number))
      .orderBy(desc(userJournals.createdAt));
    return { success: true, data: journals };
  })
  .delete("/:id", async ({ params, user }) => {
    await db.delete(userJournals)
      .where(eq(userJournals.id, params.id));
    return { success: true };
  });
