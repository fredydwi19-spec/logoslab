import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projects, questionBank, reviewsHistory, notifications, users, gameFillTheBlank, gameQuestionsBank } from "../db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const projectRoutes = new Elysia({ prefix: "/api/projects" })
  .onBeforeHandle(async ({ jwt, cookie }) => {
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
    const payload = await jwt.verify(auth.value as string);
    return { user: payload as any };
  })
  // Create Project (Ketua Tim)
  .post("/", async ({ body, user }) => {
    if (user.role !== "KETUA_TIM") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    const { title, description, instructions, gameType, deadline, idPembuat } = body as any;

    const [result] = await db.insert(projects).values({
      title,
      description,
      instructions,
      gameType,
      type: "GAME",
      deadline: deadline ? new Date(deadline) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      idPembuat: Number(idPembuat),
      status: "DRAFT"
    });

    // Send notification to Pembuat Game
    await db.insert(notifications).values({
      userId: Number(idPembuat),
      message: `Anda mendapat penugasan proyek game baru: ${title}`,
      projectId: result.insertId
    });

    return { success: true, projectId: result.insertId };
  })
  // Get Projects by Role
  .get("/", async ({ user }) => {
    let projectList = [];
    if (user.role === "PEMBUAT_GAME") {
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
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(id)));
    if (!project) {
      return new Response(JSON.stringify({ error: "Not Found" }), { status: 404 });
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

    return { success: true, data: { ...project, questions, history } };
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

    // Security: Only authorized roles can transition specific states
    if (user.role === "PAKAR") {
      if (!["DRAFT", "REVIEW_PAKAR", "REVISI_PAKAR"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Proyek tidak dalam antrean review Pakar" }), { status: 400 });
      }
      
      if (statusGiven === "ACCEPT") {
        newStatus = "ACCEPTED_PAKAR";
        notificationMsg = `Pakar telah menyetujui proyek: ${project.title}`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_PAKAR";
        notificationMsg = `Pakar memberikan revisi pada proyek: ${project.title}`;
      }
    } else if (user.role === "KETUA_TIM") {
      if (!["ACCEPTED_PAKAR", "REVIEW_KETUA", "REVISI_KETUA"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Proyek belum disetujui Pakar atau tidak dalam antrean Ketua" }), { status: 400 });
      }

      if (statusGiven === "ACCEPT") {
        newStatus = "PUBLISHED";
        notificationMsg = `Proyek ${project.title} telah di-publish!`;
      } else if (statusGiven === "REVISI") {
        newStatus = "REVISI_KETUA";
        notificationMsg = `Ketua Tim memberikan revisi pada proyek: ${project.title}`;
      }
    } else if (user.role === "PEMBUAT_GAME") {
      if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
        return new Response(JSON.stringify({ error: "Hanya proyek Draft atau Revisi yang bisa dikirim" }), { status: 400 });
      }
      
      // Smart Routing: If this is a revision from Chairman, go back to Chairman.
      // Otherwise, go to Expert (Pakar).
      if (project.status === "REVISI_KETUA") {
        newStatus = "REVIEW_KETUA";
      } else {
        newStatus = "REVIEW_PAKAR";
      }
      
      notificationMsg = `Pembuat Game telah mengirim proyek untuk di-review: ${project.title}`;
      targetUserId = newStatus === "REVIEW_KETUA" ? 1 : project.idPakar; // Notify Chairman (assuming ID 1 for now) or assigned Pakar
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
      feedback,
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
        const json = await response.json();
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
  });
