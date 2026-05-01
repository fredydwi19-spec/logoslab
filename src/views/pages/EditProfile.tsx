export const EditProfilePage = ({ user }: { user: any }) => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Edit Profil - Logos LAB</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      <style>
        :root {
          --clr-midnight: #1A237E;
          --clr-orange: #FF5722;
          --clr-orange-hover: #E64A19;
        }
        body { font-family: 'Inter', sans-serif; }
        .bg-midnight { background-color: var(--clr-midnight); }
        .text-orange { color: var(--clr-orange); }
        .btn-primary { 
          background-color: var(--clr-orange); 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover { 
          background-color: var(--clr-orange-hover);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 87, 34, 0.4);
        }
        .input-field {
          transition: border-color 0.3s;
        }
        .input-field:focus {
          border-color: var(--clr-midnight);
          outline: none;
          box-shadow: 0 0 0 3px rgba(26, 35, 126, 0.1);
        }
        .upload-area {
          border: 2px dashed #E2E8F0;
          transition: all 0.3s;
        }
        .upload-area:hover {
          border-color: var(--clr-orange);
          background: #FFF5F2;
        }
      </style>
    </head>
    <body class="bg-slate-50 min-h-screen">
      <nav class="bg-midnight text-white py-4 px-8 flex justify-between items-center sticky top-0 z-50">
        <a href="/" class="flex items-center gap-2 font-bold text-xl">
          <div class="w-8 h-8 bg-orange rounded flex items-center justify-center text-white">L</div>
          Logos LAB
        </a>
        <a href="/" class="text-sm font-medium hover:text-orange transition-colors">Kembali ke Beranda</a>
      </nav>

      <main class="max-w-2xl mx-auto py-12 px-6">
        <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div class="bg-midnight p-8 text-white">
            <h1 class="text-2xl font-bold">Edit Profil</h1>
            <p class="text-blue-100/70 text-sm mt-1">Perbarui informasi profil Anda untuk pengalaman yang lebih personal.</p>
          </div>

          <form id="edit-profile-form" class="p-8 space-y-8">
            <div class="space-y-6">
              <!-- Profile Picture -->
              <div class="flex flex-col items-center gap-4">
                <div class="relative group">
                  <div class="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md">
                    <img id="profile-preview" src="${user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.username)}&background=1A237E&color=fff`}" class="w-full h-full object-cover">
                  </div>
                  <label for="profile-picture" class="absolute bottom-0 right-0 bg-orange text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </label>
                  <input type="file" id="profile-picture" name="profile_picture" class="hidden" accept="image/*">
                </div>
                <p class="text-xs text-slate-400">Klik ikon kamera untuk mengganti foto</p>
              </div>

              <!-- Full Name -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700 ml-1">Nama Lengkap</label>
                <input type="text" name="name" value="${user.name || ''}" placeholder="Masukkan nama lengkap Anda" required
                  class="input-field w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800">
              </div>

              <!-- Email (Read Only) -->
              <div class="space-y-2">
                <label class="text-sm font-bold text-slate-700 ml-1">Alamat Email</label>
                <input type="email" value="${user.email}" disabled
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed">
              </div>
            </div>

            <div class="pt-4">
              <button type="submit" id="save-btn" class="btn-primary w-full py-4 rounded-xl text-white font-bold tracking-wide shadow-lg shadow-orange/20">
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </main>

      <script>
        const form = document.getElementById('edit-profile-form');
        const fileInput = document.getElementById('profile-picture');
        const preview = document.getElementById('profile-preview');
        const saveBtn = document.getElementById('save-btn');

        // Preview image
        fileInput.addEventListener('change', function() {
          const file = this.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
              preview.src = e.target.result;
            }
            reader.readAsDataURL(file);
          }
        });

        // Submit form
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          saveBtn.disabled = true;
          saveBtn.innerText = 'Menyimpan...';

          const formData = new FormData(form);
          const name = formData.get('name');

          try {
            const response = await fetch('/profile/edit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name })
            });

            if (response.ok) {
              alert('Profil berhasil diperbarui!');
              window.location.reload();
            } else {
              alert('Gagal memperbarui profil.');
            }
          } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan.');
          } finally {
            saveBtn.disabled = false;
            saveBtn.innerText = 'Simpan Perubahan';
          }
        });
      </script>
    </body>
    </html>
  `;
};
