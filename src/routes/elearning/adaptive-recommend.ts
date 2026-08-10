import { Elysia } from "elysia";
import { db } from "../../db/db";
import { studentLearningLogs, materialTags, projects } from "../../db/schema";
import { eq, sql, and, desc } from "drizzle-orm";

export const adaptiveRecommendRoute = new Elysia({ prefix: "/adaptive-recommend" })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .get("/", async ({ user }) => {
    const userId = Number((user as any).id);

    // Hitung persentase benar per tag untuk user
    const tagStats = await db
      .select({
        tagId: studentLearningLogs.tagId,
        total: sql<number>`count(*)`,
        correct: sql<number>`sum(if(${studentLearningLogs.isCorrect}, 1, 0))`,
      })
      .from(studentLearningLogs)
      .where(eq(studentLearningLogs.userId, userId))
      .groupBy(studentLearningLogs.tagId);

    if (tagStats.length === 0) {
      return { success: true, data: null, message: "Tidak ada riwayat untuk direkomendasikan" };
    }

    // Cari tag dengan persentase terendah
    let lowestTagId = tagStats[0].tagId;
    let lowestRatio = tagStats[0].correct / tagStats[0].total;

    for (const stat of tagStats) {
      const ratio = stat.correct / stat.total;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        lowestTagId = stat.tagId;
      }
    }

    // Cari materi dengan tag tersebut yang sudah PUBLISHED
    const recommendedMateri = await db
      .select({
        projectId: projects.id,
        title: projects.title,
        materiType: projects.materiType
      })
      .from(materialTags)
      .innerJoin(projects, eq(materialTags.materialId, projects.id))
      .where(
        and(
          eq(materialTags.tagId, lowestTagId),
          eq(projects.type, "MATERI"),
          eq(projects.status, "PUBLISHED")
        )
      )
      .limit(5);

    return { 
      success: true, 
      weakestTagId: lowestTagId, 
      weakestRatio: lowestRatio, 
      data: recommendedMateri 
    };
  });
