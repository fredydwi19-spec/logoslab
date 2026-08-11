import React, { useEffect, useState } from 'react';
import { KetuaTimDashboard } from './KetuaTimDashboard';
import { MemberDashboard } from './MemberDashboard';
import { MemberAchievements } from './MemberAchievements';
import { Navbar } from '../../components/Navbar';
import { Sidebar } from '../../components/Sidebar';

// Fallback empty components for other roles to ensure compilation
export const PembuatGameDashboard = () => <div className="p-8 text-center bg-slate-50 min-h-screen text-slate-500 font-bold">Workspace Produksi Game (React Converted)</div>;
export const PembuatMateriDashboard = () => <div className="p-8 text-center bg-slate-50 min-h-screen text-slate-500 font-bold">Workspace Konten Materi (React Converted)</div>;
export const PakarDashboard = () => <div className="p-8 text-center bg-slate-50 min-h-screen text-slate-500 font-bold">Review Proyek Pakar (React Converted)</div>;

export const DashboardPage = () => {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch /api/auth/me. 
    // Here we can attempt to infer from an existing API or just mock based on URL/localStorage.
    // For now, let's try to fetch user-summary to see if we are a USER, otherwise kpi-summary for KETUA_TIM.
    const determineRole = async () => {
      try {
        const userRes = await fetch('/api/dashboard/user-summary');
        if (userRes.ok) {
          const json = await userRes.json();
          if (json.success) {
            setRole('USER');
            return;
          }
        }
        
        const kpiRes = await fetch('/api/dashboard/kpi-summary');
        if (kpiRes.ok) {
          const json = await kpiRes.json();
          if (json.success) {
            setRole('KETUA_TIM');
            return;
          }
        }

        // Default fallback if endpoints forbid access
        setRole('UNKNOWN');
      } catch (err) {
        setRole('UNKNOWN');
      } finally {
        setLoading(false);
      }
    };
    determineRole();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-[#1A237E]">Memuat Dashboard...</div>;
  }

  const renderDashboard = () => {
    switch (role) {
      case 'KETUA_TIM':
        return <KetuaTimDashboard />;
      case 'PEMBUAT_GAME':
        return <PembuatGameDashboard />;
      case 'PEMBUAT_MATERI':
        return <PembuatMateriDashboard />;
      case 'PAKAR':
        return <PakarDashboard />;
      case 'USER':
        return <MemberDashboard />;
      default:
        return <div className="p-8 text-center text-slate-500 bg-slate-50 min-h-screen">Halaman Dashboard belum dikonfigurasi atau sesi Anda berakhir.</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-6 md:p-8">
            {renderDashboard()}
          </div>
        </main>
      </div>
    </div>
  );
};
