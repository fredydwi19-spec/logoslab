export const DashboardMateriPage = ({ materis }: { materis: any[] }) => {
  const typeLabel: Record<string, string> = {
    PDF: "PDF",
    VIDEO: "Video",
    MANUAL: "Interaktif",
  };
  const typeBadge: Record<string, string> = {
    PDF: "bg-amber-100 text-amber-700",
    VIDEO: "bg-rose-100 text-rose-700",
    MANUAL: "bg-teal-100 text-teal-700",
  };
  const typeIcon: Record<string, string> = {
    PDF: "bi-file-earmark-pdf",
    VIDEO: "bi-play-btn",
    MANUAL: "bi-book-half",
  };
  const typeEmoji: Record<string, string> = {
    PDF: "📄",
    VIDEO: "🎬",
    MANUAL: "📖",
  };

  return `
    <div x-data="{ filter: 'ALL' }">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
            <span class="w-2 h-8 bg-[#14b8a6] rounded-full inline-block"></span>
            Materi Pembelajaran
          </h2>
          <p class="text-slate-500 text-sm mt-1 ml-5">Semua materi yang telah dipublish oleh tim. Akses kapan saja!</p>
        </div>
        <div class="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <i class="bi bi-journal-richtext text-[#14b8a6] text-xl"></i>
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Materi</p>
            <p class="text-xl font-black text-[#1A237E]">${materis.length}</p>
          </div>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="flex flex-wrap gap-2 mb-6">
        <button @click="filter = 'ALL'"
          :class="filter === 'ALL' ? 'bg-[#1A237E] text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          Semua
        </button>
        <button @click="filter = 'PDF'"
          :class="filter === 'PDF' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-file-earmark-pdf mr-1"></i> PDF
        </button>
        <button @click="filter = 'VIDEO'"
          :class="filter === 'VIDEO' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-play-btn mr-1"></i> Video
        </button>
        <button @click="filter = 'MANUAL'"
          :class="filter === 'MANUAL' ? 'bg-teal-500 text-white' : 'bg-white text-slate-600 border border-slate-200'"
          class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md">
          <i class="bi bi-book-half mr-1"></i> Interaktif
        </button>
      </div>

      <!-- Materi Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        ${
          materis.length === 0
            ? `<div class="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <div class="text-6xl mb-4 opacity-20">📚</div>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada materi yang dipublish saat ini.</p>
               </div>`
            : materis
                .map(
                  (m) => `
          <a href="/materi/${m.id}"
             class="block bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group transition-all duration-300 hover:-translate-y-1 no-underline"
             x-show="filter === 'ALL' || filter === '${m.materiType}'">

            <!-- Thumbnail -->
            <div class="relative h-44 overflow-hidden">
              ${
                m.thumbnailUrl
                  ? `<img src="${m.thumbnailUrl}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />`
                  : `<div class="w-full h-full flex items-center justify-center text-7xl
                       ${m.materiType === "PDF" ? "bg-gradient-to-br from-amber-50 to-amber-100" : m.materiType === "VIDEO" ? "bg-gradient-to-br from-rose-50 to-rose-100" : "bg-gradient-to-br from-teal-50 to-teal-100"}">
                       ${typeEmoji[m.materiType] || "📖"}
                     </div>`
              }
              <!-- Hover overlay -->
              <div class="absolute inset-0 bg-[#1A237E]/65 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="bg-white text-[#1A237E] font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                  <i class="bi bi-arrow-right-circle-fill text-[#14b8a6] text-lg"></i> Buka Materi
                </div>
              </div>
              <!-- Type badge -->
              <div class="absolute top-3 left-3">
                <span class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${typeBadge[m.materiType] || "bg-slate-100 text-slate-600"}">
                  <i class="bi ${typeIcon[m.materiType] || "bi-file"} mr-1"></i>
                  ${typeLabel[m.materiType] || m.materiType}
                </span>
              </div>
            </div>

            <!-- Info -->
            <div class="p-5">
              <h3 class="font-bold text-[#1A237E] text-base line-clamp-1 group-hover:text-[#14b8a6] transition-colors mb-1">
                ${m.title}
              </h3>
              <p class="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                ${m.description || "Materi pembelajaran dari Logos LAB. Klik untuk membaca selengkapnya."}
              </p>
              <div class="flex items-center justify-between pt-3 border-t border-slate-50">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <i class="bi bi-person-fill"></i> Logos Team
                </span>
                <span class="text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1
                  ${m.materiType === "PDF" ? "bg-amber-50 text-amber-600" : m.materiType === "VIDEO" ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-600"}">
                  <i class="bi ${typeIcon[m.materiType] || "bi-file"} mr-0.5"></i>
                  ${typeLabel[m.materiType] || m.materiType}
                </span>
              </div>
            </div>
          </a>
        `
                )
                .join("")
        }
      </div>
    </div>
  `;
};
