import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { projects, materiReadProgress, achievements } from "../db/schema";
import { eq, and } from "drizzle-orm";

export const materiRoutes = new Elysia({ prefix: "/api/materi" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .derive(async ({ jwt, cookie: { auth }, set }) => {
    if (!auth?.value) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const user = await jwt.verify(auth.value);
    if (!user) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    return { user: user as { id: number; role: string; username: string } };
  })
  .post("/:id/progress", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const { scrollPercentage, timeSpentSeconds, videoWatchedPercentage } = body as any;

    const [existing] = await db.select().from(materiReadProgress).where(
      and(
        eq(materiReadProgress.userId, user.id),
        eq(materiReadProgress.projectId, projectId)
      )
    ).limit(1);

    if (existing) {
      await db.update(materiReadProgress).set({
        scrollPercentage: scrollPercentage !== undefined ? scrollPercentage : existing.scrollPercentage,
        timeSpentSeconds: timeSpentSeconds !== undefined ? timeSpentSeconds : existing.timeSpentSeconds,
        videoWatchedPercentage: videoWatchedPercentage !== undefined ? videoWatchedPercentage : existing.videoWatchedPercentage,
      }).where(eq(materiReadProgress.id, existing.id));
    } else {
      await db.insert(materiReadProgress).values({
        userId: user.id,
        projectId,
        scrollPercentage: scrollPercentage || 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        videoWatchedPercentage: videoWatchedPercentage || 0,
      });
    }

    return { success: true, message: "Progress updated" };
  }, {
    body: t.Object({
      scrollPercentage: t.Optional(t.Number()),
      timeSpentSeconds: t.Optional(t.Number()),
      videoWatchedPercentage: t.Optional(t.Number()),
    })
  })
  .get("/:id/progress", async ({ params: { id }, user }) => {
    const projectId = Number(id);
    const [progress] = await db.select().from(materiReadProgress).where(
      and(
        eq(materiReadProgress.userId, user.id),
        eq(materiReadProgress.projectId, projectId)
      )
    ).limit(1);

    return { success: true, data: progress || null };
  })
  .post("/:id/claim-achievement", async ({ params: { id }, user, set }) => {
    const projectId = Number(id);
    
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project || project.type !== "MATERI") {
      set.status = 400;
      return { error: "Invalid project" };
    }

    const [progress] = await db.select().from(materiReadProgress).where(
      and(
        eq(materiReadProgress.userId, user.id),
        eq(materiReadProgress.projectId, projectId)
      )
    ).limit(1);

    if (!progress) {
      set.status = 400;
      return { error: "No progress found" };
    }

    let achievementType: "MATERI_TEKS_SELESAI" | "MATERI_VIDEO_SELESAI" | "GAME_SELESAI";
    let isEligible = false;

    if (project.materiType === "TEKS") {
      achievementType = "MATERI_TEKS_SELESAI";
      if ((progress.scrollPercentage ?? 0) >= 95 && (progress.timeSpentSeconds ?? 0) >= 120) {
        isEligible = true;
      }
    } else if (project.materiType === "VIDEO") {
      achievementType = "MATERI_VIDEO_SELESAI";
      if ((progress.videoWatchedPercentage ?? 0) >= 90) {
        isEligible = true;
      }
    } else {
      set.status = 400;
      return { error: "Invalid materi type" };
    }

    if (!isEligible) {
      set.status = 400;
      return { error: "Syarat klaim belum terpenuhi" };
    }

    // Check if already claimed
    const [existingClaim] = await db.select().from(achievements).where(
      and(
        eq(achievements.userId, user.id),
        eq(achievements.projectId, projectId),
        eq(achievements.achievementType, achievementType)
      )
    ).limit(1);

    if (existingClaim) {
      set.status = 400;
      return { error: "Achievement sudah pernah diklaim" };
    }

    await db.insert(achievements).values({
      userId: user.id,
      projectId,
      achievementType
    });
    
    // Mark progress as completed
    await db.update(materiReadProgress).set({ isCompleted: true }).where(eq(materiReadProgress.id, progress.id));

    return { success: true, message: "Achievement berhasil diklaim!" };
  });
