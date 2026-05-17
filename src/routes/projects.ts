import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, questionBank, reviewsHistory, notifications, users, gameFillTheBlank, gameQuestionsBank, gameWordSearch, gameCrossword, materiContents } from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";

export const projectRoutes = new Elysia({ prefix: "/api/projects" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
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

    if (!user && project.status !== "PUBLISHED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    let questions: any[] = [];
    if (project.gameType === "QUIZ") {
      questions = await db.select().from(questionBank).where(eq(questionBank.projectId, Number(id)));
    } else if (project.gameType === "FILL_THE_BLANK") {
      const qData = await db.select().from(gameFillTheBlank).where(eq(gameFillTheBlank.projectId, Number(id)));
      questions = qData.map(q => ({
        ...q,
        answers: JSON.parse(q.answers)
      }));
    } else if (project.gameType === "WORD_SEARCH") {
      const [wsData] = await db.select().from(gameWordSearch).where(eq(gameWordSearch.projectId, Number(id)));
      if (wsData && wsData.words) {
        try {
          questions = JSON.parse(wsData.words);
        } catch (e) {
          questions = [];
        }
      }
    } else if (project.gameType === "CROSSWORD") {
      const [cwData] = await db.select().from(gameCrossword).where(eq(gameCrossword.projectId, Number(id)));
      if (cwData && cwData.clues) {
        try {
          questions = JSON.parse(cwData.clues);
        } catch (e) {
          questions = [];
        }
      }
    }
    
    let materiContentsData: any[] = [];
    if (project.type === "MATERI") {
      materiContentsData = await db.select().from(materiContents).where(eq(materiContents.projectId, Number(id))).orderBy(materiContents.sortOrder);
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

    return { success: true, data: { ...project, questions, materiContents: materiContentsData, history } };
  })
  // Update Status / Review
  .post("/:id/review", async ({ params: { id }, body, user }) => {
    const { statusGiven, feedback } = body as any;
    const projectId = Number(id);

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });

    let newStatus = project.status;
    let targetUserId = project.idPembuat;
    let notificationMsg = "";

    if (user.role === "PAKAR") {
      if (!["REVIEW_PAKAR", "REVISI_PAKAR"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Proyek tidak dalam antrean review Pakar" }), { status: 400 });
      }
      
      if (statusGiven === "ACCEPT") {
        newStatus = "ACCEPTED_PAKAR";
        targetUserId = 0; // Notify Ketua Tim (fetched below)
        notificationMsg = `Pakar telah menyetujui proyek "${project.title}". Silakan lakukan review akhir.`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_PAKAR";
        targetUserId = project.idPembuat;
        notificationMsg = `Pakar membutuhkan revisi pada proyek "${project.title}". Mohon cek feedback dari Pakar.`;
      }

      // If ACCEPT, notify Ketua Tim
      if (statusGiven === "ACCEPT") {
        const [ketuaTim] = await db.select().from(users).where(eq(users.role, "KETUA_TIM")).limit(1);
        targetUserId = ketuaTim?.id || 0;
      }
    } else if (user.role === "KETUA_TIM") {
      if (!["ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Proyek belum disetujui Pakar atau tidak dalam antrean Ketua" }), { status: 400 });
      }

      if (statusGiven === "ACCEPT") {
        newStatus = "PUBLISHED";
        targetUserId = project.idPembuat;
        notificationMsg = `Selamat! Proyek "${project.title}" telah di-publish oleh Ketua Tim.`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_KETUA";
        targetUserId = project.idPembuat;
        notificationMsg = `Ketua Tim membutuhkan revisi pada proyek "${project.title}". Mohon cek feedback.`;
      }
    } else if (user.role === "PEMBUAT_GAME" || user.role === "PEMBUAT_MATERI") {
      if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Hanya proyek Draft atau Revisi yang bisa dikirim" }), { status: 400 });
      }
      
      // Smart Routing: If this is a revision from Chairman, go back to Chairman.
      // Otherwise, go to Expert (Pakar).
      if (project.status === "REVISI_KETUA") {
        newStatus = "REVIEW_KETUA";
        const [ketuaTim] = await db.select().from(users).where(eq(users.role, "KETUA_TIM")).limit(1);
        targetUserId = ketuaTim?.id || 0;
        notificationMsg = `Pembuat Konten telah menyelesaikan revisi proyek "${project.title}". Silakan lakukan review akhir.`;
      } else {
        newStatus = "REVIEW_PAKAR";
        targetUserId = project.idPakar || 0;
        notificationMsg = `Proyek "${project.title}" siap untuk di-review oleh Pakar.`;
      }
    } else {
      return new Response(JSON.stringify({ error: "Akses Ditolak" }), { status: 403 });
    }

    if (newStatus !== project.status) {
      await db.update(projects).set({ status: newStatus as any }).where(eq(projects.id, projectId));
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
  // Save Question
  .post("/:id/questions", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const questions = body as any[]; // Array of questions from local storage/auto-save

    // Check project status
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
      return new Response(JSON.stringify({ error: "Project is read-only" }), { status: 403 });
    }

    if (project.gameType === "QUIZ") {
      // Delete existing and insert new (simple sync strategy for autosave)
      await db.delete(questionBank).where(eq(questionBank.projectId, projectId));
      
      if (questions && questions.length > 0) {
        const qValues = questions.map(q => ({
          projectId,
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty,
          score: q.difficulty === "RENDAH" ? 10 : q.difficulty === "SEDANG" ? 20 : q.difficulty === "SULIT" ? 50 : 30,
          explanation: q.explanation || ""
        }));
        await db.insert(questionBank).values(qValues as any);
      }
    } else if (project.gameType === "FILL_THE_BLANK") {
      await db.delete(gameFillTheBlank).where(eq(gameFillTheBlank.projectId, projectId));

      if (questions && questions.length > 0) {
        const qValues = questions.map(q => ({
          projectId,
          fullText: q.fullText,
          answers: JSON.stringify(q.answers), // Array of { word, explanation }
          difficulty: q.difficulty,
          score: q.difficulty === "RENDAH" ? 10 : q.difficulty === "SEDANG" ? 20 : q.difficulty === "SULIT" ? 50 : 30,
        }));
        await db.insert(gameFillTheBlank).values(qValues as any);

        // Logic for Bank Soal: Insert into gameQuestionsBank if not already there
        for (const q of questions) {
           await db.insert(gameQuestionsBank).values({
             content: q.fullText,
             category: project.category || "General",
             difficulty: q.difficulty as any
           }).onDuplicateKeyUpdate({
             set: { updatedAt: new Date() }
           });
        }
      }
    }

    return { success: true, message: "Saved to cloud" };
  })
  // Submit Answer (User Gameplay)
  .post("/:id/submit", async ({ params: { id }, body, user }) => {
    const projectId = Number(id);
    const { questionId, userAnswers } = body as any; // userAnswers: Array<string> matching the placeholders

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
    if (!project) return new Response(JSON.stringify({ error: "Project Not Found" }), { status: 404 });

    if (project.gameType === "FILL_THE_BLANK") {
      const [question] = await db.select().from(gameFillTheBlank).where(eq(gameFillTheBlank.id, questionId));
      if (!question) return new Response(JSON.stringify({ error: "Question Not Found" }), { status: 404 });

      const correctAnswers = JSON.parse(question.answers) as Array<{ word: string, explanation: string }>;
      const results = correctAnswers.map((correct, index) => {
        const userAnswer = userAnswers[index] || "";
        const isCorrect = userAnswer.trim().toLowerCase() === correct.word.trim().toLowerCase();
        return {
          isCorrect,
          correctAnswer: correct.word,
          explanation: correct.explanation,
          userAnswer
        };
      });

      const allCorrect = results.every(r => r.isCorrect);
      const scoreEarned = allCorrect ? question.score : 0;

      // TODO: Accumulate score in user profile/project score if needed

      return {
        success: true,
        allCorrect,
        scoreEarned,
        details: results
      };
    } else if (project.gameType === "QUIZ") {
      const [question] = await db.select().from(questionBank).where(eq(questionBank.id, questionId));
      if (!question) return new Response(JSON.stringify({ error: "Question Not Found" }), { status: 404 });

      const isCorrect = userAnswers[0] === question.correctAnswer;
      const scoreEarned = isCorrect ? question.score : 0;

      return {
        success: true,
        isCorrect,
        scoreEarned,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
      };
    }

    return new Response(JSON.stringify({ error: "Unsupported Game Type" }), { status: 400 });
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

    // Delete dependent records first to avoid foreign key constraints
    await db.delete(notifications).where(eq(notifications.projectId, projectId));
    await db.delete(reviewsHistory).where(eq(reviewsHistory.projectId, projectId));
    await db.delete(questionBank).where(eq(questionBank.projectId, projectId));
    await db.delete(gameFillTheBlank).where(eq(gameFillTheBlank.projectId, projectId));
    await db.delete(gameWordSearch).where(eq(gameWordSearch.projectId, projectId));
    await db.delete(gameCrossword).where(eq(gameCrossword.projectId, projectId));
    await db.delete(materiContents).where(eq(materiContents.projectId, projectId));

    await db.delete(projects).where(eq(projects.id, projectId));
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

    await db.update(projects).set({ status: "UNPUBLISHED" }).where(eq(projects.id, projectId));
    
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
      idPakar: idPakar ? Number(idPakar) : project.idPakar
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
  });
