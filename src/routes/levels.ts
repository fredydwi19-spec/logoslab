import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { projects, questionBank, gameFillTheBlank, gameWordSearch, gameCrossword, userScores, levelAttempts } from "../db/schema";
import { eq, and, max, isNull } from "drizzle-orm";
import { publicQuizQuestion, publicFtbQuestion } from "../utils/level";

type Project = typeof projects.$inferSelect;

// Isi satu level game, dipakai untuk menghitung nilai maksimal dan menilai jawaban
async function loadLevelContent(project: Project, level: number) {
  const byLevel = <T extends typeof questionBank | typeof gameFillTheBlank | typeof gameWordSearch | typeof gameCrossword>(table: T) =>
    and(eq(table.projectId, project.id), eq(table.level, level));

  if (project.gameType === "QUIZ") {
    const questions = await db.select().from(questionBank).where(byLevel(questionBank));
    return { maxScore: questions.reduce((sum, q) => sum + q.score, 0), questions };
  }
  if (project.gameType === "FILL_THE_BLANK") {
    const questions = await db.select().from(gameFillTheBlank).where(byLevel(gameFillTheBlank));
    return { maxScore: questions.reduce((sum, q) => sum + q.score, 0), questions };
  }
  if (project.gameType === "WORD_SEARCH") {
    const [row] = await db.select().from(gameWordSearch).where(byLevel(gameWordSearch));
    return { maxScore: row?.score ?? 0, row };
  }
  if (project.gameType === "CROSSWORD") {
    const [row] = await db.select().from(gameCrossword).where(byLevel(gameCrossword));
    return { maxScore: row?.score ?? 0, row };
  }
  return { maxScore: 0 };
}

const normalize = (text: unknown) => String(text ?? "").trim().toUpperCase();

// Skor dihitung di server dari jawaban pemain, bukan dari angka yang dikirim browser
function scoreAnswers(project: Project, content: Awaited<ReturnType<typeof loadLevelContent>>, body: any): number {
  if (project.gameType === "QUIZ" && "questions" in content) {
    const answers = body?.answers ?? {};
    return (content.questions as (typeof questionBank.$inferSelect)[])
      .filter(q => normalize(answers[q.id]) === q.correctAnswer)
      .reduce((sum, q) => sum + q.score, 0);
  }
  if (project.gameType === "FILL_THE_BLANK" && "questions" in content) {
    const answers = body?.answers ?? {};
    return (content.questions as (typeof gameFillTheBlank.$inferSelect)[])
      .filter(q => {
        const expected = JSON.parse(q.answers) as { word: string }[];
        const given = Array.isArray(answers[q.id]) ? answers[q.id] : [];
        return expected.length > 0 && expected.every((a, i) => normalize(given[i]) === normalize(a.word));
      })
      .reduce((sum, q) => sum + q.score, 0);
  }
  if (project.gameType === "WORD_SEARCH" && "row" in content && content.row) {
    const row = content.row as typeof gameWordSearch.$inferSelect;
    const words = (JSON.parse(row.words) as { word: string }[]).map(w => normalize(w.word)).filter(Boolean);
    const found = new Set((Array.isArray(body?.foundWords) ? body.foundWords : []).map(normalize));
    const foundCount = words.filter(w => found.has(w)).length;
    return words.length ? Math.round(row.score * foundCount / words.length) : 0;
  }
  if (project.gameType === "CROSSWORD" && "row" in content && content.row) {
    const row = content.row as typeof gameCrossword.$inferSelect;
    const clues = JSON.parse(row.clues) as { answer: string }[];
    const answers = body?.answers ?? {};
    const solvedCount = clues.filter((c, i) => normalize(c.answer) !== "" && normalize(answers[i]) === normalize(c.answer)).length;
    return clues.length ? Math.round(row.score * solvedCount / clues.length) : 0;
  }
  return 0;
}

async function bestScore(userId: number, projectId: number, level: number): Promise<number> {
  const [row] = await db.select({ best: max(userScores.score) }).from(userScores)
    .where(and(eq(userScores.userId, userId), eq(userScores.projectId, projectId), eq(userScores.level, level)));
  return row?.best ?? 0;
}

const isPassed = (score: number, maxScore: number, passPercentage: number) =>
  maxScore > 0 && (score * 100) / maxScore >= passPercentage;

// Peta level untuk pemain: hanya level yang sudah terbit. Level 1 selalu terbuka; level berikutnya terbuka jika level sebelumnya lulus.
async function buildProgress(project: Project, userId: number | null) {
  const levels: { level: number; maxScore: number; bestScore: number; percent: number; passed: boolean; unlocked: boolean }[] = [];
  for (let level = 1; level <= project.publishedLevelCount; level++) {
    const { maxScore } = await loadLevelContent(project, level);
    const best = userId ? await bestScore(userId, project.id, level) : 0;
    const previous = levels[level - 2];
    levels.push({
      level,
      maxScore,
      bestScore: best,
      percent: maxScore > 0 ? Math.round((best * 100) / maxScore) : 0,
      passed: isPassed(best, maxScore, project.passPercentage),
      unlocked: level === 1 || (userId !== null && !!previous?.passed),
    });
  }
  return { passPercentage: project.passPercentage, levels, upcoming: !!project.levelReviewStatus, loggedIn: userId !== null };
}

async function loadPublishedGame(projectId: number): Promise<Project | null> {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId));
  return project && project.type === "GAME" && project.status === "PUBLISHED" ? project : null;
}

// Sesi main yang masih berjalan dan milik pemain ini (pengunjung tanpa login: sesi tanpa user)
async function loadOpenAttempt(attemptId: string, projectId: number, level: number, userId: number | null) {
  const project = await loadPublishedGame(projectId);
  if (!project) return { status: 404, error: "Game tidak ditemukan" } as const;
  const [attempt] = await db.select().from(levelAttempts).where(and(
    eq(levelAttempts.id, attemptId),
    eq(levelAttempts.projectId, projectId),
    eq(levelAttempts.level, level),
    userId === null ? isNull(levelAttempts.userId) : eq(levelAttempts.userId, userId),
  ));
  if (!attempt) return { status: 404, error: "Sesi main tidak ditemukan. Mulai ulang level ini." } as const;
  if (attempt.finishedAt) return { status: 400, error: "Sesi main ini sudah selesai. Mulai ulang level untuk bermain lagi." } as const;
  return { project, attempt };
}

export const levelRoutes = new Elysia({ prefix: "/api/projects" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })
  .get("/:id/progress", async ({ params: { id }, user, set }) => {
    const project = await loadPublishedGame(Number(id));
    if (!project) {
      set.status = 404;
      return { error: "Game tidak ditemukan" };
    }
    return { success: true, data: await buildProgress(project, user?.id ?? null) };
  })
  // Mulai satu level: membuat sesi main dan mengirim soal tanpa kunci jawaban
  .post("/:id/levels/:level/start", async ({ params: { id, level }, user, set }) => {
    const project = await loadPublishedGame(Number(id));
    if (!project) {
      set.status = 404;
      return { error: "Game tidak ditemukan" };
    }
    const levelNumber = Number(level);
    const progress = await buildProgress(project, user?.id ?? null);
    const target = progress.levels.find(l => l.level === levelNumber);
    if (!target) {
      set.status = 400;
      return { error: `Level ${level} belum terbit.` };
    }
    if (!target.unlocked) {
      set.status = 403;
      return { error: user ? `Level ${levelNumber} masih terkunci. Selesaikan Level ${levelNumber - 1} dengan nilai minimal ${project.passPercentage}%.` : "Silakan login untuk membuka level berikutnya." };
    }

    const attemptId = crypto.randomUUID();
    await db.insert(levelAttempts).values({ id: attemptId, userId: user?.id ?? null, projectId: project.id, level: levelNumber, answers: "{}" });

    const content = await loadLevelContent(project, levelNumber);
    let questions: unknown[] = [];
    if (project.gameType === "QUIZ" && "questions" in content) {
      questions = (content.questions as (typeof questionBank.$inferSelect)[]).map(publicQuizQuestion);
    } else if (project.gameType === "FILL_THE_BLANK" && "questions" in content) {
      questions = (content.questions as (typeof gameFillTheBlank.$inferSelect)[]).map(publicFtbQuestion);
    }
    return { success: true, attemptId, level: levelNumber, maxScore: content.maxScore, questions };
  })
  // Cek satu jawaban. Quiz & FTB: hanya jawaban pertama yang dicatat. TTS: boleh mencoba lagi sampai benar.
  .post("/:id/levels/:level/answer", async ({ params: { id, level }, body, user, set }) => {
    const data = (body ?? {}) as any;
    const session = await loadOpenAttempt(String(data.attemptId ?? ""), Number(id), Number(level), user?.id ?? null);
    if ("error" in session) {
      set.status = session.status;
      return { error: session.error };
    }
    const { project, attempt } = session;
    const content = await loadLevelContent(project, attempt.level);
    const answers = JSON.parse(attempt.answers) as Record<string, unknown>;
    const saveAnswers = () => db.update(levelAttempts).set({ answers: JSON.stringify(answers) }).where(eq(levelAttempts.id, attempt.id));

    if (project.gameType === "QUIZ" && "questions" in content) {
      const question = (content.questions as (typeof questionBank.$inferSelect)[]).find(q => q.id === Number(data.questionId));
      if (!question) {
        set.status = 404;
        return { error: "Soal tidak ditemukan di level ini." };
      }
      if (!(question.id in answers)) {
        answers[question.id] = normalize(data.answer);
        await saveAnswers();
      }
      const isCorrect = answers[question.id] === question.correctAnswer;
      return { success: true, isCorrect, scoreEarned: isCorrect ? question.score : 0, correctAnswer: question.correctAnswer, explanation: question.explanation };
    }

    if (project.gameType === "FILL_THE_BLANK" && "questions" in content) {
      const question = (content.questions as (typeof gameFillTheBlank.$inferSelect)[]).find(q => q.id === Number(data.questionId));
      if (!question) {
        set.status = 404;
        return { error: "Soal tidak ditemukan di level ini." };
      }
      if (!(question.id in answers)) {
        answers[question.id] = (Array.isArray(data.answer) ? data.answer : []).map((a: unknown) => String(a ?? ""));
        await saveAnswers();
      }
      const given = answers[question.id] as string[];
      const expected = JSON.parse(question.answers) as { word: string; explanation: string }[];
      const details = expected.map((a, i) => ({
        isCorrect: normalize(given[i]) === normalize(a.word),
        correctAnswer: a.word,
        explanation: a.explanation,
        userAnswer: given[i] ?? "",
      }));
      const allCorrect = details.length > 0 && details.every(d => d.isCorrect);
      return { success: true, allCorrect, scoreEarned: allCorrect ? question.score : 0, details };
    }

    if (project.gameType === "CROSSWORD" && "row" in content && content.row) {
      const clues = JSON.parse((content.row as typeof gameCrossword.$inferSelect).clues) as { answer: string; explanation?: string }[];
      const clueIndex = Number(data.clueIndex);
      const clue = clues[clueIndex];
      if (!clue) {
        set.status = 404;
        return { error: "Pertanyaan TTS tidak ditemukan di level ini." };
      }
      const isCorrect = normalize(clue.answer) !== "" && normalize(data.answer) === normalize(clue.answer);
      if (!isCorrect) return { success: true, isCorrect: false };
      answers[clueIndex] = normalize(clue.answer);
      await saveAnswers();
      return { success: true, isCorrect: true, answer: clue.answer, explanation: clue.explanation ?? "" };
    }

    set.status = 400;
    return { error: "Jenis game ini tidak memakai cek jawaban per soal." };
  })
  // Akhir level: nilai dihitung dari jawaban yang tercatat di sesi. Pemain yang login skornya disimpan.
  .post("/:id/levels/:level/finish", async ({ params: { id, level }, body, user, set }) => {
    const data = (body ?? {}) as any;
    const session = await loadOpenAttempt(String(data.attemptId ?? ""), Number(id), Number(level), user?.id ?? null);
    if ("error" in session) {
      set.status = session.status;
      return { error: session.error };
    }
    const { project, attempt } = session;
    const answers = JSON.parse(attempt.answers) as Record<string, unknown>;
    // Word Search: daftar kata memang terlihat oleh pemain, jadi kata yang ditemukan dikirim saat selesai
    const foundWords = Array.isArray(data.foundWords) ? data.foundWords.map((w: unknown) => String(w ?? "")) : [];
    if (project.gameType === "WORD_SEARCH") answers.foundWords = foundWords;

    const content = await loadLevelContent(project, attempt.level);
    const score = scoreAnswers(project, content, { answers, foundWords });
    await db.update(levelAttempts)
      .set({ answers: JSON.stringify(answers), score, finishedAt: new Date() })
      .where(eq(levelAttempts.id, attempt.id));

    const percent = content.maxScore > 0 ? Math.round((score * 100) / content.maxScore) : 0;
    const passed = isPassed(score, content.maxScore, project.passPercentage);
    const result = { success: true, attemptId: attempt.id, score, maxScore: content.maxScore, percent, passPercentage: project.passPercentage, passed };
    if (!user) return { ...result, needLogin: true };

    const before = await buildProgress(project, user.id);
    const target = before.levels.find(l => l.level === attempt.level);
    await db.insert(userScores).values({ userId: user.id, projectId: project.id, score, level: attempt.level });
    const nextLevel = before.levels.find(l => l.level === attempt.level + 1);
    return {
      ...result,
      bestScore: Math.max(score, target?.bestScore ?? 0),
      nextLevel: nextLevel && (passed || target?.passed) ? attempt.level + 1 : null,
      isLastLevel: !nextLevel,
      upcoming: before.upcoming,
    };
  });
