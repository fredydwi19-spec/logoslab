export const UserJournalPage = () => {
  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('userJournalData', function() {
          return {
            loading: true,
            journals: [],
            error: '',
            
            init: async function() {
              await this.fetchJournals();
            },
            
            fetchJournals: async function() {
              this.loading = true;
              try {
                const res = await fetch('/api/journals/my-journals', { credentials: 'include' });
                const json = await res.json();
                if(json.success) {
                  this.journals = json.data;
                } else {
                  this.error = json.error;
                }
              } catch(e) {
                this.error = 'Failed to load journals';
              } finally {
                this.loading = false;
              }
            },
            
            deleteJournal: async function(id) {
              if(!confirm('Yakin ingin menghapus jurnal ini?')) return;
              try {
                const res = await fetch('/api/journals/' + id, { method: 'DELETE' });
                const json = await res.json();
                if(json.success) {
                  this.journals = this.journals.filter(j => j.id !== id);
                }
              } catch(e) {
                alert('Gagal menghapus jurnal');
              }
            }
          }
        });
      });
    </script>
    
    <div x-data="userJournalData()" class="max-w-6xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-teal-700 to-emerald-900 rounded-[2rem] p-8 md:p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div class="relative z-10">
          <h2 class="text-3xl md:text-4xl font-black mb-3 flex items-center gap-3">📖 Jurnal Refleksi Pribadi</h2>
          <p class="text-emerald-100 text-lg">Catat dan renungkan setiap pembelajaran berhargamu di sini.</p>
        </div>
        <div class="relative z-10 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/30 text-center min-w-[150px]">
          <p class="text-[10px] font-black uppercase tracking-widest text-emerald-100 mb-1">Total Catatan</p>
          <p class="text-4xl font-black" x-text="journals.length"></p>
        </div>
      </div>
      
      <!-- Content -->
      <template x-if="loading">
         <div class="text-center py-20 text-slate-400 animate-pulse font-bold tracking-widest uppercase text-sm">Memuat Jurnal...</div>
      </template>
      
      <template x-if="error">
         <div class="text-center py-20">
            <div class="inline-block bg-red-100 text-red-600 px-6 py-4 rounded-2xl font-bold" x-text="error"></div>
         </div>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" x-show="!loading">
        <template x-for="journal in journals" :key="journal.id">
          <div class="bg-amber-50/50 rounded-3xl shadow-md border border-amber-100 p-6 flex flex-col group hover:shadow-xl transition-all transform hover:-translate-y-1 relative overflow-hidden">
            <!-- Decorative pin -->
            <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 w-12 h-6 bg-red-400/80 rounded-full blur-sm opacity-50"></div>
            <div class="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full shadow-md border border-red-600"></div>
            
            <div class="mt-4 flex justify-between items-start mb-4">
              <div>
                <span class="inline-block px-3 py-1 bg-white border border-amber-200 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-full mb-2" x-text="journal.referenceType === 'QUIZ' ? 'Kuis/Game' : 'Materi'"></span>
                <h3 class="text-lg font-bold text-slate-800 leading-tight" x-text="journal.title"></h3>
              </div>
              <button @click="deleteJournal(journal.id)" class="text-slate-400 hover:text-red-500 transition-colors p-2" title="Hapus Jurnal">
                <i class="bi bi-trash3-fill"></i>
              </button>
            </div>
            
            <div class="flex-1 bg-white/80 p-4 rounded-2xl border border-amber-100 mb-4 shadow-inner">
              <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium italic" x-text="journal.reflectionText"></p>
            </div>
            
            <div class="text-right">
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest" x-text="new Date(journal.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })"></p>
            </div>
          </div>
        </template>
        
        <template x-if="journals.length === 0">
          <div class="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div class="text-6xl mb-4 opacity-30">✍️</div>
             <h3 class="text-xl font-bold text-slate-500">Belum ada catatan jurnal</h3>
             <p class="text-slate-400 mt-2 font-medium">Selesaikan kuis atau baca materi untuk mulai menulis renungan Anda.</p>
          </div>
        </template>
      </div>

    </div>
  `;
};
