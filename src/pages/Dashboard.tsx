import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { ButtonCTA } from '../components/ButtonCTA';

export const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 text-[#1A237E] font-sans leading-relaxed">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="p-6">
          <header className="mb-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Dashboard Overview</h1>
            <ButtonCTA>
              <i className="bi bi-plus-circle mr-2"></i>Buat Proyek Baru
            </ButtonCTA>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded shadow border-t-4 border-[#FFC107]">
              <h2 className="text-lg font-semibold mb-2">Proyek Aktif</h2>
              <p className="text-3xl font-bold">12</p>
            </div>
            <div className="bg-white p-6 rounded shadow border-t-4 border-[#1A237E]">
              <h2 className="text-lg font-semibold mb-2">Menunggu Review</h2>
              <p className="text-3xl font-bold">4</p>
            </div>
            <div className="bg-white p-6 rounded shadow border-t-4 border-orange-500">
              <h2 className="text-lg font-semibold mb-2">Pencapaian</h2>
              <p className="text-3xl font-bold">80%</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
