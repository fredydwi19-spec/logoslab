import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq, sql } from "drizzle-orm";

// Jangan pernah mengirim hash password ke browser
const withoutPassword = ({ password, ...rest }: typeof users.$inferSelect) => rest;

export const userRoutes = new Elysia({ prefix: "/users" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  // Publik: hanya jumlah pengguna, untuk penghitung di landing page
  .get("/count", async () => {
    const [row] = await db.select({ count: sql<number>`count(*)` }).from(users);
    return { count: Number(row?.count ?? 0) };
  })
  // Semua route di bawah ini hanya untuk Ketua Tim
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
    if (user.role !== "KETUA_TIM") {
      set.status = 403;
      return { error: "Forbidden" };
    }
  })
  .get("/", async () => {
    const data = await db.select().from(users);
    return { data: data.map(withoutPassword), count: data.length };
  })
  .get("/:id", async ({ params: { id } }) => {
    const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
    return user ? withoutPassword(user) : { message: "User not found" };
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
