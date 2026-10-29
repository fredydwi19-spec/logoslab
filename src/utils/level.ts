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
