// Nomor level soal/grid: angka bulat mulai dari 1. Selain itu dianggap Level 1.
export function toLevel(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

const EDITABLE_STATUSES = ["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"];

// Level pertama yang boleh diedit Pembuat, atau null jika isi proyek sedang tidak bisa diedit.
// Proyek biasa: semua level (mulai 1). Game terbit yang sedang menambah level: hanya level di atas level terbit.
export function firstEditableLevel(project: { status: string; levelReviewStatus: string | null; publishedLevelCount: number }): number | null {
  if (EDITABLE_STATUSES.includes(project.status)) return 1;
  if (project.status === "PUBLISHED" && project.levelReviewStatus && EDITABLE_STATUSES.includes(project.levelReviewStatus)) {
    return project.publishedLevelCount + 1;
  }
  return null;
}

// Anggota tim proyek (Ketua, Pembuat, atau Pakar yang ditugaskan) boleh melihat semua level, termasuk yang belum terbit.
export function isProjectTeam(user: { id: number; role: string } | null, project: { idPembuat: number; idPakar: number | null }): boolean {
  if (!user) return false;
  return user.role === "KETUA_TIM" || user.id === project.idPembuat || user.id === project.idPakar;
}

// Level harus berurutan tanpa celah (1, 2, 3, ...). Mengembalikan nomor level pertama yang kosong, atau null jika lengkap.
export function findMissingLevel(levels: number[]): number | null {
  const max = Math.max(0, ...levels);
  for (let level = 1; level <= max; level++) {
    if (!levels.includes(level)) return level;
  }
  return null;
}

// --- Versi soal untuk pemain: tanpa kunci jawaban (jawaban dinilai di server) ---

export function publicQuizQuestion<T extends { correctAnswer: unknown; explanation: unknown }>(question: T) {
  const { correctAnswer, explanation, ...rest } = question;
  return rest;
}

type FtbPart = { text: string } | { blank: number };

// Teks Fill the Blank dipecah menjadi potongan teks dan kotak isian. Nomor kotak = urutan jawaban yang disimpan Pembuat.
export function ftbParts(fullText: string, answers: { word: string }[]): FtbPart[] {
  const lower = fullText.toLowerCase();
  const taken: { start: number; end: number; blank: number }[] = [];
  const overlaps = (start: number, end: number) => taken.some(t => start < t.end && end > t.start && t.end > t.start);
  const isLetter = (ch: string | undefined) => !!ch && /\p{L}|\p{N}/u.test(ch);

  answers.forEach((answer, blank) => {
    const word = String(answer.word ?? "").trim().toLowerCase();
    if (!word) return;
    // Urutan pencarian: "[kata]", lalu kata utuh, lalu bagian kata
    const tries: { needle: string; wholeWord: boolean }[] = [
      { needle: `[${word}]`, wholeWord: false },
      { needle: word, wholeWord: true },
      { needle: word, wholeWord: false },
    ];
    for (const { needle, wholeWord } of tries) {
      for (let pos = lower.indexOf(needle); pos !== -1; pos = lower.indexOf(needle, pos + 1)) {
        const end = pos + needle.length;
        if (overlaps(pos, end)) continue;
        if (wholeWord && (isLetter(lower[pos - 1]) || isLetter(lower[end]))) continue;
        taken.push({ start: pos, end, blank });
        return;
      }
    }
    // Kata tidak ditemukan di teks: kotak isian diletakkan di akhir
    taken.push({ start: fullText.length, end: fullText.length, blank });
  });

  taken.sort((a, b) => a.start - b.start);
  const parts: FtbPart[] = [];
  let cursor = 0;
  for (const t of taken) {
    if (t.start > cursor) parts.push({ text: fullText.slice(cursor, t.start) });
    parts.push({ blank: t.blank });
    cursor = Math.max(cursor, t.end);
  }
  if (cursor < fullText.length) parts.push({ text: fullText.slice(cursor) });
  return parts;
}

export function publicFtbQuestion<T extends { fullText: string; answers: string | { word: string }[] }>(question: T) {
  const { fullText, answers, ...rest } = question;
  const list = (typeof answers === "string" ? JSON.parse(answers) : answers) as { word: string }[];
  return { ...rest, parts: ftbParts(fullText, list), blankCount: list.length };
}

// TTS: panjang jawaban tetap dikirim (untuk kotak di grid), hurufnya tidak
export function publicCrosswordClues(clues: { answer?: string; explanation?: string }[]) {
  return clues.map(({ answer, explanation, ...rest }) => ({ ...rest, length: String(answer ?? "").length }));
}

export function publicCrosswordGrid(grid: { letter?: string }[][]) {
  return grid.map(row => row.map(({ letter, ...rest }) => rest));
}
