import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, questionBank, reviewsHistory, notifications, users, userScores, gameFillTheBlank, gameQuestionsBank, gameWordSearch, gameCrossword, materiContents, materialSections, materialGlossary, achievements, materiReadProgress, quizDuels, userJournals, gamePlayLogs, materialAccessLogs, projectChats, gameAdventureScenes } from "../db/schema";
import { eq, and, desc, inArray, gte, sql } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { toLevel, findMissingLevel, firstEditableLevel, isProjectTeam, publicQuizQuestion, publicFtbQuestion, publicCrosswordClues } from "../utils/level";
import { validateAdventure } from "../utils/adventure";
import { loadAdventureScenes } from "./adventure";

// Nilai minimal lulus level: angka bulat 1–100. Kosong = pakai nilai bawaan. Tidak valid = null.
function parsePassPercentage(value: unknown, fallback: number): number | null {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
}

// Level tertinggi yang berisi konten game (minimal 1)
async function getHighestContentLevel(projectId: number, gameType: string | null): Promise<number> {
  const table = gameType === "QUIZ" ? questionBank
    : gameType === "FILL_THE_BLANK" ? gameFillTheBlank
    : gameType === "WORD_SEARCH" ? gameWordSearch
    : gameType === "CROSSWORD" ? gameCrossword
    : gameType === "ADVENTURE" ? gameAdventureScenes
    : null;
  if (!table) return 1;
  const rows: { level: number }[] = await db.select({ level: table.level }).from(table as any).where(eq(table.projectId, projectId));
  return Math.max(1, ...rows.map(r => r.level));
}

export const projectRoutes = new Elysia({ prefix: "/api/projects" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .onBeforeHandle(async ({ jwt, cookie, request }) => {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Allow public access to gameplay routes
    if (request.method === "GET" && path.match(/^\/api\/projects\/\d+$/)) return;
    if (request.method === "POST" && path.match(/^\/api\/projects\/\d+\/submit$/)) return;

    const auth = cookie.auth;
    if (!auth?.value) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const payload = await jwt.verify(auth.value as string);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
  })
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  // Create Project (Ketua Tim)
  .post("/", async ({ body, user }) => {
    if (user.role !== "KETUA_TIM") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { title, description, instructions, gameType, type, materiType, deadline, idPembuat, idPakar, category, thumbnailUrl } = body as any;

    const passPercentage = parsePassPercentage((body as any).passPercentage, 70);
    if (passPercentage === null) {
      return new Response(JSON.stringify({ error: "Nilai minimal lulus harus berupa angka bulat 1–100" }), { status: 400 });
    }

    const [result] = await db.insert(projects).values({
      title,
      description,
      instructions,
      gameType: gameType || null,
      type: type || "GAME",
      materiType: materiType || null,
      category: category || null,
      thumbnailUrl: thumbnailUrl || null,
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      idPembuat: Number(idPembuat),
      idPakar: idPakar ? Number(idPakar) : null,
      passPercentage,
      status: "DRAFT"
    });

    // Send notification to Pembuat Game
    await db.insert(notifications).values({
      userId: Number(idPembuat),
      message: `Anda mendapat penugasan proyek game baru: ${title}`,
      projectId: result.insertId
    });

    // Send notification to Pakar if assigned
    if (idPakar) {
      await db.insert(notifications).values({
        userId: Number(idPakar),
        message: `Anda ditunjuk sebagai Pakar untuk proyek: ${title}`,
        projectId: result.insertId
      });
    }

    return { success: true, projectId: result.insertId };
  })
  // Get Projects by Role
  .get("/", async ({ user }) => {
    let projectList: any[] = [];
    if (user.role === "PEMBUAT_GAME" || user.role === "PEMBUAT_MATERI") {
      projectList = await db.select().from(projects).where(eq(projects.idPembuat, user.id));
    } else if (user.role === "PAKAR") {
      projectList = await db.select().from(projects).where(eq(projects.idPakar, user.id));
    } else if (user.role === "KETUA_TIM") {
      projectList = await db.select().from(projects);
    } else if (user.role === "USER") {
      projectList = await db.select().from(projects).where(eq(projects.status, "PUBLISHED"));
    }
    return { success: true, data: projectList };
  })
  // Get Project Details
  .get("/:id", async ({ params: { id }, user }) => {
    const [projectWithPics] = await db.select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      instructions: projects.instructions,
      gameType: projects.gameType,
      type: projects.type,
      materiType: projects.materiType,
      status: projects.status,
      deadline: projects.deadline,
      idPembuat: projects.idPembuat,
      idPakar: projects.idPakar,
      category: projects.category,
      thumbnailUrl: projects.thumbnailUrl,
      passPercentage: projects.passPercentage,
      publishedLevelCount: projects.publishedLevelCount,
      levelReviewStatus: projects.levelReviewStatus,
      pembuatName: users.name,
    })
    .from(projects)
    .leftJoin(users, eq(projects.idPembuat, users.id))
    .where(eq(projects.id, Number(id)));

    if (!projectWithPics) {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    }

    // Get Pakar Name separately or with another join
    const [pakarData] = await db.select({ name: users.name })
      .from(users)
      .where(eq(users.id, projectWithPics.idPakar || 0));

    const project = { 
      ...projectWithPics, 
      pembuatName: projectWithPics.pembuatName || "Belum Ditentukan",
      pakarName: pakarData?.name || "Belum Ditentukan"
    };

    if (!project) {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    }

    // Selain anggota tim proyek, hanya game terbit yang boleh dibuka, dan hanya level yang sudah terbit
    const isTeam = isProjectTeam(user, project);
    if (!isTeam && project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    let questions: any[] = [];
    if (project.gameType === "QUIZ") {
      questions = await db.select().from(questionBank).where(eq(questionBank.projectId, Number(id))).orderBy(questionBank.level, questionBank.id);
    } else if (project.gameType === "FILL_THE_BLANK") {
      const qData = await db.select().from(gameFillTheBlank).where(eq(gameFillTheBlank.projectId, Number(id))).orderBy(gameFillTheBlank.level, gameFillTheBlank.id);
      questions = qData.map(q => ({
        ...q,
        answers: JSON.parse(q.answers)
      }));
    } else if (project.gameType === "WORD_SEARCH") {
      const [wsData] = await db.select().from(gameWordSearch).where(eq(gameWordSearch.projectId, Number(id))).orderBy(gameWordSearch.level);
      if (wsData && wsData.words) {
        try {
          questions = JSON.parse(wsData.words);
        } catch (e) {
          questions = [];
        }
      }
    } else if (project.gameType === "CROSSWORD") {
      const [cwData] = await db.select().from(gameCrossword).where(eq(gameCrossword.projectId, Number(id))).orderBy(gameCrossword.level);
      if (cwData && cwData.clues) {
        try {
          questions = JSON.parse(cwData.clues);
        } catch (e) {
          questions = [];
        }
      }
    }

    if (!isTeam && (project.gameType === "QUIZ" || project.gameType === "FILL_THE_BLANK")) {
      questions = questions.filter(q => q.level <= project.publishedLevelCount);
    }
    // Pemain tidak menerima kunci jawaban; jawaban dicek lewat /api/projects/:id/levels/:level/answer
    if (!isTeam) {
      if (project.gameType === "QUIZ") questions = questions.map(publicQuizQuestion);
      else if (project.gameType === "FILL_THE_BLANK") questions = questions.map(publicFtbQuestion);
      else if (project.gameType === "CROSSWORD") questions = publicCrosswordClues(questions);
    }

    let materiContentsData: any[] = [];
    let materialSectionsData: any[] = [];
    let materialGlossaryData: any[] = [];
    if (project.type === "MATERI") {
      if (project.materiType === "MANUAL") {
        materialSectionsData = await db.select().from(materialSections).where(eq(materialSections.projectId, Number(id))).orderBy(materialSections.sortOrder);
        materialGlossaryData = await db.select().from(materialGlossary).where(eq(materialGlossary.projectId, Number(id)));
      } else {
        materiContentsData = await db.select().from(materiContents).where(eq(materiContents.projectId, Number(id))).orderBy(materiContents.sortOrder);
      }
    }

    const history = await db.select({
      id: reviewsHistory.id,
      feedback: reviewsHistory.feedback,
      statusGiven: reviewsHistory.statusGiven,
      createdAt: reviewsHistory.createdAt,
      reviewerName: users.name,
      reviewerRole: users.role
    })
    .from(reviewsHistory)
    .leftJoin(users, eq(reviewsHistory.reviewerId, users.id))
    .where(eq(reviewsHistory.projectId, Number(id)))
    .orderBy(desc(reviewsHistory.createdAt));

    return { success: true, data: { ...project, questions, materiContents: materiContentsData, materialSections: materialSectionsData, materialGlossary: materialGlossaryData, history } };
  })
  // Update Status / Review
  .post("/:id/review", async ({ params: { id }, body, user }) => {
    const { statusGiven, feedback } = body as any;
    const projectId = Number(id);

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    // Game terbit yang sedang menambah level: alur review berjalan di levelReviewStatus, status proyek tetap PUBLISHED
    const isNewLevelReview = project.status === "PUBLISHED";
    const currentStatus = isNewLevelReview ? project.levelReviewStatus : project.status;
    if (!currentStatus) {
      return new Response(JSON.stringify({ error: "Tidak ada level baru yang sedang dikerjakan pada game ini." }), { status: 400 });
    }
    const subject = isNewLevelReview ? `level baru proyek "${project.title}"` : `proyek "${project.title}"`;

    let newStatus: string = currentStatus;
    let targetUserId = project.idPembuat;
    let notificationMsg = "";

    if (user.role === "PAKAR") {
      if (!["REVIEW_PAKAR", "REVISI_PAKAR"].includes(currentStatus)) {
        return new Response(JSON.stringify({ error: "Proyek tidak dalam antrean review Pakar" }), { status: 400 });
      }

      if (statusGiven === "ACCEPT") {
        newStatus = "ACCEPTED_PAKAR";
        targetUserId = 0; // Notify Ketua Tim (fetched below)
        notificationMsg = `Pakar telah menyetujui ${subject}. Silakan lakukan review akhir.`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_PAKAR";
        targetUserId = project.idPembuat;
        notificationMsg = `Pakar membutuhkan revisi pada ${subject}. Mohon cek feedback dari Pakar.`;
      }

      // If ACCEPT, notify Ketua Tim
      if (statusGiven === "ACCEPT") {
        const [ketuaTim] = await db.select().from(users).where(eq(users.role, "KETUA_TIM")).limit(1);
        targetUserId = ketuaTim?.id || 0;
      }
    } else if (user.role === "KETUA_TIM") {
      if (!["ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA"].includes(currentStatus)) {
        return new Response(JSON.stringify({ error: "Proyek belum disetujui Pakar atau tidak dalam antrean Ketua" }), { status: 400 });
      }

      if (statusGiven === "ACCEPT") {
        newStatus = "PUBLISHED";
        targetUserId = project.idPembuat;
        notificationMsg = `Selamat! ${isNewLevelReview ? "Level baru proyek" : "Proyek"} "${project.title}" telah di-publish oleh Ketua Tim.`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_KETUA";
        targetUserId = project.idPembuat;
        notificationMsg = `Ketua Tim membutuhkan revisi pada ${subject}. Mohon cek feedback.`;
      }
    } else if (user.role === "PEMBUAT_GAME" || user.role === "PEMBUAT_MATERI") {
      if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(currentStatus)) {
        return new Response(JSON.stringify({ error: "Hanya proyek Draft atau Revisi yang bisa dikirim" }), { status: 400 });
      }

      // Quiz & Fill the Blank: setiap level 1..N wajib berisi minimal satu soal
      if (project.gameType === "QUIZ" || project.gameType === "FILL_THE_BLANK") {
        const table = project.gameType === "QUIZ" ? questionBank : gameFillTheBlank;
        const rows = await db.select({ level: table.level }).from(table).where(eq(table.projectId, projectId));
        if (rows.length === 0) {
          return new Response(JSON.stringify({ error: "Minimal harus ada 1 soal sebelum dikirim." }), { status: 400 });
        }
        const missingLevel = findMissingLevel(rows.map(r => r.level));
        if (missingLevel !== null) {
          return new Response(JSON.stringify({ error: `Level ${missingLevel} belum berisi soal.` }), { status: 400 });
        }
      }

      // Word Search & TTS: setiap level 1..N wajib punya grid berisi minimal satu kata/clue
      if (project.gameType === "WORD_SEARCH" || project.gameType === "CROSSWORD") {
        const isWordSearch = project.gameType === "WORD_SEARCH";
        const itemName = isWordSearch ? "kata" : "clue";
        const rows = isWordSearch
          ? (await db.select({ level: gameWordSearch.level, items: gameWordSearch.words }).from(gameWordSearch).where(eq(gameWordSearch.projectId, projectId)))
          : (await db.select({ level: gameCrossword.level, items: gameCrossword.clues }).from(gameCrossword).where(eq(gameCrossword.projectId, projectId)));
        const filledLevels = rows.filter(r => {
          try { return JSON.parse(r.items).length > 0; } catch { return false; }
        }).map(r => r.level);
        if (filledLevels.length === 0) {
          return new Response(JSON.stringify({ error: `Minimal harus ada 1 ${itemName} yang disimpan sebelum dikirim.` }), { status: 400 });
        }
        const highestLevel = Math.max(...rows.map(r => r.level));
        for (let level = 1; level <= highestLevel; level++) {
          if (!filledLevels.includes(level)) {
            return new Response(JSON.stringify({ error: `Level ${level} belum berisi ${itemName}.` }), { status: 400 });
          }
        }
      }

      // Adventure: setiap level 1..N wajib berisi cerita yang lolos pemeriksa alur
      if (project.gameType === "ADVENTURE") {
        const rows = await db.select({ level: gameAdventureScenes.level }).from(gameAdventureScenes).where(eq(gameAdventureScenes.projectId, projectId));
        if (rows.length === 0) {
          return new Response(JSON.stringify({ error: "Cerita belum berisi scene." }), { status: 400 });
        }
        const highestLevel = Math.max(...rows.map(r => r.level));
        for (let level = Math.max(1, firstEditableLevel(project) ?? 1); level <= highestLevel; level++) {
          const errors = validateAdventure(await loadAdventureScenes(projectId, level), project.passPercentage);
          if (errors.length > 0) {
            return new Response(JSON.stringify({ error: `Level ${level}: ${errors[0]}${errors.length > 1 ? ` (dan ${errors.length - 1} masalah lain)` : ""}` }), { status: 400 });
          }
        }
      }

      // Level baru wajib benar-benar ada di atas level yang sudah terbit
      if (isNewLevelReview) {
        const highestLevel = await getHighestContentLevel(projectId, project.gameType);
        if (highestLevel <= project.publishedLevelCount) {
          return new Response(JSON.stringify({ error: `Belum ada level baru. Tambahkan minimal satu level di atas Level ${project.publishedLevelCount}.` }), { status: 400 });
        }
      }

      // Smart Routing: If this is a revision from Chairman, go back to Chairman.
      // Otherwise, go to Expert (Pakar).
      if (currentStatus === "REVISI_KETUA") {
        newStatus = "REVIEW_KETUA";
        const [ketuaTim] = await db.select().from(users).where(eq(users.role, "KETUA_TIM")).limit(1);
        targetUserId = ketuaTim?.id || 0;
        notificationMsg = `Pembuat Konten telah menyelesaikan revisi ${subject}. Silakan lakukan review akhir.`;
      } else {
        newStatus = "REVIEW_PAKAR";
        targetUserId = project.idPakar || 0;
        notificationMsg = `${isNewLevelReview ? "Level baru proyek" : "Proyek"} "${project.title}" siap untuk di-review oleh Pakar.`;
      }
    } else {
      return new Response(JSON.stringify({ error: "Akses Ditolak" }), { status: 403 });
    }

    if (newStatus !== currentStatus) {
      if (newStatus === "PUBLISHED") {
        // Terbit: semua level yang ada saat ini menjadi bisa dimainkan
        const publishedLevelCount = project.type === "GAME" ? await getHighestContentLevel(projectId, project.gameType) : 0;
        await db.update(projects).set({ status: "PUBLISHED", levelReviewStatus: null, publishedLevelCount }).where(eq(projects.id, projectId));
      } else if (isNewLevelReview) {
        await db.update(projects).set({ levelReviewStatus: newStatus as any }).where(eq(projects.id, projectId));
      } else {
        await db.update(projects).set({ status: newStatus as any }).where(eq(projects.id, projectId));
      }
    }
    
    if (targetUserId) {
      await db.insert(notifications).values({
        userId: targetUserId,
        message: notificationMsg,
        projectId
      });
    }

    await db.insert(reviewsHistory).values({
      projectId,
      reviewerId: user.id,
      feedback: feedback || "",
      statusGiven: statusGiven || "SUBMITTED"
    });

    return { success: true, message: "Status updated and review recorded" };
  })
  // Mulai menambah level baru pada game yang sudah terbit (Pembuat Game pemilik proyek)
  .post("/:id/new-level", async ({ params: { id }, user }) => {
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    if (user.role !== "PEMBUAT_GAME" || project.idPembuat !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    if (project.type !== "GAME" || project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Level baru hanya bisa ditambahkan pada game yang sudah terbit." }), { status: 400 });
    }
    if (project.levelReviewStatus) {
      return new Response(JSON.stringify({ error: "Level baru untuk game ini sedang dikerjakan." }), { status: 400 });
    }

    await db.update(projects).set({ levelReviewStatus: "DRAFT" }).where(eq(projects.id, projectId));

    const [ketuaTim] = await db.select().from(users).where(eq(users.role, "KETUA_TIM")).limit(1);
    if (ketuaTim) {
      await db.insert(notifications).values({
        userId: ketuaTim.id,
        message: `Pembuat Game mulai menambah level baru pada game "${project.title}" (saat ini ${project.publishedLevelCount} level terbit).`,
        projectId
      });
    }

    await db.insert(reviewsHistory).values({
      projectId,
      reviewerId: user.id,
      feedback: `Mulai menambah level baru (level terbit: ${project.publishedLevelCount})`,
      statusGiven: "NEW_LEVEL"
    });

    return { success: true, message: "Silakan tambahkan level baru. Level yang sudah terbit dikunci." };
  })
  // Save Question
  .post("/:id/questions", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const questions = body as any[]; // Array of questions from local storage/auto-save

    // Check project status
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    // Level yang sudah terbit dikunci: hanya level mulai minLevel yang diganti
    const minLevel = firstEditableLevel(project);
    if (minLevel === null) {
      return new Response(JSON.stringify({ error: "Project is read-only" }), { status: 403 });
    }
    // Hanya Pembuat yang ditugaskan di proyek ini yang boleh menyimpan soal
    if (project.idPembuat !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const editableQuestions = (questions || []).filter(q => toLevel(q.level) >= minLevel);

    if (project.gameType === "QUIZ") {
      // Delete existing and insert new (simple sync strategy for autosave)
      await db.delete(questionBank).where(and(eq(questionBank.projectId, projectId), gte(questionBank.level, minLevel)));

      if (editableQuestions.length > 0) {
        const qValues = editableQuestions.map(q => ({
          projectId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          score: q.difficulty === "MUDAH" ? 10 : q.difficulty === "SEDANG" ? 20 : q.difficulty === "SULIT" ? 50 : 30,
          explanation: q.explanation || "",
          level: toLevel(q.level)
        }));
        await db.insert(questionBank).values(qValues as any);
      }
    } else if (project.gameType === "FILL_THE_BLANK") {
      await db.delete(gameFillTheBlank).where(and(eq(gameFillTheBlank.projectId, projectId), gte(gameFillTheBlank.level, minLevel)));

      if (editableQuestions.length > 0) {
        const qValues = editableQuestions.map(q => ({
          projectId,
          fullText: q.fullText,
          answers: JSON.stringify(q.answers), // Array of { word, explanation }
          difficulty: q.difficulty,
          score: q.difficulty === "MUDAH" ? 10 : q.difficulty === "SEDANG" ? 20 : q.difficulty === "SULIT" ? 50 : 30,
          level: toLevel(q.level)
        }));
        await db.insert(gameFillTheBlank).values(qValues as any);

        // Logic for Bank Soal: Insert into gameQuestionsBank if not already there
        for (const q of editableQuestions) {
           await db.insert(gameQuestionsBank).values({
             content: q.fullText,
             category: project.category || "General",
             difficulty: q.difficulty as any
           }).onDuplicateKeyUpdate({
             set: { updatedAt: sql`NOW()` }
           });
        }
      }
    }

    return { success: true, message: "Saved to cloud" };
  })
  // AI Thumbnail Generation via Hugging Face FLUX
  .post("/generate-thumbnail", async ({ body }) => {
    const data = (body as any) || {};
    const cleanTitle = data.title || "Quiz Game";
    const prompt = `A stunning, high quality, modern game thumbnail for an educational game titled "${cleanTitle}". 3D render, vibrant colors, deep navy and electric gold accents, professional digital art.`;
    
    try {
      console.log("Generating thumbnail for:", cleanTitle);
      if (!process.env.HF_TOKEN) {
        console.error("HF_TOKEN is missing in .env!");
        throw new Error("MISSING_TOKEN");
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          headers: {
            Authorization: `Bearer ${process.env.HF_TOKEN.trim()}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({ 
            inputs: prompt,
            options: { wait_for_model: true }
          }),
          signal: controller.signal
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HF API error: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = (await response.json()) as any;
        if (json.error && json.error.includes("loading")) {
           throw new Error("MODEL_LOADING");
        }
        throw new Error(`HF JSON Error: ${JSON.stringify(json)}`);
      }

      const buffer = await response.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString("base64");
      const thumbnailUrl = `data:${contentType || 'image/png'};base64,${base64Image}`;
      
      return { success: true, thumbnailUrl };
    } catch (error: any) {
      console.error("HF Inference Error:", error.message);
      
      // Fallback to Pollinations via Server-side fetch to bypass browser blocks
      const cleanTitle = data.title || "Logos LAB Game";
      const fallbackPrompt = encodeURIComponent(`${cleanTitle} educational game thumbnail, modern 3d art style`);
      const fallbackUrl = `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=400&height=300&nologo=true`;
      
      try {
        console.log("Attempting fallback fetch for:", fallbackUrl);
        const fbRes = await fetch(fallbackUrl);
        if (fbRes.ok) {
          const fbBuffer = await fbRes.arrayBuffer();
          const fbBase64 = Buffer.from(fbBuffer).toString("base64");
          return { 
            success: true, 
            thumbnailUrl: `data:image/jpeg;base64,${fbBase64}`,
            isFallback: true 
          };
        }
      } catch (fbErr) {
        console.error("Fallback Fetch Error:", fbErr);
      }

      return { 
        success: false, 
        message: "Semua engine AI sedang sibuk. Silakan coba beberapa saat lagi." 
      };
    }
  })
  // Delete Project (Ketua Tim)
  .delete("/:id", async ({ params: { id }, user }) => {
    if (user.role !== "KETUA_TIM") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    // Hapus semua data yang merujuk proyek (termasuk data pemain) dalam satu transaksi,
    // agar tidak ada yang terhapus sebagian jika salah satu langkah gagal
    await db.transaction(async (tx) => {
      await tx.delete(notifications).where(eq(notifications.projectId, projectId));
      await tx.delete(reviewsHistory).where(eq(reviewsHistory.projectId, projectId));
      await tx.delete(projectChats).where(eq(projectChats.projectId, projectId));
      await tx.delete(userScores).where(eq(userScores.projectId, projectId));
      await tx.delete(achievements).where(eq(achievements.projectId, projectId));
      await tx.delete(materiReadProgress).where(eq(materiReadProgress.projectId, projectId));
      await tx.delete(quizDuels).where(eq(quizDuels.quizId, projectId));
      await tx.delete(userJournals).where(eq(userJournals.referenceId, projectId));
      await tx.delete(gamePlayLogs).where(eq(gamePlayLogs.projectId, projectId));
      await tx.delete(materialAccessLogs).where(eq(materialAccessLogs.projectId, projectId));
      await tx.delete(questionBank).where(eq(questionBank.projectId, projectId));
      await tx.delete(gameFillTheBlank).where(eq(gameFillTheBlank.projectId, projectId));
      await tx.delete(gameWordSearch).where(eq(gameWordSearch.projectId, projectId));
      await tx.delete(gameCrossword).where(eq(gameCrossword.projectId, projectId));
      await tx.delete(materiContents).where(eq(materiContents.projectId, projectId));
      await tx.delete(materialSections).where(eq(materialSections.projectId, projectId));
      await tx.delete(materialGlossary).where(eq(materialGlossary.projectId, projectId));
      await tx.delete(projects).where(eq(projects.id, projectId));
    });
    return { success: true, message: "Proyek berhasil dihapus" };
  })
  // Unpublish Project (Ketua Tim)
  .patch("/:id/unpublish", async ({ params: { id }, user }) => {
    if (user.role !== "KETUA_TIM") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    // Allow unpublish from any status that is not DRAFT/UNPUBLISHED
    if (project.status === "UNPUBLISHED" || project.status === "DRAFT") {
      return new Response(JSON.stringify({ error: "Proyek sudah dalam status DRAFT atau UNPUBLISHED" }), { status: 400 });
    }

    await db.update(projects).set({ status: "UNPUBLISHED", levelReviewStatus: null }).where(eq(projects.id, projectId));
    
    // Send notification to Pembuat Game
    await db.insert(notifications).values({
      userId: project.idPembuat,
      message: `Proyek "${project.title}" telah ditarik dari publikasi oleh Ketua Tim.`,
      projectId: project.id
    });

    return { success: true, message: "Proyek berhasil diunpublish" };
  })
  // Update Project Info (Ketua Tim - specifically for Edit button in DRAFT)
  .patch("/:id", async ({ params: { id }, body, user }) => {
    if (user.role !== "KETUA_TIM") return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    const projectId = Number(id);
    const { title, description, instructions, deadline, idPembuat, idPakar, gameType, thumbnailUrl, category } = body as any;

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    if (project.status !== "DRAFT") {
      return new Response(JSON.stringify({ error: "Hanya proyek DRAFT yang dapat diedit infonya" }), { status: 400 });
    }

    const { type, materiType } = body as any;

    const passPercentage = parsePassPercentage((body as any).passPercentage, project.passPercentage);
    if (passPercentage === null) {
      return new Response(JSON.stringify({ error: "Nilai minimal lulus harus berupa angka bulat 1–100" }), { status: 400 });
    }

    await db.update(projects).set({
      title,
      description,
      instructions,
      gameType,
      type: type || project.type,
      materiType: materiType || project.materiType,
      category: category || project.category,
      thumbnailUrl: thumbnailUrl || project.thumbnailUrl,
      deadline: deadline ? new Date(deadline) : project.deadline,
      idPembuat: idPembuat ? Number(idPembuat) : project.idPembuat,
      idPakar: idPakar ? Number(idPakar) : project.idPakar,
      passPercentage
    }).where(eq(projects.id, projectId));

    return { success: true, message: "Proyek berhasil diperbarui" };
  })
  .post("/:id/materi-content", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    if (project.type !== "MATERI") return new Response(JSON.stringify({ error: "Project is not MATERI" }), { status: 400 });

    // Validate RBAC & status
    if (user.role === "PEMBUAT_MATERI" && project.idPembuat !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
       return new Response(JSON.stringify({ error: "Cannot edit content outside draft/revision phases" }), { status: 400 });
    }

    const contents = body as any[]; // Array of contents
    
    // Delete existing and reinsert
    await db.delete(materiContents).where(eq(materiContents.projectId, projectId));
    
    if (contents && contents.length > 0) {
      const dataToInsert = contents.map((c: any, index: number) => ({
        projectId,
        contentType: c.contentType,
        fileUrl: c.fileUrl,
        fileName: c.fileName || null,
        fileSize: c.fileSize || null,
        sortOrder: index
      }));
      await db.insert(materiContents).values(dataToInsert);
    }
    
    return { success: true, message: "Konten materi berhasil disimpan" };
  })
  .get("/:id/materi-content", async ({ params: { id } }) => {
    const projectId = Number(id);
    const contents = await db.select().from(materiContents)
      .where(eq(materiContents.projectId, projectId))
      .orderBy(materiContents.sortOrder);
      
    return { success: true, data: contents };
  })
  .post("/:id/sections", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    if (project.type !== "MATERI") return new Response(JSON.stringify({ error: "Project is not MATERI" }), { status: 400 });

    if (user.role === "PEMBUAT_MATERI" && project.idPembuat !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
       return new Response(JSON.stringify({ error: "Cannot edit content outside draft/revision phases" }), { status: 400 });
    }

    const sections = body as any[];
    
    await db.delete(materialSections).where(eq(materialSections.projectId, projectId));
    
    if (sections && sections.length > 0) {
      const dataToInsert = sections.map((s: any, index: number) => ({
        projectId,
        subTitle: s.subTitle ? s.subTitle.replace(/[<>'"]/g, "") : "",
        content: s.content ? s.content.replace(/[<>]/g, "") : "",
        sortOrder: index
      }));
      await db.insert(materialSections).values(dataToInsert);
    }
    
    return { success: true, message: "Sections berhasil disimpan" };
  })
  .get("/:id/sections", async ({ params: { id } }) => {
    const projectId = Number(id);
    const sections = await db.select().from(materialSections)
      .where(eq(materialSections.projectId, projectId))
      .orderBy(materialSections.sortOrder);
    return { success: true, data: sections };
  })
  .post("/:id/glossary", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404 });
    if (project.type !== "MATERI") return new Response(JSON.stringify({ error: "Project is not MATERI" }), { status: 400 });

    if (user.role === "PEMBUAT_MATERI" && project.idPembuat !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
       return new Response(JSON.stringify({ error: "Cannot edit content outside draft/revision phases" }), { status: 400 });
    }

    const glossary = body as any[];
    
    await db.delete(materialGlossary).where(eq(materialGlossary.projectId, projectId));
    
    if (glossary && glossary.length > 0) {
      const dataToInsert = glossary.map((g: any) => ({
        projectId,
        word: g.word.substring(0, 255).replace(/[<>'"]/g, ""),
        definition: g.definition.substring(0, 2000).replace(/[<>'"]/g, "")
      }));
      await db.insert(materialGlossary).values(dataToInsert);
    }
    
    return { success: true, message: "Glossary berhasil disimpan" };
  })
  .get("/:id/glossary", async ({ params: { id } }) => {
    const projectId = Number(id);
    const glossary = await db.select().from(materialGlossary)
      .where(eq(materialGlossary.projectId, projectId));
    return { success: true, data: glossary };
  });
