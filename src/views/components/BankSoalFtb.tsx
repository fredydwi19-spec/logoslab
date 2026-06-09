export const BankSoalFtbUI = () => {
  return `
    <div class="p-6 md:p-10 space-y-8" x-data="bankSoalFtbData()">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-[#1A237E] font-poppins">Bank Soal Fill The Blank</h1>
          <p class="text-sm text-slate-500 mt-1">Kelola bank soal rumpang secara global.</p>
        </div>
        <div class="flex gap-2">
          <button @click="openImportModal = true" class="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold flex items-center gap-2">
            <i class="bi bi-download"></i> Import CSV
          </button>
          <button @click="openFormModal()" class="px-4 py-2 bg-[#FF5722] text-white rounded-lg hover:bg-[#E64A19] transition-colors text-sm font-bold flex items-center gap-2 shadow-md">
            <i class="bi bi-plus-lg"></i> Tambah Soal
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th class="p-4 font-semibold w-2/5">Teks Utuh</th>
                <th class="p-4 font-semibold">Kata Rumpang</th>
                <th class="p-4 font-semibold text-center">Tingkat Kesulitan</th>
                <th class="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template x-if="loading">
                <tr><td colspan="4" class="p-8 text-center text-slate-500">Memuat data...</td></tr>
              </template>
              <template x-if="!loading && soalList.length === 0">
                <tr><td colspan="4" class="p-8 text-center text-slate-500">Belum ada soal di Bank Soal FTB.</td></tr>
              </template>
              <template x-for="soal in soalList" :key="soal.id">
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="p-4 text-sm text-slate-700 align-top max-w-sm truncate" x-text="soal.fullText"></td>
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
                  <td class="p-4 text-center align-top space-x-2">
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
              <textarea x-model="formData.fullText" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows="4" placeholder="Masukkan teks. Gunakan tanda kurung buka dan tutup untuk menandai kata rumpang. Contoh: Ibukota Indonesia adalah [Jakarta]."></textarea>
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
                  <p class="text-xs text-slate-400 italic">Belum ada kata rumpang yang diekstrak.</p>
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
            <p class="text-sm text-slate-600">Gunakan file template CSV untuk mengimpor soal FTB secara massal. Format kolom wajib sesuai template.</p>
            <button @click="downloadTemplate()" class="w-full py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-semibold">
              <i class="bi bi-download"></i> Unduh Template CSV
            </button>
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <input type="file" id="fileImportFTB" accept=".csv" class="hidden" @change="handleFileChange">
              <label for="fileImportFTB" class="cursor-pointer flex flex-col items-center">
                <i class="bi bi-file-earmark-text text-3xl mb-2 text-slate-400"></i>
                <span class="text-sm font-semibold text-slate-700" x-text="selectedFileName || 'Klik untuk memilih file .csv'"></span>
                <span class="text-xs text-slate-400 mt-1">Hanya file .csv yang diterima</span>
              </label>
            </div>
          </div>
          <div class="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
            <button @click="openImportModal = false" class="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
            <button @click="submitImport()" :disabled="!selectedFile || isImporting" class="px-4 py-2 text-white bg-[#FF5722] rounded-lg hover:bg-[#E64A19] disabled:opacity-50 font-semibold text-sm">
              <span x-text="isImporting ? 'Mengimpor...' : 'Import'"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <script>
      function bankSoalFtbData() {
        return {
          soalList: [],
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
            // Pertahankan penjelasan yang sudah diisi jika kata sama
            const newAnswers = matches.map(m => m[1]).filter(w => w.trim() !== "");
            
            const currentAnsMap = {};
            this.formData.answers.forEach(a => { currentAnsMap[a.word] = a.explanation; });

            this.formData.answers = newAnswers.map(word => ({
              word: word,
              explanation: currentAnsMap[word] || ""
            }));
          },
          openFormModal(soal = null) {
            if (soal) {
              this.isEdit = true;
              this.formData = { ...soal, answers: JSON.parse(JSON.stringify(soal.answers)) };
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
              const url = this.isEdit ? \`/api/bank-soal/ftb/\${this.formData.id}\` : '/api/bank-soal/ftb';
              const res = await fetch(url, {
                method,
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
          async deleteSoal(id) {
            if (!confirm("Hapus soal ini?")) return;
            try {
              const res = await fetch(\`/api/bank-soal/ftb/\${id}\`, { method: 'DELETE' });
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
                alert(\`Berhasil mengimpor \${json.imported} soal.\`);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                document.getElementById('fileImportFTB').value = '';
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
            const rows = [
              'fullText,difficulty,word1,explanation1,word2,explanation2,word3,explanation3',
              'Ibukota Indonesia adalah [Jakarta] yang terletak di Pulau [Jawa].,MUDAH,Jakarta,Kota metropolitan terbesar di Indonesia,Jawa,Pulau terpadat di Indonesia,,',
              'Proses fotosintesis menghasilkan [oksigen] dan [glukosa] dengan bantuan cahaya matahari.,SEDANG,oksigen,Gas yang dibutuhkan makhluk hidup untuk bernafas,glukosa,Sumber energi bagi tumbuhan,,',
              'Teori relativitas dikemukakan oleh [Einstein] pada tahun [1905].,SULIT,Einstein,Fisikawan brilian asal Jerman,1905,Tahun diterbitkannya teori relativitas khusus,,'
            ];
            const csvContent = rows.join('\\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Template_Bank_Soal_FTB.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    </script>
  `;
};
