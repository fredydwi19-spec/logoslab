import { ProjectHeader } from "./ProjectHeader";

export const PembuatMateriDashboard = ({ myProjects, publishedProjects, allUsers }: { myProjects: any[], publishedProjects: any[], allUsers: any[] }) => {
  const myProjectsJson = JSON.stringify(myProjects).replace(/</g, '\\u003c');
  const publishedProjectsJson = JSON.stringify(publishedProjects).replace(/</g, '\\u003c');
  const allUsersJson = JSON.stringify(allUsers).replace(/</g, '\\u003c');

  return `
    <script id="pembuatMateriProjectsData" type="application/json">${myProjectsJson}</script>
    <script id="pembuatMateriPublishedData" type="application/json">${publishedProjectsJson}</script>
    <script id="pembuatMateriUsersData" type="application/json">${allUsersJson}</script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pembuatMateriDashboard', () => ({
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
          searchActive: '',
          searchPublished: '',
          uploading: false,
          availableTags: [],
          selectedTags: [],

          async init() {
            try {
              const res = await fetch('/api/elearning/tags');
              const json = await res.json();
              if (json.success) this.availableTags = json.data;
            } catch(e) {}
          },

          getUserName(id) {
            const u = this.allUsers.find(u => u.id === id);
            return u ? u.name : '-';
          },

          filteredActiveProjects() {
            const statusMap = {
              'DRAFT':          ['DRAFT'],
              'REVIEW_PAKAR':   ['REVIEW_PAKAR'],
              'REVISI_PAKAR':   ['REVISI_PAKAR', 'ACCEPTED_PAKAR'],
              'REVIEW_KETUA':   ['REVIEW_KETUA'],
              'REVISI_KETUA':   ['REVISI_KETUA', 'UNPUBLISHED'],
            };
            const allowed = statusMap[this.activeTab] || [];
            return this.myProjects.filter(p => {
              const matchTab = allowed.includes(p.status);
              const matchSearch = !this.searchActive || p.title.toLowerCase().includes(this.searchActive.toLowerCase());
              return matchTab && matchSearch;
            });
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
                
                try {
                  const tagRes = await fetch('/api/projects/' + id + '/tags');
                  if (tagRes.ok) {
                    const tagJson = await tagRes.json();
                    if (tagJson.success) this.selectedTags = tagJson.data.map(t => t.tagId);
                  }
                } catch(e) { this.selectedTags = []; }

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
            this.selectedTags = [];
            this.showAuditLog = false;
            this.showPreview = false;
          },

          async saveTags() {
            if (this.isReadOnly()) return;
            await fetch('/api/projects/' + this.activeProject.id + '/tags', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify(this.selectedTags)
            });
          },

          toggleTag(tagId) {
            if (this.isReadOnly()) return;
            if (this.selectedTags.includes(tagId)) {
              this.selectedTags = this.selectedTags.filter(id => id !== tagId);
            } else {
              this.selectedTags.push(tagId);
            }
            this.saveTags();
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
          <h2 class="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Workspace Konten</h2>
        </div>
      </div>

      <!-- Tab Panel & Project List -->
      <div x-show="!activeProject" class="bg-white p-8 rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <!-- Filter Tabs -->
        <div class="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-slate-100 p-2 rounded-2xl border border-slate-200">
          <div class="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button @click="activeTab = 'DRAFT'" :class="activeTab === 'DRAFT' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">📝 DRAFT</button>
            <button @click="activeTab = 'REVIEW_PAKAR'" :class="activeTab === 'REVIEW_PAKAR' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">⌛ REVIEW PAKAR</button>
            <button @click="activeTab = 'REVISI_PAKAR'" :class="activeTab === 'REVISI_PAKAR' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap"><i class="bi bi-exclamation-triangle"></i> REVISI PAKAR</button>
            <button @click="activeTab = 'REVIEW_KETUA'" :class="activeTab === 'REVIEW_KETUA' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">⌛ REVIEW KETUA</button>
            <button @click="activeTab = 'REVISI_KETUA'" :class="activeTab === 'REVISI_KETUA' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" class="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap"><i class="bi bi-exclamation-triangle"></i> REVISI KETUA</button>
          </div>
          <input type="text" x-model="searchActive" placeholder="Cari Materi..." class="w-full md:w-64 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1A237E] outline-none font-bold">
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
                  <td class="px-6 py-4 text-right">
                    <button @click="openProject(p.id)" class="bg-[#FF5722] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-[#E64A19] shadow-md transition-all uppercase tracking-widest">
                      <span x-text="p.status === 'DRAFT' || p.status.includes('REVISI') ? 'Kerjakan' : 'Lihat'"></span>
                    </button>
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

        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mt-6 mb-6">
          <h4 class="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-4">Tag Topik (E-Learning Adaptif)</h4>
          <div class="flex flex-wrap gap-2">
            <template x-for="tag in availableTags" :key="tag.id">
              <button @click="toggleTag(tag.id)" 
                      :class="selectedTags.includes(tag.id) ? 'bg-[#FFC107] text-[#1A237E] border-[#FFC107] shadow-md scale-105' : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'" 
                      class="px-5 py-2 rounded-full text-xs font-black border-2 transition-all cursor-pointer">
                <span x-text="tag.namaTag"></span>
              </button>
            </template>
            <template x-if="availableTags.length === 0">
              <div class="text-xs text-slate-400 font-bold">Belum ada tag tersedia. Hubungi Ketua Tim.</div>
            </template>
          </div>
        </div>

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
