import { Elysia } from "elysia";
import { db } from "../db/db";
import { users, projects, userScores, materiReadProgress, achievements } from "../db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";

export const userDashboardRoutes = new Elysia({ prefix: "/api/user" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .get("/dashboard", async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    if (!auth?.value) {
      return new Response("Unauthorized", { status: 401 });
    }
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const userId = Number(payload.id);

    // 1. totalPlayed
    const [scoresCount] = await db.select({ count: sql<number>`count(*)` }).from(userScores).where(eq(userScores.userId, userId));
    const [materiCount] = await db.select({ count: sql<number>`count(*)` }).from(materiReadProgress).where(eq(materiReadProgress.userId, userId));
    const totalPlayed = Number(scoresCount?.count ?? 0) + Number(materiCount?.count ?? 0);

    // 2. completedCount
    const [achievementsCount] = await db.select({ count: sql<number>`count(*)` }).from(achievements).where(eq(achievements.userId, userId));
    const completedCount = Number(achievementsCount?.count ?? 0);

    // 3. totalXp & dailyStreak
    const [userData] = await db.select({ totalXp: users.totalXp, currentStreak: users.currentStreak }).from(users).where(eq(users.id, userId));
    const totalXp = userData?.totalXp || 0;
    const dailyStreak = userData?.currentStreak || 0;

    // 4. resumeProject
    const [resumeData] = await db.select({
      projectId: materiReadProgress.projectId,
      scrollPercentage: materiReadProgress.scrollPercentage,
      videoWatchedPercentage: materiReadProgress.videoWatchedPercentage,
      title: projects.title,
      type: projects.type
    })
    .from(materiReadProgress)
    .innerJoin(projects, eq(materiReadProgress.projectId, projects.id))
    .where(and(eq(materiReadProgress.userId, userId), eq(materiReadProgress.isCompleted, false)))
    .orderBy(desc(materiReadProgress.updatedAt))
    .limit(1);

    // 5. recommendedProjects
    const recommendedProjects = await db.select({
      id: projects.id,
      title: projects.title,
      type: projects.type,
      category: projects.category,
      thumbnailUrl: projects.thumbnailUrl
    })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"))
    .limit(4);

    // 6. leaderboard
    const leaderboard = await db.select({
      name: users.name,
      avatarUrl: users.avatarUrl,
      totalXp: users.totalXp
    })
    .from(users)
    .orderBy(desc(users.totalXp))
    .limit(5);

    // 7. unlockedBadges
    const unlockedBadges = await db.select({
      achievementType: achievements.achievementType,
      claimedAt: achievements.claimedAt
    })
    .from(achievements)
    .where(eq(achievements.userId, userId));

    return {
      stats: {
        totalPlayed,
        completedCount,
        totalXp,
        dailyStreak
      },
      resumeProject: resumeData || null,
      recommendedProjects,
      leaderboard,
      unlockedBadges
    };
  });
