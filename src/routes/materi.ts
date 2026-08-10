import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { projects, materiReadProgress, achievements, userMaterialHistory, materialSections, materialGlossary, materiContents, questionBank } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";

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
    const user = await jwt.verify(auth.value as string);
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

    const totalTimeSpentSeconds = existing ? (timeSpentSeconds !== undefined ? timeSpentSeconds : existing.timeSpentSeconds) : (timeSpentSeconds || 0);
    const totalScroll = existing ? (scrollPercentage !== undefined ? scrollPercentage : existing.scrollPercentage) : (scrollPercentage || 0);
    const timeSpentMinutes = Math.floor((totalTimeSpentSeconds || 0) / 60);
    
    let isCompleted = totalScroll >= 100 && timeSpentMinutes >= 2;
    let note = "";
    if (totalScroll >= 100 && timeSpentMinutes < 2) {
      isCompleted = false;
      note = "Dibaca Sekilas";
    }

    await db.insert(userMaterialHistory).values({
      userId: user.id,
      materialId: projectId,
      timeSpentMinutes,
      isCompleted
    }).onDuplicateKeyUpdate({
      set: {
        timeSpentMinutes: sql`VALUES(time_spent_minutes)`,
        isCompleted: sql`VALUES(is_completed)`,
        updatedAt: new Date()
      }
    });

    return { success: true, message: "Progress updated", note };
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

    if (project.materiType === "TEKS" || project.materiType === "MANUAL") {
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
  })
  .get("/:id", async ({ params: { id }, user, set }) => {
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) {
      set.status = 404;
      return { error: "Materi not found" };
    }

    if (!user && project.status !== "PUBLISHED") {
      set.status = 401;
      return { error: "Unauthorized" };
    }

    let materiContentsData: any[] = [];
    let materialSectionsData: any[] = [];
    let materialGlossaryData: any[] = [];
    let questionsData: any[] = []; // Actually for MANUAL type, questions are stored in questionBank usually? Wait, projects.ts uses questionBank for QUIZ. The old SSR code checked `materi.questions`. In projects.ts for MATERI, questions are not loaded... Wait, if they are not loaded, maybe they were not stored in questionBank? Let me just import questionBank and materiContents and materialSections and materialGlossary.

    if (project.materiType === "MANUAL") {
      materialSectionsData = await db.select().from(materialSections).where(eq(materialSections.projectId, projectId)).orderBy(materialSections.sortOrder);
      materialGlossaryData = await db.select().from(materialGlossary).where(eq(materialGlossary.projectId, projectId));
      // In old MateriViewer, it checks projectVar?.questions
      // I need to import questionBank
      // We can fetch from questionBank for the mini quiz
      questionsData = await db.select().from(questionBank).where(eq(questionBank.projectId, projectId));
    } else {
      materiContentsData = await db.select().from(materiContents).where(eq(materiContents.projectId, projectId)).orderBy(materiContents.sortOrder);
    }

    return { 
      success: true, 
      data: { 
        ...project, 
        materiContents: materiContentsData, 
        materialSections: materialSectionsData, 
        materialGlossary: materialGlossaryData,
        questions: questionsData 
      } 
    };
  });
