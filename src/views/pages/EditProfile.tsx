export const ProfilePage = ({ user }: { user: any }) => {
  const isUser = user.role === "USER";
  const userInterests = user.interests ? user.interests.split(",") : [];
  
  const allInterests = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  return `
      <style>
        :root {
          --clr-midnight: #1A237E;
          --clr-orange: #FF5722;
          --clr-soft-grey: #F5F5F5;
        }
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
        
        .interest-chip {
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .interest-chip:hover {
          transform: translateY(-2px);
        }
        .interest-checkbox:checked + .interest-label {
          background-color: #FF5722;
          color: white;
          border-color: #FF5722;
          box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3);
        }
      </style>

      <main class="max-w-4xl mx-auto mt-6 px-6 pb-20">
        <div class="flex flex-col md:flex-row gap-8">
          
          <!-- Sidebar: Info Ringkas -->
          <aside class="w-full md:w-1/3 space-y-6">
            <div class="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div class="shield-frame mb-6">
                <div class="shield-inner">
                  <img id="profile-preview" src="${user.avatarUrl || user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=1A237E&color=fff`}" alt="Avatar">
                </div>
              </div>
              <h2 class="text-base font-bold text-slate-800">${user.name}</h2>
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
            <div class="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
              <h1 class="text-lg font-bold text-slate-800 mb-8">Pengaturan Profil</h1>
              
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
                        class="w-full px-5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all font-medium">
                    </div>
                    <div class="space-y-2">
                      <label class="text-sm font-bold text-slate-700 ml-1">Ganti Foto Profil</label>
                      <div class="flex items-center gap-4">
                        <label for="profile-picture" class="flex-1 cursor-pointer bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-100 transition-colors">
                          <span class="text-sm text-slate-500">Klik untuk unggah foto baru</span>
                          <input type="file" id="profile-picture" name="profile_picture" class="hidden" accept="image/jpeg,image/png,image/webp">
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Bagian 2: Minat (Hanya untuk USER) -->
                ${isUser ? `
                  <div class="space-y-6">
                    <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      Minat Belajar
                      <div class="h-px bg-slate-100 flex-1"></div>
                    </h3>
                    
                    <p class="text-sm text-slate-500">Pilih kategori yang ingin kamu prioritaskan di beranda.</p>
                    
                    <div class="flex flex-wrap gap-3">
                      ${allInterests.map(interest => {
                        const checked = userInterests.includes(interest) ? 'checked' : '';
                        return `
                          <label class="interest-chip">
                            <input type="checkbox" name="interests" value="${interest}" class="interest-checkbox hidden" ${checked}>
                            <div class="interest-label p-2 text-sm.5 text-sm rounded-lg rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 transition-all">
                              ${interest}
                            </div>
                          </label>
                        `;
                      }).join('')}
                    </div>
                  </div>
                ` : ''}

                <div class="pt-6">
                  <button type="submit" id="save-btn" class="w-full bg-accent hover:bg-accent-hover text-white font-bold py-2.5 rounded-2xl shadow-lg shadow-accent/20 transition-all transform hover:-translate-y-1">
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

          try {
            const response = await fetch('/profile/update', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              alert('Profil berhasil diperbarui!');
              window.location.reload();
            } else {
              const data = await response.json().catch(() => ({}));
              alert(data.error || 'Gagal memperbarui profil.');
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
      </main>
  `;
};
