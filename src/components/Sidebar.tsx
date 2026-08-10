import React from 'react';

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-[#1A237E] text-white min-h-screen p-4 flex flex-col gap-4 hidden md:flex">
      <div className="font-bold text-lg mb-6 text-[#FFC107]">Menu Utama</div>
      <nav className="flex flex-col gap-2">
        <a href="/dashboard" className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded transition-colors text-sm sm:text-base">
          <i className="bi bi-house-door"></i> Dashboard
        </a>
        <a href="/projects" className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded transition-colors text-sm sm:text-base">
          <i className="bi bi-folder"></i> Proyek
        </a>
        <a href="/bank-soal" className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded transition-colors text-sm sm:text-base">
          <i className="bi bi-card-list"></i> Bank Soal
        </a>
      </nav>
    </aside>
  );
};
