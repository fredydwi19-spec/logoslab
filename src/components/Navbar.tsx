import React from 'react';

export const Navbar = () => {
  return (
    <nav className="bg-[#1A237E] text-white p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src="/public/assets/Logo-LogosLAB.png" alt="Logos LAB" className="h-8" />
        <span className="font-bold text-lg md:text-xl">Logos LAB</span>
      </div>
      <div>
        <button className="text-white hover:text-[#FFC107] transition-colors text-sm sm:text-base">
          <i className="bi bi-person-circle text-xl"></i>
        </button>
      </div>
    </nav>
  );
};
