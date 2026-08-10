import { Elysia } from "elysia";
import { db } from "../db/db";
import {
  bankSoalQuiz, bankSoalFtb, bankSoalTts,
  questionBank, gameFillTheBlank,
  projects
} from "../db/schema";
import { eq, sql, inArray, and } from "drizzle-orm";
import { jwt } from "@elysiajs/jwt";
import * as XLSX from "xlsx";

// ── Native CSV parser (handles quoted fields, CRLF/LF, UTF-8 BOM, semicolon/comma delimiter) ──
function parseCSV(text: string): Record<string, string>[] {
  const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
  
  let firstLineEnd = clean.indexOf('\n');
  if (firstLineEnd === -1) firstLineEnd = clean.length;
  const headerLineRaw = clean.slice(0, firstLineEnd);
  
  const commaCount = (headerLineRaw.match(/,/g) || []).length;
  const semicolonCount = (headerLineRaw.match(/;/g) || []).length;
  const delim = semicolonCount > commaCount ? ';' : ',';

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let cur = '';
  let inQ = false;
  
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (ch === '"') {
      if (inQ && clean[i + 1] === '"') { 
        cur += '"'; 
        i++; 
      } else {
        inQ = !inQ;
      }
    } else if (ch === delim && !inQ) {
      currentRow.push(cur.trim());
      cur = '';
    } else if ((ch === '\n' || (ch === '\r' && clean[i+1] === '\n')) && !inQ) {
      if (ch === '\r') i++;
      currentRow.push(cur.trim());
      rows.push(currentRow);
      currentRow = [];
      cur = '';
    } else {
      if (ch === '\r' && !inQ) {
         // abaikan \r di luar quote
      } else {
         cur += ch;
      }
    }
  }
  
  if (cur !== '' || currentRow.length > 0) {
    currentRow.push(cur.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0]!;
  const results: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const values = rows[i]!;
    if (values.length === 1 && !values[0]) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h.trim()] = values[idx] ?? ''; });
    results.push(row);
  }
  return results;
}



// Helper: normalisasi nilai difficulty dari berbagai format ke MUDAH/SEDANG/SULIT
function normalizeDifficulty(val: string): string | null {
  const v = String(val || '').trim().toUpperCase();
  if (['MUDAH', 'EASY', 'GAMPANG', 'RENDAH', 'LOW', '1', 'MUDAH'].includes(v)) return 'MUDAH';
  if (['SEDANG', 'MEDIUM', 'NORMAL', 'MENENGAH', 'MID', 'MIDDLE', '2'].includes(v)) return 'SEDANG';
  if (['SULIT', 'SUSAH', 'HARD', 'DIFFICULT', 'TINGGI', 'HIGH', '3'].includes(v)) return 'SULIT';
  return null;
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
    const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation, competency } = body as any;
    if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !difficulty) {
      return new Response(JSON.stringify({ error: "Field wajib tidak boleh kosong" }), { status: 400 });
    }
    const [result] = await db.insert(bankSoalQuiz).values({
      question, optionA, optionB, optionC, optionD,
      correctAnswer, difficulty, explanation: explanation || "",
      competency: competency || "Biblical Knowledge",
      createdBy: user.id
    });
    return { success: true, id: result.insertId };
  })

  .put("/quiz/:id", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { question, optionA, optionB, optionC, optionD, correctAnswer, difficulty, explanation, competency } = body as any;
    await db.update(bankSoalQuiz).set({
      question, optionA, optionB, optionC, optionD,
      correctAnswer, difficulty, explanation: explanation || "",
      competency: competency || "Biblical Knowledge"
    }).where(eq(bankSoalQuiz.id, Number(params.id)));
    return { success: true };
  })

  .post("/quiz/bulk-delete", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { ids } = body as { ids: number[] };
    if (ids && ids.length > 0) {
      await db.delete(bankSoalQuiz).where(inArray(bankSoalQuiz.id, ids));
    }
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

  .post("/ftb/bulk-delete", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { ids } = body as { ids: number[] };
    if (ids && ids.length > 0) {
      await db.delete(bankSoalFtb).where(inArray(bankSoalFtb.id, ids));
    }
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

  .post("/tts/bulk-delete", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    const { ids } = body as { ids: number[] };
    if (ids && ids.length > 0) {
      await db.delete(bankSoalTts).where(inArray(bankSoalTts.id, ids));
    }
    return { success: true };
  })

  .delete("/tts/:id", async ({ params, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;
    await db.delete(bankSoalTts).where(eq(bankSoalTts.id, Number(params.id)));
    return { success: true };
  })

  // ============================================================
  // TEMPLATE EXCEL
  // ============================================================
  .get("/template/:type", async ({ params }) => {
    const type = params.type as "quiz" | "ftb" | "tts";
    const workbook = XLSX.utils.book_new();
    let worksheet;
    let filename = "Template_Bank_Soal.xlsx";

    if (type === "quiz") {
      filename = "Template_Bank_Soal_Quiz.xlsx";
      worksheet = XLSX.utils.json_to_sheet([
        { question: "Apa ibukota Indonesia?", optionA: "Jakarta", optionB: "Bandung", optionC: "Surabaya", optionD: "Medan", correctAnswer: "A", difficulty: "MUDAH", explanation: "Jakarta adalah ibukota negara RI.", competency: "Biblical Knowledge" },
        { question: "Pusat tata surya adalah...", optionA: "Bumi", optionB: "Bulan", optionC: "Matahari", optionD: "Mars", correctAnswer: "C", difficulty: "SEDANG", explanation: "Matahari adalah pusat tata surya.", competency: "Apologetika" }
      ]);
      // Set column widths for readability
      worksheet['!cols'] = [
        { wch: 50 }, // question
        { wch: 20 }, // optionA
        { wch: 20 }, // optionB
        { wch: 20 }, // optionC
        { wch: 20 }, // optionD
        { wch: 14 }, // correctAnswer
        { wch: 12 }, // difficulty
        { wch: 40 }, // explanation
        { wch: 25 }, // competency
      ];
    } else if (type === "ftb") {
      filename = "Template_Bank_Soal_FTB.xlsx";
      worksheet = XLSX.utils.json_to_sheet([
        { fullText: "Ibukota Indonesia adalah [Jakarta] yang terletak di Pulau [Jawa].", difficulty: "MUDAH", word1: "Jakarta", explanation1: "Kota metropolitan terbesar", word2: "Jawa", explanation2: "Pulau terpadat di Indonesia", word3: "", explanation3: "" },
        { fullText: "Proses fotosintesis menghasilkan [oksigen] dan [glukosa].", difficulty: "SEDANG", word1: "oksigen", explanation1: "Gas pernafasan", word2: "glukosa", explanation2: "Sumber energi", word3: "", explanation3: "" }
      ]);
    } else if (type === "tts") {
      filename = "Template_Bank_Soal_TTS.xlsx";
      worksheet = XLSX.utils.json_to_sheet([
        { clue: "Ibukota Indonesia", answer: "JAKARTA", difficulty: "MUDAH", explanation: "Terletak di pulau Jawa" },
        { clue: "Pusat tata surya", answer: "MATAHARI", difficulty: "SEDANG", explanation: "Bintang terdekat dengan bumi" }
      ]);
    } else {
      return new Response("Not Found", { status: 404 });
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  })

  // ============================================================
  // IMPORT EXCEL — Quiz / FTB / TTS
  // ============================================================
  .post("/import/:type", async ({ params, body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;

    const type = params.type as "quiz" | "ftb" | "tts";
    const formData = body as any;
    const file = formData?.file;

    if (!file) {
      return new Response(JSON.stringify({ error: "File Excel tidak ditemukan. Pastikan Anda memilih file .xlsx yang valid." }), { status: 400 });
    }

    // Validasi ekstensi file
    const fileName: string = (file as any).name || "";
    if (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls") && !fileName.toLowerCase().endsWith(".csv")) {
      return new Response(JSON.stringify({ error: `File harus berformat Excel (.xlsx/.xls) atau .csv. File yang diterima: ${fileName}` }), { status: 400 });
    }

    try {
      let rows: Record<string, any>[] = [];
      if (typeof file === "object" && file instanceof Blob) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
        
        // Baca semua sheet dan gabungkan
        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) continue;
          // defval:'': sel kosong tetap terbaca sebagai string kosong (bukan undefined)
          // raw:false: angka/tanggal dikonversi ke string
          // blankrows:false: skip baris yang benar-benar kosong
          const sheetRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
            defval: '',
            raw: false,
            blankrows: false
          });
          console.log(`[Import] Sheet "${sheetName}": ${sheetRows.length} baris. Header:`, sheetRows[0] ? Object.keys(sheetRows[0]).join(', ') : 'kosong');
          rows = rows.concat(sheetRows);
        }
        console.log(`[Import] Total baris dari semua sheet: ${rows.length}`);
      } else {
        return new Response(JSON.stringify({ error: "Format file tidak valid" }), { status: 400 });
      }

      if (!rows.length) {
        return new Response(JSON.stringify({ error: "File Excel kosong atau header tidak sesuai template. Pastikan baris pertama adalah header kolom." }), { status: 400 });
      }

      let imported = 0;
      const errors: string[] = [];
      const BATCH_SIZE = 500; // Batch insert untuk performa ribuan baris

      if (type === "quiz") {
        const existingData = await db.select({ question: bankSoalQuiz.question }).from(bankSoalQuiz);
        const existingSet = new Set(existingData.map(d => (d.question || "").trim().toLowerCase()));
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          const q = r.question || r.pertanyaan || r.soal || r.Question || r.Pertanyaan || '';
          const diffRaw = r.difficulty || r.tingkat_kesulitan || r.kesulitan || r.Difficulty || '';
          const optA = r.optionA || r.pilihanA || r.pilihan_a || r.OptionA || '';
          const optB = r.optionB || r.pilihanB || r.pilihan_b || r.OptionB || '';
          const optC = r.optionC || r.pilihanC || r.pilihan_c || r.OptionC || '';
          const optD = r.optionD || r.pilihanD || r.pilihan_d || r.OptionD || '';
          const caRaw = r.correctAnswer || r.jawaban_benar || r.kunci_jawaban || r.kunci || r.jawaban || '';
          const expl = r.explanation || r.penjelasan || r.pembahasan || '';
          const comp = r.competency || r.kompetensi || r.kategori_kompetensi || r.Competency || 'Biblical Knowledge';

          if (!q || !optA || !optB || !optC || !optD || !caRaw || !diffRaw) {
            errors.push(`Baris ${i + 2}: Field wajib kosong, dilewati`);
            continue;
          }
          const qText = q.trim().toLowerCase();
          if (existingSet.has(qText)) {
            errors.push(`Baris ${i + 2}: Pertanyaan ganda, dilewati`);
            continue;
          }
          existingSet.add(qText);
          const diff = normalizeDifficulty(diffRaw);
          if (!diff) {
            errors.push(`Baris ${i + 2}: difficulty '${diffRaw}' tidak valid`);
            continue;
          }
          const ca = String(caRaw).trim().toUpperCase();
          if (!["A", "B", "C", "D"].includes(ca)) {
            errors.push(`Baris ${i + 2}: jawaban benar '${caRaw}' tidak valid`);
            continue;
          }
          batch.push({
            question: q, optionA: optA, optionB: optB,
            optionC: optC, optionD: optD,
            correctAnswer: ca as any, difficulty: diff as any,
            explanation: expl,
            competency: String(comp).trim() || 'Biblical Knowledge',
            createdBy: user.id
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
        const existingData = await db.select({ fullText: bankSoalFtb.fullText }).from(bankSoalFtb);
        const existingSet = new Set(existingData.map(d => (d.fullText || "").trim().toLowerCase()));
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          const fullText = String(r.fullText || r.fulltext || r.teksutuh || r['full text'] || r['teks utuh'] || r.FullText || r.pertanyaan || r.soal || r.Question || r.Pertanyaan || '').trim();
          let diffRaw = String(r.difficulty || r.tingkat_kesulitan || r.kesulitan || r.Difficulty || r.Tingkat_Kesulitan || '').trim();
          
          if (!fullText) {
            errors.push(`Baris ${i + 2}: Kolom fullText kosong. Kolom tersedia: ${Object.keys(r).join(', ')}`);
            continue;
          }
          const qText = fullText.toLowerCase();
          if (existingSet.has(qText)) {
            errors.push(`Baris ${i + 2}: Pertanyaan ganda, dilewati`);
            continue;
          }
          existingSet.add(qText);
          
          // Auto-heal difficulty
          if (!diffRaw) diffRaw = 'MUDAH';
          const diff = normalizeDifficulty(diffRaw) || 'MUDAH';

          // Baca hingga 5 pasang word/explanation — coba juga nama kolom alternatif
          let answers: { word: string; explanation: string }[] = [];
          for (let k = 1; k <= 5; k++) {
            const w = String(r[`word${k}`] || r[`kata${k}`] || r[`answer${k}`] || r[`jawaban${k}`] || r[`Word${k}`] || r[`kata rumpang ${k}`] || r[`word ${k}`] || r[`Kata${k}`] || '').trim();
            const expl = String(r[`explanation${k}`] || r[`penjelasan${k}`] || r[`keterangan${k}`] || r[`Explanation${k}`] || r[`penjelasan ${k}`] || r[`explanation ${k}`] || '').trim();
            if (w) answers.push({ word: w, explanation: expl });
          }
          
          // Auto-heal: jika tidak ada word di kolom, coba ekstrak dari kurung siku [...] di teks utuh
          if (!answers.length) {
            const matches = [...fullText.matchAll(/\[(.*?)\]/g)];
            answers = matches.map(m => ({ word: (m[1] || '').trim(), explanation: '' })).filter(a => a.word !== '');
          }

          if (!answers.length) {
            errors.push(`Baris ${i + 2}: Tidak ada kata rumpang. Isi kolom word1 atau tandai kata dengan [...] di teks.`);
            continue;
          }
          batch.push({
            fullText: fullText, answers: JSON.stringify(answers),
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
        const existingData = await db.select({ clue: bankSoalTts.clue }).from(bankSoalTts);
        const existingSet = new Set(existingData.map(d => (d.clue || "").trim().toLowerCase()));
        const batch: any[] = [];
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r) continue;
          const clueRaw = r.clue || r.petunjuk || r.pertanyaan || r.Clue || '';
          const ansRaw = r.answer || r.jawaban || r.Answer || '';
          const diffRaw = r.difficulty || r.tingkat_kesulitan || r.kesulitan || r.Difficulty || '';
          const expl = r.explanation || r.penjelasan || r.pembahasan || '';

          if (!clueRaw || !ansRaw || !diffRaw) {
            errors.push(`Baris ${i + 2}: clue/answer/difficulty kosong, dilewati`);
            continue;
          }
          const qText = clueRaw.trim().toLowerCase();
          if (existingSet.has(qText)) {
            errors.push(`Baris ${i + 2}: Clue ganda, dilewati`);
            continue;
          }
          existingSet.add(qText);
          const diff = normalizeDifficulty(diffRaw);
          if (!diff) {
            errors.push(`Baris ${i + 2}: difficulty '${diffRaw}' tidak valid, dilewati`);
            continue;
          }
          batch.push({
            clue: clueRaw, answer: ansRaw.replace(/\\s+/g, "").toUpperCase(),
            difficulty: diff as any, explanation: expl,
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
      return new Response(JSON.stringify({ error: "Gagal memproses file Excel: " + err.message }), { status: 500 });
    }
  })

  // Debug endpoint: inspect CSV headers & first 3 rows (remove after debugging)
  .post("/debug-csv", async ({ body }) => {
    const formData = body as any;
    const file = formData?.file;
    if (!file || !(file instanceof Blob)) return { error: "no file" };
    const text = await file.text();
    const clean = text.startsWith('\uFEFF') ? text.slice(1) : text;
    const firstLine = clean.split('\n')[0] || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;
    const delim = semicolonCount > commaCount ? ';' : ',';
    const lines = clean.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l => l.trim());
    return {
      delimiter: delim,
      totalLines: lines.length,
      header: lines[0],
      row1: lines[1] || '',
      row2: lines[2] || ''
    };
  })

  // ============================================================
  // AUTO-GENERATE Soal ke Project
  // ============================================================
  .post("/auto-generate", async ({ body, user }) => {
    const guard = guardBankSoal(user);
    if (guard) return guard;

    const { projectId, gameType, totalSoal, jumlahMudah, jumlahSedang, jumlahSulit, competency } = body as any;

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
          
          let query = db.select().from(bankSoalQuiz).$dynamic();
          
          const conditions = [eq(bankSoalQuiz.difficulty, diff as any)];
          if (competency && competency !== "SEMUA") {
            conditions.push(eq(bankSoalQuiz.competency, competency));
          }
          
          return query
            .where(and(...conditions))
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
        const valuesToInsert = allSelected.map(q => ({
          projectId: Number(projectId),
          question: q.question,
          optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty as any,
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
        const allSelected = [...fMudah, ...fSedang, ...fSulit];

        const valuesToInsert = allSelected.map(f => ({
          projectId: Number(projectId),
          fullText: f.fullText,
          answers: f.answers,
          difficulty: f.difficulty as any,
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
