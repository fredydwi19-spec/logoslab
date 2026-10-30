// Preview Adventure untuk tim proyek (Pakar, Ketua, Simulasi Pembuat). Tim menerima cerita lengkap,
// jadi alur dimainkan langsung di browser. Pemain di /play tetap memakai alur dari server.
export const AdventurePreviewScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('adv_preview_init')) return;
        Alpine.store('adv_preview_init', true);

        const SCENE_LABELS = { STORY: 'Cerita', CHALLENGE: 'Tantangan', ENDING: 'Akhir' };

        Alpine.data('adventurePreview', (data) => ({
          scenes: (data && data.scenes) || [],
          tab: 'play',
          current: null,
          history: [],
          feedback: null,

          init() {
            this.restart();
          },

          restart() {
            this.current = this.scenes.find(s => s.isStart) || null;
            this.history = [];
            this.feedback = null;
          },

          sceneLabel(type) {
            return SCENE_LABELS[type] || type;
          },

          sceneByKey(key) {
            return this.scenes.find(s => s.sceneKey === key) || null;
          },

          targetName(key) {
            const target = this.sceneByKey(key);
            return target ? target.sceneKey + ' · ' + (target.title || this.sceneLabel(target.sceneType)) : (key ? key + ' (tidak ada)' : '(belum diisi)');
          },

          goTo(key, decision) {
            this.history.push({ key: this.current.sceneKey, title: this.current.title, decision });
            this.current = this.sceneByKey(key);
            this.feedback = null;
          },

          choose(index) {
            const choice = this.current.choices[index];
            this.goTo(choice.next, choice.text);
          },

          answer(opt) {
            if (this.feedback) return;
            const isCorrect = opt === this.current.correctAnswer;
            this.feedback = { selected: opt, isCorrect, next: isCorrect ? this.current.nextCorrect : this.current.nextWrong };
          },

          continueStory() {
            this.goTo(this.feedback.next, this.feedback.isCorrect ? 'menjawab benar' : 'menjawab salah');
          }
        }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

const typeBorder = "{ 'border-blue-200': %s.sceneType === 'STORY', 'border-highlight': %s.sceneType === 'CHALLENGE', 'border-green-200': %s.sceneType === 'ENDING' }";
const typeBadge = "{ 'bg-blue-100 text-blue-800': %s.sceneType === 'STORY', 'bg-highlight text-primary': %s.sceneType === 'CHALLENGE', 'bg-green-100 text-green-800': %s.sceneType === 'ENDING' }";
const forScene = (template: string, name: string) => template.split("%s").join(name);

export const AdventurePreview = ({ gameDataVar = 'gameData', note = '' }: { gameDataVar?: string; note?: string }) => {
  return `
    <div x-data="adventurePreview(${gameDataVar})" class="w-full max-w-3xl mx-auto text-left space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <button type="button" @click="tab = 'play'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="tab === 'play' ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'"><i class="bi bi-play-fill"></i> Mainkan</button>
        <button type="button" @click="tab = 'list'" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="tab === 'list' ? 'bg-primary text-highlight' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'"><i class="bi bi-list-ul"></i> <span x-text="'Semua Scene (' + scenes.length + ')'"></span></button>
        <button type="button" x-show="tab === 'play'" @click="restart()" class="sm:ml-auto px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-white text-primary border-2 border-slate-200 hover:border-primary"><i class="bi bi-arrow-counterclockwise"></i> Mulai Ulang</button>
      </div>
      ${note ? `<p class="text-[11px] font-bold text-slate-500">${note}</p>` : ''}

      <!-- Mainkan -->
      <template x-if="tab === 'play'">
        <div>
          <p x-show="!current" class="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-sm font-bold text-accent-hover">Cerita ini belum punya scene awal, atau pilihan menuju scene yang tidak ada.</p>
          <template x-if="current">
            <div class="bg-white rounded-2xl border-2 shadow-sm p-5 md:p-6" :class="${forScene(typeBorder, 'current')}">
              <div class="flex flex-wrap items-center gap-2 mb-3">
                <span class="bg-primary text-highlight px-3 py-1 rounded-lg text-xs font-black" x-text="current.sceneKey"></span>
                <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest" :class="${forScene(typeBadge, 'current')}" x-text="sceneLabel(current.sceneType)"></span>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest" x-text="'Langkah ' + (history.length + 1)"></span>
              </div>
              <h3 class="text-lg font-bold text-primary mb-2" x-text="current.title"></h3>
              <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-line" x-text="current.content"></p>

              <template x-if="current.sceneType === 'STORY'">
                <div class="mt-5 space-y-2">
                  <template x-for="(choice, ci) in current.choices" :key="ci">
                    <button type="button" @click="choose(ci)" class="w-full text-left border-2 border-slate-200 hover:border-highlight hover:bg-yellow-50 rounded-xl p-3 text-sm font-semibold text-primary flex items-center gap-3">
                      <span class="h-7 w-7 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 text-xs" x-text="ci + 1"></span>
                      <span class="flex-1" x-text="choice.text"></span>
                      <span class="text-[10px] font-black text-slate-400" x-text="'→ ' + (choice.next || '?')"></span>
                    </button>
                  </template>
                </div>
              </template>

              <template x-if="current.sceneType === 'CHALLENGE'">
                <div class="mt-5">
                  <p class="font-bold text-primary mb-3" x-text="current.question"></p>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <template x-for="opt in ['A', 'B', 'C', 'D']" :key="opt">
                      <button type="button" @click="answer(opt)" :disabled="!!feedback" class="border-2 p-3 rounded-xl text-left flex items-center gap-3 disabled:cursor-default"
                        :class="{ 'border-green-500 bg-green-50': feedback && opt === current.correctAnswer, 'border-red-500 bg-red-50': feedback && feedback.selected === opt && opt !== current.correctAnswer, 'border-slate-200 bg-white hover:border-primary': !feedback }">
                        <span class="h-7 w-7 shrink-0 rounded-lg flex items-center justify-center font-bold text-xs" :class="feedback && opt === current.correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'" x-text="opt"></span>
                        <span class="text-sm font-semibold text-primary" x-text="current['option' + opt]"></span>
                      </button>
                    </template>
                  </div>
                  <div x-show="feedback" class="mt-4 p-4 rounded-xl border-2 border-dashed" :class="feedback?.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                    <p class="font-black uppercase tracking-widest text-xs mb-1" :class="feedback?.isCorrect ? 'text-green-800' : 'text-red-800'" x-text="feedback?.isCorrect ? 'Jawaban tepat' : 'Belum tepat'"></p>
                    <p class="text-sm text-slate-700 italic" x-text="current.explanation"></p>
                    <div class="mt-3 flex justify-end">
                      <button type="button" @click="continueStory()" class="bg-primary text-white px-5 py-2 rounded-full font-black uppercase tracking-widest text-xs hover:bg-primary-dark flex items-center gap-2">Lanjutkan <span x-text="'→ ' + (feedback?.next || '?')"></span></button>
                    </div>
                  </div>
                </div>
              </template>

              <template x-if="current.sceneType === 'ENDING'">
                <div class="mt-5 space-y-3">
                  <div class="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    <div class="text-2xl font-black" :class="(current.endingScore ?? 0) >= (activeProject?.passPercentage || 70) ? 'text-green-600' : 'text-accent'" x-text="current.endingScore ?? '-'"></div>
                    <div class="text-xs font-bold text-slate-500" x-text="'Nilai ending. Nilai minimal lulus: ' + (activeProject?.passPercentage || 70)"></div>
                  </div>
                  <blockquote class="border-l-4 border-highlight bg-yellow-50 rounded-r-xl p-3 text-sm font-semibold text-primary italic whitespace-pre-line" x-text="current.verse"></blockquote>
                  <p class="text-sm text-slate-600"><span class="font-black text-primary">Ajakan refleksi:</span> <span x-text="current.reflection"></span></p>
                </div>
              </template>
            </div>
          </template>

          <div x-show="history.length > 0" class="mt-4 text-xs text-slate-500">
            <p class="font-black uppercase tracking-widest text-[10px] text-slate-400 mb-2">Jejak keputusan</p>
            <ol class="space-y-1 list-decimal pl-5">
              <template x-for="(step, si) in history" :key="si">
                <li><span class="font-bold text-slate-600" x-text="step.key + ' ' + step.title"></span>: <span x-text="step.decision"></span></li>
              </template>
            </ol>
          </div>
        </div>
      </template>

      <!-- Semua scene (untuk review isi lengkap) -->
      <template x-if="tab === 'list'">
        <div class="space-y-3">
          <template x-for="scene in scenes" :key="scene.sceneKey">
            <div class="bg-white rounded-xl border-2 p-4 space-y-2" :class="${forScene(typeBorder, 'scene')}">
              <div class="flex flex-wrap items-center gap-2">
                <span class="bg-primary text-highlight px-2 py-0.5 rounded-lg text-xs font-black" x-text="scene.sceneKey"></span>
                <span class="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest" :class="${forScene(typeBadge, 'scene')}" x-text="sceneLabel(scene.sceneType)"></span>
                <span x-show="scene.isStart" class="text-[10px] font-black uppercase tracking-widest text-accent">Scene awal</span>
              </div>
              <p class="font-bold text-primary" x-text="scene.title"></p>
              <p class="text-sm text-slate-700 whitespace-pre-line" x-text="scene.content"></p>
              <template x-if="scene.sceneType === 'STORY'">
                <ul class="text-xs space-y-1">
                  <template x-for="(choice, ci) in scene.choices" :key="ci">
                    <li class="text-slate-600"><span class="font-bold" x-text="(ci + 1) + '. ' + choice.text"></span> <span class="text-slate-400" x-text="'→ ' + targetName(choice.next)"></span></li>
                  </template>
                </ul>
              </template>
              <template x-if="scene.sceneType === 'CHALLENGE'">
                <div class="text-xs space-y-1">
                  <p class="font-bold text-primary" x-text="scene.question"></p>
                  <template x-for="opt in ['A', 'B', 'C', 'D']" :key="opt">
                    <p :class="opt === scene.correctAnswer ? 'text-green-700 font-black' : 'text-slate-600'" x-text="opt + '. ' + scene['option' + opt] + (opt === scene.correctAnswer ? '  (kunci)' : '')"></p>
                  </template>
                  <p class="italic text-slate-500" x-text="'Penjelasan: ' + (scene.explanation || '-')"></p>
                  <p class="text-green-700 font-bold" x-text="'Benar → ' + targetName(scene.nextCorrect)"></p>
                  <p class="text-red-700 font-bold" x-text="'Salah → ' + targetName(scene.nextWrong)"></p>
                </div>
              </template>
              <template x-if="scene.sceneType === 'ENDING'">
                <div class="text-xs space-y-1 text-slate-600">
                  <p class="font-black" x-text="'Nilai ending: ' + (scene.endingScore ?? '-')"></p>
                  <p class="italic" x-text="'Ayat: ' + (scene.verse || '-')"></p>
                  <p x-text="'Ajakan refleksi: ' + (scene.reflection || '-')"></p>
                </div>
              </template>
            </div>
          </template>
        </div>
      </template>
    </div>
  `;
};
