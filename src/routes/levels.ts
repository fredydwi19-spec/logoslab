import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { projects, questionBank, gameFillTheBlank, gameWordSearch, gameCrossword, userScores } from "../db/schema";
import { eq, and, max } from "drizzle-orm";

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
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(id)));
    if (!project || project.type !== "GAME" || project.status !== "PUBLISHED") {
      set.status = 404;
      return { error: "Game tidak ditemukan" };
    }
    return { success: true, data: await buildProgress(project, user?.id ?? null) };
  })
  .post("/:id/levels/:level/finish", async ({ params: { id, level }, body, user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Silakan login untuk menyimpan skor dan membuka level berikutnya." };
    }
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(id)));
    if (!project || project.type !== "GAME" || project.status !== "PUBLISHED") {
      set.status = 404;
      return { error: "Game tidak ditemukan" };
    }

    const levelNumber = Number(level);
    const progress = await buildProgress(project, user.id);
    const target = progress.levels.find(l => l.level === levelNumber);
    if (!target) {
      set.status = 400;
      return { error: `Level ${level} belum terbit.` };
    }
    if (!target.unlocked) {
      set.status = 403;
      return { error: `Level ${levelNumber} masih terkunci. Selesaikan Level ${levelNumber - 1} dengan nilai minimal ${project.passPercentage}%.` };
    }

    const content = await loadLevelContent(project, levelNumber);
    const score = scoreAnswers(project, content, body);
    await db.insert(userScores).values({ userId: user.id, projectId: project.id, score, level: levelNumber });

    const percent = content.maxScore > 0 ? Math.round((score * 100) / content.maxScore) : 0;
    const passed = isPassed(score, content.maxScore, project.passPercentage);
    const nextLevel = progress.levels.find(l => l.level === levelNumber + 1);
    return {
      success: true,
      score,
      maxScore: content.maxScore,
      percent,
      passPercentage: project.passPercentage,
      passed,
      bestScore: Math.max(score, target.bestScore),
      nextLevel: nextLevel && (passed || target.passed) ? levelNumber + 1 : null,
      isLastLevel: !nextLevel,
      upcoming: progress.upcoming,
    };
  });
