export const UserMaterialsPage = ({ materials }: { materials: any[] }) => {
  const materialsJson = JSON.stringify(materials).replace(/</g, '\\u003c');
  
  return `
    <script>
      document.addEventListener('alpine:init', function() {
        Alpine.data('userMaterialsData', function() {
          return {
            items: ${materialsJson},
            filterType: 'ALL',
            filterValue: '',
            
            get filteredItems() {
              if (this.filterType === 'ALL') return this.items;
              if (this.filterType === 'TITLE') {
                return this.items.filter(item => item.title.toLowerCase().includes(this.filterValue.toLowerCase()));
              }
              if (this.filterType === 'CATEGORY') {
                if (!this.filterValue) return this.items;
                return this.items.filter(item => item.materialType === this.filterValue);
              }
              return this.items;
            },

            get uniqueCategories() {
              const types = this.items.map(i => i.materialType).filter(Boolean);
              return [...new Set(types)];
            },

            getMaterialIcon(type) {
              switch(type) {
                case 'PDF': return '📄';
                case 'VIDEO': return '🎬';
                case 'TEXT': return '📝';
                default: return '📚';
              }
            }
          }
        });
      });
    </script>
    
    <div x-data="userMaterialsData()" class="space-y-6">
      
      <!-- Filter Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 class="text-xl font-bold text-primary mb-4">Pencarian Materi Belajar</h2>
        <div class="flex flex-col md:flex-row gap-4 items-end">
          
          <div class="w-full md:w-1/3">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Tipe Filter</label>
            <select x-model="filterType" @change="filterValue = ''" class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0 transition-colors font-semibold text-slate-700">
              <option value="ALL">Semua Materi</option>
              <option value="TITLE">Berdasarkan Judul</option>
              <option value="CATEGORY">Berdasarkan Kategori/Jenis</option>
            </select>
          </div>

          <div class="w-full md:w-2/3" x-show="filterType === 'TITLE'">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Cari Judul Materi</label>
            <input type="text" x-model="filterValue" placeholder="Ketik judul materi..." class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0 transition-colors font-medium">
          </div>

          <div class="w-full md:w-2/3" x-show="filterType === 'CATEGORY'">
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Pilih Kategori</label>
            <select x-model="filterValue" class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-0 transition-colors font-semibold text-slate-700">
              <option value="">Semua Kategori</option>
              <template x-for="cat in uniqueCategories">
                <option :value="cat" x-text="cat.replace('_', ' ')"></option>
              </template>
            </select>
          </div>
          
        </div>
      </div>

      <!-- Grid Content -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <template x-for="item in filteredItems" :key="item.id">
          <div class="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden group flex flex-col hover:shadow-2xl transition-all transform hover:-translate-y-1">
            <div class="h-48 bg-gradient-to-br from-indigo-50 to-blue-50 relative overflow-hidden flex items-center justify-center">
              <template x-if="item.thumbnailUrl">
                <img :src="item.thumbnailUrl" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
              </template>
              <template x-if="!item.thumbnailUrl">
                <div class="text-7xl transform group-hover:scale-110 transition-transform" x-text="getMaterialIcon(item.materialType)"></div>
              </template>
              <div class="absolute top-4 right-4 bg-white/90 backdrop-blur text-xs font-black px-3 py-1.5 rounded-full text-primary shadow-lg uppercase tracking-widest" x-text="item.materialType ? item.materialType.replace('_', ' ') : 'MATERI'"></div>
            </div>
            
            <div class="p-6 flex flex-col flex-1">
              <h3 class="text-lg font-black text-slate-800 mb-2 leading-tight line-clamp-2" x-text="item.title"></h3>
              <p class="text-sm text-slate-500 mb-6 flex-1 line-clamp-3 leading-relaxed" x-text="item.description || 'Tidak ada deskripsi.'"></p>
              
              <a :href="'/play/' + item.id" class="w-full bg-primary text-white text-center py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary-dark transition-colors shadow-md flex items-center justify-center gap-2">
                <i class="bi bi-book-fill text-base text-highlight"></i> Baca Materi
              </a>
            </div>
          </div>
        </template>
        
        <template x-if="filteredItems.length === 0">
          <div class="col-span-full text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
             <div class="text-5xl mb-4 opacity-30">📚</div>
             <h3 class="text-xl font-bold text-slate-500">Tidak ada materi yang ditemukan</h3>
             <p class="text-slate-400 mt-2 font-medium">Coba ubah kriteria pencarian Anda.</p>
          </div>
        </template>
      </div>

    </div>
  `;
};
