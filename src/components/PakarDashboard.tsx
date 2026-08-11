import React, { useState, useEffect } from 'react';

export const PakarDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, fetch from '/api/dashboard/pakar-summary' or projects
    setTimeout(() => {
      setReviews([
        { id: 1, title: 'Kuis Sejarah Gereja', type: 'GAME', status: 'REVIEW_PAKAR', date: '2026-08-11' },
        { id: 2, title: 'Materi Dogmatika', type: 'MATERI', status: 'REVIEW_PAKAR', date: '2026-08-12' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-32"></div>
        <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100 animate-pulse h-64"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-6 w-1 bg-[#FFC107] rounded-full"></div>
        <h2 className="text-xl font-bold text-[#1A237E] uppercase tracking-widest">Dashboard Pakar</h2>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF5722] to-orange-300"></div>
        <h3 className="text-sm font-black uppercase tracking-widest text-[#1A237E] mb-2">Evaluasi Kurasi</h3>
        <p className="text-xs text-slate-500">Anda memiliki {reviews.length} antrean review yang membutuhkan evaluasi teknis.</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
        <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest mb-4">Antrean Review Proyek</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-slate-400 text-xs uppercase tracking-widest">
                <th className="px-6 py-4 font-black">Judul Proyek</th>
                <th className="px-6 py-4 font-black">Tipe</th>
                <th className="px-6 py-4 font-black">Tanggal Submit</th>
                <th className="px-6 py-4 font-black text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-slate-600 divide-y divide-slate-50">
              {reviews.map((r, idx) => (
                <tr key={idx} className="hover:bg-blue-50/40 transition-all group">
                  <td className="px-6 py-4 font-bold text-[#1A237E]">{r.title}</td>
                  <td className="px-6 py-4"><span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-bold uppercase">{r.type}</span></td>
                  <td className="px-6 py-4 text-xs font-medium">{r.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-[#1A237E] text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 transition-colors shadow-md">Review</button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-400 text-xs font-bold uppercase">Tidak ada antrean review</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
