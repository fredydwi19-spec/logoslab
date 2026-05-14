import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

// ── Helper: Build system-aware prompt ──────────────────────────────────────
function buildSystemPrompt(context: string): string {
  return `Kamu adalah Logos AI Assistant, asisten cerdas untuk platform Logos LAB — platform pembelajaran Alkitab interaktif berbasis game edukatif.
Platform ini digunakan oleh tim kolaborasi yang terdiri dari Ketua Tim, Pembuat Game, dan Pakar Teologi.
Saat ini user berada di halaman: ${context}.
Berikan jawaban yang singkat, jelas, dan relevan dengan konteks platform Logos LAB.
Jika pertanyaan di luar konteks platform, tetap bantu dengan sopan namun arahkan kembali ke topik Logos LAB.
Balas selalu dalam Bahasa Indonesia.`;
}

// ── Helper: Sanitize user input ────────────────────────────────────────────
function sanitizeMessage(text: string): string {
  // Strip HTML tags to prevent injection
  return text.replace(/<[^>]*>/g, "").trim();
}

// ── Helper: Call Gemini API ────────────────────────────────────────────
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.status} — ${errText}`);
  }

  const data = await res.json() as any;

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text.trim();
  }

  throw new Error("Unexpected response structure from Gemini API");
}

// ── Route Definition ───────────────────────────────────────────────────────
export const aiRoutes = new Elysia({ prefix: "/api/ai" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET || "super-secret-key",
    })
  )
  .post("/chat", async ({ body }) => {
    const { message, context } = body as { message: string; context: string };

    // ── Input Validation ──────────────────────────────────────────────────
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ success: false, error: "Pesan tidak boleh kosong." }), { status: 400 });
    }

    const cleanMessage = sanitizeMessage(message);

    if (cleanMessage.length === 0) {
      return new Response(JSON.stringify({ success: false, error: "Pesan tidak boleh kosong." }), { status: 400 });
    }

    if (cleanMessage.length > 1000) {
      return new Response(JSON.stringify({ success: false, error: "Pesan terlalu panjang (maks 1000 karakter)." }), { status: 400 });
    }

    const safeContext = typeof context === "string" && context.trim().length > 0
      ? sanitizeMessage(context)
      : "Dashboard Logos LAB";

    // ── Call AI ───────────────────────────────────────────────────────────
    try {
      const systemPrompt = buildSystemPrompt(safeContext);
      const reply = await callGemini(systemPrompt, cleanMessage);
      return { success: true, reply };
    } catch (err: any) {
      console.error("[AI Route Error]", err.message);
      return new Response(
        JSON.stringify({ success: false, error: "AI tidak dapat merespons saat ini. Coba lagi nanti." }),
        { status: 503 }
      );
    }
  });
