import { Elysia } from "elysia";
import { userRoutes } from "./routes/users";

const app = new Elysia()
  .use(userRoutes)
  .listen(3000);

console.log(
  `🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`
);