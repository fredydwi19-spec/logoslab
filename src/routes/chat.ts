import { Elysia, t } from "elysia";
import { db } from "../db/db";
import { projectChats, users, projects } from "../db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import { callGemini } from "./ai";

// Hanya Ketua Tim serta Pembuat dan Pakar yang ditugaskan di proyek yang boleh ikut diskusi
async function isProjectMember(user: any, projectId: number) {
  if (user.role === "KETUA_TIM") return true;
  const [project] = await db.select({ idPembuat: projects.idPembuat, idPakar: projects.idPakar })
    .from(projects)
    .where(eq(projects.id, projectId));
  return !!project && (project.idPembuat === user.id || project.idPakar === user.id);
}

async function getChatProjectId(chatId: number) {
  const [chat] = await db.select({ projectId: projectChats.projectId })
    .from(projectChats)
    .where(eq(projectChats.id, chatId));
  return chat?.projectId ?? null;
}

export const chatRoutes = new Elysia({ prefix: "/api/chats" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .patch("/:chatId/convert-to-task", async ({ params, jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (!auth?.value) {
      set.status = 401;
      return "Unauthorized";
    }
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) {
      set.status = 401;
      return "Unauthorized";
    }

    const chatId = Number(params.chatId);
    const projectId = await getChatProjectId(chatId);
    if (projectId === null) {
      set.status = 404;
      return "Not Found";
    }
    if (!["PAKAR", "KETUA_TIM"].includes(payload.role) || !(await isProjectMember(payload, projectId))) {
      set.status = 403;
      return "Forbidden";
    }

    await db.update(projectChats)
      .set({ isActionable: true })
      .where(eq(projectChats.id, chatId));

    return { success: true };
  })
  .patch("/:chatId/toggle-resolve", async ({ params, body, jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (!auth?.value) {
      set.status = 401;
      return "Unauthorized";
    }
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) {
      set.status = 401;
      return "Unauthorized";
    }

    const { isResolved } = body as { isResolved: boolean };
    const chatId = Number(params.chatId);
    const projectId = await getChatProjectId(chatId);
    if (projectId === null) {
      set.status = 404;
      return "Not Found";
    }
    if (!(await isProjectMember(payload, projectId))) {
      set.status = 403;
      return "Forbidden";
    }

    await db.update(projectChats)
      .set({ isResolved: isResolved })
      .where(eq(projectChats.id, chatId));

    return { success: true };
  });

export const projectChatRoutes = new Elysia({ prefix: "/api/projects" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
    })
  )
  .get("/:id/chats", async ({ params, query, jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (!auth?.value) {
      set.status = 401;
      return "Unauthorized";
    }
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) {
      set.status = 401;
      return "Unauthorized";
    }

    const projectId = Number(params.id);
    if (!(await isProjectMember(payload, projectId))) {
      set.status = 403;
      return "Forbidden";
    }

    const contextType = (query.contextType || "GENERAL") as "GENERAL" | "QUESTION";
    const contextTargetId = query.contextTargetId ? Number(query.contextTargetId) : null;

    let condition = and(
      eq(projectChats.projectId, projectId),
      eq(projectChats.contextType, contextType)
    );

    if (contextTargetId) {
      condition = and(condition, eq(projectChats.contextTargetId, contextTargetId));
    }

    const chatsData = await db.select({
      id: projectChats.id,
      projectId: projectChats.projectId,
      senderId: projectChats.senderId,
      contextType: projectChats.contextType,
      contextTargetId: projectChats.contextTargetId,
      message: projectChats.message,
      isActionable: projectChats.isActionable,
      isResolved: projectChats.isResolved,
      createdAt: projectChats.createdAt,
      senderName: users.name,
      senderRole: users.role,
      senderAvatar: users.avatarUrl
    }).from(projectChats)
      .innerJoin(users, eq(projectChats.senderId, users.id))
      .where(condition)
      .orderBy(asc(projectChats.createdAt));

    return chatsData;
  })
  .post("/:id/chats", async ({ params, body, jwt, cookie, set }) => {
    const auth = cookie.auth;
    if (!auth?.value) {
      set.status = 401;
      return "Unauthorized";
    }
    const payload: any = await jwt.verify(auth.value as string);
    if (!payload) {
      set.status = 401;
      return "Unauthorized";
    }

    const projectId = Number(params.id);
    if (!(await isProjectMember(payload, projectId))) {
      set.status = 403;
      return "Forbidden";
    }

    const { message, contextType = "GENERAL", contextTargetId = null } = body as any;

    if (!message) {
      set.status = 400;
      return "Message is required";
    }

    // Insert user message
    const [inserted] = await db.insert(projectChats).values({
      projectId,
      senderId: payload.id,
      contextType,
      contextTargetId,
      message,
    });

    const isAiRequest = message.trim().startsWith("@LogosAI");

    if (isAiRequest) {
      // Find logos ai user ID (or fallback to an imaginary ID or generic AI response without a real user ID). 
      // But senderId references users(id). We should find a user with role PAKAR or USER? Let's just create a system user or use the first user? No, LogosAI needs a user ID. 
      // Actually, wait, senderId references users.id. Do we have a LogosAI user? We probably need to check if there is one.
      // Wait, let's just make the senderId the user's ID for now, but prefix with LogoAI, OR create an AI user on the fly.
      let aiUser = await db.select().from(users).where(eq(users.username, "logos_ai"));
      if (aiUser.length === 0) {
        // Create an AI user
        await db.insert(users).values({
          name: "Logos AI",
          email: "logos_ai@system.local",
          username: "logos_ai",
          role: "PAKAR", // or whatever
          isVerified: true,
          avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=LogosAI"
        });
        aiUser = await db.select().from(users).where(eq(users.username, "logos_ai"));
      }

      const prompt = message.replace("@LogosAI", "").trim();
      
      const aiSender = aiUser[0];
      if (!aiSender) {
        set.status = 500;
        return "Logos AI user could not be created";
      }

      let aiResponseText = "Mohon maaf, saat ini AI sedang tidak tersedia.";
      try {
        aiResponseText = await callGemini(
          "Sebagai asisten Logos AI dalam platform LogosLab yang berfokus pada Theologi, mohon jawab pertanyaan dengan bahasa Indonesia yang ramah, ringkas dan membantu. Konteks: Project chat.",
          prompt
        );
      } catch(e) {
         console.error("Error calling Gemini:", e);
      }

      await db.insert(projectChats).values({
        projectId,
        senderId: aiSender.id,
        contextType,
        contextTargetId,
        message: aiResponseText,
      });
    }

    return { success: true };
  });
