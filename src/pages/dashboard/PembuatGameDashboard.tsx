import React from 'react';

export const PembuatGameDashboard = () => {
  return (
    <>
      {/* 
        This component was automatically converted from SSR HTML to JSX.
        Alpine.js logic has been disabled (attributes prefixed with data-x-) 
        to ensure valid JSX compilation. 
      */}
      
    
    
    
    

    <div className="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" data-x-data="pembuatDashboard()">
      <div className="bg-[#1A237E] p-6 border-b-4 border-[#FFC107] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-xl font-bold text-white uppercase tracking-widest leading-tight" data-x-text="viewMode === 'all' ? 'Semua Proyek Saya' : 'Workspace Produksi Game'"></h2>
        </div>
        <div className="flex items-center gap-4">
           <span data-x-show="activeProject" id="saveStatus" className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500">CLOUD SYNC ACTIVE</span>
           <div className="flex gap-2" data-x-show="!activeProject">
             <a href="/dashboard/game" :className="viewMode === 'active' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Proyek Dikerjakan</a>
             <a href="/dashboard/game?view=all" :className="viewMode === 'all' ? 'bg-[#FFC107] text-[#1A237E]' : 'bg-white/10 text-white'" className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Semua Proyek Saya</a>
           </div>
        </div>
      </div>
      
      <div className="p-8">

        <!-- ======= VIEW: PROYEK DIKERJAKAN (ACTIVE) ======= -->
        <div data-x-show="viewMode === 'active' && !activeProject">
          <!-- Header + Search -->
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-[#1A237E] uppercase tracking-wider flex items-center gap-2">
                <span className="h-5 w-1.5 bg-[#FFC107] rounded-full"></span>
                Proyek Yang Sedang Dikerjakan
              </h2>
              <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">Proyek aktif yang ditugaskan kepada Anda</p>
            </div>
            <div className="relative w-full md:w-64">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" data-x-model="searchActive" placeholder="Cari judul proyek..." className="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-[#FFC107] outline-none shadow-inner" />
            </div>
          </div>

          <!-- Tab Panel -->
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200 mb-0">

            <!-- Tab Bar -->
            <div className="flex overflow-x-auto bg-[#1A237E] border-b-0">
              <button data-x-click="activeTab = 'DRAFT'"
                className="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :className="activeTab === 'DRAFT' ? 'bg-white text-yellow-600 border-yellow-400 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                📝 Draft
              </button>
              <button data-x-click="activeTab = 'REVIEW_PAKAR'"
                className="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :className="activeTab === 'REVIEW_PAKAR' ? 'bg-white text-blue-600 border-blue-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                🔍 Review Pakar
              </button>
              <button data-x-click="activeTab = 'REVISI_PAKAR'"
                className="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :className="activeTab === 'REVISI_PAKAR' ? 'bg-white text-orange-600 border-orange-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i className="bi bi-pencil-square"></i> Revisi Pakar
              </button>
              <button data-x-click="activeTab = 'REVIEW_KETUA'"
                className="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :className="activeTab === 'REVIEW_KETUA' ? 'bg-white text-indigo-700 border-indigo-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                <i className="bi bi-award"></i> Review Ketua
              </button>
              <button data-x-click="activeTab = 'REVISI_KETUA'"
                className="flex-shrink-0 px-5 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] flex items-center gap-1.5"
                :className="activeTab === 'REVISI_KETUA' ? 'bg-white text-red-600 border-red-500 shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'">
                🔁 Revisi Ketua
              </button>
            </div>

            <!-- Active Projects Table -->
            <div className="overflow-x-auto bg-white">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                  <th className="px-6 py-4 font-black">Judul Game</th>
                  <th className="px-6 py-4 font-black">Jenis</th>
                  <th className="px-6 py-4 font-black">Deadline</th>
                  <th className="px-6 py-4 font-black">PIC Pakar</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-50">
                <template x-htmlFor="p in filteredActiveProjects()" data-x-bind-key="p.id">
                  <tr className="hover:bg-blue-50/40 transition-all group">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-800 text-base md:text-lg leading-tight group-hover:text-[#1A237E] transition-colors" data-x-text="p.title"></div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5" data-x-text="'#G' + p.id"></div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-black uppercase border border-slate-200" data-x-text="p.gameType || '-'"></span>
                    </td>
                    <td className="px-6 py-5">
                      <span :className="new Date(p.deadline) < new Date() ? 'text-red-600 font-black' : 'text-slate-700 font-bold'" data-x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm md:text-base font-medium text-slate-700" data-x-text="p.idPakar ? getUserName(p.idPakar) : 'Belum Ditentukan'"></span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter"
                        :className="{
                          'bg-yellow-100 text-yellow-800 border border-yellow-200': p.status === 'DRAFT',
                          'bg-blue-100 text-blue-800 border border-blue-200': p.status === 'REVIEW_PAKAR',
                          'bg-orange-100 text-orange-800 border border-orange-200': p.status === 'REVISI_PAKAR',
                          'bg-green-100 text-green-800 border border-green-200': p.status === 'ACCEPTED_PAKAR',
                          'bg-indigo-100 text-indigo-800 border border-indigo-200': p.status === 'REVIEW_KETUA',
                          'bg-red-100 text-red-800 border border-red-200': p.status === 'REVISI_KETUA',
                          'bg-slate-100 text-slate-600 border border-slate-200': p.status === 'UNPUBLISHED',
                        }"
                        data-x-text="p.status.replace(/_/g, ' ')">
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button data-x-click="openProject(p.id)" className="bg-[#1A237E] text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-900 transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">BUKA</button>
                    </td>
                  </tr>
                </template>
                <template data-x-if="filteredActiveProjects().length === 0">
                  <tr><td colspan="6" className="text-center py-16 text-slate-400 italic font-bold">
                    <div className="text-4xl mb-3 opacity-30">📭</div>
                    <div className="text-xs uppercase tracking-widest">Tidak ada proyek dalam kategori ini.</div>
                  </td></tr>
                </template>
              </tbody>
            </table>
            </div><!-- /overflow-x-auto -->
          </div><!-- /tab-panel -->
        </div><!-- /viewMode active -->

        <!-- ======= VIEW: SEMUA PROYEK SAYA (PUBLISHED) ======= -->
        <div data-x-show="viewMode === 'all' && !activeProject">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h2 className="text-lg font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-2">
                <span className="h-5 w-1.5 bg-green-500 rounded-full"></span>
                Proyek Telah Dipublikasikan
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-1">Game yang telah selesai dikerjakan dan sudah live (Read-Only)</p>
            </div>
          </div>

          <!-- Search -->
          <div className="flex justify-end mb-6">
            <div className="relative w-full md:w-72">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" data-x-model="searchPublished" placeholder="Cari judul game..." className="w-full border-2 border-slate-100 rounded-xl pl-9 pr-4 py-2 text-sm font-bold focus:border-green-400 outline-none shadow-inner" />
            </div>
          </div>

          <!-- Published Projects Table -->
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-slate-400 text-xs uppercase tracking-widest">
                  <th className="px-6 py-4 font-black">Judul Game</th>
                  <th className="px-6 py-4 font-black">Jenis Game</th>
                  <th className="px-6 py-4 font-black">Deadline</th>
                  <th className="px-6 py-4 font-black">Tanggal Publish</th>
                  <th className="px-6 py-4 font-black text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-slate-600 divide-y divide-slate-50">
                <template x-htmlFor="p in filteredPublishedProjects()" data-x-bind-key="p.id">
                  <tr className="hover:bg-green-50/40 transition-all group">
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-800 group-hover:text-green-700 transition-colors" data-x-text="p.title"></div>
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5" data-x-text="'#G' + p.id"></div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-lg font-black uppercase border border-green-200" data-x-text="p.gameType || '-'"></span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-slate-700 font-bold" data-x-text="p.deadline ? new Date(p.deadline).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></span>
                        <span className="text-green-700 font-black text-sm" data-x-text="p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'"></span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button data-x-click="openProject(p.id)" className="bg-green-600 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-green-700 transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">LIHAT DETAIL</button>
                    </td>
                  </tr>
                </template>
                <template data-x-if="filteredPublishedProjects().length === 0">
                  <tr><td colspan="5" className="text-center py-16 text-slate-400 italic font-bold">
                    <div className="text-4xl mb-3 opacity-30">🏆</div>
                    <div className="text-xs uppercase tracking-widest">Belum ada game yang dipublikasikan.</div>
                  </td></tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Editor View -->
        <div data-x-show="activeProject" style="display: none;" className="space-y-6">
          <button data-x-click="closeProject()" className="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2">
            ← Kembali
          </button>

          {/* Interpolated: ProjectHeader() */}

          <template data-x-if="activeProject?.gameType === 'WORD_SEARCH'">
             <div className="mb-10">
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                   {/* Interpolated: WordSearchEditor({ projectVar: 'activeProject'  */})}
                </div>
             </div>
          </template>
          
          <template data-x-if="activeProject?.gameType === 'CROSSWORD'">
              <div className="mb-10">
                 <div className="bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl">
                    {/* Interpolated: CrosswordEditor({ projectVar: 'activeProject'  */})}
                 </div>
              </div>
          </template>

          <div data-x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'" className="space-y-6 mb-10">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1.5 bg-[#1A237E] rounded-full"></div>
                <div>
                  <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest">Editor Konten</h3>
                  <p className="text-[10px] text-slate-400 font-bold">Kelola butir soal interaktif</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                 <button data-x-click="downloadExcelTemplate()" className="text-[10px] font-black uppercase bg-white border-2 border-slate-200 px-4 py-2 rounded-lg hover:border-[#1A237E] transition-all flex items-center gap-2">
                   Template Excel
                 </button>
                 <label className="text-[10px] font-black uppercase bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-lg cursor-pointer hover:bg-[#FFD54F] transition-all flex items-center gap-2 shadow-sm">
                   Import Excel
                   <input type="file" accept=".xlsx,.xls" data-x-change="importExcel" className="hidden" />
                 </label>
                 <button data-x-show="activeProject?.gameType === 'QUIZ' || activeProject?.gameType === 'FILL_THE_BLANK'" data-x-click="openGenerateModal = true" className="text-[10px] font-black uppercase bg-[#FF5722] text-white px-4 py-2 rounded-lg hover:bg-[#E64A19] transition-all flex items-center gap-2 shadow-md">
                   Generate Soal
                 </button>

              </div>
            </div>
          </div>

          <!-- Staging Validation UI -->
          <template data-x-if="stagingQuestions.length > 0">
            <div className="bg-blue-50 border-4 border-blue-200 p-8 rounded-3xl space-y-6 mb-10 shadow-xl">
               <div className="flex justify-between items-center">
                  <h4 className="text-lg font-black text-blue-900 uppercase">Validasi Import Soal (<span data-x-text="stagingQuestions.length"></span>)</h4>
                  <div className="flex gap-2">
                     <button data-x-click="stagingQuestions = []" className="bg-white text-slate-400 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Batal</button>
                     <button data-x-click="commitStaging()" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg transform hover:scale-105 transition-all">Konfirmasi Tambah</button>
                  </div>
               </div>
               <div className="max-h-64 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  <template x-htmlFor="(sq, sidx) in stagingQuestions" data-x-bind-key="sidx">
                     <div className="bg-white p-4 rounded-xl shadow-sm text-xs border border-blue-100">
                        <p className="font-bold text-blue-900 mb-2" data-x-text="sq.question || sq.fullText"></p>
                        <div className="flex gap-4 opacity-60 font-black uppercase text-[8px]">
                           <span data-x-text="'TYPE: ' + (sq.question ? 'QUIZ' : 'FTB')"></span>
                           <span data-x-text="'DIFFICULTY: ' + (sq.difficulty || 'MUDAH')"></span>
                        </div>
                     </div>
                  </template>
               </div>
            </div>
          </template>

          <template data-x-if="isReadOnly()">
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4 font-bold border border-red-200">
               Proyek dalam status <span data-x-text="activeProject?.status"></span> dan bersifat Read-Only.
            </div>
          </template>

          <!-- Generate Modal -->
          <div data-x-show="openGenerateModal" className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style="display: none;" data-x-transition="true">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-[#1A237E]">Auto-Generate Soal dari Bank</h3>
                <button data-x-click="openGenerateModal = false" className="text-slate-400 hover:text-red-500">&times;</button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500 font-bold mb-4">Pastikan Total Soal = (Mudah + Sedang + Sulit). Auto-generate akan menarik soal secara acak dari Bank Soal global.</p>
                <div data-x-show="activeProject?.gameType === 'QUIZ'">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori Kompetensi</label>
                  <select data-x-model="generateData.competency" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                    <option value="SEMUA">Semua Kompetensi (Acak)</option>
                    <option value="Biblical Knowledge">Biblical Knowledge</option>
                    <option value="Eksegesis &amp; Hermeneutik">Eksegesis &amp; Hermeneutik</option>
                    <option value="Biblical Theory">Biblical Theory</option>
                    <option value="Homiletika">Homiletika</option>
                    <option value="Apologetika">Apologetika</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Soal</label>
                  <input type="number" min="1" data-x-model="generateData.totalSoal" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-green-700 mb-1">Mudah</label>
                    <input type="number" min="0" data-x-model="generateData.jumlahMudah" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-yellow-700 mb-1">Sedang</label>
                    <input type="number" min="0" data-x-model="generateData.jumlahSedang" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-red-700 mb-1">Sulit</label>
                    <input type="number" min="0" data-x-model="generateData.jumlahSulit" className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" />
                  </div>
                </div>
                <div className="p-3 mt-4 bg-slate-50 rounded border border-slate-200 text-xs font-bold text-center">
                  Total Terhitung: <span data-x-text="Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)" :className="{'text-red-600': Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit)), 'text-green-600': Number(generateData.totalSoal) === (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))}"></span>
                </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button data-x-click="openGenerateModal = false" className="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
                <button data-x-click="submitGenerate()" data-x-bind-disabled="isGenerating || Number(generateData.totalSoal) !== (Number(generateData.jumlahMudah) + Number(generateData.jumlahSedang) + Number(generateData.jumlahSulit))" className="px-4 py-2 text-white bg-[#1A237E] rounded-lg hover:bg-blue-900 disabled:opacity-50 font-semibold text-sm">
                  <span data-x-text="isGenerating ? 'Memproses...' : 'Generate'"></span>
                </button>
              </div>
            </div>
          </div>

          <div data-x-show="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'" className="space-y-6">
            <template x-htmlFor="(q, idx) in questions" data-x-bind-key="idx">
              <div className="bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-md relative group transition-all hover:border-[#FFC107]">
                <div className="absolute -left-4 top-10 bg-[#1A237E] text-white h-10 w-10 rounded-xl flex items-center justify-center font-black shadow-lg" data-x-text="idx + 1"></div>
                <button data-x-show="!isReadOnly()" data-x-click="removeQuestion(idx)" className="absolute -right-2 -top-2 bg-red-500 text-white h-8 w-8 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10 font-bold">&times;</button>
                
                <!-- Quiz Editor -->
                <template data-x-if="activeProject?.gameType === 'QUIZ'">
                  <div className="space-y-6 pt-10">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Butir Pertanyaan</label>
                      <textarea data-x-model="q.question" data-x-input="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-[#1A237E] outline-none font-semibold text-base text-[#1A237E] bg-white transition-all shadow-inner" placeholder="Tuliskan pertanyaan di sini..."></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <template x-htmlFor="opt in ['A', 'B', 'C', 'D']">
                        <div className="relative">
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" data-x-text="'Pilihan ' + opt"></label>
                          <input type="text" data-x-model="q['option' + opt]" data-x-input="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border border-slate-200 rounded-lg p-3 focus:border-[#1A237E] outline-none font-semibold text-sm text-slate-700 bg-white transition-all pl-10 shadow-sm" :placeholder="'Opsi ' + opt" />
                          <div className="absolute left-3 top-9 font-bold text-[#1A237E]" data-x-text="opt + '.'"></div>
                        </div>
                      </template>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Jawaban Benar</label>
                        <select data-x-model="q.correctAnswer" data-x-change="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border border-slate-200 rounded-lg p-3 focus:border-[#1A237E] outline-none font-bold text-sm bg-white cursor-pointer text-[#1A237E] shadow-sm">
                          <option value="A">Opsi A</option><option value="B">Opsi B</option><option value="C">Opsi C</option><option value="D">Opsi D</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Kesulitan</label>
                        <select data-x-model="q.difficulty" data-x-change="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border border-slate-200 rounded-lg p-3 focus:border-[#1A237E] outline-none font-bold text-sm bg-white cursor-pointer text-[#1A237E] shadow-sm">
                          <option value="MUDAH">MUDAH (10 Poin)</option>
                          <option value="SEDANG">SEDANG (20 Poin)</option>
                          <option value="SULIT">SULIT (50 Poin)</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Penjelasan Edukatif</label>
                      <textarea data-x-model="q.explanation" data-x-input="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-[#1A237E] outline-none font-medium text-slate-600 italic bg-white transition-all shadow-sm" placeholder="Berikan alasan mengapa jawaban tersebut benar..."></textarea>
                    </div>
                  </div>
                </template>

                <!-- FTB Editor -->
                <template data-x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                  <div className="space-y-6 pl-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex justify-between">
                           Teks Lengkap (Blok teks lalu klik 'Jadikan Blank')
                           <button data-x-show="!isReadOnly()" data-x-click="makeBlank(idx)" className="bg-[#FFC107] text-[#1A237E] px-4 py-1 rounded-full hover:bg-yellow-400 transition-all shadow-sm flex items-center gap-2 font-black text-[10px] uppercase">
                             Jadikan Blank
                           </button>
                        </label>
                        <textarea :id="'ftb-text-' + idx" data-x-model="q.fullText" data-x-input="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full border-2 border-slate-100 rounded-2xl p-6 h-40 focus:border-[#1A237E] outline-none font-bold text-xl text-[#1A237E] bg-white transition-all shadow-inner" placeholder="Tuliskan kalimat di sini..."></textarea>
                     </div>
                     <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Daftar Kata Rumpang</label>
                        <template x-htmlFor="(ans, aidx) in q.answers" data-x-bind-key="aidx">
                           <div className="bg-slate-50 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-start border border-slate-100">
                              <div className="flex-none">
                                 <div className="text-[8px] font-black text-blue-400 uppercase mb-1">KATA</div>
                                 <div className="bg-[#1A237E] text-white px-3 py-1 rounded font-black text-sm" data-x-text="ans.word"></div>
                              </div>
                              <div className="flex-1 w-full">
                                 <div className="text-[8px] font-black text-blue-400 uppercase mb-1">PENJELASAN</div>
                                 <input type="text" data-x-model="ans.explanation" data-x-input="debouncedSave()" data-x-bind-disabled="isReadOnly()" className="w-full bg-white border-2 border-slate-100 rounded-lg p-2 text-xs font-bold focus:border-[#1A237E] outline-none transition-all" placeholder="Mengapa kata ini penting?" />
                              </div>
                              <button data-x-show="!isReadOnly()" data-x-click="q.answers.splice(aidx, 1); debouncedSave()" className="text-red-400 hover:text-red-600 pt-5 font-black">&times;</button>
                           </div>
                        </template>
                        <template data-x-if="!q.answers?.length">
                           <div className="text-center py-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-100 text-slate-400 text-xs font-bold uppercase italic opacity-50">Belum ada kata rumpang.</div>
                        </template>
                     </div>
                  </div>
                </template>
              </div>
            </template>

            <button data-x-show="!isReadOnly()" data-x-click="addQuestion()" className="w-full border-4 border-dashed border-slate-200 rounded-[2.5rem] p-10 text-slate-400 font-black uppercase tracking-[0.3em] hover:border-[#1A237E] hover:text-[#1A237E] transition-all flex flex-col items-center gap-4 group">
               <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-[#1A237E] group-hover:text-[#FFC107] transition-all transform group-hover:rotate-90">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" /></svg>
               </div>
               TAMBAH BUTIR SOAL BARU
            </button>

            <div data-x-show="!isReadOnly()" className="pt-10 flex flex-col items-center gap-3">
               <button data-x-click="submitForReview()" className="bg-[#FF5722] text-white px-12 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-2xl hover:bg-[#E64A19] transition-all transform hover:scale-110 active:scale-95 flex items-center gap-4">
                  <span data-x-text="activeProject?.status === 'REVISI_KETUA' ? 'KIRIM KE KETUA TIM' : 'KIRIM KE PAKAR'"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
               </button>
               <p className="text-xs text-slate-400 font-bold"
                  data-x-text="activeProject?.status === 'REVISI_KETUA' ? '→ Proyek akan dikirim ke Ketua Tim untuk review akhir' : '→ Proyek akan dikirim ke Pakar yang ditugaskan untuk review konten'">
               </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview Game Modal -->
      <div data-x-show="showPreview" 
           @open-preview.window="gameData = $event.detail; showPreview = true;"
           style="display:none;" 
           className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] backdrop-blur-md">
         <div className="bg-white rounded-[3rem] w-full shadow-2xl overflow-hidden flex flex-col relative border-4 border-white/20 transition-all duration-500"
              :className="activeProject?.gameType === 'WORD_SEARCH' || activeProject?.gameType === 'CROSSWORD' ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl h-[85vh]'">
            <button data-x-click="showPreview = false" className="absolute top-6 right-6 text-slate-400 hover:text-[#FF5722] z-10 text-3xl transition-colors font-black">&times;</button>
            <div className="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-8 border-[#FFC107] flex justify-between px-10">
              <div className="flex gap-2">
                <span className="text-white/40">SIMULASI:</span>
                <span data-x-text="activeProject?.title" className="text-[#FFC107]"></span>
              </div>
              <div className="flex gap-4 text-[10px]">
                <span className="bg-white/10 px-3 py-1 rounded-full text-white" data-x-text="activeProject?.gameType"></span>
              </div>
            </div>
            <div className="p-0 flex-1 overflow-y-auto bg-slate-50 relative flex flex-col">
               <template data-x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                 <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none z-20">
                    <button data-x-click="prevQuestion()" data-x-show="currentQuestionIndex > 0" className="pointer-events-auto bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button data-x-click="nextQuestion()" data-x-show="currentQuestionIndex < questions.length - 1" className="pointer-events-auto bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 border border-slate-200">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
               </template>

               <div className="text-center w-full flex-1 flex flex-col justify-center">
                  <template data-x-if="activeProject?.gameType !== 'WORD_SEARCH' && activeProject?.gameType !== 'CROSSWORD'">
                    <div className="inline-block mx-auto bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest mt-10" data-x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + questions.length"></div>
                  </template>
                  
                  <!-- Quiz Content -->
                  <template data-x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-[#1A237E] mb-6 leading-relaxed" data-x-text="questions[currentQuestionIndex]?.question"></h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <template x-htmlFor="opt in ['A', 'B', 'C', 'D']">
                           <button data-x-click="checkAnswerQuiz(opt)" 
                              :className="{
                                'border-[#FFC107] bg-yellow-50': selectedAnswer === opt,
                                'border-green-500 bg-green-50': showExplanation && opt === questions[currentQuestionIndex].correctAnswer,
                                'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer,
                                'border-slate-100 bg-white': selectedAnswer !== opt && !(showExplanation && opt === questions[currentQuestionIndex].correctAnswer)
                              }"
                              className="border-4 p-4 rounded-xl text-[#1A237E] font-bold transition-all text-left flex items-center gap-3 group disabled:cursor-default text-sm"
                              data-x-bind-disabled="showExplanation">
                              <span className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold" 
                                    :className="showExplanation && opt === questions[currentQuestionIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] text-slate-400'">
                                <span data-x-text="opt"></span>
                              </span>
                              <span data-x-text="questions[currentQuestionIndex]['option' + opt]"></span>
                           </button>
                         </template>
                      </div>
                    </div>
                  </template>

                  <!-- FTB Content -->
                  <template data-x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div className="text-2xl font-bold text-[#1A237E] mb-10 leading-relaxed bg-white p-8 rounded-3xl shadow-inner border-2 border-slate-100" 
                           data-x-html="renderFTB(questions[currentQuestionIndex])"></div>
                      <div className="mt-8 flex justify-center">
                        <button data-x-click="checkAnswerFTB()" data-x-show="!showExplanation" className="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-[#E64A19] transition-all">PERIKSA JAWABAN</button>
                      </div>
                    </div>
                  </template>

                  <!-- Word Search Content -->
                  <template data-x-if="showPreview && activeProject?.gameType === 'WORD_SEARCH' && gameData">
                    <div className="w-full">
                       {/* Interpolated: WordSearchGame({ projectVar: 'activeProject', gameDataVar: 'gameData'  */})}
                    </div>
                  </template>
                  
                  <template data-x-if="showPreview && activeProject?.gameType === 'CROSSWORD' && gameData">
                    <div className="w-full h-full flex items-center justify-center p-4 bg-[#1A237E]/5" data-x-bind-key="'cw-' + activeProject.id + '-' + (gameData?.updatedAt || Date.now())">
                       {/* Interpolated: CrosswordGame({ projectVar: 'activeProject', gameDataVar: 'gameData', isReadOnly: 'true'  */})}
                    </div>
                  </template>

                  <!-- Explanation Box -->
                  <div data-x-show="showExplanation" data-x-transition="true" className="mt-8 p-6 rounded-2xl text-left border-2 border-dashed"
                       :className="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                     <div className="flex items-center gap-3 mb-2">
                        <template data-x-if="isCorrect">
                           <span className="bg-green-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <template data-x-if="!isCorrect">
                           <span className="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <span className="font-black text-xs uppercase tracking-widest" :className="isCorrect ? 'text-green-800' : 'text-red-800'" data-x-text="isCorrect ? 'Luar Biasa!' : 'Belum Tepat!'"></span>
                     </div>
                     <div className="space-y-3">
                        <template data-x-if="activeProject?.gameType === 'QUIZ'">
                          <p className="text-sm font-bold text-slate-700 italic" data-x-text="questions[currentQuestionIndex]?.explanation"></p>
                        </template>
                        <template data-x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                          <div className="space-y-2">
                            <template x-htmlFor="(ans, aidx) in questions[currentQuestionIndex]?.answers" data-x-bind-key="aidx">
                              <div className="text-xs font-bold border-l-4 pl-3" :className="userFTBAnswers[aidx]?.toLowerCase() === ans.word.toLowerCase() ? 'border-green-400' : 'border-red-400'">
                                <span className="text-[#1A237E] uppercase tracking-tighter" data-x-text="ans.word"></span>: 
                                <span className="text-slate-500 italic" data-x-text="ans.explanation"></span>
                              </div>
                            </template>
                          </div>
                        </template>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
    {/* Interpolated: WordSearchEditorScript() */}
    {/* Interpolated: WordSearchGameScript() */}
    {/* Interpolated: CrosswordEditorScript() */}
    {/* Interpolated: CrosswordGameScript() */}
  
    </>
  );
};
