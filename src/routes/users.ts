import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const userRoutes = new Elysia({ prefix: "/users" })
  .get("/", async () => {
    try {
      const data = await db.select().from(users);
      return { data, count: data.length };
    } catch (error) {
      throw error; // Will be caught by global error handler
    }
  })
  .get("/:id", async ({ params: { id } }) => {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    return user || { message: "User not found" };
  })
  .post("/", async ({ body, set }) => {
    try {
      const result = await db.insert(users).values(body);
      const insertedId = result[0].insertId;
      return { data: { id: insertedId, ...body }, message: "User created" };
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        set.status = 409;
        return { error: "Email already exists" };
      }
      throw error;
    }
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
