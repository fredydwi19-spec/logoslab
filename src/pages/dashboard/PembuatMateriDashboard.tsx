import React from 'react';

export const PembuatMateriDashboard = () => {
  return (
    <>
      {/* 
        This component was automatically converted from SSR HTML to JSX.
        Alpine.js logic has been disabled (attributes prefixed with data-x-) 
        to ensure valid JSX compilation. 
      */}
      
    
    
    
    

    <div className="space-y-8" data-x-data="pembuatMateriDashboard()">
      <!-- Header -->
      <div className="flex items-center justify-between bg-[#1A237E] p-6 rounded-xl shadow-lg border-b-4 border-[#FFC107]">
        <div className="flex items-center gap-4">
          <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" className="h-12 w-auto object-contain bg-white p-1 rounded shadow-sm" onerror="this.style.display='none'"/>
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Workspace Konten</h2>
        </div>
      </div>

      <!-- Tab Panel & Project List -->
      <div data-x-show="!activeProject" className="bg-white p-8 rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        <!-- Filter Tabs -->
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-slate-100 p-2 rounded-2xl border border-slate-200">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button data-x-click="activeTab = 'DRAFT'" :className="activeTab === 'DRAFT' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" className="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">📝 DRAFT</button>
            <button data-x-click="activeTab = 'REVIEW_PAKAR'" :className="activeTab === 'REVIEW_PAKAR' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" className="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">⌛ REVIEW PAKAR</button>
            <button data-x-click="activeTab = 'REVISI_PAKAR'" :className="activeTab === 'REVISI_PAKAR' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" className="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap"><i className="bi bi-exclamation-triangle"></i> REVISI PAKAR</button>
            <button data-x-click="activeTab = 'REVIEW_KETUA'" :className="activeTab === 'REVIEW_KETUA' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" className="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap">⌛ REVIEW KETUA</button>
            <button data-x-click="activeTab = 'REVISI_KETUA'" :className="activeTab === 'REVISI_KETUA' ? 'bg-[#1A237E] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'" className="px-5 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap"><i className="bi bi-exclamation-triangle"></i> REVISI KETUA</button>
          </div>
          <input type="text" data-x-model="searchActive" placeholder="Cari Materi..." className="w-full md:w-64 border-2 border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1A237E] outline-none font-bold" />
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left bg-white">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr className="text-slate-400 text-xs tracking-widest uppercase">
                <th className="px-6 py-4 font-black">Detail Materi</th>
                <th className="px-6 py-4 font-black">Tipe</th>
                <th className="px-6 py-4 font-black">Status</th>
                <th className="px-6 py-4 font-black text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-100">
              <template x-htmlFor="p in filteredActiveProjects()" data-x-bind-key="p.id">
                <tr className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-[#1A237E] text-sm md:text-base mb-1" data-x-text="p.title"></p>
                    <p className="text-xs text-slate-400 font-semibold" data-x-text="'Deadline: ' + (p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID') : '-')"></p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black tracking-widest border border-emerald-200" data-x-text="p.materiType"></span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black tracking-widest border border-slate-200" data-x-text="p.status.replace(/_/g, ' ')"></span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button data-x-click="openProject(p.id)" className="bg-[#FF5722] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-[#E64A19] shadow-md transition-all uppercase tracking-widest">
                      <span data-x-text="p.status === 'DRAFT' || p.status.includes('REVISI') ? 'Kerjakan' : 'Lihat'"></span>
                    </button>
                  </td>
                </tr>
              </template>
              <template data-x-if="filteredActiveProjects().length === 0">
                <tr><td colspan="4" className="text-center py-12 text-slate-400 font-bold">Tidak ada proyek di tab ini.</td></tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Workspace Editor Materi -->
      <div data-x-show="activeProject" style="display: none;" className="space-y-6">
        <button data-x-click="closeProject()" className="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
          ← Kembali ke Dashboard
        </button>

        {/* Interpolated: ProjectHeader({ projectVar: 'activeProject', projectType: 'MATERI'  */})}

        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mt-6 mb-6">
          <h4 className="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-4">Tag Topik (E-Learning Adaptif)</h4>
          <div className="flex flex-wrap gap-2">
            <template x-htmlFor="tag in availableTags" data-x-bind-key="tag.id">
              <button data-x-click="toggleTag(tag.id)" 
                      :className="selectedTags.includes(tag.id) ? 'bg-[#FFC107] text-[#1A237E] border-[#FFC107] shadow-md scale-105' : 'bg-slate-100 text-slate-500 border-slate-200 hover:border-slate-300'" 
                      className="px-5 py-2 rounded-full text-xs font-black border-2 transition-all cursor-pointer">
                <span data-x-text="tag.namaTag"></span>
              </button>
            </template>
            <template data-x-if="availableTags.length === 0">
              <div className="text-xs text-slate-400 font-bold">Belum ada tag tersedia. Hubungi Ketua Tim.</div>
            </template>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-[#1A237E] p-6 text-white border-b-4 border-[#FFC107] flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest flex items-center gap-3">
              <span className="text-2xl">📝</span> Editor Konten
            </h3>
            <div className="flex gap-4">
              <button data-x-click="showPreview = true" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 uppercase tracking-widest">
                PREVIEW MATERI
              </button>
              <button data-x-show="!isReadOnly()" data-x-click="submitForReview()" className="bg-[#FF5722] hover:bg-[#E64A19] px-6 py-2 rounded-xl text-xs font-black shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 uppercase tracking-widest">
                SUBMIT UNTUK REVIEW
              </button>
            </div>
          </div>

          <!-- Uploader Area (For TEKS/VIDEO) -->
          <div data-x-show="activeProject?.materiType !== 'MANUAL'">
            <div className="p-8 bg-slate-50" data-x-show="!isReadOnly()">
            <div className="bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/50 group relative">
              <input type="file" multiple data-x-change="handleFileUpload" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" :accept="activeProject?.materiType === 'TEKS' ? '.pdf,.ppt,.pptx,.png,.jpg,.jpeg' : '.mp4,.webm'" />
              <div className="space-y-4">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <span className="text-3xl text-[#1A237E]">↑</span>
                </div>
                <h4 className="text-lg font-black text-[#1A237E]">Pilih file atau tarik ke sini</h4>
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest" data-x-text="activeProject?.materiType === 'TEKS' ? 'Mendukung: PDF, PPT, PNG, JPG (Maks 10MB)' : 'Mendukung: MP4, WebM (Maks 50MB)'"></p>
                <div data-x-show="uploading" className="mt-4 text-[#FF5722] font-bold animate-pulse">Sedang mengunggah...</div>
              </div>
            </div>
            
            <template data-x-if="activeProject?.materiType === 'VIDEO'">
              <div className="mt-4 flex justify-center">
                <button data-x-click="addEmbedUrl()" className="text-[#1A237E] font-bold underline hover:text-indigo-900">Atau Tambahkan URL Embed (YouTube)</button>
              </div>
            </template>
          </div>

          <!-- Content List -->
          <div className="p-8 pt-0">
            <h4 className="font-black text-slate-800 uppercase tracking-widest mb-4">Konten Tersimpan (<span data-x-text="materiContents.length"></span>)</h4>
            <div className="space-y-3">
              <template x-htmlFor="(content, idx) in materiContents" data-x-bind-key="idx">
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0 font-bold" data-x-text="content.contentType"></div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate" data-x-text="content.fileName || content.fileUrl"></p>
                      <p className="text-xs text-slate-500 font-semibold" data-x-text="content.fileSize ? (content.fileSize / 1024 / 1024).toFixed(2) + ' MB' : ''"></p>
                    </div>
                  </div>
                  <button data-x-show="!isReadOnly()" data-x-click="removeContent(idx)" className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors">
                    <span className="text-xl">&times;</span>
                  </button>
                </div>
              </template>
              <template data-x-if="materiContents.length === 0">
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold">
                  Belum ada konten materi.
                </div>
              </template>
            </div>
          </div>
          </div>

          <!-- MANUAL Editor Area -->
          <div data-x-show="activeProject?.materiType === 'MANUAL'" className="p-4 md:p-8 space-y-8 bg-slate-50">
            <!-- Sections Area -->
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-[#1A237E] uppercase tracking-widest text-lg">📚 Sub-Bab Materi</h4>
                <div className="flex items-center gap-4">
                  <span data-x-show="savingSections" className="text-sm font-bold text-orange-500 animate-pulse">Menyimpan...</span>
                  <span data-x-show="!savingSections" className="text-sm font-bold text-green-500">Tersimpan ✓</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <template x-htmlFor="(section, idx) in sections" data-x-bind-key="idx">
                  <div className="bg-white rounded-2xl overflow-hidden border-2 border-[#FFC107] shadow-md">
                    <div className="bg-[#1A237E] text-white px-4 py-3 flex justify-between items-center">
                      <span className="font-black uppercase tracking-widest text-sm" data-x-text="'SUB-BAB ' + (idx + 1)"></span>
                      <button data-x-show="!isReadOnly()" data-x-click="removeSection(idx)" className="text-white/60 hover:text-red-400 font-bold transition-colors">✕ Hapus</button>
                    </div>
                    <div className="p-4 md:p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Judul Sub-Bab (Opsional)</label>
                        <input type="text" data-x-model="section.subTitle" @input.debounce.2000ms="saveSections()" data-x-bind-disabled="isReadOnly()" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm focus:border-[#1A237E] outline-none font-bold" placeholder="Contoh: Pendahuluan" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Isi Konten</label>
                        <textarea data-x-model="section.content" @input.debounce.2000ms="saveSections()" data-x-bind-disabled="isReadOnly()" rows="8" className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base leading-relaxed focus:border-[#1A237E] outline-none" placeholder="Ketik materi Anda di sini..."></textarea>
                      </div>
                    </div>
                  </div>
                </template>
                <button data-x-show="!isReadOnly()" data-x-click="addSection()" className="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all border-b-4 border-orange-800 active:border-b-0 active:translate-y-1">
                  + TAMBAH SUB-BAB
                </button>
              </div>
            </div>

            <hr className="border-2 border-dashed border-slate-200">

            <!-- Glossary Area -->
            <div>
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-[#1A237E] uppercase tracking-widest text-lg flex items-center gap-2">
                  <span>📖</span> Glosarium (Istilah Sulit)
                </h4>
                <div className="flex items-center gap-4">
                  <span data-x-show="savingGlossary" className="text-sm font-bold text-orange-500 animate-pulse">Menyimpan...</span>
                  <span data-x-show="!savingGlossary" className="text-sm font-bold text-green-500">Tersimpan ✓</span>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-6">Istilah di bawah ini akan digarisbawahi pada konten materi dan memunculkan penjelasan saat di-hover/klik oleh pembaca.</p>

              <div className="space-y-3">
                <template x-htmlFor="(item, idx) in glossaryItems" data-x-bind-key="idx">
                  <div className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <input type="text" data-x-model="item.word" @input.debounce.2000ms="saveGlossary()" data-x-bind-disabled="isReadOnly()" placeholder="Kata/Istilah" className="w-full md:w-1/3 border-2 border-slate-100 rounded-lg px-3 py-2 text-sm font-bold focus:border-[#FFC107] outline-none" />
                    <input type="text" data-x-model="item.definition" @input.debounce.2000ms="saveGlossary()" data-x-bind-disabled="isReadOnly()" placeholder="Definisi/Penjelasan Singkat" className="w-full border-2 border-slate-100 rounded-lg px-3 py-2 text-sm focus:border-[#FFC107] outline-none" />
                    <button data-x-show="!isReadOnly()" data-x-click="removeGlossary(idx)" className="shrink-0 bg-red-100 text-red-600 hover:bg-red-200 w-10 h-10 rounded-lg font-black transition-colors">✕</button>
                  </div>
                </template>
                <button data-x-show="!isReadOnly()" data-x-click="addGlossary()" className="w-full md:w-auto bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest shadow-md transition-all text-xs">
                  + TAMBAH ISTILAH
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Modal -->
      <div data-x-show="showPreview" style="display:none;" className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
          <div className="bg-[#1A237E] p-4 flex justify-between items-center text-white border-b-4 border-[#FFC107]">
            <h3 className="font-black uppercase tracking-widest">Preview: <span data-x-text="activeProject?.title" className="text-[#FFC107]"></span></h3>
            <button data-x-click="showPreview = false" className="text-white/50 hover:text-white text-3xl font-black transition-colors">&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 flex flex-col items-center gap-8">
            <template x-htmlFor="content in materiContents">
              <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                <template data-x-if="content.contentType === 'IMAGE'">
                  <img :src="content.fileUrl" className="w-full h-auto object-contain" />
                </template>
                <template data-x-if="content.contentType === 'PDF' || content.contentType === 'PPT'">
                  <iframe :src="content.fileUrl" className="w-full h-[70vh] border-0"></iframe>
                </template>
                <template data-x-if="content.contentType === 'VIDEO'">
                  <video :src="content.fileUrl" controls className="w-full h-auto max-h-[70vh] bg-black"></video>
                </template>
                <template data-x-if="content.contentType === 'EMBED_URL'">
                  <iframe :src="content.fileUrl" className="w-full h-[500px] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </template>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  
    </>
  );
};
