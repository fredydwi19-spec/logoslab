import { ProjectHeader } from "./ProjectHeader";

export const PembuatMateriDashboard = ({ myProjects, publishedProjects, allUsers, analytics }: { myProjects: any[], publishedProjects: any[], allUsers: any[], analytics?: any }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');
  const analyticsJson = analytics ? JSON.stringify(analytics).replace(/</g, '\\u003c') : 'null';

  return `
    <script id="pembuatMateriProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pembuatMateriPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pembuatMateriUsersData" type="application/json">${allUsersJson}</script>
    <script id="pembuatMateriAnalyticsData" type="application/json">${analyticsJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pembuatMateriDashboard', () => ({
          analytics: JSON.parse(document.getElementById('pembuatMateriAnalyticsData').textContent),
          activeProject: null,
          materiContents: [],
          sections: [],
          glossaryItems: [],
          savingSections: false,
          savingGlossary: false,
          showPreview: false,
          showAuditLog: false,
          myProjects: JSON.parse(document.getElementById('pembuatMateriProjectsData').textContent || '[]'),
          publishedProjects: JSON.parse(document.getElementById('pembuatMateriPublishedData').textContent || '[]'),
          allUsers: JSON.parse(document.getElementById('pembuatMateriUsersData').textContent || '[]'),
          activeTab: 'DRAFT',
          menuTab: new URLSearchParams(window.location.search).get('tab') || 'dashboard',
          searchActive: '',
          searchPublished: '',
          uploading: false,

          filterKey: '',
          filterValue: '',
          filterStart: '',
          filterEnd: '',
          appliedFilter: { key: '', value: '', start: '', end: '' },

          applyFilter() {
            this.appliedFilter = {
              key: this.filterKey,
              value: this.filterValue,
              start: this.filterStart,
              end: this.filterEnd
            };
          },

          resetFilter() {
            this.filterKey = '';
            this.filterValue = '';
            this.filterStart = '';
            this.filterEnd = '';
            this.appliedFilter = { key: '', value: '', start: '', end: '' };
          },

          applyDynamicFilter(list) {
            if (!list || !Array.isArray(list)) return [];
            if (!this.appliedFilter.key) {
              if (this.searchActive) {
                return list.filter(p => p.title.toLowerCase().includes(this.searchActive.toLowerCase()));
              }
              return list;
            }
            return list.filter(p => {
              const { key, value, start, end } = this.appliedFilter;
              
              if (this.searchActive && !p.title.toLowerCase().includes(this.searchActive.toLowerCase())) {
                return false;
              }
              
              if (key === 'title_materi') {
                if (!value) return false;
                return p.title?.toLowerCase().includes(value.toLowerCase());
              }
              if (key === 'type_materi') {
                if (!value) return false;
                return p.materiType === value;
              }
              if (key === 'status') {
                if (!value) return false;
                return p.status === value;
              }
              if (key === 'deadline') {
                if (!p.deadline) return false;
                const d = new Date(p.deadline);
                const sd = start ? new Date(start) : null;
                const ed = end ? new Date(end) : null;
                if (sd && d < sd) return false;
                if (ed && d > ed) return false;
                return true;
              }
              return false;
            });
          },

          getUserName(id) {
            const u = this.allUsers.find(u => u.id === id);
            return u ? u.name : '-';
          },

          filteredActiveProjects() {
            return this.applyDynamicFilter(this.myProjects);
          },

          filteredPublishedProjects() {
            return this.publishedProjects.filter(p =>
              !this.searchPublished || p.title.toLowerCase().includes(this.searchPublished.toLowerCase())
            );
          },

          async openProject(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (json.success) {
                this.activeProject = json.data;
                this.materiContents = json.data.materiContents || [];
                if (this.activeProject.materiType === 'MANUAL') {
                  const secRes = await fetch('/api/projects/' + id + '/sections');
                  const secJson = await secRes.json();
                  if (secJson.success) this.sections = secJson.data;

                  const glosRes = await fetch('/api/projects/' + id + '/glossary');
                  const glosJson = await glosRes.json();
                  if (glosJson.success) this.glossaryItems = glosJson.data;
                }
                this.showAuditLog = false;
                this.showPreview = false;
              } else {
                alert('Gagal memuat proyek: ' + (json.error || 'Terjadi kesalahan'));
              }
            } catch (err) {
              console.error('openProject error:', err);
              alert('Gagal terhubung ke server.');
            }
          },

          closeProject() {
            this.activeProject = null;
            this.materiContents = [];
            this.sections = [];
            this.glossaryItems = [];
            this.showAuditLog = false;
            this.showPreview = false;
          },

          isReadOnly() {
            if (!this.activeProject) return true;
            return !["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(this.activeProject.status);
          },

          async handleFileUpload(e) {
            if (this.isReadOnly()) return;
            const files = e.target.files;
            if (!files.length) return;
            
            this.uploading = true;
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const reader = new FileReader();
              await new Promise((resolve) => {
                reader.onload = (evt) => {
                  let contentType = 'IMAGE';
                  if (file.type.includes('pdf')) contentType = 'PDF';
                  else if (file.type.includes('powerpoint') || file.type.includes('presentation')) contentType = 'PPT';
                  else if (file.type.includes('video')) contentType = 'VIDEO';
                  
                  this.materiContents.push({
                    contentType: contentType,
                    fileUrl: evt.target.result,
                    fileName: file.name,
                    fileSize: file.size
                  });
                  resolve();
                };
                reader.readAsDataURL(file);
              });
            }
            this.uploading = false;
            e.target.value = '';
            this.saveContents();
          },

          addEmbedUrl() {
            const url = prompt("Masukkan URL Embed (YouTube/Vimeo dll):");
            if (url) {
              this.materiContents.push({
                contentType: 'EMBED_URL',
                fileUrl: url,
                fileName: url,
                fileSize: 0
              });
              this.saveContents();
            }
          },

          removeContent(idx) {
            if (confirm('Hapus konten ini?')) {
              this.materiContents.splice(idx, 1);
              this.saveContents();
            }
          },

          async saveContents() {
            if (this.isReadOnly()) return;
            const res = await fetch('/api/projects/' + this.activeProject.id + '/materi-content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.materiContents)
            });
            if (!res.ok) {
              alert('Gagal menyimpan konten');
            }
          },

          addSection() {
            if (this.isReadOnly()) return;
            this.sections.push({ subTitle: '', content: '', sortOrder: this.sections.length });
          },

          removeSection(idx) {
            if (this.isReadOnly()) return;
            if (confirm('Hapus sub-bab ini?')) {
              this.sections.splice(idx, 1);
              this.saveSections();
            }
          },

          async saveSections() {
            if (this.isReadOnly()) return;
            this.savingSections = true;
            const res = await fetch('/api/projects/' + this.activeProject.id + '/sections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.sections)
            });
            if (!res.ok) alert('Gagal menyimpan sub-bab');
            setTimeout(() => { this.savingSections = false; }, 1000);
          },

          addGlossary() {
            if (this.isReadOnly()) return;
            this.glossaryItems.push({ word: '', definition: '' });
          },

          removeGlossary(idx) {
            if (this.isReadOnly()) return;
            if (confirm('Hapus istilah ini?')) {
              this.glossaryItems.splice(idx, 1);
              this.saveGlossary();
            }
          },

          async saveGlossary() {
            if (this.isReadOnly()) return;
            this.savingGlossary = true;
            const res = await fetch('/api/projects/' + this.activeProject.id + '/glossary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.glossaryItems)
            });
            if (!res.ok) alert('Gagal menyimpan glosarium');
            setTimeout(() => { this.savingGlossary = false; }, 1000);
          },

          async submitForReview() {
            if (this.activeProject.materiType === 'MANUAL') {
              if (this.sections.length === 0 || this.sections[0].content.trim() === '') {
                alert("Proyek materi manual kosong! Harap isi minimal 1 sub-bab.");
                return;
              }
            } else {
              if (this.materiContents.length === 0) {
                alert("Proyek materi kosong! Harap unggah minimal 1 file/konten sebelum disubmit.");
                return;
              }
            }
            if (!confirm('Kirim proyek ini untuk di-review? Anda tidak bisa mengedit lagi sampai ada feedback revisi.')) return;

            try {
              const res = await fetch('/api/projects/' + this.activeProject.id + '/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
              });
              const json = await res.json();
              if (json.success) {
                alert('Berhasil disubmit untuk review!');
                window.location.reload();
              } else {
                alert('Gagal: ' + json.error);
              }
            } catch (err) {
              console.error(err);
              alert('Terjadi kesalahan.');
            }
          }
        }));
      });
    </script>

    <div class="space-y-8" x-data="pembuatMateriDashboard()">
      <!-- Header -->
      <div class="flex items-center justify-between bg-[#1A237E] p-6 rounded-xl shadow-lg border-b-4 border-[#FFC107]">
        <div class="flex items-center gap-4">
          <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" class="h-12 w-auto object-contain bg-white p-1 rounded shadow-sm" onerror="this.style.display='none'"/>
          <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight" x-text="activeProject ? 'Workspace Produksi Materi' : (menuTab === 'dashboard' ? 'Dashboard Analitik' : 'Manajemen Proyek')">Workspace Konten</h2>
        </div>
        <div class="flex items-center gap-4">
           <div class="flex gap-2" x-show="!activeProject && menuTab === 'projects'">
             <a href="/dashboard/pembuat?tab=projects" class="bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Proyek Saya</a>
           </div>
        </div>
      </div>

      <!-- ANALYTICS WIDGETS -->
      <template x-if="menuTab === 'dashboard' && !activeProject && analytics">
        <div class="space-y-6">
          <!-- SECTION 1: GLOBAL PUBLISHED METRICS -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-gradient-to-r from-[#1A237E] to-blue-600 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-blue-200 mb-1">Total Proyek Game Dipublish</p>
                <h3 class="text-4xl font-black text-[#FFC107]" x-text="analytics.globalStats.totalPublishedGames"></h3>
              </div>
              <div class="text-5xl opacity-80"><i class="bi bi-controller"></i></div>
            </div>
            <div class="bg-gradient-to-r from-[#FF5722] to-orange-500 rounded-2xl p-6 text-white shadow-xl flex items-center justify-between hover:scale-[1.02] transition-transform">
              <div>
                <p class="text-xs font-bold uppercase tracking-widest text-orange-200 mb-1">Total Proyek Materi Dipublish</p>
                <h3 class="text-4xl font-black" x-text="analytics.globalStats.totalPublishedMaterials"></h3>
              </div>
              <div class="text-5xl opacity-80"><i class="bi bi-journal-text"></i></div>
            </div>
          </div>

          <!-- SECTION 2: KEY PERFORMANCE INDEX (KPI Creator) -->
          <div class="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="h-6 w-1.5 bg-[#1A237E] rounded-full"></span>
              <h3 class="text-lg font-bold text-[#1A237E] uppercase tracking-widest">KPI Pembuat Materi</h3>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Materi Dikerjakan</p>
                <p class="text-2xl font-black text-[#1A237E]" x-text="analytics.creatorKpi.totalAssignedMaterials"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Materi Sedang Dikerjakan</p>
                <p class="text-2xl font-black text-[#FF5722]" x-text="analytics.creatorKpi.activeMaterialsCount"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Waktu Penyelesaian</p>
                <p class="text-sm font-black text-green-600 mt-2" x-text="analytics.creatorKpi.avgCompletionTimeFormatted"></p>
              </div>
              <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Revisi per Proyek</p>
                <p class="text-2xl font-black text-purple-600" x-text="analytics.creatorKpi.avgRevisionCount"></p>
              </div>
            </div>
            <!-- Tabel Peringkat Kecepatan Pengerjaan -->
            <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" x-data="{ sortAsc: true }">
              <div class="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center">
                <h4 class="text-xs font-bold text-[#1A237E] uppercase tracking-widest">Peringkat Kecepatan Pengerjaan Materi</h4>
                <button @click="sortAsc = !sortAsc; analytics.creatorKpi.speedRankedMaterials.reverse()" class="text-[10px] bg-white border border-slate-300 px-3 py-1.5 rounded-lg font-black uppercase tracking-tighter text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <i class="bi" :class="sortAsc ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up'"></i>
                  <span x-text="sortAsc ? 'Tercepat -> Terlambat' : 'Terlambat -> Tercepat'"></span>
                </button>
              </div>
              <div class="max-h-48 overflow-y-auto">
                <template x-if="analytics.creatorKpi.speedRankedMaterials.length === 0">
                  <div class="p-6 text-center text-xs text-slate-400 font-bold italic">Belum ada proyek yang diselesaikan.</div>
                </template>
                <table class="w-full text-left border-collapse" x-show="analytics.creatorKpi.speedRankedMaterials.length > 0">
                  <tbody>
                    <template x-for="(proj, idx) in analytics.creatorKpi.speedRankedMaterials" :key="proj.id">
                      <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td class="p-3 pl-4">
                          <span class="w-6 h-6 inline-flex items-center justify-center rounded-full text-[10px] font-black" :class="idx === 0 && sortAsc ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-slate-100 text-slate-500'" x-text="idx + 1"></span>
                        </td>
                        <td class="p-3 text-sm font-semibold text-[#1A237E]" x-text="proj.title"></td>
                        <td class="p-3 text-xs font-bold text-slate-500 text-right pr-4" x-text="proj.durationFormatted"></td>
                      </tr>
                    </template>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- SECTION 3: POPULARITY & ENGAGEMENT SHOWCASE -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Top Played Games -->
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <span class="h-6 w-1.5 bg-[#FFC107] rounded-full"></span>
                <h3 class="text-sm font-bold text-[#1A237E] uppercase tracking-widest">Game Paling Sering Dimainkan</h3>
              </div>
              <div class="space-y-3">
                <template x-if="analytics.popularityStats.topPlayedGames.length === 0">
                  <div class="text-xs text-slate-400 italic">Belum ada data permainan.</div>
                </template>
                <template x-for="(game, i) in analytics.popularityStats.topPlayedGames" :key="i">
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex items-center gap-3">
                      <div class="text-lg opacity-50">🎮</div>
                      <h4 class="text-sm font-semibold text-slate-700" x-text="game.title"></h4>
                    </div>
                    <div class="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full"><span x-text="game.playCount"></span>x Dimainkan</div>
                  </div>
                </template>
              </div>
            </div>
            
            <!-- Top Accessed Materials -->
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div class="flex items-center gap-3 mb-4">
                <span class="h-6 w-1.5 bg-[#FF5722] rounded-full"></span>
                <h3 class="text-sm font-bold text-[#1A237E] uppercase tracking-widest">Materi Paling Sering Diakses</h3>
              </div>
              <div class="space-y-3">
                <template x-if="analytics.popularityStats.topAccessedMaterials.length === 0">
                  <div class="text-xs text-slate-400 italic">Belum ada data materi.</div>
                </template>
                <template x-for="(mat, i) in analytics.popularityStats.topAccessedMaterials" :key="i">
                  <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div class="flex items-center gap-3">
                      <div class="text-lg opacity-50">📖</div>
                      <h4 class="text-sm font-semibold text-slate-700" x-text="mat.title"></h4>
                    </div>
                    <div class="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full"><span x-text="mat.accessCount"></span>x Diakses</div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Tab Panel & Project List -->
      <div x-show="menuTab === 'projects' && !activeProject" class="bg-white p-8 rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <!-- Dynamic Filter -->
        <div class="flex flex-wrap items-center gap-3 w-full mb-6 p-4 bg-slate-50/80 rounded-xl border border-slate-200">
          <div class="flex flex-col gap-1 w-48 shrink-0">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kriteria Filter</label>
            <select x-model="filterKey" @change="filterValue=''; filterStart=''; filterEnd=''" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
              <option value="">-- Pilih Kriteria --</option>
              <option value="title_materi">Judul Materi</option>
              <option value="type_materi">Jenis Materi</option>
              <option value="status">Status</option>
              <option value="deadline">Tanggal Deadline</option>
            </select>
          </div>
          <div class="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nilai Filter</label>
            
            <template x-if="filterKey === 'title_materi'">
              <input type="text" x-model="filterValue" placeholder="Ketik pencarian..." class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
            </template>

            <template x-if="filterKey === 'type_materi'">
              <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
                <option value="">-- Pilih Jenis Materi --</option>
                <option value="TEKS">TEKS</option>
                <option value="VIDEO">VIDEO</option>
                <option value="MANUAL">MANUAL</option>
              </select>
            </template>

            <template x-if="filterKey === 'status'">
              <select x-model="filterValue" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
                <option value="">-- Pilih Status --</option>
                <option value="DRAFT">DRAFT</option>
                <option value="REVIEW_PAKAR">REVIEW PAKAR</option>
                <option value="REVISI_PAKAR">REVISI PAKAR</option>
                <option value="ACCEPTED_PAKAR">ACCEPTED PAKAR</option>
                <option value="REVIEW_KETUA">REVIEW KETUA</option>
                <option value="REVISI_KETUA">REVISI KETUA</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="UNPUBLISHED">UNPUBLISHED</option>
              </select>
            </template>

            <template x-if="filterKey === 'deadline'">
              <div class="flex gap-2">
                <input type="date" x-model="filterStart" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
                <span class="self-center font-bold text-slate-400">-</span>
                <input type="date" x-model="filterEnd" class="w-full border-2 border-slate-200 rounded-lg py-2 px-3 text-sm focus:border-[#1A237E] outline-none font-bold text-slate-700 bg-white shadow-sm">
              </div>
            </template>

            <template x-if="!filterKey">
              <div class="w-full border-2 border-slate-200 border-dashed rounded-lg py-2 px-3 text-sm text-slate-400 italic bg-white text-center shadow-sm">Pilih kriteria terlebih dahulu</div>
            </template>
          </div>
          
          <div class="flex gap-2 ml-auto shrink-0 self-end">
            <button @click="applyFilter()" class="bg-[#1A237E] text-[#FFC107] py-2.5 px-4 text-sm font-semibold rounded-lg shadow-md hover:bg-indigo-900 transition-all uppercase tracking-widest flex items-center gap-2">
              TERAPKAN
            </button>
            <button @click="resetFilter()" class="bg-slate-200 text-slate-700 py-2.5 px-4 text-sm font-semibold rounded-lg shadow-sm hover:bg-slate-300 transition-all uppercase tracking-widest">
              RESET
            </button>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table class="w-full text-left bg-white">
            <thead class="bg-slate-50 border-b-2 border-slate-200">
              <tr class="text-slate-400 text-xs tracking-widest uppercase">
                <th class="px-6 py-4 font-black">Detail Materi</th>
                <th class="px-6 py-4 font-black">Tipe</th>
                <th class="px-6 py-4 font-black">Status</th>
                <th class="px-6 py-4 font-black text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="text-slate-600 divide-y divide-slate-100">
              <template x-for="p in filteredActiveProjects()" :key="p.id">
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4">
                    <p class="font-black text-[#1A237E] text-sm md:text-base mb-1" x-text="p.title"></p>
                    <p class="text-xs text-slate-400 font-semibold" x-text="'Deadline: ' + (p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID') : '-')"></p>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black tracking-widest border border-emerald-200" x-text="p.materiType"></span>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black tracking-widest border border-slate-200" x-text="p.status.replace(/_/g, ' ')"></span>
                  </td>
                  <td class="px-6 py-4 align-middle">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="$dispatch('open-chat-drawer', { projectId: p.id, contextType: 'GENERAL', contextTargetId: null, targetName: p.title, userRole: window.USER_ROLE })" title="Diskusi Proyek" class="bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl text-xs font-black hover:bg-indigo-200 shadow-sm transition-all uppercase tracking-widest flex items-center justify-center shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" /></svg>
                      </button>
                      <button x-show="p.status === 'DRAFT' || p.status === 'UNPUBLISHED'" @click="openProject(p.id)" class="bg-[#1A237E] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-900 transition-all shadow-md uppercase tracking-widest">KERJAKAN</button>
                      <button x-show="['REVISI_PAKAR', 'REVISI_KETUA'].includes(p.status)" @click="openProject(p.id)" class="bg-amber-500 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-amber-600 transition-all shadow-md uppercase tracking-widest">PERBAIKI</button>
                      <button x-show="['REVIEW_PAKAR', 'REVIEW_KETUA', 'ACCEPTED_PAKAR', 'PUBLISHED'].includes(p.status)" @click="openProject(p.id)" class="bg-slate-100 text-slate-700 border border-slate-300 px-5 py-2 rounded-xl text-xs font-black hover:bg-slate-200 transition-all shadow-sm uppercase tracking-widest">DETAIL</button>
                    </div>
                  </td>
                </tr>
              </template>
              <template x-if="filteredActiveProjects().length === 0">
                <tr><td colspan="4" class="text-center py-12 text-slate-400 font-bold">Tidak ada proyek di tab ini.</td></tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Workspace Editor Materi -->
      <div x-show="activeProject" style="display: none;" class="space-y-6">
        <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
          ← Kembali ke Dashboard
        </button>

        ${ProjectHeader({ projectVar: 'activeProject', projectType: 'MATERI' })}

        <div class="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
          <div class="bg-[#1A237E] p-6 text-white border-b-4 border-[#FFC107] flex justify-between items-center">
            <h3 class="font-black uppercase tracking-widest flex items-center gap-3">
              <span class="text-2xl">📝</span> Editor Konten
            </h3>
            <div class="flex gap-4">
              <button @click="showPreview = true" class="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest">
                PREVIEW MATERI
              </button>
              <button x-show="!isReadOnly()" @click="submitForReview()" class="bg-[#FF5722] hover:bg-[#E64A19] px-6 py-2 rounded-xl text-xs font-black shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 uppercase tracking-widest">
                SUBMIT UNTUK REVIEW
              </button>
            </div>
          </div>

          <!-- Uploader Area (For TEKS/VIDEO) -->
          <div x-show="activeProject?.materiType !== 'MANUAL'">
            <div class="p-8 bg-slate-50" x-show="!isReadOnly()">
            <div class="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 group relative">
              <input type="file" multiple @change="handleFileUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :accept="activeProject?.materiType === 'TEKS' ? '.pdf,.ppt,.pptx,.png,.jpg,.jpeg' : '.mp4,.webm'">
              <div class="space-y-4">
                <div class="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <span class="text-3xl text-[#1A237E]">↑</span>
                </div>
                <h4 class="text-lg font-black text-[#1A237E]">Pilih file atau tarik ke sini</h4>
                <p class="text-sm font-semibold text-slate-400 uppercase tracking-widest" x-text="activeProject?.materiType === 'TEKS' ? 'Mendukung: PDF, PPT, PNG, JPG (Maks 10MB)' : 'Mendukung: MP4, WebM (Maks 50MB)'"></p>
                <div x-show="uploading" class="mt-4 text-[#FF5722] font-bold animate-pulse">Sedang mengunggah...</div>
              </div>
            </div>
            
            <template x-if="activeProject?.materiType === 'VIDEO'">
              <div class="mt-4 flex justify-center">
                <button @click="addEmbedUrl()" class="text-[#1A237E] font-bold underline hover:text-indigo-900">Atau Tambahkan URL Embed (YouTube)</button>
              </div>
            </template>
          </div>

          <!-- Content List -->
          <div class="p-8 pt-0">
            <h4 class="font-black text-slate-800 uppercase tracking-widest mb-4">Konten Tersimpan (<span x-text="materiContents.length"></span>)</h4>
            <div class="space-y-3">
              <template x-for="(content, idx) in materiContents" :key="idx">
                <div class="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div class="flex items-center gap-4 overflow-hidden">
                    <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 font-bold" x-text="content.contentType"></div>
                    <div class="truncate">
                      <p class="font-bold text-slate-800 truncate" x-text="content.fileName || content.fileUrl"></p>
                      <p class="text-xs text-slate-500 font-semibold" x-text="content.fileSize ? (content.fileSize / 1024 / 1024).toFixed(2) + ' MB' : ''"></p>
                    </div>
                  </div>
                  <button x-show="!isReadOnly()" @click="removeContent(idx)" class="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <span class="text-xl">&times;</span>
                  </button>
                </div>
              </template>
              <template x-if="materiContents.length === 0">
                <div class="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold">
                  Belum ada konten materi.
                </div>
              </template>
            </div>
          </div>
          </div>

          <!-- MANUAL Editor Area -->
          <div x-show="activeProject?.materiType === 'MANUAL'" class="p-4 md:p-8 space-y-8 bg-slate-50">
            <!-- Sections Area -->
            <div>
              <div class="flex justify-between items-center mb-6">
                <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-lg">📚 Sub-Bab Materi</h4>
                <div class="flex items-center gap-4">
                  <span x-show="savingSections" class="text-sm font-bold text-orange-500 animate-pulse">Menyimpan...</span>
                  <span x-show="!savingSections" class="text-sm font-bold text-green-500">Tersimpan ✓</span>
                </div>
              </div>
              
              <div class="space-y-6">
                <template x-for="(section, idx) in sections" :key="idx">
                  <div class="bg-white rounded-2xl overflow-hidden border-2 border-[#FFC107] shadow-md">
                    <div class="bg-[#1A237E] text-white px-4 py-3 flex justify-between items-center">
                      <span class="font-black uppercase tracking-widest text-sm" x-text="'SUB-BAB ' + (idx + 1)"></span>
                      <button x-show="!isReadOnly()" @click="removeSection(idx)" class="text-white/60 hover:text-red-400 font-bold transition-colors">✕ Hapus</button>
                    </div>
                    <div class="p-4 md:p-6 space-y-4">
                      <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Judul Sub-Bab (Opsional)</label>
                        <input type="text" x-model="section.subTitle" @input.debounce.2000ms="saveSections()" :disabled="isReadOnly()" class="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1A237E] outline-none font-bold" placeholder="Contoh: Pendahuluan">
                      </div>
                      <div>
                        <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Isi Konten</label>
                        <textarea x-model="section.content" @input.debounce.2000ms="saveSections()" :disabled="isReadOnly()" rows="8" class="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base leading-relaxed focus:border-[#1A237E] outline-none" placeholder="Ketik materi Anda di sini..."></textarea>
                      </div>
                    </div>
                  </div>
                </template>
                <button x-show="!isReadOnly()" @click="addSection()" class="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all border-b-4 border-orange-800 active:border-b-0 active:translate-y-1">
                  + TAMBAH SUB-BAB
                </button>
              </div>
            </div>

            <hr class="border-2 border-dashed border-slate-200">

            <!-- Glossary Area -->
            <div>
              <div class="flex justify-between items-center mb-6">
                <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-lg flex items-center gap-2">
                  <span>📖</span> Glosarium (Istilah Sulit)
                </h4>
                <div class="flex items-center gap-4">
                  <span x-show="savingGlossary" class="text-sm font-bold text-orange-500 animate-pulse">Menyimpan...</span>
                  <span x-show="!savingGlossary" class="text-sm font-bold text-green-500">Tersimpan ✓</span>
                </div>
              </div>
              <p class="text-sm font-bold text-slate-500 mb-6">Istilah di bawah ini akan digarisbawahi pada konten materi dan memunculkan penjelasan saat di-hover/klik oleh pembaca.</p>

              <div class="space-y-3">
                <template x-for="(item, idx) in glossaryItems" :key="idx">
                  <div class="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <input type="text" x-model="item.word" @input.debounce.2000ms="saveGlossary()" :disabled="isReadOnly()" placeholder="Kata/Istilah" class="w-full md:w-1/3 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold focus:border-[#FFC107] outline-none">
                    <input type="text" x-model="item.definition" @input.debounce.2000ms="saveGlossary()" :disabled="isReadOnly()" placeholder="Definisi/Penjelasan Singkat" class="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-sm focus:border-[#FFC107] outline-none">
                    <button x-show="!isReadOnly()" @click="removeGlossary(idx)" class="shrink-0 bg-red-100 text-red-600 hover:bg-red-200 w-10 h-10 rounded-lg font-black transition-colors">✕</button>
                  </div>
                </template>
                <button x-show="!isReadOnly()" @click="addGlossary()" class="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-md transition-all text-xs">
                  + TAMBAH ISTILAH
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
        <div class="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
          <div class="bg-[#1A237E] p-4 flex justify-between items-center text-white border-b-4 border-[#FFC107]">
            <h3 class="font-black uppercase tracking-widest">Preview: <span x-text="activeProject?.title" class="text-[#FFC107]"></span></h3>
            <button @click="showPreview = false" class="text-white/50 hover:text-white text-3xl font-black transition-colors">&times;</button>
          </div>
          <div class="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 flex flex-col items-center gap-8">
            <template x-for="content in materiContents">
              <div class="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                <template x-if="content.contentType === 'IMAGE'">
                  <img :src="content.fileUrl" class="w-full h-auto object-contain" />
                </template>
                <template x-if="content.contentType === 'PDF' || content.contentType === 'PPT'">
                  <iframe :src="content.fileUrl" class="w-full h-[70vh] border-0"></iframe>
                </template>
                <template x-if="content.contentType === 'VIDEO'">
                  <video :src="content.fileUrl" controls class="w-full h-auto max-h-[70vh] bg-black"></video>
                </template>
                <template x-if="content.contentType === 'EMBED_URL'">
                  <iframe :src="content.fileUrl" class="w-full h-[500px] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  `;
};
