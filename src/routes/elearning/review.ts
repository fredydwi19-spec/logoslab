import { Elysia, t } from "elysia";
import { db } from "../../db/db";
import { projects, reviewsHistory } from "../../db/schema";
import { eq } from "drizzle-orm";

export const reviewRoute = new Elysia({ prefix: "/review" })
  .onBeforeHandle(({ user, set }) => {
    if (!user || (user as any).role !== "PAKAR") {
      set.status = 403;
      return { error: "Forbidden: Hanya Pakar yang dapat memberikan review." };
    }
  })
  .post("/", async ({ body, user }) => {
    const { projectId, feedback, statusGiven } = body;
    const reviewerId = Number((user as any).id);

    // Pastikan project ada dan statusnya REVIEW_PAKAR
    const project = await db.select().from(projects).where(eq(projects.id, projectId));
    if (project.length === 0) return { error: "Project tidak ditemukan" };
    if (project[0].status !== "REVIEW_PAKAR") return { error: "Status project bukan REVIEW_PAKAR" };

    // Update status project
    const newStatus = statusGiven === "ACCEPT" ? "ACCEPTED_PAKAR" : "REVISI_PAKAR";
    await db.update(projects).set({ status: newStatus }).where(eq(projects.id, projectId));

    // Masukkan ke history
    await db.insert(reviewsHistory).values({
      projectId,
      reviewerId,
      feedback,
      statusGiven
    });

    return { success: true, message: `Review disimpan, status menjadi ${newStatus}` };
  }, {
    body: t.Object({
      projectId: t.Number(),
      feedback: t.String(),
      statusGiven: t.Union([t.Literal("ACCEPT"), t.Literal("REVISI")])
    })
  });
