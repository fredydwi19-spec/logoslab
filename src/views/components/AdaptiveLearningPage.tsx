export const AdaptiveLearningPage = ({
  username,
  publishedMateris,
  publishedGames,
}: {
  username: string;
  publishedMateris: any[];
  publishedGames: any[];
}) => {
  const materiJson = JSON.stringify(publishedMateris);
  const gameJson = JSON.stringify(publishedGames);

  return `
<div x-data="adaptiveLearning()" x-init="init()">

  <!-- SCREEN 1: WELCOME -->
  <div x-show="screen === 'welcome'" x-transition class="max-w-2xl mx-auto text-center py-12">
    <div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#1A237E] to-indigo-500 rounded-3xl shadow-2xl mb-6 text-5xl">🧠</div>
    <h1 class="text-3xl font-black text-[#1A237E] uppercase tracking-wider mb-3">Adaptive Learning</h1>
    <p class="text-slate-500 mb-2 text-base">Halo, <strong>${username}</strong>! Sistem ini akan menganalisis tingkat pemahamanmu</p>
    <p class="text-slate-400 text-sm mb-8">dalam 5 bidang pengetahuan Alkitab, lalu memberikan panduan belajar yang dipersonalisasi.</p>

    <div class="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-10">
      ${[
        { icon: "<i class='bi bi-book text-blue-500'></i>", label: "Biblical Knowledge" },
        { icon: "<i class='bi bi-search text-purple-500'></i>", label: "Eksegesis & Hermeneutik" },
        { icon: "<i class='bi bi-journal-text text-green-500'></i>", label: "Biblical Theory" },
        { icon: "<i class='bi bi-mic text-orange-500'></i>", label: "Homiletika" },
        { icon: "<i class='bi bi-shield-check text-red-500'></i>", label: "Apologetika" },
      ]
        .map(
          (c) => `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
          <div class="text-3xl mb-2">${c.icon}</div>
          <p class="text-[10px] font-black text-slate-500 uppercase tracking-wider">${c.label}</p>
        </div>`
        )
        .join("")}
    </div>

    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-8 text-left text-sm text-blue-700">
      <p class="font-bold mb-1">📋 Cara Kerja</p>
      <ul class="space-y-1 text-blue-600 text-xs list-disc list-inside">
        <li>20 pertanyaan pilihan ganda — 4 soal per bidang</li>
        <li>Tidak ada jawaban benar/salah yang dinilai — ini untuk mengetahui level-mu</li>
        <li>Selesaikan semua pertanyaan untuk mendapat rekomendasi belajar</li>
        <li>Estimasi waktu: 5–10 menit</li>
      </ul>
    </div>

    <button @click="startAssessment()"
      class="bg-[#FF5722] text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-[#E64A19] transition-all hover:-translate-y-1">
      Mulai Penilaian 🚀
    </button>
  </div>

  <!-- SCREEN 2: ASSESSMENT -->
  <div x-show="screen === 'assessment'" x-transition class="max-w-2xl mx-auto">
    <!-- Progress bar -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs font-black text-slate-400 uppercase tracking-widest"
              x-text="'Bidang: ' + categories[currentCat].label"></span>
        <span class="text-xs font-black text-[#1A237E]"
              x-text="(currentQ + 1) + ' / ' + totalQ"></span>
      </div>
      <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-[#1A237E] to-[#FF5722] rounded-full transition-all duration-500"
             :style="'width:' + ((currentQ / totalQ) * 100) + '%'"></div>
      </div>
      <div class="flex gap-1 mt-2">
        <template x-for="(cat, i) in categories">
          <div class="flex-1 h-1 rounded-full transition-all"
               :class="i < currentCat ? 'bg-green-400' : i === currentCat ? 'bg-[#FF5722]' : 'bg-slate-200'"></div>
        </template>
      </div>
    </div>

    <!-- Question card -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-6">
      <div class="inline-flex items-center gap-2 bg-[#1A237E]/5 px-4 py-1.5 rounded-full mb-6">
        <span x-html="categories[currentCat].icon" class="text-lg"></span>
        <span class="text-[10px] font-black text-[#1A237E] uppercase tracking-widest"
              x-text="categories[currentCat].label"></span>
      </div>
      <p class="text-lg font-bold text-[#1A237E] leading-relaxed mb-8"
         x-text="currentQuestion?.q"></p>
      <div class="grid grid-cols-1 gap-3">
        <template x-for="(opt, oi) in currentQuestion?.opts">
          <button @click="selectOption(oi)"
            :class="selected === oi
              ? 'border-[#FF5722] bg-orange-50 text-[#FF5722] scale-[1.01]'
              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#1A237E] hover:bg-blue-50'"
            class="w-full text-left px-5 py-4 rounded-2xl border-2 font-medium text-sm transition-all flex items-center gap-4">
            <span class="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black border-2 transition-all"
                  :class="selected === oi ? 'bg-[#FF5722] border-[#FF5722] text-white' : 'border-slate-300 text-slate-400'"
                  x-text="['A','B','C','D'][oi]"></span>
            <span x-text="opt"></span>
          </button>
        </template>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <button @click="prevQ()" x-show="currentQ > 0"
        class="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-500 font-bold text-sm hover:border-slate-400 transition-all">
        ← Sebelumnya
      </button>
      <div x-show="currentQ === 0" class="w-1"></div>
      <button @click="nextQ()"
        :disabled="selected === null"
        :class="selected !== null ? 'bg-[#1A237E] text-white hover:-translate-y-0.5 shadow-lg' : 'bg-slate-100 text-slate-300 cursor-not-allowed'"
        class="px-8 py-3 rounded-xl font-black text-sm uppercase tracking-wider transition-all">
        <span x-text="isLastQ ? 'Lihat Hasil →' : 'Berikutnya →'"></span>
      </button>
    </div>
  </div>

  <!-- SCREEN 3: RESULTS -->
  <div x-show="screen === 'results'" x-transition>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
          <span class="w-2 h-8 bg-[#FF5722] rounded-full"></span>Hasil Analisismu
        </h2>
        <p class="text-slate-400 text-sm mt-1 ml-5">Berdasarkan jawabanmu, berikut profil pengetahuan Alkitabmu.</p>
      </div>
      <button @click="resetAssessment()"
        class="px-5 py-2.5 rounded-xl border-2 border-[#1A237E]/20 text-[#1A237E] font-bold text-xs uppercase tracking-widest hover:border-[#1A237E] transition-all">
        🔄 Ulangi Penilaian
      </button>
    </div>

    <!-- Score cards -->
    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-8">
      <template x-for="(cat, i) in categories">
        <div class="bg-white rounded-2xl p-5 shadow-sm border-b-4 text-center transition-all hover:-translate-y-1"
             :class="scores[i] >= 3 ? 'border-green-400' : scores[i] === 2 ? 'border-yellow-400' : 'border-red-400'">
          <div class="text-3xl mb-2" x-html="cat.icon"></div>
          <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3" x-text="cat.label"></p>
          <!-- Mini bar -->
          <div class="h-2 bg-slate-100 rounded-full mb-2 overflow-hidden">
            <div class="h-full rounded-full transition-all duration-700"
                 :class="scores[i] >= 3 ? 'bg-green-400' : scores[i] === 2 ? 'bg-yellow-400' : 'bg-red-400'"
                 :style="'width:' + (scores[i] / 4 * 100) + '%'"></div>
          </div>
          <p class="text-lg font-black" :class="scores[i] >= 3 ? 'text-green-600' : scores[i] === 2 ? 'text-yellow-600' : 'text-red-500'"
             x-text="scores[i] + '/4'"></p>
          <p class="text-[9px] font-bold mt-1"
             :class="scores[i] >= 3 ? 'text-green-500' : scores[i] === 2 ? 'text-yellow-500' : 'text-red-400'"
             x-text="scores[i] >= 3 ? 'Kuat ✓' : scores[i] === 2 ? 'Cukup ≈' : 'Perlu Latihan !'"></p>
        </div>
      </template>
    </div>

    <!-- Weak areas recommendations -->
    <div class="mb-8">
      <h3 class="text-base font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
        <span class="text-yellow-500"><i class="bi bi-lightbulb-fill"></i></span> Rekomendasi Belajar Untukmu
      </h3>
      <template x-if="weakAreas.length === 0">
        <div class="bg-green-50 border-2 border-green-200 rounded-2xl p-8 text-center">
          <div class="text-5xl mb-3">🎉</div>
          <p class="font-black text-green-700 text-lg">Luar biasa! Kamu sudah menguasai semua bidang.</p>
          <p class="text-green-600 text-sm mt-1">Terus pertahankan dengan mengerjakan game dan materi lanjutan.</p>
        </div>
      </template>
      <template x-if="weakAreas.length > 0">
        <div class="space-y-4">
          <template x-for="area in weakAreas">
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div class="flex items-center gap-3 mb-4">
                <span class="text-2xl" x-html="area.icon"></span>
                <div>
                  <p class="font-black text-[#1A237E] text-sm uppercase tracking-wider" x-text="area.label"></p>
                  <p class="text-xs text-red-400 font-bold" x-text="'Skor: ' + area.score + '/4 — Perlu ditingkatkan'"></p>
                </div>
              </div>
              <!-- Recommended materis -->
              <div x-show="area.materis.length > 0" class="mb-3">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📚 Materi Terkait</p>
                <div class="flex flex-wrap gap-2">
                  <template x-for="m in area.materis">
                    <a :href="'/materi/' + m.id"
                      class="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all">
                      📄 <span x-text="m.title"></span>
                    </a>
                  </template>
                </div>
              </div>
              <!-- Recommended games -->
              <div x-show="area.games.length > 0">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🎮 Game Terkait</p>
                <div class="flex flex-wrap gap-2">
                  <template x-for="g in area.games">
                    <a :href="'/dashboard/games'"
                      class="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all">
                      🎮 <span x-text="g.title"></span>
                    </a>
                  </template>
                </div>
              </div>
              <div x-show="area.materis.length === 0 && area.games.length === 0"
                   class="bg-slate-50 rounded-xl p-3 text-xs text-slate-400 text-center">
                Konten untuk bidang ini sedang disiapkan. Cek kembali nanti!
              </div>
            </div>
          </template>
        </div>
      </template>
    </div>

    <!-- General study plan -->
    <div class="bg-gradient-to-br from-[#1A237E] to-indigo-700 rounded-3xl p-7 text-white">
      <h3 class="font-black text-lg uppercase tracking-widest mb-4 flex items-center gap-2">📅 Rencana Belajar Mingguan</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white/10 rounded-2xl p-4">
          <p class="text-[#FFC107] font-black text-xs uppercase tracking-widest mb-2">Hari 1–2</p>
          <p class="text-sm font-semibold" x-text="weakAreas[0] ? 'Fokus: ' + weakAreas[0].label : 'Pertahankan semua bidang'"></p>
          <p class="text-white/60 text-xs mt-1">Baca materi & coba 1 game terkait</p>
        </div>
        <div class="bg-white/10 rounded-2xl p-4">
          <p class="text-[#FFC107] font-black text-xs uppercase tracking-widest mb-2">Hari 3–4</p>
          <p class="text-sm font-semibold" x-text="weakAreas[1] ? 'Fokus: ' + weakAreas[1].label : 'Eksplorasi konten baru'"></p>
          <p class="text-white/60 text-xs mt-1">Latih dengan kuis & isi kosong</p>
        </div>
        <div class="bg-white/10 rounded-2xl p-4">
          <p class="text-[#FFC107] font-black text-xs uppercase tracking-widest mb-2">Hari 5–7</p>
          <p class="text-sm font-semibold">Review & Pengulangan</p>
          <p class="text-white/60 text-xs mt-1">Ulangi penilaian untuk lihat progres</p>
        </div>
      </div>
    </div>
  </div>

</div>

<script>
window.adaptiveLearning = function() {
  const MATERIS = ${materiJson};
  const GAMES   = ${gameJson};

  const CATEGORIES = [
    { label: "Biblical Knowledge",      icon: "<i class='bi bi-book text-blue-500'></i>", keywords: ["alkitab","biblical","kitab","pengetahuan","perjanjian"] },
    { label: "Eksegesis & Hermeneutik", icon: "<i class='bi bi-search text-purple-500'></i>", keywords: ["eksegesis","hermeneutik","tafsir","interpretasi","konteks"] },
    { label: "Biblical Theory",         icon: "<i class='bi bi-journal-text text-green-500'></i>", keywords: ["teologi","doktrin","theory","trinitas","eschatologi"] },
    { label: "Homiletika",              icon: "<i class='bi bi-mic text-orange-500'></i>", keywords: ["khotbah","homiletika","kotbah","berkhotbah","preach"] },
    { label: "Apologetika",             icon: "<i class='bi bi-shield-check text-red-500'></i>", keywords: ["apologetika","apologetics","pembelaan","iman","argumen"] },
  ];

  const QUESTIONS = [
    // Biblical Knowledge (cat 0)
    { cat:0, q:"Berapa banyak kitab dalam Perjanjian Lama yang kamu ketahui dengan baik?", opts:["Hampir semua (39 kitab)","Sebagian besar","Hanya beberapa","Belum terlalu familier"] },
    { cat:0, q:"Seberapa sering kamu membaca Alkitab setiap minggunya?", opts:["Setiap hari","3–5 kali seminggu","1–2 kali seminggu","Jarang"] },
    { cat:0, q:"Seberapa baik kamu memahami alur cerita besar (meta-narasi) Alkitab?", opts:["Sangat baik","Cukup baik","Masih bingung di beberapa bagian","Belum memahami"] },
    { cat:0, q:"Apakah kamu bisa menjelaskan perbedaan Perjanjian Lama dan Perjanjian Baru?", opts:["Bisa menjelaskan dengan detail","Bisa secara garis besar","Sedikit bisa","Belum bisa"] },
    // Eksegesis (cat 1)
    { cat:1, q:"Apakah kamu tahu cara menganalisis teks Alkitab berdasarkan konteks historisnya?", opts:["Ya, sering saya lakukan","Ya, secara dasar","Pernah belajar tapi lupa","Belum pernah"] },
    { cat:1, q:"Seberapa familiar kamu dengan metode penafsiran literal vs allegoris?", opts:["Sangat familiar","Cukup familiar","Pernah dengar","Belum familiar"] },
    { cat:1, q:"Bisakah kamu membedakan genre sastra dalam Alkitab (puisi, nubuatan, narasi)?", opts:["Bisa membedakan semua","Bisa sebagian besar","Hanya beberapa","Belum bisa"] },
    { cat:1, q:"Apakah kamu pernah mempelajari bahasa asli Alkitab (Ibrani/Yunani) untuk tafsir?", opts:["Ya, cukup mendalam","Sedikit","Hanya dengar istilahnya","Belum sama sekali"] },
    // Biblical Theory (cat 2)
    { cat:2, q:"Seberapa baik pemahamanmu tentang doktrin Trinitas?", opts:["Sangat baik","Cukup baik","Dasar saja","Masih bingung"] },
    { cat:2, q:"Apakah kamu familiar dengan doktrin eschatologi (akhir zaman)?", opts:["Sangat familiar","Cukup familiar","Sedikit","Belum familiar"] },
    { cat:2, q:"Seberapa baik kamu memahami doktrin soteriologi (keselamatan)?", opts:["Sangat baik","Cukup baik","Dasar","Belum mengerti"] },
    { cat:2, q:"Bisakah kamu menjelaskan perbedaan aliran teologi Reformed dan Arminian?", opts:["Bisa menjelaskan detail","Secara garis besar","Pernah dengar saja","Tidak bisa"] },
    // Homiletika (cat 3)
    { cat:3, q:"Seberapa sering kamu menyampaikan khotbah atau renungan?", opts:["Rutin (tiap minggu)","Sesekali","Pernah beberapa kali","Belum pernah"] },
    { cat:3, q:"Apakah kamu memahami struktur khotbah yang efektif?", opts:["Ya, sangat paham","Cukup paham","Sedikit","Belum paham"] },
    { cat:3, q:"Bisakah kamu membuat outline khotbah dari satu perikop Alkitab?", opts:["Bisa dengan mudah","Bisa dengan usaha","Sulit","Belum bisa"] },
    { cat:3, q:"Seberapa nyaman kamu berbicara di depan jemaat?", opts:["Sangat nyaman","Cukup nyaman","Masih gugup","Belum percaya diri"] },
    // Apologetika (cat 4)
    { cat:4, q:"Seberapa siap kamu membela iman Kristen secara rasional?", opts:["Sangat siap","Cukup siap","Perlu belajar lebih","Belum siap"] },
    { cat:4, q:"Apakah kamu familiar dengan argumen-argumen klasik untuk eksistensi Tuhan?", opts:["Sangat familiar","Cukup familiar","Sedikit","Belum familiar"] },
    { cat:4, q:"Bisakah kamu merespons pertanyaan skeptis tentang kekristenan?", opts:["Bisa dengan baik","Bisa beberapa pertanyaan","Kesulitan","Belum bisa"] },
    { cat:4, q:"Seberapa baik pemahamanmu tentang hubungan iman dan sains?", opts:["Sangat baik","Cukup baik","Dasar","Belum mengerti"] },
  ];

  const TOTAL = QUESTIONS.length;

  return {
    screen: 'welcome',
    categories: CATEGORIES,
    questions: QUESTIONS,
    totalQ: TOTAL,
    currentQ: 0,
    selected: null,
    answers: Array(TOTAL).fill(null),
    scores: Array(5).fill(0),
    weakAreas: [],
    get currentCat() { return this.questions[this.currentQ]?.cat ?? 0; },
    get currentQuestion() { return this.questions[this.currentQ]; },
    get isLastQ() { return this.currentQ === TOTAL - 1; },

    init() {
      // restore saved answers if any
      const saved = localStorage.getItem('al_answers');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.length === TOTAL && parsed.every(v => v !== null)) {
            this.answers = parsed;
            this.computeResults();
            this.screen = 'results';
          }
        } catch(e) {}
      }
    },

    startAssessment() {
      this.currentQ = 0;
      this.selected = this.answers[0];
      this.screen = 'assessment';
    },

    selectOption(idx) { this.selected = idx; },

    nextQ() {
      if (this.selected === null) return;
      this.answers[this.currentQ] = this.selected;
      if (this.isLastQ) {
        localStorage.setItem('al_answers', JSON.stringify(this.answers));
        this.computeResults();
        this.screen = 'results';
      } else {
        this.currentQ++;
        this.selected = this.answers[this.currentQ];
      }
    },

    prevQ() {
      if (this.currentQ > 0) {
        this.answers[this.currentQ] = this.selected;
        this.currentQ--;
        this.selected = this.answers[this.currentQ];
      }
    },

    computeResults() {
      // Score = number of "strong" answers (opt 0 or 1 = strong, 2 = medium, 3 = weak)
      const catScores = Array(5).fill(0);
      this.questions.forEach((q, i) => {
        const ans = this.answers[i];
        if (ans === 0) catScores[q.cat] += 4;
        else if (ans === 1) catScores[q.cat] += 3;
        else if (ans === 2) catScores[q.cat] += 1;
        else catScores[q.cat] += 0;
      });
      // Normalize to /4 scale
      this.scores = catScores.map(s => Math.round(s / 4));

      // Build weak areas with recommendations using DB categories
      this.weakAreas = [];
      CATEGORIES.forEach((cat, i) => {
        if (this.scores[i] < 3) {
          const relMateris = MATERIS.filter(m =>
            (m.categories || []).includes(cat.label) ||
            (m.category === cat.label)
          ).slice(0, 3);
          const relGames = GAMES.filter(g =>
            (g.categories || []).includes(cat.label) ||
            (g.category === cat.label)
          ).slice(0, 2);
          this.weakAreas.push({ ...cat, score: this.scores[i], materis: relMateris, games: relGames });
        }
      });
      // Sort weakest first
      this.weakAreas.sort((a, b) => a.score - b.score);
    },

    resetAssessment() {
      localStorage.removeItem('al_answers');
      this.answers = Array(TOTAL).fill(null);
      this.scores = Array(5).fill(0);
      this.weakAreas = [];
      this.currentQ = 0;
      this.selected = null;
      this.screen = 'welcome';
    },
  };
};
</script>
  `;
};
