// Nomor level soal/grid: angka bulat mulai dari 1. Selain itu dianggap Level 1.
export function toLevel(value: unknown): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// Level harus berurutan tanpa celah (1, 2, 3, ...). Mengembalikan nomor level pertama yang kosong, atau null jika lengkap.
export function findMissingLevel(levels: number[]): number | null {
  const max = Math.max(0, ...levels);
  for (let level = 1; level <= max; level++) {
    if (!levels.includes(level)) return level;
  }
  return null;
}
