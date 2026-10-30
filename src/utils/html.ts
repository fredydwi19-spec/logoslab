// Escape teks dari pengguna/database sebelum dimasukkan ke HTML yang disusun sebagai teks (${...}).
// Tampilan SSR di src/views tidak meng-escape otomatis (lihat AGENTS.md bagian 06).
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);
}
