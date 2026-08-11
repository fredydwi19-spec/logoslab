import React, { useState, useEffect } from 'react';

export const ProfilePage = () => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile Form State
  const [name, setName] = useState('');
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string>('');
  
  // Password Form State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isSaving, setIsSaving] = useState(false);

  const allCompetencies = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then((data: any) => {
        if (!data.error) {
          setUser(data);
          setName(data.name || '');
          setCompetencies(data.competencies ? data.competencies.split(',') : []);
          setPreviewSrc(data.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || data.username)}&background=1A237E&color=fff`);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onload = (evt) => setPreviewSrc(evt.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCompetencyToggle = (comp: string) => {
    if (competencies.includes(comp)) {
      setCompetencies(competencies.filter(c => c !== comp));
    } else {
      setCompetencies([...competencies, comp]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('competencies', competencies.join(','));
    if (profilePicture) {
      formData.append('profile_picture', profilePicture);
    }

    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'POST',
        body: formData, // Sending as multipart/form-data
      });
      const data: any = await res.json();
      if (data.success) {
        alert('Profil berhasil diperbarui!');
        if (data.profilePicture) {
          setPreviewSrc(data.profilePicture);
        }
      } else {
        alert(data.error || 'Gagal memperbarui profil');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      const data: any = await res.json();
      if (data.success) {
        alert('Kata sandi berhasil diubah!');
        setIsPasswordModalOpen(false);
        setOldPassword('');
        setNewPassword('');
      } else {
        alert(data.error || 'Gagal mengubah kata sandi');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A237E]"></div></div>;
  }

  if (!user) {
    return <div className="p-8 text-center">Gagal memuat data profil.</div>;
  }

  const isUserRole = user.role === 'USER';

  return (
    <div className="min-h-screen pb-20 bg-slate-50 font-sans">
      <main className="max-w-4xl mx-auto mt-12 px-6">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar: Info Ringkas */}
          <aside className="w-full md:w-1/3 space-y-6">
            <div className="bg-white/90 p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="relative p-2 bg-gradient-to-br from-orange-500 to-[#1A237E] mb-6 shadow-lg" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)', width: '140px', height: '160px' }}>
                <div className="bg-white w-full h-full flex items-center justify-center overflow-hidden" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}>
                  <img src={previewSrc} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-[#1A237E]">{user.name}</h2>
              <p className="text-sm text-slate-500 font-medium px-3 py-1 bg-slate-100 rounded-full mt-2 uppercase tracking-wider">{user.role.replace('_', ' ')}</p>
              
              <div className="w-full border-t border-slate-100 mt-8 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Email</span>
                  <span className="text-[#1A237E] font-semibold truncate ml-4">{user.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Bergabung</span>
                  <span className="text-[#1A237E] font-semibold">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="mt-6 w-full py-2 border-2 border-[#1A237E] text-[#1A237E] font-semibold rounded-xl hover:bg-[#1A237E] hover:text-white transition-colors text-sm"
              >
                Ubah Kata Sandi
              </button>
            </div>
          </aside>

          {/* Main Content: Form Edit */}
          <div className="flex-1 space-y-8">
            <div className="bg-white/90 p-10 rounded-[32px] shadow-sm border border-slate-100">
              <h1 className="text-2xl font-bold text-[#1A237E] mb-8">Pengaturan Profil</h1>
              
              <form onSubmit={handleSaveProfile} className="space-y-10">
                {/* Bagian 1: Identitas */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                    Informasi Dasar
                    <div className="h-px bg-slate-100 flex-1"></div>
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#1A237E] ml-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required
                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:border-[#1A237E] focus:ring-4 focus:ring-[#1A237E]/5 outline-none transition-all font-medium text-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#1A237E] ml-1">Ganti Foto Profil</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:bg-slate-100 hover:border-[#1A237E]/50 transition-colors">
                          <span className="text-sm font-medium text-slate-500">Klik untuk unggah foto baru</span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Kategori Kompetensi (Hanya untuk USER) */}
                {isUserRole && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                      Kategori Kompetensi Belajar
                      <div className="h-px bg-slate-100 flex-1"></div>
                    </h3>
                    
                    <p className="text-sm text-slate-500">Pilih kategori yang ingin kamu prioritaskan di beranda.</p>
                    
                    <div className="flex flex-wrap gap-3">
                      {allCompetencies.map(comp => {
                        const checked = competencies.includes(comp);
                        return (
                          <button
                            key={comp}
                            type="button"
                            onClick={() => handleCompetencyToggle(comp)}
                            className={`px-5 py-3 rounded-2xl border text-sm font-semibold transition-all ${checked ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/30' : 'border-slate-200 text-slate-600 hover:border-[#1A237E] hover:text-[#1A237E]'}`}
                          >
                            {comp}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button 
                    type="submit" 
                    disabled={isSaving}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-orange-500/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:transform-none"
                  >
                    {isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A237E]/20 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
            <h2 className="text-xl font-bold text-[#1A237E] mb-6">Ubah Kata Sandi</h2>
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A237E]">Kata Sandi Lama</label>
                <input 
                  type="password" 
                  value={oldPassword} 
                  onChange={e => setOldPassword(e.target.value)} 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-[#1A237E] outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#1A237E]">Kata Sandi Baru</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:border-[#1A237E] outline-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-3 text-slate-500 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-md transition-colors"
                >
                  Simpan Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
