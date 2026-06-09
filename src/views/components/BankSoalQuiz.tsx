export const BankSoalQuizUI = () => {
  return `
    <div class="p-6 md:p-10 space-y-8" x-data="bankSoalQuizData()">
      <!-- Header -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-[#1A237E] font-poppins">Bank Soal Quiz</h1>
          <p class="text-sm text-slate-500 mt-1">Kelola bank soal Quiz secara global.</p>
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
                <th class="p-4 font-semibold">Pertanyaan</th>
                <th class="p-4 font-semibold">Opsi & Jawaban</th>
                <th class="p-4 font-semibold text-center">Tingkat Kesulitan</th>
                <th class="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <template x-if="loading">
                <tr><td colspan="4" class="p-8 text-center text-slate-500">Memuat data...</td></tr>
              </template>
              <template x-if="!loading && soalList.length === 0">
                <tr><td colspan="4" class="p-8 text-center text-slate-500">Belum ada soal di Bank Soal Quiz.</td></tr>
              </template>
              <template x-for="soal in soalList" :key="soal.id">
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="p-4 text-sm text-slate-700 align-top max-w-xs truncate" x-text="soal.question"></td>
                  <td class="p-4 text-xs text-slate-600 align-top">
                    <div>A: <span x-text="soal.optionA" :class="{'font-bold text-green-600': soal.correctAnswer === 'A'}"></span></div>
                    <div>B: <span x-text="soal.optionB" :class="{'font-bold text-green-600': soal.correctAnswer === 'B'}"></span></div>
                    <div>C: <span x-text="soal.optionC" :class="{'font-bold text-green-600': soal.correctAnswer === 'C'}"></span></div>
                    <div>D: <span x-text="soal.optionD" :class="{'font-bold text-green-600': soal.correctAnswer === 'D'}"></span></div>
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
            <h3 class="text-lg font-bold text-[#1A237E]" x-text="isEdit ? 'Edit Soal Quiz' : 'Tambah Soal Quiz'"></h3>
            <button @click="showForm = false" class="text-slate-400 hover:text-red-500">&times;</button>
          </div>
          <div class="p-5 overflow-y-auto space-y-4">
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Pertanyaan</label>
              <textarea x-model="formData.question" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows="3" placeholder="Masukkan pertanyaan..."></textarea>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Opsi A</label>
                <input type="text" x-model="formData.optionA" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Opsi B</label>
                <input type="text" x-model="formData.optionB" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Opsi C</label>
                <input type="text" x-model="formData.optionC" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Opsi D</label>
                <input type="text" x-model="formData.optionD" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Jawaban Benar</label>
                <select x-model="formData.correctAnswer" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                <select x-model="formData.difficulty" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 mb-1">Penjelasan (Opsional)</label>
              <textarea x-model="formData.explanation" class="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows="2"></textarea>
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
            <h3 class="text-lg font-bold text-[#1A237E]">Import Bank Soal Quiz</h3>
            <button @click="openImportModal = false" class="text-slate-400 hover:text-red-500">&times;</button>
          </div>
          <div class="p-5 space-y-4">
            <p class="text-sm text-slate-600">Gunakan file template CSV untuk mengimpor soal secara massal. Format kolom wajib sesuai template.</p>
            <button @click="downloadTemplate()" class="w-full py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-semibold">
              <i class="bi bi-download"></i> Unduh Template CSV
            </button>
            <div class="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
              <input type="file" id="fileImport" accept=".csv" class="hidden" @change="handleFileChange">
              <label for="fileImport" class="cursor-pointer flex flex-col items-center">
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
      function bankSoalQuizData() {
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
            question: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'A',
            difficulty: 'MUDAH',
            explanation: ''
          },
          init() {
            this.fetchData();
          },
          async fetchData() {
            this.loading = true;
            try {
              const res = await fetch('/api/bank-soal/quiz');
              const json = await res.json();
              if (json.success) this.soalList = json.data;
            } catch (err) {
              console.error(err);
              alert("Gagal memuat data bank soal");
            } finally {
              this.loading = false;
            }
          },
          openFormModal(soal = null) {
            if (soal) {
              this.isEdit = true;
              this.formData = { ...soal };
            } else {
              this.isEdit = false;
              this.formData = { id: null, question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', difficulty: 'MUDAH', explanation: '' };
            }
            this.showForm = true;
          },
          async submitForm() {
            try {
              const method = this.isEdit ? 'PUT' : 'POST';
              const url = this.isEdit ? \`/api/bank-soal/quiz/\${this.formData.id}\` : '/api/bank-soal/quiz';
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
                alert(json.error || "Gagal menyimpan data");
              }
            } catch (err) {
              alert("Terjadi kesalahan sistem");
            }
          },
          async deleteSoal(id) {
            if (!confirm("Hapus soal ini?")) return;
            try {
              const res = await fetch(\`/api/bank-soal/quiz/\${id}\`, { method: 'DELETE' });
              if (res.ok) this.fetchData();
            } catch (err) {
              alert("Gagal menghapus soal");
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
              const res = await fetch('/api/bank-soal/import/quiz', {
                method: 'POST',
                body: formData
              });
              const json = await res.json();
              if (json.success) {
                alert(\`Berhasil mengimpor \${json.imported} soal.\`);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                document.getElementById('fileImport').value = '';
                this.fetchData();
              } else {
                alert(json.error || "Gagal import");
              }
            } catch (err) {
              alert("Terjadi kesalahan saat import");
            } finally {
              this.isImporting = false;
            }
          },
          downloadTemplate() {
            const rows = [
              'question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation',
              \`Siapa proklamator kemerdekaan Indonesia?,Soekarno dan Hatta,Suharto dan Habibie,Megawati dan Gus Dur,Jokowi dan Ma'ruf,A,MUDAH,Soekarno-Hatta memproklamasikan kemerdekaan pada 17 Agustus 1945\`,
              \`Berapakah hasil dari 7 x 8?,54,56,58,60,B,SEDANG,7 dikali 8 sama dengan 56\`,
              \`Apa nama hukum fisika yang menyatakan setiap aksi ada reaksi yang sama besar dan berlawanan arah?,Hukum Newton I,Hukum Newton II,Hukum Newton III,Hukum Archimedes,C,SULIT,Ini adalah Hukum Newton III tentang aksi-reaksi\`
            ];
            const csvContent = rows.join('\\n');
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Template_Bank_Soal_Quiz.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    </script>
  `;
};
