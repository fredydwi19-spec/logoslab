export const ProfilePage = ({ user }: { user: any }) => {
  const isUser = user.role === "USER";
  const userCompetencies = user.competencies ? user.competencies.split(",") : [];
  
  const allCompetencies = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Profil Saya - Logos LAB</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@600;700&display=swap" rel="stylesheet" />
      <style>
        :root {
          --clr-midnight: #1A237E;
          --clr-orange: #FF5722;
          --clr-soft-grey: #F5F5F5;
        }
        body { 
          font-family: 'Inter', sans-serif; 
          background-color: var(--clr-soft-grey);
        }
        h1, h2, h3 { font-family: 'Poppins', sans-serif; }
        
        .shield-frame {
          position: relative;
          padding: 8px;
          background: linear-gradient(135deg, #FF5722, #1A237E);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          width: 140px;
          height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .shield-inner {
          background: white;
          width: 100%;
          height: 100%;
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .shield-inner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .competency-chip {
          display: inline-block;
          cursor: pointer;
        }
        .competency-chip:hover {
          transform: scale(1.05);
        }
        .competency-checkbox:checked + .competency-label {
          background-color: #FF5722;
          color: white;
          border-color: #FF5722;
          box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3);
        }
      </style>
    </head>
    <body class="min-h-screen pb-20">
      <nav class="bg-white border-b border-slate-200 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <a href="/" class="flex items-center gap-2 font-bold text-xl text-[#1A237E]">
          <div class="w-8 h-8 bg-[#FF5722] rounded flex items-center justify-center text-white">L</div>
          Logos LAB
        </a>
        <a href="/dashboard/${(() => {
          switch(user.role) {
            case 'KETUA_TIM':      return 'ketua';
            case 'PEMBUAT_GAME':   return 'game';
            case 'PEMBUAT_MATERI': return 'materi';
            case 'PAKAR':          return 'pakar';
            default:               return 'user';
          }
        })()}" class="flex items-center gap-2 text-sm font-semibold text-[#1A237E] hover:text-[#FF5722] transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          Dashboard
        </a>
      </nav>

      <main class="max-w-4xl mx-auto mt-12 px-6">
        <div class="flex flex-col md:flex-row gap-8">
          
          <!-- Sidebar: Info Ringkas -->
          <aside class="w-full md:w-1/3 space-y-6">
            <div class="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div class="shield-frame mb-6">
                <div class="shield-inner">
                  <img id="profile-preview" src="${user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=1A237E&color=fff`}" alt="Avatar">
                </div>
              </div>
              <h2 class="text-xl font-bold text-slate-800">${user.name}</h2>
              <p class="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full mt-2 uppercase tracking-wider">${user.role.replace('_', ' ')}</p>
              
              <div class="w-full border-t border-slate-50 mt-8 pt-6">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-slate-400">Email</span>
                  <span class="text-slate-700 font-medium truncate ml-4">${user.email}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-slate-400">Bergabung</span>
                  <span class="text-slate-700 font-medium">${new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </aside>

          <!-- Main Content: Form Edit -->
          <div class="flex-1 space-y-8">
            <div class="bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">
              <h1 class="text-2xl font-bold text-slate-800 mb-8">Pengaturan Profil</h1>
              
              <form id="profile-form" class="space-y-10">
                <!-- Bagian 1: Identitas -->
                <div class="space-y-6">
                  <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    Informasi Dasar
                    <div class="h-px bg-slate-100 flex-1"></div>
                  </h3>
                  
                  <div class="grid grid-cols-1 gap-6">
                    <div class="space-y-2">
                      <label class="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                      <input type="text" name="name" value="${user.name}" placeholder="Nama Anda" required
                        class="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:border-[#1A237E] focus:ring-4 focus:ring-[#1A237E]/5 outline-none transition-all font-medium">
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-bold text-slate-700 ml-1">Ganti Foto Profil</label>
                      <div class="flex items-center gap-4">
                        <label for="profile-picture" class="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors">
                          <span class="text-sm text-slate-500">Klik untuk unggah foto baru</span>
                          <input type="file" id="profile-picture" name="profile_picture" class="hidden" accept="image/*">
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bagian 2: Kategori Kompetensi (Hanya untuk USER) -->
                ${isUser ? `
                  <div class="space-y-6">
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      Kategori Kompetensi Belajar
                      <div class="h-px bg-slate-100 flex-1"></div>
                    </h3>
                    
                    <p class="text-sm text-slate-500">Pilih kategori yang ingin kamu prioritaskan di beranda.</p>
                    
                    <div class="flex flex-wrap gap-3">
                      ${allCompetencies.map(comp => {
                        const checked = userCompetencies.includes(comp) ? 'checked' : '';
                        return `
                          <label class="competency-chip">
                            <input type="checkbox" name="competencies" value="${comp}" class="competency-checkbox hidden" ${checked}>
                            <div class="competency-label px-5 py-3 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 transition-all">
                              ${comp}
                            </div>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                ` : ''}

                <div class="pt-6">
                  <button type="submit" id="save-btn" class="w-full bg-[#FF5722] hover:bg-[#E64A19] text-white font-bold py-5 rounded-2xl shadow-lg shadow-[#FF5722]/20 transition-all transform hover:-translate-y-1">
                    Simpan Semua Perubahan
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </main>

      <script>
        const form = document.getElementById('profile-form');
        const fileInput = document.getElementById('profile-picture');
        const preview = document.getElementById('profile-preview');
        const saveBtn = document.getElementById('save-btn');

        fileInput.addEventListener('change', function() {
          const file = this.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => preview.src = e.target.result;
            reader.readAsDataURL(file);
          }
        });

        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          saveBtn.disabled = true;
          saveBtn.innerText = 'Menyimpan...';

          const formData = new FormData(form);
          const name = formData.get('name');
          const competencies = formData.getAll('competencies');

          try {
            const response = await fetch('/profile/update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, competencies })
            });

            if (response.ok) {
              alert('Profil berhasil diperbarui!');
              window.location.reload();
            } else {
              alert('Gagal memperbarui profil.');
            }
          } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan koneksi.');
          } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Simpan Semua Perubahan';
          }
        });
      </script>
    </body>
    </html>
  `;
};
