import { projects, questionBank } from "../../db/schema";

export const PembuatGameDashboard = ({ myProjects }: { myProjects: any[] }) => {
  return `
    <div class="bg-white p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" x-data="pembuatDashboard()">
      <div class="bg-[#1A237E] p-6 border-b-4 border-[#FFC107] flex items-center justify-between">
        <h2 class="text-xl font-black text-white uppercase tracking-widest">Workspace Produksi Game</h2>
        <div class="flex items-center gap-4">
           <span x-show="activeProject" id="saveStatus" class="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500">CLOUD SYNC ACTIVE</span>
        </div>
      </div>
      
      <div class="p-8">
        <h2 x-show="!activeProject" class="text-lg font-bold text-[#1A237E] mb-6 flex items-center gap-2">
          <span class="h-4 w-1 bg-[#FFC107] rounded-full"></span>
          Penugasan Aktif
        </h2>
      
      <!-- List View -->
      <div x-show="!activeProject" class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-slate-100 text-slate-400 text-sm">
              <th class="pb-4 font-semibold">ID</th>
              <th class="pb-4 font-semibold">Nama Proyek</th>
              <th class="pb-4 font-semibold">Deadline</th>
              <th class="pb-4 font-semibold">Status</th>
              <th class="pb-4 font-semibold text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="text-slate-600">
            ${myProjects.map(p => `
              <tr class="border-b border-slate-50 hover:bg-blue-50/50 transition-all">
                <td class="py-5 font-bold text-[#1A237E]">#G${p.id}</td>
                <td class="py-5 font-black text-slate-800 text-base">${p.title}</td>
                <td class="py-5 text-sm">
                  <div class="flex flex-col">
                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tenggat Waktu</span>
                    <span class="${new Date(p.deadline) < new Date() ? 'text-red-600 font-black' : 'font-bold'}">${new Date(p.deadline).toLocaleDateString()}</span>
                  </div>
                </td>
                <td class="py-5">
                  <span class="px-3 py-1 bg-slate-100 text-[#1A237E] border border-[#1A237E]/20 rounded-full text-[10px] font-black uppercase tracking-tighter">${p.status.replace('_', ' ')}</span>
                </td>
                <td class="py-5 text-right">
                  <button @click="openProject(${p.id})" class="bg-[#FF5722] text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-[#E64A19] transition-all shadow-md transform hover:scale-105 uppercase tracking-widest">KELOLA SOAL</button>
                </td>
              </tr>
            `).join('')}
            ${myProjects.length === 0 ? '<tr><td colspan="5" class="text-center py-10 text-slate-400 italic font-medium">Anda belum memiliki penugasan aktif saat ini.</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <!-- Editor View -->
      <div x-show="activeProject" style="display: none;" class="space-y-6">
        <button @click="closeProject()" class="text-slate-500 hover:text-slate-800 mb-4 flex items-center">
          ← Kembali
        </button>

        <!-- Static Header Info -->
        <div class="bg-[#1A237E]/5 p-8 rounded-2xl border-2 border-[#1A237E]/10 flex flex-col md:flex-row gap-8 items-start mb-10">
          <div class="relative h-48 w-full md:w-64 rounded-xl overflow-hidden border-4 border-white shadow-2xl">
            <img :src="activeProject?.thumbnailUrl || 'https://via.placeholder.com/300'" class="w-full h-full object-cover">
            <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#1A237E] to-transparent p-4">
               <span class="text-[10px] bg-[#FFC107] text-[#1A237E] px-2 py-0.5 rounded font-black uppercase" x-text="activeProject?.gameType"></span>
            </div>
          </div>
          <div class="flex-1 space-y-4">
            <div>
              <h3 class="text-3xl font-black text-[#1A237E] leading-tight" x-text="activeProject?.title"></h3>
              <p class="text-slate-500 font-medium mt-1 italic" x-text="activeProject?.description"></p>
            </div>
            <div class="p-5 bg-white rounded-xl shadow-sm border-l-8 border-[#FFC107]">
              <div class="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2 opacity-60">Instruksi Penugasan</div>
              <p class="text-[#1A237E] text-sm font-bold" x-text="activeProject?.instructions"></p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2 min-w-[150px]">
             <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow Status</div>
             <span class="px-4 py-2 bg-[#1A237E] text-white rounded-xl text-xs font-black shadow-lg" x-text="activeProject?.status.replace('_', ' ')"></span>
             <div class="mt-4 text-right">
                <span class="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-tight">Terakhir Disimpan</span>
                <span class="text-xs font-black text-[#1A237E]" x-text="lastSaved || 'Baru dimulai'"></span>
             </div>
          </div>
        </div>

        <!-- Project Workspace -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div class="lg:col-span-2 space-y-6">
            <!-- Questions Editor Toolbar -->
            <div class="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 gap-4">
              <div class="flex items-center gap-3">
                <div class="h-8 w-1.5 bg-[#1A237E] rounded-full"></div>
                <div>
                  <h3 class="text-sm font-black text-[#1A237E] uppercase tracking-widest">Editor Konten</h3>
                  <p class="text-[10px] text-slate-400 font-bold">Kelola butir soal interaktif</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 justify-center">
                 <button @click="downloadTemplate()" class="text-[10px] font-black uppercase bg-white border-2 border-slate-200 px-4 py-2 rounded-lg hover:border-[#1A237E] transition-all flex items-center gap-2">
                   CSV Template
                 </button>
                 <label class="text-[10px] font-black uppercase bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-lg cursor-pointer hover:bg-[#FFD54F] transition-all flex items-center gap-2 shadow-sm">
                   Import CSV
                   <input type="file" accept=".csv" @change="importCSV" class="hidden">
                 </label>
                 <button @click="previewGame()" class="text-[10px] font-black uppercase bg-[#1A237E] text-white px-4 py-2 rounded-lg hover:bg-indigo-900 transition-all flex items-center gap-2 shadow-md">
                   Simulasi Game
                 </button>
              </div>
            </div>
          </div>

          <!-- History Sidebar -->
          <div class="space-y-6">
            <div class="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200 h-full">
              <h4 class="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Umpan Balik Pakar & Ketua
              </h4>
              <div class="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                 <template x-for="log in activeProject?.history || []" :key="log.id">
                   <div class="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden">
                      <div class="absolute left-0 top-0 h-full w-1" :class="log.statusGiven === 'ACCEPT' ? 'bg-green-500' : 'bg-orange-500'"></div>
                      <div class="flex justify-between items-center mb-1">
                          <div class="text-[9px] font-black uppercase tracking-tighter" :class="log.statusGiven === 'ACCEPT' ? 'text-green-600' : 'text-orange-600'" x-text="log.statusGiven"></div>
                          <div class="text-[8px] text-slate-400 font-black uppercase tracking-widest" x-text="log.reviewerName"></div>
                       </div>
                       <p class="text-xs text-slate-600 font-bold italic" x-text="log.feedback"></p>
                       <div class="text-[8px] text-slate-400 mt-2 font-black opacity-50" x-text="new Date(log.createdAt).toLocaleString('id-ID', { hour12: false })"></div>
                   </div>
                 </template>
                 <template x-if="!(activeProject?.history?.length)">
                   <div class="text-center py-10">
                      <div class="text-slate-300 mb-2">---</div>
                      <p class="text-slate-400 text-[10px] italic font-medium uppercase tracking-widest">Belum ada catatan review.</p>
                   </div>
                 </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Staging Validation UI -->
        <template x-if="stagingQuestions.length > 0">
          <div class="bg-orange-50 border-2 border-orange-200 p-6 rounded-2xl mb-8 animate-in slide-in-from-top duration-500 shadow-xl">
             <div class="flex justify-between items-center mb-4">
               <div>
                 <h4 class="text-orange-800 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                   STAGING VALIDATION (IMPORT SOAL)
                 </h4>
                 <p class="text-orange-700 text-xs font-bold mt-1 italic">Silakan tinjau data di bawah ini sebelum disimpan permanen ke database.</p>
               </div>
               <div class="flex gap-2">
                 <button @click="stagingQuestions = []" class="bg-white text-orange-800 border-2 border-orange-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-orange-100 transition-all">BATALKAN</button>
                 <button @click="commitStaging()" class="bg-[#FF5722] text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase shadow-lg transform hover:scale-105 transition-all">SIMPAN PERMANEN</button>
               </div>
             </div>
             <div class="max-h-64 overflow-y-auto border border-orange-100 rounded-lg bg-white">
                <table class="w-full text-[10px]">
                  <thead class="bg-orange-100 text-orange-900 sticky top-0">
                    <tr>
                      <th class="p-2 text-left">Pertanyaan</th>
                      <th class="p-2 text-center">Kunci</th>
                      <th class="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <template x-for="(sq, sidx) in stagingQuestions" :key="sidx">
                      <tr class="border-b border-orange-50">
                        <td class="p-2 font-medium" x-text="sq.question"></td>
                        <td class="p-2 text-center font-black" x-text="sq.correctAnswer"></td>
                        <td class="p-2 text-center">
                          <span class="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">READY</span>
                        </td>
                      </tr>
                    </template>
                  </tbody>
                </table>
             </div>
          </div>
        </template>

        <template x-if="isReadOnly()">
          <div class="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
             Proyek dalam status <span x-text="activeProject?.status"></span> dan bersifat Read-Only.
          </div>
        </template>

        <div class="space-y-6" id="questionsContainer">
          <template x-for="(q, idx) in questions" :key="idx">
            <div class="border-2 rounded-2xl p-6 bg-white shadow-lg relative group transition-all hover:border-[#FFC107]">
               <div class="absolute -left-3 top-6 bg-[#1A237E] text-[#FFC107] h-8 w-10 flex items-center justify-center rounded-lg font-black shadow-md border-2 border-[#FFC107]" x-text="idx + 1"></div>
               <button x-show="!isReadOnly()" @click="removeQuestion(idx)" class="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all bg-red-50 p-2 rounded-full hover:bg-red-500 hover:text-white">
                 <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>

               <!-- Quiz Editor -->
               <template x-if="activeProject?.gameType === 'QUIZ'">
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pl-8">
                   <div class="col-span-full">
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Konten Pertanyaan</label>
                      <textarea x-model="q.question" @input="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#FFC107] outline-none font-bold transition-all min-h-[100px]" placeholder="Ketik pertanyaan di sini..."></textarea>
                   </div>
                   
                   <div class="space-y-3">
                     <div class="flex items-center gap-3">
                       <span class="h-8 w-8 bg-slate-100 flex items-center justify-center rounded-lg font-black text-slate-400">A</span>
                       <input type="text" x-model="q.optionA" @input="debouncedSave" :disabled="isReadOnly()" class="flex-1 border-2 border-slate-100 rounded-xl p-3 focus:border-[#1A237E] outline-none font-bold transition-all shadow-sm">
                     </div>
                     <div class="flex items-center gap-3">
                       <span class="h-8 w-8 bg-slate-100 flex items-center justify-center rounded-lg font-black text-slate-400">B</span>
                       <input type="text" x-model="q.optionB" @input="debouncedSave" :disabled="isReadOnly()" class="flex-1 border-2 border-slate-100 rounded-xl p-3 focus:border-[#1A237E] outline-none font-bold transition-all shadow-sm">
                     </div>
                   </div>
                   <div class="space-y-3">
                     <div class="flex items-center gap-3">
                       <span class="h-8 w-8 bg-slate-100 flex items-center justify-center rounded-lg font-black text-slate-400">C</span>
                       <input type="text" x-model="q.optionC" @input="debouncedSave" :disabled="isReadOnly()" class="flex-1 border-2 border-slate-100 rounded-xl p-3 focus:border-[#1A237E] outline-none font-bold transition-all shadow-sm">
                     </div>
                     <div class="flex items-center gap-3">
                       <span class="h-8 w-8 bg-slate-100 flex items-center justify-center rounded-lg font-black text-slate-400">D</span>
                       <input type="text" x-model="text" x-model="q.optionD" @input="debouncedSave" :disabled="isReadOnly()" class="flex-1 border-2 border-slate-100 rounded-xl p-3 focus:border-[#1A237E] outline-none font-bold transition-all shadow-sm">
                     </div>
                   </div>
                   
                   <div>
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Kunci Jawaban Benar</label>
                      <select x-model="q.correctAnswer" @change="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-[#FFC107] outline-none font-black transition-all appearance-none cursor-pointer">
                        <option value="A">Pilihan A</option><option value="B">Pilihan B</option><option value="C">Pilihan C</option><option value="D">Pilihan D</option>
                      </select>
                   </div>
                   <div>
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Parameter Kesulitan</label>
                      <select x-model="q.difficulty" @change="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-[#FFC107] outline-none font-black transition-all appearance-none cursor-pointer">
                        <option value="RENDAH">Mudah (10 Poin)</option>
                        <option value="SEDANG">Menengah (20 Poin)</option>
                        <option value="SULIT">Tantangan (50 Poin)</option>
                        <option value="BONUS">Hadiah (30 Poin)</option>
                      </select>
                   </div>
                   <div class="col-span-full">
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Penjelasan Edukatif (Muncul saat salah)</label>
                      <input type="text" x-model="q.explanation" @input="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold transition-all italic text-slate-500" placeholder="Berikan alasan mengapa jawaban tersebut benar...">
                   </div>
                 </div>
               </template>

               <!-- Fill The Blank Editor -->
               <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                 <div class="grid grid-cols-1 gap-6 pl-8">
                   <div class="col-span-full">
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Teks Lengkap (Highlight Kata untuk dijadikan rumpang)</label>
                      <div class="relative">
                        <textarea :id="'ftb-text-' + idx" x-model="q.fullText" @input="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#FFC107] outline-none font-bold transition-all min-h-[150px]" placeholder="Masukkan teks lengkap di sini..."></textarea>
                        <div class="absolute right-4 bottom-4">
                          <button @click="makeBlank(idx)" :disabled="isReadOnly()" class="bg-[#FFC107] text-[#1A237E] px-4 py-2 rounded-lg text-[10px] font-black uppercase shadow-sm hover:bg-yellow-500 transition-all">Jadikan Rumpang</button>
                        </div>
                      </div>
                   </div>

                   <div class="col-span-full space-y-4">
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest">Daftar Bagian Rumpang & Penjelasan</label>
                      <template x-for="(ans, aidx) in q.answers" :key="aidx">
                        <div class="bg-slate-50 p-4 rounded-xl border-2 border-slate-100 flex flex-col md:flex-row gap-4 items-start md:items-center animate-in fade-in slide-in-from-left-2">
                           <div class="flex items-center gap-2">
                             <span class="bg-[#1A237E] text-[#FFC107] h-6 w-6 flex items-center justify-center rounded-full text-[10px] font-black" x-text="aidx + 1"></span>
                             <span class="px-3 py-1 bg-white border border-slate-200 rounded font-black text-xs text-[#1A237E]" x-text="ans.word"></span>
                           </div>
                           <input type="text" x-model="ans.explanation" @input="debouncedSave" :disabled="isReadOnly()" class="flex-1 border-2 border-white rounded-lg p-2 focus:border-[#FFC107] outline-none text-xs font-bold shadow-sm" placeholder="Masukkan penjelasan teologis/edukatif untuk kata ini...">
                           <button @click="q.answers.splice(aidx, 1); debouncedSave();" :disabled="isReadOnly()" class="text-red-400 hover:text-red-600">
                             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                        </div>
                      </template>
                      <template x-if="!q.answers || q.answers.length === 0">
                        <div class="text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">
                          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Belum ada bagian rumpang. Sorot teks di atas lalu klik tombol "Jadikan Rumpang".</p>
                        </div>
                      </template>
                   </div>

                   <div class="w-1/2">
                      <label class="block text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-2">Parameter Kesulitan</label>
                      <select x-model="q.difficulty" @change="debouncedSave" :disabled="isReadOnly()" class="w-full border-2 border-slate-100 rounded-xl p-3 focus:border-[#FFC107] outline-none font-black transition-all appearance-none cursor-pointer">
                        <option value="RENDAH">Mudah (10 Poin)</option>
                        <option value="SEDANG">Menengah (20 Poin)</option>
                        <option value="SULIT">Tantangan (50 Poin)</option>
                      </select>
                   </div>
                 </div>
               </template>
            </div>
          </template>
        </div>
        
        <button x-show="!isReadOnly()" @click="addQuestion()" class="w-full border-4 border-dashed border-slate-200 text-slate-300 p-10 rounded-2xl hover:border-[#FFC107] hover:text-[#FFC107] hover:bg-slate-50 transition-all font-black text-2xl uppercase tracking-widest group">
           <span class="group-hover:scale-110 inline-block transition-transform">+ Tambah Soal Baru</span>
        </button>
        <!-- Action Footer -->
        <div x-show="!isReadOnly()" class="bg-[#1A237E] p-8 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-2xl border-b-8 border-[#FFC107]">
            <div class="text-white">
               <h4 class="font-black text-lg uppercase tracking-widest">Selesaikan Produksi?</h4>
               <p class="text-blue-200 text-xs font-bold" x-text="activeProject?.status === 'REVISI_KETUA' ? 'Pastikan revisi sesuai permintaan Ketua Tim.' : 'Pastikan semua soal sudah divalidasi sebelum dikirim ke Pakar.'"></p>
            </div>
            <button @click="submitForReview()" class="bg-[#FFC107] text-[#1A237E] px-10 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-lg transform hover:scale-105 flex items-center gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
               <span x-text="activeProject?.status === 'REVISI_KETUA' ? 'KIRIM KE KETUA TIM' : 'SUBMIT KE PAKAR'"></span>
            </button>
        </div>
      </div>

      <!-- Preview Game Modal -->
      <div x-show="showPreview" style="display:none;" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm">
         <div class="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
            <button @click="showPreview = false" class="absolute top-6 right-6 text-slate-400 hover:text-[#FF5722] z-10 text-3xl transition-colors font-black">&times;</button>
            <div class="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-[0.2em] border-b-4 border-[#FFC107]">
              SIMULASI GAME: <span x-text="activeProject?.title" class="text-[#FFC107]"></span>
            </div>
            <div class="p-12 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center relative">
               <!-- Navigation Arrows -->
               <button @click="prevQuestion()" x-show="currentQuestionIndex > 0" class="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 z-20 border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
               </button>
               <button @click="nextQuestion()" x-show="currentQuestionIndex < questions.length - 1" class="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1A237E] p-4 rounded-full shadow-xl transition-all hover:scale-110 z-20 border border-slate-200">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7" /></svg>
               </button>

               <div class="text-center w-full max-w-2xl">
                  <div class="inline-block bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + questions.length"></div>
                  
                  <!-- Quiz Content -->
                  <template x-if="activeProject?.gameType === 'QUIZ'">
                    <div>
                      <h3 class="text-2xl font-black text-[#1A237E] mb-10 leading-relaxed" x-text="questions[currentQuestionIndex]?.question"></h3>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <template x-for="opt in ['A', 'B', 'C', 'D']">
                           <button @click="checkAnswerQuiz(opt)" 
                              :class="{
                                'border-[#FFC107] bg-yellow-50': selectedAnswer === opt,
                                'border-green-500 bg-green-50': showExplanation && opt === questions[currentQuestionIndex].correctAnswer,
                                'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer,
                                'border-slate-100 bg-white': selectedAnswer !== opt && !(showExplanation && opt === questions[currentQuestionIndex].correctAnswer)
                              }"
                              class="border-4 p-6 rounded-2xl text-[#1A237E] font-black transition-all text-left flex items-center gap-4 group disabled:cursor-default"
                              :disabled="showExplanation">
                              <span class="h-8 w-8 rounded-lg flex items-center justify-center font-black" 
                                    :class="showExplanation && opt === questions[currentQuestionIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] text-slate-400'">
                                <span x-text="opt"></span>
                              </span>
                              <span x-text="questions[currentQuestionIndex]['option' + opt]"></span>
                           </button>
                         </template>
                      </div>
                    </div>
                  </template>

                  <!-- Fill The Blank Content -->
                  <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                    <div>
                      <div class="text-2xl font-bold text-[#1A237E] mb-10 leading-relaxed bg-white p-8 rounded-3xl shadow-inner border-2 border-slate-100" 
                           x-html="renderFTB(questions[currentQuestionIndex])"></div>
                      
                      <div class="mt-8 flex justify-center">
                        <button @click="checkAnswerFTB()" x-show="!showExplanation" class="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-[#E64A19] transition-all">PERIKSA JAWABAN</button>
                      </div>
                    </div>
                  </template>

                  <!-- Explanation Box -->
                  <div x-show="showExplanation" x-transition class="mt-8 p-6 rounded-2xl text-left border-2 border-dashed"
                       :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                     <div class="flex items-center gap-3 mb-2">
                        <template x-if="isCorrect">
                           <span class="bg-green-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <template x-if="!isCorrect">
                           <span class="bg-red-500 text-white p-1 rounded-full"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" /></svg></span>
                        </template>
                        <span class="font-black text-xs uppercase tracking-widest" :class="isCorrect ? 'text-green-800' : 'text-red-800'" x-text="isCorrect ? 'Luar Biasa!' : 'Belum Tepat!'"></span>
                     </div>
                     <div class="space-y-3">
                       <template x-if="activeProject?.gameType === 'QUIZ'">
                         <p class="text-sm font-bold text-slate-700 italic" x-text="questions[currentQuestionIndex].explanation"></p>
                       </template>
                       <template x-if="activeProject?.gameType === 'FILL_THE_BLANK'">
                         <div class="space-y-2">
                           <template x-for="(ans, aidx) in questions[currentQuestionIndex].answers" :key="aidx">
                             <div class="text-xs font-bold border-l-4 pl-3" :class="userFTBAnswers[aidx]?.toLowerCase() === ans.word.toLowerCase() ? 'border-green-400' : 'border-red-400'">
                               <span class="text-[#1A237E] uppercase tracking-tighter" x-text="ans.word"></span>: 
                               <span class="text-slate-500 italic" x-text="ans.explanation"></span>
                             </div>
                           </template>
                         </div>
                       </template>
                     </div>
                  </div>

                  <div class="mt-12 flex justify-center" x-show="showExplanation && (currentQuestionIndex === questions.length - 1)">
                     <button @click="showPreview = false" class="bg-[#1A237E] text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-2xl flex items-center gap-3 transform hover:scale-110">
                        SELESAI REVIEW
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-[#FFC107]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                     </button>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- Need AlpineJS for this specific logic -->
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pembuatDashboard', () => ({
          activeProject: null,
          questions: [],
          stagingQuestions: [],
          saveTimeout: null,
          lastSaved: '',
          showPreview: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,
          userFTBAnswers: [],
          
          async openProject(id) {
            const res = await fetch('/api/projects/' + id);
            const json = await res.json();
            if(json.success) {
              this.activeProject = json.data;
              this.questions = json.data.questions || [];
              this.checkLocalRecovery(id);
              this.updateSaveIndicator('SYNCHRONIZED', 'bg-green-100 text-green-800');
            }
          },
          
          closeProject() {
            this.activeProject = null;
            this.stagingQuestions = [];
          },
          
          isReadOnly() {
            if(!this.activeProject) return true;
            return !["DRAFT", "REVISI_PAKAR", "REVISI_KETUA"].includes(this.activeProject.status);
          },

          updateSaveIndicator(text, classes) {
            const el = document.getElementById('saveStatus');
            if(!el) return;
            el.innerText = text;
            el.className = "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-inner transition-all duration-500 " + classes;
          },
          
          addQuestion() {
            if (this.activeProject?.gameType === 'QUIZ') {
              this.questions.push({
                question: '', optionA: '', optionB: '', optionC: '', optionD: '',
                correctAnswer: 'A', difficulty: 'RENDAH', explanation: ''
              });
            } else {
              this.questions.push({
                fullText: '', answers: [], difficulty: 'RENDAH'
              });
            }
            this.debouncedSave();
          },
          
          removeQuestion(idx) {
            if(confirm('Hapus soal ini?')) {
              this.questions.splice(idx, 1);
              this.debouncedSave();
            }
          },

          makeBlank(idx) {
            const textarea = document.getElementById('ftb-text-' + idx);
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end).trim();

            if (!selectedText) {
              alert("Silakan sorot kata atau frasa terlebih dahulu.");
              return;
            }

            if (!this.questions[idx].answers) this.questions[idx].answers = [];
            
            this.questions[idx].answers.push({
              word: selectedText,
              explanation: ''
            });

            this.debouncedSave();
          },
          
          // Hybrid Autosave
          debouncedSave() {
            if(this.isReadOnly()) return;
            
            // 1. Instantly save to local storage
            const localKey = 'project_draft_' + this.activeProject.id;
            localStorage.setItem(localKey, JSON.stringify({
              timestamp: Date.now(),
              questions: this.questions
            }));
            
            this.updateSaveIndicator('LOCAL SAVED', 'bg-orange-100 text-orange-800 animate-pulse');
            
            // 2. Debounce cloud save
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(async () => {
               this.updateSaveIndicator('UPLOADING...', 'bg-blue-600 text-white animate-bounce');
               const res = await fetch('/api/projects/' + this.activeProject.id + '/questions', {
                 method: 'POST',
                 headers: {'Content-Type': 'application/json'},
                 body: JSON.stringify(this.questions)
               });
               if(res.ok) {
                 this.updateSaveIndicator('CLOUD SYNCED', 'bg-green-600 text-white');
                 this.lastSaved = new Date().toLocaleTimeString();
                 localStorage.removeItem(localKey);
               } else {
                 this.updateSaveIndicator('OFFLINE / ERROR', 'bg-red-600 text-white');
               }
            }, 3000);
          },
          
          checkLocalRecovery(id) {
             const localData = localStorage.getItem('project_draft_' + id);
             if(localData) {
               const parsed = JSON.parse(localData);
               if(confirm("Ditemukan draf pemulihan lokal (" + new Date(parsed.timestamp).toLocaleTimeString() + "). Ingin memulihkan pekerjaan terakhir?")) {
                 this.questions = parsed.questions;
                 this.debouncedSave();
               } else {
                 localStorage.removeItem('project_draft_' + id);
               }
             }
          },
          
          downloadTemplate() {
            const header = "question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation\\n";
            const dummy = "Siapa Presiden pertama RI?,Soekarno,Hatta,Soedirman,Habibie,A,RENDAH,Soekarno adalah proklamator\\n";
            const blob = new Blob([header + dummy], {type: 'text/csv'});
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "template_soal_logoslab.csv";
            a.click();
          },

          // Strict Sanitization
          sanitize(str) {
            if(!str) return '';
            return str.replace(/<[^>]*>?/gm, '').trim(); // Remove HTML tags
          },
          
          importCSV(e) {
            const file = e.target.files[0];
            if(!file || file.name.split('.').pop() !== 'csv') {
              alert("Mohon gunakan format file .CSV");
              return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
               const text = event.target.result;
               const rows = text.split('\\n').slice(1); // skip header
               const imported = [];
               for(let row of rows) {
                 if(!row.trim()) continue;
                 const cols = row.split(',');
                 if(cols.length < 6) continue;
                 imported.push({
                   question: this.sanitize(cols[0]), 
                   optionA: this.sanitize(cols[1]), 
                   optionB: this.sanitize(cols[2]), 
                   optionC: this.sanitize(cols[3]), 
                   optionD: this.sanitize(cols[4]),
                   correctAnswer: (cols[5] || 'A').trim().toUpperCase(), 
                   difficulty: (cols[6] || 'RENDAH').trim().toUpperCase(), 
                   explanation: this.sanitize(cols[7] || '')
                 });
               }
               this.stagingQuestions = imported;
               e.target.value = ''; // Reset input
            };
            reader.readAsText(file);
          },

          previewGame() {
            if(this.questions.length === 0) {
               alert("Belum ada soal untuk di-preview.");
               return;
            }
            this.currentQuestionIndex = 0;
            this.selectedAnswer = null;
            this.showExplanation = false;
            this.isCorrect = false;
            this.userFTBAnswers = [];
            this.showPreview = true;
          },
          
          checkAnswerQuiz(opt) {
            if(this.showExplanation) return;
            this.selectedAnswer = opt;
            this.isCorrect = opt === this.questions[this.currentQuestionIndex].correctAnswer;
            this.showExplanation = true;
          },

          renderFTB(q) {
            if(!q || !q.fullText) return '';
            let text = q.fullText;
            const answers = q.answers || [];
            
            // Sort answers by length descending to avoid partial replacement issues
            const sortedAnswers = [...answers].sort((a, b) => b.word.length - a.word.length);
            
            sortedAnswers.forEach((ans, i) => {
              const regex = new RegExp(ans.word, 'gi');
              text = text.replace(regex, '<input type="text" class="ftb-input border-b-2 border-[#1A237E] outline-none text-center px-2 text-[#FF5722] bg-slate-50 rounded-t w-24 mx-1" placeholder="..." onchange="window.updateFTB(' + i + ', this.value)">');
            });
            
            // Expose update function to global for x-html
            window.updateFTB = (idx, val) => {
              this.userFTBAnswers[idx] = val;
            };
            
            return text;
          },

          checkAnswerFTB() {
            const q = this.questions[this.currentQuestionIndex];
            const answers = q.answers || [];
            let allCorrect = true;

            answers.forEach((ans, i) => {
              const userVal = (this.userFTBAnswers[i] || '').trim().toLowerCase();
              if (userVal !== ans.word.trim().toLowerCase()) {
                allCorrect = false;
              }
            });

            this.isCorrect = allCorrect;
            this.showExplanation = true;
          },

          nextQuestion() {
            if(this.currentQuestionIndex < this.questions.length - 1) {
              this.currentQuestionIndex++;
              this.selectedAnswer = null;
              this.showExplanation = false;
              this.userFTBAnswers = [];
            } else {
              this.showPreview = false;
            }
          },

          prevQuestion() {
            if(this.currentQuestionIndex > 0) {
              this.currentQuestionIndex--;
              this.selectedAnswer = null;
              this.showExplanation = false;
              this.userFTBAnswers = [];
            }
          },

          async submitForReview() {
            if(this.questions.length === 0) {
              alert("Minimal harus ada 1 soal sebelum dikirim.");
              return;
            }
            const target = this.activeProject.status === 'REVISI_KETUA' ? 'Ketua Tim' : 'Pakar';
            if(!confirm(\`Kirim proyek ini ke \${target} untuk di-review? Anda tidak dapat mengedit soal selama proses review berlangsung.\`)) return;
            
            const res = await fetch(\`/api/projects/\${this.activeProject.id}/review\`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ statusGiven: 'SUBMIT', feedback: 'Sent for review' })
            });
            
            if(res.ok) {
              window.location.reload();
            } else {
              alert("Gagal mengirim ke pakar");
            }
          }
        }));
      });
    </script>
  `;
};
