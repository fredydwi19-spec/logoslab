import { db } from "../db/db";
import { projects, users, reviewsHistory, achievements, materiReadProgress, userScores, gameInterests } from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

/**
 * Mengambil seluruh metrik KPI untuk dashboard Ketua Tim.
 * Endpoint: GET /api/dashboard/kpi-summary
 * Akses: KETUA_TIM only.
 */
export async function getDashboardKpiSummary() {
  // === TOP ROW: KPI Cards ===

  // 1. Total Proyek Berjalan (aktif dari pembuat_materi & pembuat_game, status bukan PUBLISHED/UNPUBLISHED)
  const activeStatuses = ["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR", "ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA"];
  const activeProjectsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(
      sql`${projects.status} IN ('DRAFT','REVIEW_PAKAR','REVISI_PAKAR','ACCEPTED_PAKAR','REVIEW_KETUA','REVISI_KETUA')`
    );
  const totalActiveProjects = Number(activeProjectsResult[0]?.count ?? 0);

  // 2. Log Revisi Kritis: Proyek berstatus REVISI_PAKAR atau REVISI_KETUA yang belum direspons
  //    (revisi dikirim pakar/ketua, pembuat belum submit ulang)
  const criticalRevisionResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(
      sql`${projects.status} IN ('REVISI_PAKAR','REVISI_KETUA')`
    );
  const criticalRevisionCount = Number(criticalRevisionResult[0]?.count ?? 0);

  // 3. Total Pengguna terdaftar
  const totalUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const totalUsers = Number(totalUsersResult[0]?.count ?? 0);

  // 4. Live User Online (proxy: user yang punya record progress diperbarui dalam 15 menit terakhir)
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const liveUsersResult = await db
    .select({ count: sql<number>`count(DISTINCT ${materiReadProgress.userId})` })
    .from(materiReadProgress)
    .where(gte(materiReadProgress.updatedAt, fifteenMinutesAgo));
  const liveUsers = Number(liveUsersResult[0]?.count ?? 0);

  // === MIDDLE ROW: Spider Chart 5 Sumbu ===

  // Sumbu 1: Content Velocity — rata-rata proyek diselesaikan dalam 30 hari terakhir
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPublishedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(
      and(
        eq(projects.status, "PUBLISHED"),
        gte(projects.updatedAt, thirtyDaysAgo)
      )
    );
  const recentPublishedCount = Number(recentPublishedResult[0]?.count ?? 0);
  // Normalisasi ke skala 0-100: asumsi target 10 proyek/bulan = 100%
  const contentVelocityScore = Math.min(100, Math.round((recentPublishedCount / 10) * 100));

  // Sumbu 2: Expert Responsiveness — persentase proyek REVIEW_PAKAR yang direspons dalam 7 hari
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const pakarReviewedRecentlyResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(reviewsHistory)
    .where(
      and(
        sql`${reviewsHistory.statusGiven} IN ('ACCEPT','REVISI')`,
        gte(reviewsHistory.createdAt, sevenDaysAgo)
      )
    );
  const pakarReviewedRecently = Number(pakarReviewedRecentlyResult[0]?.count ?? 0);
  const pendingReviewResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(projects)
    .where(eq(projects.status, "REVIEW_PAKAR"));
  const pendingReview = Number(pendingReviewResult[0]?.count ?? 0);
  const totalReviewBase = pakarReviewedRecently + pendingReview;
  const expertResponsivenessScore = totalReviewBase > 0
    ? Math.min(100, Math.round((pakarReviewedRecently / totalReviewBase) * 100))
    : 100;

  // Sumbu 3: User Engagement — persentase user yang punya progress materi (isCompleted atau scrollPercentage > 50%)
  const engagedUsersResult = await db
    .select({ count: sql<number>`count(DISTINCT ${materiReadProgress.userId})` })
    .from(materiReadProgress)
    .where(
      sql`${materiReadProgress.scrollPercentage} > 50 OR ${materiReadProgress.isCompleted} = 1`
    );
  const engagedUsers = Number(engagedUsersResult[0]?.count ?? 0);
  const userEngagementScore = totalUsers > 0
    ? Math.min(100, Math.round((engagedUsers / totalUsers) * 100))
    : 0;

  // Sumbu 4: Passing Rate — persentase user yang klaim achievement GAME_SELESAI
  const achievementUsersResult = await db
    .select({ count: sql<number>`count(DISTINCT ${achievements.userId})` })
    .from(achievements)
    .where(eq(achievements.achievementType, "GAME_SELESAI"));
  const achievementUsers = Number(achievementUsersResult[0]?.count ?? 0);
  const passingRateScore = totalUsers > 0
    ? Math.min(100, Math.round((achievementUsers / totalUsers) * 100))
    : 0;

  // Sumbu 5: Category Coverage — persentase kategori teologi yang sudah punya proyek published
  const theologyCategories = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika",
  ];
  const publishedCategoryResult = await db
    .select({ category: projects.category })
    .from(projects)
    .where(eq(projects.status, "PUBLISHED"));
  const coveredCategories = new Set(
    publishedCategoryResult
      .flatMap(r => (r.category ? r.category.split(",").map(c => c.trim()) : []))
      .filter(c => theologyCategories.includes(c))
  );
  const categoryCoverageScore = Math.round(
    (coveredCategories.size / theologyCategories.length) * 100
  );

  // === MIDDLE ROW: Funnel Chart (konversi aktivitas user) ===
  // Stage 1: Membuka Materi (punya record di materiReadProgress)
  const openedMateriResult = await db
    .select({ count: sql<number>`count(DISTINCT ${materiReadProgress.userId})` })
    .from(materiReadProgress);
  const openedMateri = Number(openedMateriResult[0]?.count ?? 0);

  // Stage 2: Lolos Scroll Tracker (scrollPercentage >= 80 atau isCompleted)
  const passedScrollResult = await db
    .select({ count: sql<number>`count(DISTINCT ${materiReadProgress.userId})` })
    .from(materiReadProgress)
    .where(
      sql`${materiReadProgress.scrollPercentage} >= 80 OR ${materiReadProgress.isCompleted} = 1`
    );
  const passedScroll = Number(passedScrollResult[0]?.count ?? 0);

  // Stage 3: Mencoba Kuis (punya record di userScores)
  const triedQuizResult = await db
    .select({ count: sql<number>`count(DISTINCT ${userScores.userId})` })
    .from(userScores);
  const triedQuiz = Number(triedQuizResult[0]?.count ?? 0);

  // Stage 4: Klaim Achievement (punya record achievement)
  const claimedAchievementResult = await db
    .select({ count: sql<number>`count(DISTINCT ${achievements.userId})` })
    .from(achievements);
  const claimedAchievement = Number(claimedAchievementResult[0]?.count ?? 0);

  const funnelData = [
    { label: "Membuka Materi", value: openedMateri, color: "#1A237E" },
    { label: "Lolos Scroll Tracker", value: passedScroll, color: "#1565C0" },
    { label: "Mencoba Kuis", value: triedQuiz, color: "#FFC107" },
    { label: "Klaim Achievement", value: claimedAchievement, color: "#FF5722" },
  ];

  // === BOTTOM ROW: Heatmap Aktivitas 7 Hari Terakhir ===
  // Hitung jumlah aktivitas (update progress) per hari selama 7 hari terakhir
  const heatmapData: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const dayResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(materiReadProgress)
      .where(
        sql`${materiReadProgress.updatedAt} BETWEEN ${dayStart} AND ${dayEnd}`
      );

    heatmapData.push({
      date: dayStart.toISOString().split("T")[0]!,
      count: Number(dayResult[0]?.count ?? 0),
    });
  }

  return {
    kpiCards: {
      totalActiveProjects,
      criticalRevisionCount,
      totalUsers,
      liveUsers,
    },
    spiderChart: {
      labels: [
        "Content Velocity",
        "Expert Responsiveness",
        "User Engagement",
        "Passing Rate",
        "Category Coverage",
      ],
      data: [
        contentVelocityScore,
        expertResponsivenessScore,
        userEngagementScore,
        passingRateScore,
        categoryCoverageScore,
      ],
    },
    funnelChart: funnelData,
    heatmap: heatmapData,
  };
}

export async function getUserDashboardSummary(userId: number) {
  // 1. KPI
  const scoresResult = await db.select({ score: userScores.score, projectId: userScores.projectId }).from(userScores).where(eq(userScores.userId, userId));
  const totalXP = scoresResult.reduce((sum, s) => sum + s.score, 0);

  const badgesResult = await db.select({ count: sql<number>`count(*)` }).from(achievements).where(eq(achievements.userId, userId));
  const badges = Number(badgesResult[0]?.count ?? 0);

  const completedMateri = await db.select({ count: sql<number>`count(*)` }).from(materiReadProgress).where(and(eq(materiReadProgress.userId, userId), eq(materiReadProgress.isCompleted, true)));
  const uniqueGamesPlayed = new Set(scoresResult.map(s => s.projectId)).size;
  const totalCompleted = Number(completedMateri[0]?.count ?? 0) + uniqueGamesPlayed;
  
  const totalPublishedResult = await db.select({ count: sql<number>`count(*)` }).from(projects).where(eq(projects.status, "PUBLISHED"));
  const totalPublished = Number(totalPublishedResult[0]?.count ?? 1);
  const completionRate = totalPublished === 0 ? 0 : Math.min(100, Math.round((totalCompleted / totalPublished) * 100));

  const streak = 5; // Placeholder logic for streak

  // 2. Spider Chart
  const categories = ["Biblical Knowledge", "Eksegesis & Hermeneutik", "Biblical Theory", "Homiletika", "Apologetika"];
  const spiderData = categories.map(() => 0);

  // Fetch all game interests to map category to projectIds
  const allGameInterests = await db.select().from(gameInterests);
  
  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const catProjectIds = allGameInterests.filter(gi => gi.category === cat).map(gi => gi.projectId);
    if (catProjectIds.length > 0) {
      const catScores = scoresResult.filter(s => catProjectIds.includes(s.projectId));
      if (catScores.length > 0) {
        const sumScore = catScores.reduce((sum, s) => sum + s.score, 0);
        // Assuming max score per game is 100
        const maxScore = catProjectIds.length * 100;
        spiderData[i] = maxScore > 0 ? Math.min(100, Math.round((sumScore / maxScore) * 100)) : 0;
      }
    }
  }

  // 3. Line Chart
  const lineChart = {
    labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"],
    data: [50, 65, 80, 85]
  };

  return {
    kpi: { streak, totalXP, completionRate, badges },
    spiderChart: {
      labels: categories,
      datasets: [{ label: "Tingkat Penguasaan (%)", data: spiderData }]
    },
    lineChart
  };
}
