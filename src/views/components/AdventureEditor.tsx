export const AdventureEditorScript = () => `
  <script>
    (function() {
      const init = () => {
        if (typeof Alpine === 'undefined') return;
        if (Alpine.store('adv_editor_init')) return;
        Alpine.store('adv_editor_init', true);

        const SCENE_LABELS = { STORY: 'Cerita', CHALLENGE: 'Tantangan', ENDING: 'Akhir' };

        Alpine.data('adventureEditor', (project) => ({
          projectId: project ? project.id : null,
          passPercentage: project ? (project.passPercentage || 70) : 70,
          scenes: [],
          errors: [],
          isChecking: false,
          checkTimer: null,
          isSaving: false,
          saveStatus: 'SYNCHRONIZED', // SYNCHRONIZED, LOCAL SAVED, UPLOADING, CLOUD SYNCED
          level: 1,
          levelCount: 1,
          savedSnapshot: '',
          showFlowMap: false,
          // Pilih soal dari Bank Soal Quiz untuk scene Tantangan
          bankPickerScene: null,
          bankQuestions: [],
          bankSearch: '',
          bankLoading: false,
          // Terbit bertahap: level <= publishedLevelCount dikunci saat game sudah terbit
          projectStatus: project ? project.status : null,
          levelReviewStatus: project ? project.levelReviewStatus : null,
          publishedLevelCount: project && project.status === 'PUBLISHED' ? (project.publishedLevelCount || 0) : 0,

          async init() {
            if (!this.projectId) return;
            await this.loadLevel(this.canEdit() && this.publishedLevelCount > 0 ? this.publishedLevelCount + 1 : 1);
            this.$watch('scenes', () => {
              if (this.isLocked()) return;
              this.localSave();
              this.scheduleCheck();
            });
          },

          // --- Level: satu cerita per level ---
          canEdit() {
            const editable = ['DRAFT', 'REVISI_PAKAR', 'REVISI_KETUA'];
            return editable.includes(this.projectStatus) || (this.projectStatus === 'PUBLISHED' && editable.includes(this.levelReviewStatus));
          },

          isLocked() {
            return !this.canEdit() || this.level <= this.publishedLevelCount;
          },

          draftKey() {
            return 'adventure_draft_' + this.projectId + '_L' + this.level;
          },

          snapshot() {
            return JSON.stringify(this.scenes);
          },

          isDirty() {
            return this.snapshot() !== this.savedSnapshot;
          },

          async loadLevel(level) {
            const res = await fetch('/api/adventure/' + this.projectId + '?level=' + level);
            const json = await res.json().catch(() => ({}));
            if (!res.ok) { alert(json.error || 'Gagal memuat cerita.'); return; }
            this.level = level;
            this.levelCount = Math.max(this.levelCount, json.levelCount || 1, level);
            this.scenes = json.scenes || [];
            this.errors = json.errors || [];
            this.savedSnapshot = this.snapshot();
            this.saveStatus = 'SYNCHRONIZED';

            let draft = null;
            try { draft = JSON.parse(localStorage.getItem(this.draftKey()) || 'null'); } catch (e) { draft = null; }
            if (draft && !this.isLocked() && JSON.stringify(draft) !== this.savedSnapshot) {
              if (confirm('Ditemukan perubahan cerita Level ' + level + ' yang belum tersimpan di cloud. Ingin memulihkan?')) {
                this.scenes = draft;
                this.saveStatus = 'LOCAL SAVED';
                this.scheduleCheck();
              } else {
                try { localStorage.removeItem(this.draftKey()); } catch (e) {}
              }
            }
          },

          async switchLevel(level) {
            if (level === this.level) return;
            if (this.isDirty() && !confirm('Perubahan Level ' + this.level + ' belum disimpan ke cloud (masih tersimpan sementara di browser). Tetap pindah level?')) return;
            await this.loadLevel(level);
          },

          addLevel() {
            this.switchLevel(this.levelCount + 1);
          },

          localSave() {
            if (!this.isDirty()) return;
            try { localStorage.setItem(this.draftKey(), this.snapshot()); } catch (e) {}
            this.saveStatus = 'LOCAL SAVED';
          },

          // --- Scene ---
          sceneLabel(type) {
            return SCENE_LABELS[type] || type;
          },

          nextSceneKey() {
            const numbers = this.scenes.map(s => Number(String(s.sceneKey).replace(/^S/, ''))).filter(n => Number.isInteger(n));
            return 'S' + (Math.max(0, ...numbers) + 1);
          },

          addScene(type) {
            if (this.isLocked()) return;
            const scene = {
              sceneKey: this.nextSceneKey(), sceneType: type, isStart: this.scenes.length === 0,
              title: '', content: '',
              choices: type === 'STORY' ? [{ text: '', next: '' }, { text: '', next: '' }] : [],
              question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: null, explanation: '',
              nextCorrect: '', nextWrong: '',
              endingScore: type === 'ENDING' ? 100 : null, verse: '', reflection: ''
            };
            this.scenes.push(scene);
            this.$nextTick(() => {
              const el = document.getElementById('adv-scene-' + scene.sceneKey);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
          },

          removeScene(scene) {
            if (this.isLocked()) return;
            const used = this.scenes.some(s => s !== scene && this.edgesOf(s).some(e => e.target === scene.sceneKey));
            if (!confirm('Hapus scene ' + scene.sceneKey + (scene.title ? ' (' + scene.title + ')' : '') + '?' + (used ? ' Pilihan yang menuju scene ini akan dikosongkan.' : ''))) return;
            const key = scene.sceneKey;
            this.scenes = this.scenes.filter(s => s !== scene);
            this.scenes.forEach(s => {
              s.choices.forEach(c => { if (c.next === key) c.next = ''; });
              if (s.nextCorrect === key) s.nextCorrect = '';
              if (s.nextWrong === key) s.nextWrong = '';
            });
            if (scene.isStart && this.scenes.length > 0 && !this.scenes.some(s => s.isStart)) this.scenes[0].isStart = true;
          },

          setStart(scene) {
            if (this.isLocked()) return;
            this.scenes.forEach(s => { s.isStart = s === scene; });
          },

          addChoice(scene) {
            if (scene.choices.length < 4) scene.choices.push({ text: '', next: '' });
          },

          removeChoice(scene, index) {
            if (scene.choices.length > 2) scene.choices.splice(index, 1);
          },

          // Pilihan tujuan untuk dropdown "menuju scene" (semua scene lain)
          targetsFor(scene) {
            return this.scenes.filter(s => s !== scene);
          },

          targetName(key) {
            const target = this.scenes.find(s => s.sceneKey === key);
            return target ? target.sceneKey + ' · ' + this.sceneLabel(target.sceneType) + (target.title ? ': ' + target.title : '') : '';
          },

          // --- Pemeriksa alur (aturannya di server: /api/adventure/:id/check) ---
          scheduleCheck() {
            clearTimeout(this.checkTimer);
            this.checkTimer = setTimeout(() => this.runCheck(), 600);
          },

          async runCheck() {
            this.isChecking = true;
            try {
              const res = await fetch('/api/adventure/' + this.projectId + '/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scenes: this.scenes })
              });
              const json = await res.json();
              if (res.ok) this.errors = json.errors || [];
            } catch (e) {
              console.error('Pemeriksa alur gagal:', e);
            } finally {
              this.isChecking = false;
            }
          },

          // --- Peta alur: scene dikelompokkan per langkah dari scene awal ---
          edgesOf(scene) {
            if (scene.sceneType === 'STORY') return scene.choices.map((c, i) => ({ label: c.text || ('Pilihan ' + (i + 1)), target: c.next, tone: 'neutral' }));
            if (scene.sceneType === 'CHALLENGE') return [{ label: 'Benar', target: scene.nextCorrect, tone: 'good' }, { label: 'Salah', target: scene.nextWrong, tone: 'bad' }];
            return [];
          },

          flowLayers() {
            const start = this.scenes.find(s => s.isStart);
            if (!start) return [];
            const seen = new Set([start.sceneKey]);
            const layers = [[start]];
            while (true) {
              const next = [];
              layers[layers.length - 1].forEach(scene => {
                this.edgesOf(scene).forEach(edge => {
                  const target = this.scenes.find(s => s.sceneKey === edge.target);
                  if (target && !seen.has(target.sceneKey)) { seen.add(target.sceneKey); next.push(target); }
                });
              });
              if (next.length === 0) break;
              layers.push(next);
            }
            return layers;
          },

          unreachableScenes() {
            const reached = new Set(this.flowLayers().flat().map(s => s.sceneKey));
            return this.scenes.filter(s => !reached.has(s.sceneKey));
          },

          // --- Bank Soal ---
          async openBankPicker(scene) {
            this.bankPickerScene = scene;
            this.bankSearch = '';
            if (this.bankQuestions.length > 0) return;
            this.bankLoading = true;
            try {
              const res = await fetch('/api/bank-soal/quiz');
              const json = await res.json();
              if (res.ok) this.bankQuestions = json.data || [];
              else alert(json.error || 'Gagal memuat Bank Soal.');
            } catch (e) {
              alert('Gagal memuat Bank Soal.');
            } finally {
              this.bankLoading = false;
            }
          },

          filteredBankQuestions() {
            const q = this.bankSearch.trim().toLowerCase();
            return q ? this.bankQuestions.filter(b => (b.question || '').toLowerCase().includes(q)) : this.bankQuestions;
          },

          // Soal disalin ke scene; mengubah Bank Soal nanti tidak mengubah cerita yang sudah dibuat
          useBankQuestion(bank) {
            const scene = this.bankPickerScene;
            if (!scene) return;
            ['question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer'].forEach(field => { scene[field] = bank[field] || ''; });
            scene.explanation = bank.explanation || '';
            this.bankPickerScene = null;
          },

          async saveToServer() {
            if (this.isLocked()) { alert('Level ini tidak bisa diubah.'); return; }
            this.isSaving = true;
            this.saveStatus = 'UPLOADING';
            try {
              const res = await fetch('/api/adventure/' + this.projectId + '/scenes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ level: this.level, scenes: this.scenes })
              });
              const json = await res.json().catch(() => ({}));
              if (res.ok) {
                try { localStorage.removeItem(this.draftKey()); } catch (e) {}
                this.savedSnapshot = this.snapshot();
                this.errors = json.errors || [];
                this.saveStatus = 'CLOUD SYNCED';
                setTimeout(() => { this.saveStatus = 'SYNCHRONIZED'; }, 3000);
              } else {
                alert(json.error || 'Gagal menyimpan ke cloud.');
                this.saveStatus = 'LOCAL SAVED';
              }
            } catch (e) {
              alert('Terjadi kesalahan jaringan.');
              this.saveStatus = 'LOCAL SAVED';
            } finally {
              this.isSaving = false;
            }
          }
        }));
      };
      if (window.Alpine) init();
      else document.addEventListener('alpine:init', init);
    })();
  </script>
`;

// Dropdown "menuju scene" untuk satu tujuan (pilihan cerita, jawaban benar, atau jawaban salah)
const TargetSelect = (model: string) => `
  <select x-model="${model}" :disabled="isLocked()" class="w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 bg-white focus:border-primary outline-none disabled:bg-slate-50">
    <option value="">-- Menuju scene --</option>
    <template x-for="t in targetsFor(scene)" :key="t.sceneKey">
      <option :value="t.sceneKey" :selected="t.sceneKey === ${model}" x-text="targetName(t.sceneKey)"></option>
    </template>
  </select>
`;

const inputClass = "w-full border-2 border-slate-200 rounded-lg p-2.5 text-sm text-slate-700 bg-white focus:border-primary outline-none disabled:bg-slate-50";
const labelClass = "block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1";

export const AdventureEditor = ({ projectVar = 'activeProject' }: { projectVar?: string }) => {
  return `
    <div x-data="adventureEditor(${projectVar})" class="space-y-6 animate-in fade-in duration-500">
      <!-- Tab Level: satu cerita per level -->
      <div class="flex flex-wrap items-center gap-2 bg-slate-50 p-4 rounded-2xl border-2 border-slate-200">
        <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-1">Level</span>
        <template x-for="l in levelCount" :key="l">
          <button type="button" @click="switchLevel(l)" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all" :class="level === l ? 'bg-primary text-highlight shadow-md' : 'bg-white text-slate-600 border-2 border-slate-200 hover:border-primary'" x-text="'Level ' + l + (l <= publishedLevelCount ? ' · terbit' : '')"></button>
        </template>
        <button type="button" x-show="canEdit()" @click="addLevel()" class="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-dashed border-accent text-accent hover:bg-accent hover:text-white transition-all">+ Tambah Level</button>
        <span class="sm:ml-auto text-[10px] text-slate-400 font-bold">Setiap level berisi satu cerita. Simpan ke cloud sebelum pindah level.</span>
      </div>
      <div x-show="isLocked()" class="flex items-center gap-3 bg-green-50 border-2 border-green-200 text-green-800 p-4 rounded-2xl text-xs font-bold">
        <i class="bi bi-lock-fill text-lg"></i>
        <span x-text="level <= publishedLevelCount ? 'Level ' + level + ' sudah terbit dan sedang dimainkan, jadi tidak bisa diubah.' : 'Proyek sedang direview atau sudah terbit, jadi cerita tidak bisa diubah.'"></span>
      </div>

      <!-- Judul editor dan tombol utama -->
      <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 bg-highlight rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
            <i class="bi bi-signpost-split text-primary text-xl"></i>
          </div>
          <div>
            <h2 class="text-lg font-black text-primary uppercase tracking-tighter leading-none">Editor Adventure Studi Kasus</h2>
            <div class="flex items-center gap-2 mt-2">
              <span class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]" x-text="scenes.length + ' scene'"></span>
              <span class="h-1 w-1 bg-slate-300 rounded-full"></span>
              <span :class="{
                'text-green-500': saveStatus === 'SYNCHRONIZED' || saveStatus === 'CLOUD SYNCED',
                'text-orange-500': saveStatus === 'LOCAL SAVED',
                'text-blue-500': saveStatus === 'UPLOADING'
              }" class="text-[9px] font-black uppercase tracking-widest" x-text="saveStatus"></span>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-3 w-full xl:w-auto">
          <button type="button" @click="showFlowMap = !showFlowMap" class="flex-1 xl:flex-none bg-white text-primary border-2 border-slate-200 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-primary transition-all flex items-center justify-center gap-2">
            <i class="bi bi-diagram-3"></i> <span x-text="showFlowMap ? 'Tutup Peta Alur' : 'Lihat Peta Alur'"></span>
          </button>
          <button type="button" x-show="!isLocked()" @click="saveToServer()" :disabled="isSaving" class="flex-1 xl:flex-none bg-accent text-white px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-accent-hover transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">
            <i class="bi bi-cloud-upload"></i> <span x-text="isSaving ? 'UPLOADING...' : 'SIMPAN KE CLOUD'"></span>
          </button>
        </div>
      </div>

      <!-- Pemeriksa alur otomatis -->
      <div class="rounded-2xl border-2 p-4" :class="errors.length === 0 ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'">
        <div class="flex items-center gap-2 text-xs font-black uppercase tracking-widest" :class="errors.length === 0 ? 'text-green-800' : 'text-accent-hover'">
          <i class="bi" :class="errors.length === 0 ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'"></i>
          <span x-text="errors.length === 0 ? 'Pemeriksa alur: cerita siap dikirim ke Pakar' : 'Pemeriksa alur: ' + errors.length + ' hal perlu diperbaiki'"></span>
          <span x-show="isChecking" class="ml-auto text-[10px] text-slate-400 normal-case tracking-normal">memeriksa…</span>
        </div>
        <ul x-show="errors.length > 0" class="mt-3 space-y-1 text-xs font-semibold text-slate-700 list-disc pl-5 max-h-48 overflow-y-auto">
          <template x-for="(err, i) in errors" :key="i"><li x-text="err"></li></template>
        </ul>
        <p class="mt-2 text-[10px] text-slate-500 font-bold" x-text="'Nilai level = nilai ending yang dicapai pemain. Nilai minimal lulus: ' + passPercentage + '.'"></p>
      </div>

      <!-- Peta alur -->
      <div x-show="showFlowMap" x-transition class="bg-white rounded-2xl border-2 border-slate-100 p-4 shadow-sm">
        <h3 class="text-xs font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2"><i class="bi bi-diagram-3"></i> Peta Alur</h3>
        <p x-show="flowLayers().length === 0" class="text-xs text-slate-400 font-bold">Tandai satu scene sebagai scene awal untuk melihat peta alur.</p>
        <div class="overflow-x-auto pb-2">
          <div class="flex gap-4 min-w-max">
            <template x-for="(layer, li) in flowLayers()" :key="li">
              <div class="w-56 space-y-3">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest" x-text="li === 0 ? 'Awal' : 'Langkah ' + (li + 1)"></div>
                <template x-for="scene in layer" :key="scene.sceneKey">
                  <a :href="'#adv-scene-' + scene.sceneKey" class="block rounded-xl border-2 p-3 hover:shadow-md transition-all"
                     :class="{ 'border-blue-200 bg-blue-50': scene.sceneType === 'STORY', 'border-highlight bg-yellow-50': scene.sceneType === 'CHALLENGE', 'border-green-200 bg-green-50': scene.sceneType === 'ENDING' }">
                    <div class="text-[10px] font-black uppercase tracking-widest text-slate-500" x-text="scene.sceneKey + ' · ' + sceneLabel(scene.sceneType) + (scene.sceneType === 'ENDING' ? ' · nilai ' + (scene.endingScore ?? '-') : '')"></div>
                    <div class="text-sm font-bold text-primary truncate" x-text="scene.title || '(tanpa judul)'"></div>
                    <template x-for="(edge, ei) in edgesOf(scene)" :key="ei">
                      <div class="mt-1 text-[11px] font-semibold flex gap-1" :class="{ 'text-green-700': edge.tone === 'good', 'text-red-700': edge.tone === 'bad', 'text-slate-600': edge.tone === 'neutral' }">
                        <span class="truncate" x-text="edge.label"></span><span class="shrink-0" x-text="'→ ' + (edge.target || '?')"></span>
                      </div>
                    </template>
                  </a>
                </template>
              </div>
            </template>
          </div>
        </div>
        <div x-show="unreachableScenes().length > 0" class="mt-3 text-xs font-bold text-red-700">
          Tidak tercapai dari scene awal: <span x-text="unreachableScenes().map(s => s.sceneKey).join(', ')"></span>
        </div>
      </div>

      <div x-show="scenes.length === 0" class="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase">
        <span x-text="'Level ' + level + ' belum berisi scene. Mulai dengan scene Cerita.'"></span>
      </div>

      <!-- Kartu scene -->
      <template x-for="scene in scenes" :key="scene.sceneKey">
        <div :id="'adv-scene-' + scene.sceneKey" class="bg-white border-2 rounded-2xl p-4 md:p-6 shadow-sm space-y-4 scroll-mt-24"
             :class="{ 'border-blue-200': scene.sceneType === 'STORY', 'border-highlight': scene.sceneType === 'CHALLENGE', 'border-green-200': scene.sceneType === 'ENDING' }">
          <div class="flex flex-wrap items-center gap-2">
            <span class="bg-primary text-highlight px-3 py-1 rounded-lg text-xs font-black" x-text="scene.sceneKey"></span>
            <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest"
                  :class="{ 'bg-blue-100 text-blue-800': scene.sceneType === 'STORY', 'bg-highlight text-primary': scene.sceneType === 'CHALLENGE', 'bg-green-100 text-green-800': scene.sceneType === 'ENDING' }"
                  x-text="sceneLabel(scene.sceneType)"></span>
            <label x-show="scene.sceneType !== 'ENDING'" class="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer">
              <input type="radio" :name="'adv-start-' + level" :checked="scene.isStart" @change="setStart(scene)" :disabled="isLocked()"> Scene awal
            </label>
            <button type="button" x-show="!isLocked()" @click="removeScene(scene)" class="ml-auto text-red-600 hover:bg-red-50 px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1"><i class="bi bi-trash"></i> Hapus</button>
          </div>

          <div>
            <label class="${labelClass}">Judul scene</label>
            <input type="text" x-model="scene.title" :disabled="isLocked()" maxlength="255" class="${inputClass}" placeholder="Contoh: Ajakan menyontek">
          </div>
          <div>
            <label class="${labelClass}" x-text="scene.sceneType === 'ENDING' ? 'Isi ending' : 'Isi cerita'"></label>
            <textarea x-model="scene.content" :disabled="isLocked()" rows="3" class="${inputClass}" placeholder="Ceritakan situasinya..."></textarea>
          </div>

          <!-- Cerita: 2-4 pilihan -->
          <template x-if="scene.sceneType === 'STORY'">
            <div class="space-y-3">
              <label class="${labelClass}">Pilihan pemain (2–4)</label>
              <template x-for="(choice, ci) in scene.choices" :key="ci">
                <div class="grid grid-cols-1 md:grid-cols-12 gap-2 items-center bg-slate-50 p-3 rounded-xl">
                  <span class="md:col-span-1 text-xs font-black text-slate-400" x-text="(ci + 1) + '.'"></span>
                  <input type="text" x-model="choice.text" :disabled="isLocked()" maxlength="255" class="md:col-span-5 ${inputClass}" placeholder="Teks pilihan">
                  <div class="md:col-span-5">${TargetSelect('choice.next')}</div>
                  <button type="button" x-show="!isLocked() && scene.choices.length > 2" @click="removeChoice(scene, ci)" class="md:col-span-1 text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Hapus pilihan"><i class="bi bi-x-lg"></i></button>
                </div>
              </template>
              <button type="button" x-show="!isLocked() && scene.choices.length < 4" @click="addChoice(scene)" class="text-xs font-black text-accent uppercase tracking-widest">+ Tambah pilihan</button>
            </div>
          </template>

          <!-- Tantangan: soal pilihan ganda -->
          <template x-if="scene.sceneType === 'CHALLENGE'">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <label class="${labelClass} mb-0">Soal tantangan</label>
                <button type="button" x-show="!isLocked()" @click="openBankPicker(scene)" class="bg-white text-primary border-2 border-slate-200 hover:border-primary px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><i class="bi bi-bank"></i> Ambil dari Bank Soal</button>
              </div>
              <textarea x-model="scene.question" :disabled="isLocked()" rows="2" class="${inputClass}" placeholder="Tulis soal, atau ambil dari Bank Soal"></textarea>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                <template x-for="opt in ['A', 'B', 'C', 'D']" :key="opt">
                  <div class="flex items-center gap-2">
                    <span class="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-xs font-black" :class="scene.correctAnswer === opt ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'" x-text="opt"></span>
                    <input type="text" x-model="scene['option' + opt]" :disabled="isLocked()" maxlength="255" class="${inputClass}" :placeholder="'Opsi ' + opt">
                  </div>
                </template>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="${labelClass}">Kunci jawaban</label>
                  <select x-model="scene.correctAnswer" :disabled="isLocked()" class="${inputClass} font-bold">
                    <option value="">-- Pilih --</option>
                    <template x-for="opt in ['A', 'B', 'C', 'D']" :key="opt"><option :value="opt" :selected="scene.correctAnswer === opt" x-text="opt"></option></template>
                  </select>
                </div>
                <div>
                  <label class="${labelClass} text-green-700">Jika benar, menuju</label>
                  ${TargetSelect('scene.nextCorrect')}
                </div>
                <div>
                  <label class="${labelClass} text-red-700">Jika salah, menuju</label>
                  ${TargetSelect('scene.nextWrong')}
                </div>
              </div>
              <div>
                <label class="${labelClass}">Penjelasan (tampil setelah menjawab)</label>
                <textarea x-model="scene.explanation" :disabled="isLocked()" rows="2" class="${inputClass}"></textarea>
              </div>
            </div>
          </template>

          <!-- Akhir: nilai, ayat, refleksi -->
          <template x-if="scene.sceneType === 'ENDING'">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="${labelClass}">Nilai ending (0–100)</label>
                <input type="number" min="0" max="100" x-model.number="scene.endingScore" :disabled="isLocked()" class="${inputClass} font-black">
                <p class="mt-1 text-[10px] font-bold" :class="(scene.endingScore ?? 0) >= passPercentage ? 'text-green-700' : 'text-slate-500'" x-text="(scene.endingScore ?? 0) >= passPercentage ? 'Pemain lulus jika mencapai ending ini' : 'Pemain belum lulus jika mencapai ending ini'"></p>
              </div>
              <div class="md:col-span-2 space-y-3">
                <div>
                  <label class="${labelClass}">Ayat</label>
                  <textarea x-model="scene.verse" :disabled="isLocked()" rows="2" class="${inputClass}" placeholder="Contoh: Amsal 10:9 — Siapa bersih kelakuannya, aman jalannya."></textarea>
                </div>
                <div>
                  <label class="${labelClass}">Ajakan refleksi (untuk Jurnal)</label>
                  <textarea x-model="scene.reflection" :disabled="isLocked()" rows="2" class="${inputClass}" placeholder="Contoh: Kapan kamu pernah tergoda untuk tidak jujur?"></textarea>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- Tambah scene -->
      <div x-show="!isLocked()" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button type="button" @click="addScene('STORY')" class="border-2 border-dashed border-blue-200 text-blue-800 rounded-2xl p-4 font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><i class="bi bi-book"></i> + Scene Cerita</button>
        <button type="button" @click="addScene('CHALLENGE')" class="border-2 border-dashed border-highlight text-primary rounded-2xl p-4 font-black uppercase tracking-widest text-xs hover:bg-yellow-50 transition-all flex items-center justify-center gap-2"><i class="bi bi-patch-question"></i> + Scene Tantangan</button>
        <button type="button" @click="addScene('ENDING')" class="border-2 border-dashed border-green-200 text-green-800 rounded-2xl p-4 font-black uppercase tracking-widest text-xs hover:bg-green-50 transition-all flex items-center justify-center gap-2"><i class="bi bi-flag"></i> + Scene Akhir</button>
      </div>

      <!-- Pilih soal dari Bank Soal Quiz -->
      <div x-show="bankPickerScene" x-cloak class="fixed inset-0 z-[150] bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4" @keydown.escape.window="bankPickerScene = null">
        <div @click.away="bankPickerScene = null" class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
          <div class="bg-primary text-white p-4 rounded-t-2xl flex items-center justify-between border-b-4 border-highlight">
            <h3 class="font-black uppercase tracking-widest text-sm flex items-center gap-2"><i class="bi bi-bank"></i> Ambil dari Bank Soal Quiz</h3>
            <button type="button" @click="bankPickerScene = null" class="hover:text-highlight" aria-label="Tutup"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="p-4 border-b border-slate-100">
            <input type="text" x-model="bankSearch" class="${inputClass}" placeholder="Cari soal...">
            <p class="mt-2 text-[10px] text-slate-500 font-bold">Soal disalin ke scene. Mengubah Bank Soal nanti tidak mengubah cerita ini.</p>
          </div>
          <div class="p-4 overflow-y-auto space-y-2">
            <p x-show="bankLoading" class="text-xs text-slate-400 font-bold">Memuat Bank Soal…</p>
            <p x-show="!bankLoading && filteredBankQuestions().length === 0" class="text-xs text-slate-400 font-bold">Tidak ada soal yang cocok.</p>
            <template x-for="b in filteredBankQuestions()" :key="b.id">
              <button type="button" @click="useBankQuestion(b)" class="w-full text-left border-2 border-slate-100 hover:border-highlight rounded-xl p-3 transition-all">
                <div class="text-sm font-bold text-primary" x-text="b.question"></div>
                <div class="mt-1 text-[11px] text-slate-500" x-text="'A. ' + b.optionA + ' · B. ' + b.optionB + ' · C. ' + b.optionC + ' · D. ' + b.optionD"></div>
                <div class="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400" x-text="b.difficulty + ' · kunci ' + b.correctAnswer"></div>
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>
  `;
};
