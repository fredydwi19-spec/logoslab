import { Elysia, t } from "elysia";
import { db } from "../../db/db";
import { tags } from "../../db/schema";
import { eq } from "drizzle-orm";

export const tagsRoute = new Elysia({ prefix: "/tags" })
  .onBeforeHandle(({ user, set }) => {
    if (!user || !["KETUA_TIM", "PEMBUAT_MATERI", "PEMBUAT_GAME"].includes((user as any).role)) {
      set.status = 403;
      return { error: "Forbidden: Akses ditolak untuk role ini." };
    }
  })
  .get("/", async () => {
    const allTags = await db.select().from(tags);
    return { success: true, data: allTags };
  })
  .post("/", async ({ body }) => {
    const { namaTag } = body;
    const result = await db.insert(tags).values({ namaTag });
    return { success: true, data: { id: result[0].insertId, namaTag } };
  }, {
    body: t.Object({
      namaTag: t.String({ minLength: 1, maxLength: 255 })
    })
  })
  .delete("/:id", async ({ params }) => {
    await db.delete(tags).where(eq(tags.id, Number(params.id)));
    return { success: true, message: "Tag berhasil dihapus" };
  }, {
    params: t.Object({
      id: t.String()
    })
  });
