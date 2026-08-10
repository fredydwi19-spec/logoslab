import { db } from "../db/db";
import { userGameHistory, userBadges, userMaterialHistory, gameCompetencies, projects } from "../db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function recalculateGlobalRanks() {
  await db.transaction(async (tx) => {
    // 1. Calculate sum of scores for each user
    const userScoresResult = await tx
      .select({
        userId: userGameHistory.userId,
        totalScore: sql<number>`SUM(${userGameHistory.score})`,
      })
      .from(userGameHistory)
      .groupBy(userGameHistory.userId)
      .orderBy(desc(sql`SUM(${userGameHistory.score})`))
      .limit(5);

    // 2. Delete all existing GLOBAL_RANK badges
    await tx.delete(userBadges).where(eq(userBadges.badgeType, "GLOBAL_RANK"));

    // 3. Insert new Top 5 badges
    if (userScoresResult.length > 0) {
      const newBadges = userScoresResult.map((us, index) => ({
        userId: us.userId,
        badgeType: "GLOBAL_RANK" as const,
        badgeRankNumber: index + 1,
        isLocked: false,
      }));
      await tx.insert(userBadges).values(newBadges);
    }
  });
}

export async function getUserAchievements(userId: number) {
  // Get Badges
  const badges = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const dynamicBadges = badges.filter(b => b.badgeType === "GLOBAL_RANK").map(b => ({
    type: b.badgeType,
    rank: b.badgeRankNumber,
    locked: b.isLocked
  }));
  
  const milestoneBadgesRaw = badges.filter(b => b.badgeType === "MILESTONE");
  
  // Define all possible milestones
  const ALL_MILESTONES = [
    { name: "FIRST_BLOOD", description: "Selesaikan game pertama Anda." },
    { name: "THEOLOGIAN", description: "Selesaikan 10 materi teologi." },
    { name: "HERMENEUTIC_EXPERT", description: "Lulus semua game di kategori Eksegesis." },
    { name: "PERFECT_SCORE", description: "Dapatkan skor 100 pada ujian level Sulit." }
  ];

  const milestoneBadges = ALL_MILESTONES.map(m => {
    const found = milestoneBadgesRaw.find(b => b.milestoneName === m.name);
    return {
      name: m.name,
      locked: !found || found.isLocked,
      description: m.description,
      unlockedAt: found ? found.unlockedAt : null
    };
  });

  // Get Competency Progress (5 Linear Progress Bars)
  const categories = ["Biblical Knowledge", "Eksegesis & Hermeneutik", "Biblical Theory", "Homiletika", "Apologetika"];
  const competencyProgress = [];
  
  for (const cat of categories) {
    // Total published games in this category
    const gamesInCat = await db.select({ projectId: gameCompetencies.projectId })
      .from(gameCompetencies)
      .innerJoin(projects, eq(gameCompetencies.projectId, projects.id))
      .where(eq(gameCompetencies.category, cat));
      // assuming they are published, but let's just use gameCompetencies
    
    if (gamesInCat.length === 0) {
      competencyProgress.push({ category: cat, percentage: 0 });
      continue;
    }

    // How many did user pass
    const gameIds = gamesInCat.map(g => g.projectId);
    const passedGames = await db.select({ gameId: userGameHistory.gameId })
      .from(userGameHistory)
      .where(eq(userGameHistory.userId, userId));
      
    const passedInCat = passedGames.filter(p => p.isPassed && gameIds.includes(p.gameId));
    // unique passed games
    const uniquePassedCount = new Set(passedInCat.map(p => p.gameId)).size;
    const percentage = Math.min(100, Math.round((uniquePassedCount / gameIds.length) * 100));
    competencyProgress.push({ category: cat, percentage });
  }

  // Datatable Riwayat Game
  const gameHistoryRaw = await db.select({
    title: projects.title,
    score: userGameHistory.score,
    isPassed: userGameHistory.isPassed,
    date: userGameHistory.createdAt,
    gameId: projects.id
  })
  .from(userGameHistory)
  .innerJoin(projects, eq(userGameHistory.gameId, projects.id))
  .where(eq(userGameHistory.userId, userId))
  .orderBy(desc(userGameHistory.createdAt));

  // Datatable Riwayat Materi
  const materialHistoryRaw = await db.select({
    title: projects.title,
    timeSpentMinutes: userMaterialHistory.timeSpentMinutes,
    isCompleted: userMaterialHistory.isCompleted,
    date: userMaterialHistory.createdAt
  })
  .from(userMaterialHistory)
  .innerJoin(projects, eq(userMaterialHistory.materialId, projects.id))
  .where(eq(userMaterialHistory.userId, userId))
  .orderBy(desc(userMaterialHistory.createdAt));

  return {
    dynamicBadges,
    milestoneBadges,
    competencyProgress,
    gameHistory: gameHistoryRaw,
    materialHistory: materialHistoryRaw
  };
}
