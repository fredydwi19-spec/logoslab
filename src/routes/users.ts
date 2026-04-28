import { Elysia, t } from "elysia";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    return await db.select().from(users);
  })
  .get("/:id", async ({ params: { id } }) => {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    return user || { message: "User not found" };
  })
  .post("/", async ({ body }) => {
    const result = await db.insert(users).values(body);
    return { id: result[0].insertId, ...body };
  }, {
    body: t.Object({
      name: t.String(),
      email: t.String({ format: "email" }),
    })
  })
  .put("/:id", async ({ params: { id }, body }) => {
    await db.update(users).set(body).where(eq(users.id, Number(id)));
    return { message: "User updated" };
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      email: t.Optional(t.String({ format: "email" })),
    })
  })
  .delete("/:id", async ({ params: { id } }) => {
    await db.delete(users).where(eq(users.id, Number(id)));
    return { message: "User deleted" };
  });
