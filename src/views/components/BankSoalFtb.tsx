export const BankSoalFtbUI = () => {
  const html = `
    <div class="p-6 md:p-10 space-y-8" x-data="bankSoalFtbData()">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-[#1A237E] font-poppins">Bank Soal Fill The Blank</h1>
          <p class="text-sm text-slate-500 mt-1">Kelola bank soal rumpang secara global.</p>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <div class="relative w-full sm:w-64">
            <i class="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" x-model="searchQuery" placeholder="Cari teks rumpang..." class="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1A237E] outline-none">
          </div>
          <select x-model="filterDifficulty" class="w-full sm:w-auto border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#1A237E] outline-none bg-white font-semibold text-slate-600">
            <option value="SEMUA">Semua Kesulitan</option>
            <option value="MUDAH">Mudah</option>
            <option value="SEDANG">Sedang</option>
            <option value="SULIT">Sulit</option>
          </select>
          <div class="flex gap-2">
            <button x-show="selectedIds.length > 0" @click="deleteSelected()" class="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-bold flex items-center gap-2 flex-1 justify-center sm:flex-none" x-transition>
              <i class="bi bi-trash"></i> <span x-text="'Hapus (' + selectedIds.length + ')'"></span>
            </button>
            <button @click="openImportModal = true" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold flex items-center gap-2 flex-1 justify-center sm:flex-none">
              <i class="bi bi-file-earmark-excel"></i> Import Excel
            </button>
            <button @click="openFormModal()" class="px-4 py-2 bg-[#FF5722] text-white rounded-lg hover:bg-[#E64A19] transition-colors text-sm font-bold flex items-center gap-2 shadow-md flex-1 justify-center sm:flex-none">
              <i class="bi bi-plus-lg"></i> Tambah Soal
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th class="p-4 w-12 text-center">
                  <input type="checkbox" class="rounded text-[#1A237E] focus:ring-[#1A237E] cursor-pointer"
                         :checked="filteredSoalList().length > 0 && selectedIds.length === filteredSoalList().length"
                         @change="$event.target.checked ? selectedIds = filteredSoalList().map(s => s.id) : selectedIds = []">
                </th>
                <th class="p-4 font-semibold w-2/5">Teks Utuh</th>
                <th class="p-4 font-semibold">Kata Rumpang</th>
                <th class="p-4 font-semibold text-center">Tingkat Kesulitan</th>
                <th class="p-4 font-semibold text-center w-24 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template x-if="loading">
                <tr><td colspan="5" class="p-8 text-center text-slate-500">Memuat data...</td></tr>
              </template>
              <template x-if="!loading && soalList.length === 0">
                <tr><td colspan="5" class="p-8 text-center text-slate-500">Belum ada soal di Bank Soal FTB.</td></tr>
              </template>
              <template x-for="soal in filteredSoalList()" :key="soal.id">
                <tr class="hover:bg-slate-50 transition-colors" :class="{'bg-blue-50/50': selectedIds.includes(soal.id)}">
                  <td class="p-4 text-center align-top">
                    <input type="checkbox" class="rounded text-[#1A237E] focus:ring-[#1A237E] cursor-pointer" :value="soal.id" x-model="selectedIds">
                  </td>
                  <td class="p-4 text-sm text-slate-700 align-top break-words" x-text="soal.fullText"></td>
                  <td class="p-4 text-xs text-slate-600 align-top">
                    <ul class="list-disc pl-4">
                      <template x-for="ans in soal.answers" :key="ans.word">
                        <li><strong x-text="ans.word"></strong> <span x-text="ans.explanation ? '(' + ans.explanation + ')' : ''" class="text-slate-400"></span></li>
                      </template>
                    </ul>
                  </td>
                  <td class="p-4 text-center align-top">
                    <span class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide"
                          :class="{
                            'bg-green-100 text-green-700': soal.difficulty === 'MUDAH',
                            'bg-yellow-100 text-yellow-700': soal.difficulty === 'SEDANG',
                            'bg-red-100 text-red-700': soal.difficulty === 'SULIT'
                          }" x-text="soal.difficulty"></span>
                  </td>
                  <td class="p-4 text-center align-top space-x-2 whitespace-nowrap">
                    <button @click="openFormModal(soal)" class="text-blue-500 hover:text-blue-700" title="Edit"><i class="bi bi-pencil-square"></i></button>
                    <button @click="deleteSoal(soal.id)" class="text-red-500 hover:text-red-700" title="Hapus"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Form Modal -->
      <div x-show="showForm" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style="display: none;" x-transition>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="text-lg font-bold text-[#1A237E]" x-text="isEdit ? 'Edit Soal FTB' : 'Tambah Soal FTB'"></h3>
            <button @click="showForm = false" class="text-slate-400 hover:text-red-500">&times;</button>
          </div>
          <div class="p-5 overflow-y-auto space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Teks Utuh</label>
              <textarea x-model="formData.fullText" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows="4" placeholder="Masukkan teks. Gunakan tanda kurung siku untuk menandai kata rumpang. Contoh: Ibukota Indonesia adalah [Jakarta]."></textarea>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
              <select x-model="formData.difficulty" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>
            <div class="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h4 class="text-sm font-bold text-slate-700 mb-2">Kata Rumpang</h4>
              <p class="text-xs text-slate-500 mb-3">Klik tombol untuk mengekstrak kata dalam kurung siku [...] dari teks utuh.</p>
              <button @click="extractAnswers()" class="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold mb-3">
                Ekstrak Kata
              </button>
              <div class="space-y-2">
                <template x-for="(ans, idx) in formData.answers" :key="idx">
                  <div class="flex gap-2 items-center">
                    <input type="text" x-model="ans.word" class="w-1/3 border border-slate-200 rounded p-1.5 text-xs bg-slate-100" readonly>
                    <input type="text" x-model="ans.explanation" placeholder="Penjelasan (opsional)" class="flex-1 border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-[#FFC107] outline-none">
                  </div>
                </template>
                <template x-if="formData.answers.length === 0">
                  <p class="text-xs text-slate-400 italic">Belum ada kata rumpang. Pastikan teks mengandung [...] lalu klik Ekstrak Kata.</p>
                </template>
              </div>
            </div>
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button @click="showForm = false" class="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
            <button @click="submitForm()" class="px-4 py-2 text-white bg-[#1A237E] rounded-lg hover:bg-blue-900 font-semibold text-sm">Simpan</button>
          </div>
        </div>
      </div>

      <!-- Import Modal -->
      <div x-show="openImportModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" style="display: none;" x-transition>
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
          <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 class="text-lg font-bold text-[#1A237E]">Import Bank Soal FTB</h3>
            <button @click="openImportModal = false" class="text-slate-400 hover:text-red-500">&times;</button>
          </div>
          <div class="p-5 space-y-4">
            <p class="text-sm text-slate-600">Gunakan file template Excel (.xlsx) untuk mengimpor soal FTB secara massal. Format kolom wajib sesuai template.</p>
            <button @click="downloadTemplate()" class="w-full py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-sm font-semibold flex items-center justify-center gap-2">
              <i class="bi bi-file-earmark-excel"></i> Unduh Template Excel (.xlsx)
            </button>
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <input type="file" id="fileImportFTB" accept=".xlsx,.xls" class="hidden" @change="handleFileChange">
              <label for="fileImportFTB" class="cursor-pointer flex flex-col items-center">
                <i class="bi bi-file-earmark-excel text-3xl mb-2 text-green-500"></i>
                <span class="text-sm font-semibold text-slate-700" x-text="selectedFileName || 'Klik untuk memilih file Excel (.xlsx)'"></span>
                <span class="text-xs text-slate-400 mt-1">Hanya file .xlsx / .xls yang diterima</span>
              </label>
            </div>
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button @click="openImportModal = false" class="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
            <button @click="submitImport()" :disabled="!selectedFile || isImporting" class="px-4 py-2 text-white bg-[#FF5722] rounded-lg hover:bg-[#E64A19] disabled:opacity-50 font-semibold text-sm">
              <span x-text="isImporting ? 'Mengimpor...' : 'Mengimpor'"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const script = `
    <script>
      function bankSoalFtbData() {
        return {
          soalList: [],
          selectedIds: [],
          searchQuery: '',
          filterDifficulty: 'SEMUA',
          loading: true,
          showForm: false,
          isEdit: false,
          openImportModal: false,
          selectedFile: null,
          selectedFileName: "",
          isImporting: false,
          formData: {
            id: null,
            fullText: '',
            answers: [],
            difficulty: 'MUDAH'
          },
          init() {
            this.fetchData();
          },
          filteredSoalList() {
            return this.soalList.filter(s => {
              const matchSearch = this.searchQuery.trim() === '' || (s.fullText || '').toLowerCase().indexOf(this.searchQuery.toLowerCase()) !== -1;
              const matchDiff = this.filterDifficulty === 'SEMUA' || s.difficulty === this.filterDifficulty;
              return matchSearch && matchDiff;
            });
          },
          async fetchData() {
            this.loading = true;
            try {
              const res = await fetch('/api/bank-soal/ftb');
              const json = await res.json();
              if (json.success) this.soalList = json.data;
            } catch (err) {
              console.error(err);
              alert("Gagal memuat data");
            } finally {
              this.loading = false;
            }
          },
          extractAnswers() {
            const matches = [...this.formData.fullText.matchAll(/\\[(.*?)\\]/g)];
            const newAnswers = matches.map(function(m) { return m[1]; }).filter(function(w) { return w.trim() !== ""; });
            const currentAnsMap = {};
            this.formData.answers.forEach(function(a) { currentAnsMap[a.word] = a.explanation; });
            this.formData.answers = newAnswers.map(function(word) {
              return { word: word, explanation: currentAnsMap[word] || '' };
            });
          },
          openFormModal(soal) {
            if (soal) {
              this.isEdit = true;
              this.formData = { id: soal.id, fullText: soal.fullText, difficulty: soal.difficulty, answers: JSON.parse(JSON.stringify(soal.answers)) };
            } else {
              this.isEdit = false;
              this.formData = { id: null, fullText: '', answers: [], difficulty: 'MUDAH' };
            }
            this.showForm = true;
          },
          async submitForm() {
            if (this.formData.answers.length === 0) {
              alert("Harap ekstrak kata rumpang terlebih dahulu");
              return;
            }
            try {
              const method = this.isEdit ? 'PUT' : 'POST';
              const url = this.isEdit ? '/api/bank-soal/ftb/' + this.formData.id : '/api/bank-soal/ftb';
              const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
              });
              const json = await res.json();
              if (json.success) {
                this.showForm = false;
                this.fetchData();
              } else {
                alert(json.error || "Gagal menyimpan");
              }
            } catch (err) {
              alert("Kesalahan sistem");
            }
          },
          async deleteSelected() {
            if (this.selectedIds.length === 0) return;
            if (!confirm("Hapus " + this.selectedIds.length + " soal terpilih?")) return;
            try {
              const res = await fetch('/api/bank-soal/ftb/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: this.selectedIds })
              });
              if (res.ok) {
                this.selectedIds = [];
                this.fetchData();
              }
            } catch (err) {
              alert("Gagal menghapus soal terpilih");
            }
          },
          async deleteSoal(id) {
            if (!confirm("Hapus soal ini?")) return;
            try {
              const res = await fetch('/api/bank-soal/ftb/' + id, { method: 'DELETE' });
              if (res.ok) this.fetchData();
            } catch (err) {
              alert("Gagal hapus");
            }
          },
          handleFileChange(e) {
            const file = e.target.files[0];
            if (file) {
              this.selectedFile = file;
              this.selectedFileName = file.name;
            }
          },
          async submitImport() {
            if (!this.selectedFile) return;
            this.isImporting = true;
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            try {
              const res = await fetch('/api/bank-soal/import/ftb', {
                method: 'POST',
                body: formData
              });
              const json = await res.json();
              if (json.success) {
                let msg = "Berhasil mengimpor " + json.imported + " soal.";
                if (json.warnings && json.warnings.length > 0) {
                  const skipReasons = {};
                  json.warnings.forEach(function(w) {
                    if (w.indexOf('ganda') !== -1) skipReasons['duplikat'] = (skipReasons['duplikat'] || 0) + 1;
                    else if (w.indexOf('word') !== -1 || w.indexOf('kata rumpang') !== -1) skipReasons['word kosong'] = (skipReasons['word kosong'] || 0) + 1;
                    else if (w.indexOf('difficulty') !== -1) skipReasons['difficulty invalid'] = (skipReasons['difficulty invalid'] || 0) + 1;
                    else if (w.indexOf('fullText') !== -1) skipReasons['fullText kosong'] = (skipReasons['fullText kosong'] || 0) + 1;
                    else skipReasons['lainnya'] = (skipReasons['lainnya'] || 0) + 1;
                  });
                  let detail = ' | ' + json.warnings.length + ' dilewati: ';
                  Object.keys(skipReasons).forEach(function(r) { detail += r + '=' + skipReasons[r] + ' '; });
                  msg += detail;
                  console.warn('[FTB Import Warnings]', json.warnings.slice(0, 30));
                }
                alert(msg);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                const fi = document.getElementById('fileImportFTB');
                if (fi) fi.value = '';
                this.fetchData();
              } else {
                alert(json.error || "Gagal import");
              }
            } catch (err) {
              alert("Kesalahan sistem saat import");
            } finally {
              this.isImporting = false;
            }
          },
          downloadTemplate() {
            const link = document.createElement('a');
            link.href = '/api/bank-soal/template/ftb';
            link.download = 'Template_Bank_Soal_FTB.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    <\/script>
  `;

  return html + script;
};
