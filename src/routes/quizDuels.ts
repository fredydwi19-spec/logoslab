import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users, projects, quizDuels } from "../db/schema";
import { eq, or, desc, sql } from "drizzle-orm";

export const quizDuelsRoutes = new Elysia({ prefix: "/api/duels" })
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
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  })
  .post("/create", async ({ body, user }) => {
    const { quizId, score, timeInSeconds, questionIds } = body;
    const duelId = crypto.randomUUID();
    
    await db.insert(quizDuels).values({
      id: duelId,
      challengerId: user.id as number,
      quizId,
      questionIds: JSON.stringify(questionIds),
      challengerScore: score,
      challengerTimeSec: timeInSeconds,
      status: "WAITING_OPPONENT",
    });

    return {
      success: true,
      duelId,
      shareUrl: `/duel/${duelId}`
    };
  }, {
    body: t.Object({
      quizId: t.Number(),
      score: t.Number(),
      timeInSeconds: t.Number(),
      questionIds: t.Array(t.Number())
    })
  })
  .get("/my-duels", async ({ user }) => {
    const userId = user.id as number;
    const duels = await db.select({
      id: quizDuels.id,
      status: quizDuels.status,
      quizTitle: projects.title,
      challengerId: quizDuels.challengerId,
      opponentId: quizDuels.opponentId,
      winnerId: quizDuels.winnerId,
      challengerScore: quizDuels.challengerScore,
      opponentScore: quizDuels.opponentScore,
      createdAt: quizDuels.createdAt
    })
    .from(quizDuels)
    .innerJoin(projects, eq(quizDuels.quizId, projects.id))
    .where(or(eq(quizDuels.challengerId, userId), eq(quizDuels.opponentId, userId)))
    .orderBy(desc(quizDuels.createdAt));
    
    return { success: true, data: duels };
  })
  .get("/:id", async ({ params }) => {
    const { id } = params;
    const [duel] = await db.select({
      id: quizDuels.id,
      quizId: quizDuels.quizId,
      questionIds: quizDuels.questionIds,
      status: quizDuels.status,
      challengerId: quizDuels.challengerId,
      opponentId: quizDuels.opponentId,
      winnerId: quizDuels.winnerId,
      challengerScore: quizDuels.challengerScore,
      challengerTimeSec: quizDuels.challengerTimeSec,
      opponentScore: quizDuels.opponentScore,
      opponentTimeSec: quizDuels.opponentTimeSec,
      quizTitle: projects.title,
    })
    .from(quizDuels)
    .innerJoin(projects, eq(quizDuels.quizId, projects.id))
    .where(eq(quizDuels.id, id));

    if (!duel) {
      return { success: false, error: "Duel not found" };
    }

    const [challenger] = await db.select({ name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, duel.challengerId));
    let opponent = null;
    let winner = null;
    if (duel.opponentId) {
      const [opp] = await db.select({ name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, duel.opponentId));
      opponent = opp;
    }
    if (duel.winnerId) {
      const [win] = await db.select({ name: users.name, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, duel.winnerId));
      winner = win;
    }

    return {
      success: true,
      data: {
        ...duel,
        challenger,
        opponent,
        winner
      }
    };
  })
  .post("/:id/submit", async ({ params, body, user }) => {
    const { id } = params;
    const { score, timeInSeconds } = body;
    const userId = user.id as number;

    const [duel] = await db.select().from(quizDuels).where(eq(quizDuels.id, id));
    if (!duel) return { success: false, error: "Duel not found" };
    if (duel.status === "COMPLETED") return { success: false, error: "Duel already completed" };
    if (duel.challengerId === userId) return { success: false, error: "You cannot play against yourself" };

    let winnerId = null;
    const chalScore = duel.challengerScore || 0;
    const chalTime = duel.challengerTimeSec || 0;
    
    if (score > chalScore) {
      winnerId = userId;
    } else if (score < chalScore) {
      winnerId = duel.challengerId;
    } else {
      if (timeInSeconds < chalTime) {
        winnerId = userId;
      } else if (timeInSeconds > chalTime) {
        winnerId = duel.challengerId;
      }
    }

    await db.update(quizDuels).set({
      opponentId: userId,
      opponentScore: score,
      opponentTimeSec: timeInSeconds,
      status: "COMPLETED",
      winnerId
    }).where(eq(quizDuels.id, id));

    // +100 XP to winner
    if (winnerId) {
      await db.execute(sql`UPDATE users SET total_xp = total_xp + 100 WHERE id = ${winnerId}`);
    }

    return {
      success: true,
      message: "Duel completed",
      winnerId
    };
  }, {
    body: t.Object({
      score: t.Number(),
      timeInSeconds: t.Number()
    })
  });
