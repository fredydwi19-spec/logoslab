import { Elysia } from "elysia";
import { staticPlugin } from "@elysiajs/static";
import { userRoutes } from "./routes/users";
import { db, pool } from "./db/db";

const app = new Elysia()
  .use(staticPlugin())
  .get("/", () => Bun.file("public/index.html"))
  .onError(({ code, error }) => {
    console.error(`[Error] ${code}:`, error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      status: 500,
      error: message || "Internal Server Error"
    };
  })
  .get("/health", async () => {
    try {
      await pool.query("SELECT 1");
      return { status: "ok", timestamp: new Date().toISOString() };
    } catch (e) {
      const err = e as Error;
      return new Response(
        JSON.stringify({ status: "error", message: err.message }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
  })
  .use(userRoutes)
  .listen(3000);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);