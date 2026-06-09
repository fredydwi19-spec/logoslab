import { Elysia } from "elysia";
import { db } from "../db/db";
import {
  bankSoalQuiz, bankSoalFtb, bankSoalTts,
  questionBank, gameFillTheBlank,
  projects
} from "../db/schema";
import { eq, sql } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";

// ── Native CSV parser (handles quoted fields, CRLF/LF, UTF-8 BOM, semicolon/comma delimiter) ──
function parseCSV(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM jika ada
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
  // Normalise line endings
  const lines = clean.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Auto-detect delimiter: Excel Indonesia menggunakan ';', internasional ','
  const headerLine = lines[0]!;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const delim = semicolonCount > commaCount ? ';' : ',';

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i] ?? '';
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === delim && !inQ) {
        fields.push(cur.trim()); cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur.trim());
    return fields;
  };

  const headers = parseRow(headerLine);
  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    if (!line) continue;
    const values = parseRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? ''; });
    results.push(row);
  }
  return results;
}


// Helper: hanya KETUA_TIM dan PEMBUAT_GAME yang boleh akses Bank Soal
function guardBankSoal(user: any) {
  if (!user || !["KETUA_TIM", "PEMBUAT_GAME"].includes(user.role)) {
    return new Response(JSON.stringify({ error: "Forbidden: Hanya KETUA_TIM dan PEMBUAT_GAME yang dapat mengakses Bank Soal" }), { status: 403 });
  }
  return null;
}

export const bankSoalRoutes = new Elysia({ prefix: "/api/bank-soal" })
  .use(jwt({ name: "jwt", secret: process.env.JWT_SECRET || "super-secret-key" }))
  .onBeforeHandle(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    if (!auth?.value) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    const payload = await jwt.verify(auth.value as string);
    if (!payload) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  })
  .derive(async ({ jwt, cookie }) => {
    const auth = cookie.auth;
    const payload = auth?.value ? await jwt.verify(auth.value as string) : null;
    return { user: payload as any };
  })

  // ============================================================
  // BANK SOAL QUIZ — CRUD
  // ============================================================
  .get("/quiz", async ({ user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const data = await db.select().from(bankSoalQuiz).orderBy(bankSoalQuiz.createdAt);
    return { success: true, data };
  })

  .post("/quiz", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation } = body as any;
    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !difficulty) {
      return new Response(JSON.stringify({ error: "Field wajib tidak boleh kosong" }), { status: 400 });
    }
    const [result] = await db.insert(bankSoalQuiz).values({
      question, optionA, optionB, optionC, optionD,
      correctAnswer, difficulty, explanation: explanation || "",
      createdBy: user.id
    });
    return { success: true, id: result.insertId };
  })

  .put("/quiz/:id", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation } = body as any;
    await db.update(bankSoalQuiz).set({
      question, optionA, optionB, optionC, optionD,
      correctAnswer, difficulty, explanation: explanation || ""
    }).where(eq(bankSoalQuiz.id, Number(params.id)));
    return { success: true };
  })

  .delete("/quiz/:id", async ({ params, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    await db.delete(bankSoalQuiz).where(eq(bankSoalQuiz.id, Number(params.id)));
    return { success: true };
  })

  // ============================================================
  // BANK SOAL FTB — CRUD
  // ============================================================
  .get("/ftb", async ({ user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const rows = await db.select().from(bankSoalFtb).orderBy(bankSoalFtb.createdAt);
    const data = rows.map(r => ({ ...r, answers: JSON.parse(r.answers) }));
    return { success: true, data };
  })

  .post("/ftb", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { fullText, answers, difficulty } = body as any;
    if (!fullText || !answers || !difficulty) {
      return new Response(JSON.stringify({ error: "Field wajib tidak boleh kosong" }), { status: 400 });
    }
    const answersStr = typeof answers === "string" ? answers : JSON.stringify(answers);
    const [result] = await db.insert(bankSoalFtb).values({
      fullText, answers: answersStr, difficulty, createdBy: user.id
    });
    return { success: true, id: result.insertId };
  })

  .put("/ftb/:id", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { fullText, answers, difficulty } = body as any;
    const answersStr = typeof answers === "string" ? answers : JSON.stringify(answers);
    await db.update(bankSoalFtb).set({ fullText, answers: answersStr, difficulty })
      .where(eq(bankSoalFtb.id, Number(params.id)));
    return { success: true };
  })

  .delete("/ftb/:id", async ({ params, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    await db.delete(bankSoalFtb).where(eq(bankSoalFtb.id, Number(params.id)));
    return { success: true };
  })

  // ============================================================
  // BANK SOAL TTS — CRUD
  // ============================================================
  .get("/tts", async ({ user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const data = await db.select().from(bankSoalTts).orderBy(bankSoalTts.createdAt);
    return { success: true, data };
  })

  .post("/tts", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { clue, answer, difficulty, explanation } = body as any;
    if (!clue || !answer || !difficulty) {
      return new Response(JSON.stringify({ error: "Field wajib tidak boleh kosong" }), { status: 400 });
    }
    const [result] = await db.insert(bankSoalTts).values({
      clue, answer, difficulty, explanation: explanation || "", createdBy: user.id
    });
    return { success: true, id: result.insertId };
  })

  .put("/tts/:id", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { clue, answer, difficulty, explanation } = body as any;
    await db.update(bankSoalTts).set({ clue, answer, difficulty, explanation: explanation || "" })
      .where(eq(bankSoalTts.id, Number(params.id)));
    return { success: true };
  })

  .delete("/tts/:id", async ({ params, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    await db.delete(bankSoalTts).where(eq(bankSoalTts.id, Number(params.id)));
    return { success: true };
  })

  // ============================================================
  // IMPORT CSV — Quiz / FTB / TTS
  // ============================================================
  .post("/import/:type", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;

    const type = params.type as "quiz" | "ftb" | "tts";
    const formData = body as any;
    const file = formData?.file;

    if (!file) {
      return new Response(JSON.stringify({ error: "File CSV tidak ditemukan. Pastikan Anda memilih file .csv yang valid." }), { status: 400 });
    }

    // Validasi ekstensi file
    const fileName: string = (file as any).name || "";
    if (!fileName.toLowerCase().endsWith(".csv")) {
      return new Response(JSON.stringify({ error: `File harus berformat .csv. File yang diterima: ${fileName}` }), { status: 400 });
    }

    try {
      // Baca file sebagai teks (efisien untuk ribuan baris)
      let csvText: string;
      if (typeof file === "object" && file instanceof Blob) {
        csvText = await file.text();
      } else {
        return new Response(JSON.stringify({ error: "Format file tidak valid" }), { status: 400 });
      }

      const rows = parseCSV(csvText);

      if (!rows.length) {
        return new Response(JSON.stringify({ error: "File CSV kosong atau header tidak sesuai template. Pastikan baris pertama adalah header kolom." }), { status: 400 });
      }

      let imported = 0;
      const errors: string[] = [];
      const BATCH_SIZE = 500; // Batch insert untuk performa ribuan baris

      if (type === "quiz") {
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          if (!r.question || !r.optionA || !r.optionB || !r.optionC || !r.optionD || !r.correctAnswer || !r.difficulty) {
            errors.push(`Baris ${i + 2}: Field wajib kosong (question/optionA-D/correctAnswer/difficulty), dilewati`);
            continue;
          }
          const diff = String(r.difficulty).trim().toUpperCase();
          if (!["MUDAH", "SEDANG", "SULIT"].includes(diff)) {
            errors.push(`Baris ${i + 2}: difficulty '${r.difficulty}' tidak valid. Gunakan: MUDAH, SEDANG, atau SULIT`);
            continue;
          }
          const ca = String(r.correctAnswer).trim().toUpperCase();
          if (!["A", "B", "C", "D"].includes(ca)) {
            errors.push(`Baris ${i + 2}: correctAnswer '${r.correctAnswer}' tidak valid. Gunakan: A, B, C, atau D`);
            continue;
          }
          batch.push({
            question: r.question, optionA: r.optionA, optionB: r.optionB,
            optionC: r.optionC, optionD: r.optionD,
            correctAnswer: ca as any, difficulty: diff as any,
            explanation: r.explanation || "", createdBy: user.id
          });
          // Flush batch setiap BATCH_SIZE baris
          if (batch.length >= BATCH_SIZE) {
            await db.insert(bankSoalQuiz).values(batch as any);
            imported += batch.length;
            batch.length = 0;
          }
        }
        // Insert sisa batch
        if (batch.length > 0) {
          await db.insert(bankSoalQuiz).values(batch as any);
          imported += batch.length;
        }

      } else if (type === "ftb") {
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          if (!r.fullText || !r.difficulty) {
            errors.push(`Baris ${i + 2}: fullText atau difficulty kosong, dilewati`);
            continue;
          }
          const diff = String(r.difficulty).trim().toUpperCase();
          if (!["MUDAH", "SEDANG", "SULIT"].includes(diff)) {
            errors.push(`Baris ${i + 2}: difficulty '${r.difficulty}' tidak valid, dilewati`);
            continue;
          }
          // Baca hingga 5 pasang word/explanation
          const answers: { word: string; explanation: string }[] = [];
          for (let k = 1; k <= 5; k++) {
            const w = r[`word${k}`];
            if (w && w.trim()) answers.push({ word: w.trim(), explanation: (r[`explanation${k}`] || "").trim() });
          }
          if (!answers.length) {
            errors.push(`Baris ${i + 2}: Tidak ada kata rumpang (kolom word1 hingga word5 kosong), dilewati`);
            continue;
          }
          batch.push({
            fullText: r.fullText, answers: JSON.stringify(answers),
            difficulty: diff as any, createdBy: user.id
          });
          if (batch.length >= BATCH_SIZE) {
            await db.insert(bankSoalFtb).values(batch as any);
            imported += batch.length;
            batch.length = 0;
          }
        }
        if (batch.length > 0) {
          await db.insert(bankSoalFtb).values(batch as any);
          imported += batch.length;
        }

      } else if (type === "tts") {
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          if (!r.clue || !r.answer || !r.difficulty) {
            errors.push(`Baris ${i + 2}: clue/answer/difficulty kosong, dilewati`);
            continue;
          }
          const diff = String(r.difficulty).trim().toUpperCase();
          if (!["MUDAH", "SEDANG", "SULIT"].includes(diff)) {
            errors.push(`Baris ${i + 2}: difficulty '${r.difficulty}' tidak valid, dilewati`);
            continue;
          }
          batch.push({
            clue: r.clue, answer: r.answer.replace(/\s+/g, "").toUpperCase(),
            difficulty: diff as any, explanation: r.explanation || "",
            createdBy: user.id
          });
          if (batch.length >= BATCH_SIZE) {
            await db.insert(bankSoalTts).values(batch as any);
            imported += batch.length;
            batch.length = 0;
          }
        }
        if (batch.length > 0) {
          await db.insert(bankSoalTts).values(batch as any);
          imported += batch.length;
        }

      } else {
        return new Response(JSON.stringify({ error: "Tipe tidak valid. Gunakan: quiz, ftb, atau tts" }), { status: 400 });
      }

      const msg = errors.length > 0
        ? `${imported} soal berhasil diimpor. ${errors.length} baris dilewati.`
        : `${imported} soal berhasil diimpor dari CSV.`;
      return { success: true, imported, warnings: errors, message: msg };

    } catch (err: any) {
      console.error("[bank-soal/import] Error:", err.message);
      return new Response(JSON.stringify({ error: "Gagal memproses file CSV: " + err.message }), { status: 500 });
    }
  })

  // ============================================================
  // AUTO-GENERATE Soal ke Project
  // ============================================================
  .post("/auto-generate", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;

    const { projectId, gameType, totalSoal, jumlahMudah, jumlahSedang, jumlahSulit } = body as any;

    if (!projectId || !gameType) {
      return new Response(JSON.stringify({ error: "projectId dan gameType wajib diisi" }), { status: 400 });
    }

    const total = Number(totalSoal);
    const mudah = Number(jumlahMudah);
    const sedang = Number(jumlahSedang);
    const sulit = Number(jumlahSulit);

    // Validasi matematika
    if (mudah + sedang + sulit !== total) {
      return new Response(JSON.stringify({
        error: `Validasi gagal: Mudah (${mudah}) + Sedang (${sedang}) + Sulit (${sulit}) = ${mudah + sedang + sulit}, bukan ${total}. Jumlah harus sama dengan Total Soal.`
      }), { status: 400 });
    }

    // Cek proyek ada
    const [project] = await db.select().from(projects).where(eq(projects.id, Number(projectId)));
    if (!project) return new Response(JSON.stringify({ error: "Proyek tidak ditemukan" }), { status: 404 });
    if (!["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(project.status)) {
      return new Response(JSON.stringify({ error: "Proyek tidak dalam status yang dapat diedit" }), { status: 403 });
    }

    try {
      if (gameType === "QUIZ") {
        // Tarik soal secara acak per kesulitan menggunakan ORDER BY RAND()
        const pullRandom = async (diff: string, count: number) => {
          if (count === 0) return [];
          return db.select().from(bankSoalQuiz)
            .where(eq(bankSoalQuiz.difficulty, diff as any))
            .orderBy(sql`RAND()`)
            .limit(count);
        };

        const [qMudah, qSedang, qSulit] = await Promise.all([
          pullRandom("MUDAH", mudah),
          pullRandom("SEDANG", sedang),
          pullRandom("SULIT", sulit)
        ]);

        if (qMudah.length < mudah || qSedang.length < sedang || qSulit.length < sulit) {
          return new Response(JSON.stringify({
            error: `Stok Bank Soal Quiz tidak cukup. Tersedia: Mudah=${qMudah.length}, Sedang=${qSedang.length}, Sulit=${qSulit.length}. Diminta: Mudah=${mudah}, Sedang=${sedang}, Sulit=${sulit}.`
          }), { status: 400 });
        }

        const allSelected = [...qMudah, ...qSedang, ...qSulit];
        // Map difficulty MUDAH/SEDANG/SULIT → score untuk questionBank
        const diffToScore: Record<string, number> = { MUDAH: 10, SEDANG: 20, SULIT: 50 };
        // Map difficulty MUDAH/SEDANG/SULIT → enum lama RENDAH/SEDANG/SULIT
        const diffToOld: Record<string, string> = { MUDAH: "RENDAH", SEDANG: "SEDANG", SULIT: "SULIT" };

        const valuesToInsert = allSelected.map(q => ({
          projectId: Number(projectId),
          question: q.question,
          optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          difficulty: diffToOld[q.difficulty] as any,
          score: diffToScore[q.difficulty] || 10,
          explanation: q.explanation || ""
        }));

        await db.insert(questionBank).values(valuesToInsert as any);
        return { success: true, message: `${total} soal Quiz berhasil di-generate ke proyek #${projectId}`, generated: total };

      } else if (gameType === "FILL_THE_BLANK") {
        const pullRandom = async (diff: string, count: number) => {
          if (count === 0) return [];
          return db.select().from(bankSoalFtb)
            .where(eq(bankSoalFtb.difficulty, diff as any))
            .orderBy(sql`RAND()`)
            .limit(count);
        };

        const [fMudah, fSedang, fSulit] = await Promise.all([
          pullRandom("MUDAH", mudah),
          pullRandom("SEDANG", sedang),
          pullRandom("SULIT", sulit)
        ]);

        if (fMudah.length < mudah || fSedang.length < sedang || fSulit.length < sulit) {
          return new Response(JSON.stringify({
            error: `Stok Bank Soal FTB tidak cukup. Tersedia: Mudah=${fMudah.length}, Sedang=${fSedang.length}, Sulit=${fSulit.length}. Diminta: Mudah=${mudah}, Sedang=${sedang}, Sulit=${sulit}.`
          }), { status: 400 });
        }

        const diffToScore: Record<string, number> = { MUDAH: 10, SEDANG: 20, SULIT: 50 };
        const diffToOld: Record<string, string> = { MUDAH: "RENDAH", SEDANG: "SEDANG", SULIT: "SULIT" };
        const allSelected = [...fMudah, ...fSedang, ...fSulit];

        const valuesToInsert = allSelected.map(f => ({
          projectId: Number(projectId),
          fullText: f.fullText,
          answers: f.answers,
          difficulty: diffToOld[f.difficulty] as any,
          score: diffToScore[f.difficulty] || 10,
        }));

        await db.insert(gameFillTheBlank).values(valuesToInsert as any);
        return { success: true, message: `${total} soal FTB berhasil di-generate ke proyek #${projectId}`, generated: total };

      } else {
        return new Response(JSON.stringify({ error: "Auto-generate saat ini hanya mendukung gameType QUIZ dan FILL_THE_BLANK" }), { status: 400 });
      }
    } catch (err: any) {
      console.error("[bank-soal/auto-generate] Error:", err.message);
      return new Response(JSON.stringify({ error: "Gagal auto-generate: " + err.message }), { status: 500 });
    }
  });
