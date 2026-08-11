import React, { useState, useEffect } from 'react';

export const Sidebar = () => {
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);
  const [openBankSoal, setOpenBankSoal] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data && data.user) setUser(data.user);
        else if (data && data.role) setUser(data);
      })
      .catch(console.error);
  }, []);

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/api/')) return;
    e.preventDefault();
    window.location.replace(path);
  };

  if (!user) return null;

  const { role } = user;
  const menuItems: { label: string; icon: string; link: string }[] = [
    { label: "Dashboard", icon: "bi-house", link: `/dashboard/${role.toLowerCase().split('_')[0]}` },
  ];

  if (role === "KETUA_TIM") {
    menuItems.push({ label: "Semua Proyek", icon: "bi-bar-chart", link: "/dashboard/projects" });
  } else if (role === "PEMBUAT_GAME") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "bi-controller", link: "/dashboard/game" });
  } else if (role === "PEMBUAT_MATERI") {
    menuItems.push({ label: "Proyek Saya", icon: "bi-book", link: "/dashboard/materi" });
  } else if (role === "PAKAR") {
    menuItems.push({ label: "Proyek Dikerjakan", icon: "bi-clipboard-check", link: "/dashboard/pakar" });
  } else if (role === "USER") {
    menuItems.push({ label: "Pencapaian Saya", icon: "bi-trophy", link: "/dashboard/user/achievements" });
    menuItems.push({ label: "Adaptive Learning", icon: "bi-brain", link: "/dashboard/adaptive-learning" });
  }

  return (
    <>
      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #FFC107; border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #FFD54F; }
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #FFC107 rgba(0,0,0,0.2); }
      `}</style>
      {/* Remove fixed left-0 top-0 h-screen to fit in SPA flex layout, use w-48 flex-shrink-0 h-full */}
      <div className="sidebar w-48 bg-[#1A237E] h-full flex-shrink-0 flex flex-col shadow-2xl z-[50] hidden md:flex">
        {/* ① LOGO */}
        <div className="flex-shrink-0 p-5 border-b border-white/10 flex flex-col items-center">
          <img src="/public/assets/Logo-LogosLAB.png" alt="Logos LAB" className="h-10 w-auto mb-3 bg-white p-2 rounded-lg shadow-lg" onError={(e) => e.currentTarget.src = '/public/assets/logo.png'} />
          <div className="text-center">
            <span className="text-base font-bold text-white tracking-widest uppercase">LOGOS LAB</span>
            <p className="text-[8px] text-[#FFC107] font-bold tracking-[0.2em] uppercase mt-1">Dashboard Portal</p>
          </div>
        </div>

        {/* ② ALL MENUS — scrollable */}
        <div className="sidebar-scroll flex-1 overflow-y-auto py-4 space-y-1 w-full">
          {/* Navigasi Utama */}
          <p className="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Navigasi Utama</p>
          {menuItems.map((item, idx) => (
            <a key={idx} href={item.link} onClick={(e) => handleNavigation(e, item.link)} className="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
              <span className="mr-3 text-lg transition-transform group-hover:scale-110"><i className={`bi ${item.icon}`}></i></span>
              <span className="font-semibold uppercase tracking-wide text-xs">{item.label}</span>
            </a>
          ))}

          {(role === "KETUA_TIM" || role === "PEMBUAT_GAME") && (
            <div className="w-full">
              <button onClick={() => setOpenBankSoal(!openBankSoal)}
                className="w-full flex items-center justify-between px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
                <div className="flex items-center">
                  <span className="mr-3 text-lg transition-transform group-hover:scale-110"><i className="bi bi-bank"></i></span>
                  <span className="font-semibold uppercase tracking-wide text-xs">Bank Soal</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${openBankSoal ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              {openBankSoal && (
                <div className="bg-black/20 pl-4 py-1 space-y-1 transition-all">
                  <a href="/dashboard/bank-soal/quiz" onClick={(e) => handleNavigation(e, '/dashboard/bank-soal/quiz')} className="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
                    <span className="mr-2 text-sm group-hover:scale-110 transition-transform"><i className="bi bi-pencil-square"></i></span>
                    <span className="text-xs tracking-wide">Bank Soal Quiz</span>
                  </a>
                  <a href="/dashboard/bank-soal/ftb" onClick={(e) => handleNavigation(e, '/dashboard/bank-soal/ftb')} className="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
                    <span className="mr-2 text-sm group-hover:scale-110 transition-transform"><i className="bi bi-fonts"></i></span>
                    <span className="text-xs tracking-wide">Bank Soal FTB</span>
                  </a>
                  <a href="/dashboard/bank-soal/tts" onClick={(e) => handleNavigation(e, '/dashboard/bank-soal/tts')} className="flex items-center px-5 py-2 text-blue-200 hover:text-[#FFC107] transition-all group">
                    <span className="mr-2 text-sm group-hover:scale-110 transition-transform"><i className="bi bi-puzzle"></i></span>
                    <span className="text-xs tracking-wide">Bank Soal TTS</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Konten Publik */}
          <div className="pt-3">
            <p className="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Konten Publik</p>
            <a href="/dashboard/games" onClick={(e) => handleNavigation(e, '/dashboard/games')} className="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
              <span className="mr-3 text-lg group-hover:scale-110 transition-transform"><i className="bi bi-controller"></i></span>
              <span className="font-semibold uppercase tracking-wide text-xs">Game</span>
            </a>
            <a href="/dashboard/materi-list" onClick={(e) => handleNavigation(e, '/dashboard/materi-list')} className="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
              <span className="mr-3 text-lg group-hover:scale-110 transition-transform"><i className="bi bi-journal-richtext"></i></span>
              <span className="font-semibold uppercase tracking-wide text-xs">Materi</span>
            </a>
          </div>

          {/* Akun */}
          <div className="pt-3">
            <p className="px-5 text-[8px] font-medium text-blue-300 uppercase tracking-[0.2em] mb-1 opacity-50">Akun</p>
            <a href="/profile" onClick={(e) => handleNavigation(e, '/profile')} className="flex items-center px-5 py-3 text-blue-100 hover:bg-white/10 hover:text-[#FFC107] transition-all group border-l-4 border-transparent hover:border-[#FFC107]">
              <span className="mr-3 text-lg group-hover:scale-110 transition-transform"><i className="bi bi-person-circle"></i></span>
              <span className="font-semibold uppercase tracking-wide text-xs">Edit Profil</span>
            </a>
          </div>
        </div>

        {/* ③ KELUAR */}
        <div className="flex-shrink-0 p-4 border-t border-white/10 bg-black/30">
          <a href="/api/auth/logout"
            className="flex items-center justify-center gap-2 w-full py-3 text-[10px] font-black text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-red-900/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Keluar
          </a>
        </div>
      </div>
    </>
  );
};
