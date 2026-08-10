import React, { useState, useEffect } from 'react';
import { MateriViewerModal } from './MateriViewerModal';

export const DashboardMateriPage = () => {
  const [materis, setMateris] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isViewing, setIsViewing] = useState(false);
  const [activeMateri, setActiveMateri] = useState<any>(null);

  useEffect(() => {
    fetchMateris();
  }, []);

  const fetchMateris = async () => {
    try {
      const res = await fetch('/api/dashboard/published-materi');
      const json = await res.json();
      if (json.success) {
        setMateris(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const typeLabel: Record<string, string> = {
    PDF: "PDF",
    VIDEO: "Video",
    MANUAL: "Interaktif",
  };
  const typeBadge: Record<string, string> = {
    PDF: "bg-amber-100 text-amber-700",
    VIDEO: "bg-rose-100 text-rose-700",
    MANUAL: "bg-teal-100 text-teal-700",
  };
  const typeIcon: Record<string, string> = {
    PDF: "bi-file-earmark-pdf",
    VIDEO: "bi-play-btn",
    MANUAL: "bi-book-half",
  };
  const typeEmoji: Record<string, string> = {
    PDF: "📄",
    VIDEO: "🎬",
    MANUAL: "📖",
  };

  const openMateri = async (materi: any) => {
    try {
      const res = await fetch('/api/materi/' + materi.id);
      const json = await res.json();
      if (json.success) {
        setActiveMateri(json.data);
        setIsViewing(true);
      } else {
        alert(json.error || 'Gagal memuat materi.');
      }
    } catch (e) {
      console.error(e);
      alert('Terjadi kesalahan saat memuat materi.');
    }
  };

  const closeViewer = () => {
    setIsViewing(false);
    setActiveMateri(null);
  };

  const filteredMateris = materis.filter((m) => {
    const matchFilter = filter === 'ALL' || m.materiType === filter || (filter === 'PDF' && m.materiType === 'TEKS');
    const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-8 bg-teal-500 rounded-full inline-block"></span>
            Materi Pembelajaran
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-5">Semua materi yang telah dipublish oleh tim. Akses kapan saja!</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <i className="bi bi-journal-richtext text-teal-500 text-xl"></i>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Materi</p>
            <p className="text-xl font-black text-[#1A237E]">{materis.length}</p>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input 
            type="text" 
            placeholder="Cari judul atau deskripsi..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-full border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1A237E] focus:border-transparent shadow-sm text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PDF', 'VIDEO', 'MANUAL'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md flex items-center gap-1 ${
                filter === f ? (
                  f === 'ALL' ? 'bg-[#1A237E] text-white' :
                  f === 'PDF' ? 'bg-amber-500 text-white' :
                  f === 'VIDEO' ? 'bg-rose-500 text-white' :
                  'bg-teal-500 text-white'
                ) : 'bg-white text-slate-600 border border-slate-200'
              }`}>
              {f === 'ALL' ? 'Semua' :
               f === 'PDF' ? <><i className="bi bi-file-earmark-pdf"></i> PDF/Teks</> :
               f === 'VIDEO' ? <><i className="bi bi-play-btn"></i> Video</> :
               <><i className="bi bi-book-half"></i> Interaktif</>}
            </button>
          ))}
        </div>
      </div>

      {/* Materi Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMateris.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="text-6xl mb-4 opacity-20">📚</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada materi yang sesuai filter.</p>
          </div>
        ) : (
          filteredMateris.map(m => (
            <div key={m.id} onClick={() => openMateri(m)}
                 className="block cursor-pointer bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group transition-all duration-300 hover:-translate-y-1">
              {/* Thumbnail */}
              <div className="relative h-44 overflow-hidden">
                {m.thumbnailUrl ? (
                  <img src={m.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={m.title} />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center text-7xl ${
                    m.materiType === 'PDF' || m.materiType === 'TEKS' ? 'bg-gradient-to-br from-amber-50 to-amber-100' :
                    m.materiType === 'VIDEO' ? 'bg-gradient-to-br from-rose-50 to-rose-100' :
                    'bg-gradient-to-br from-teal-50 to-teal-100'
                  }`}>
                    {typeEmoji[m.materiType] || "📖"}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#1A237E]/65 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-[#FF5722] text-white font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <i className="bi bi-book-fill"></i> Baca Materi
                  </div>
                </div>
                {/* Type badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1 ${typeBadge[m.materiType] || "bg-slate-100 text-slate-600"}`}>
                    <i className={`bi ${typeIcon[m.materiType] || "bi-file"}`}></i>
                    {typeLabel[m.materiType] || m.materiType}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-bold text-[#1A237E] text-base line-clamp-1 group-hover:text-teal-600 transition-colors mb-1">
                  {m.title}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                  {m.description || "Materi pembelajaran dari Logos LAB. Klik untuk membaca selengkapnya."}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <i className="bi bi-person-fill"></i> Logos Team
                  </span>
                  <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                    m.materiType === 'PDF' || m.materiType === 'TEKS' ? "bg-amber-50 text-amber-600" :
                    m.materiType === 'VIDEO' ? "bg-rose-50 text-rose-600" :
                    "bg-teal-50 text-teal-600"
                  }`}>
                    <i className={`bi ${typeIcon[m.materiType] || "bi-file"}`}></i>
                    {typeLabel[m.materiType] || m.materiType}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isViewing && activeMateri && (
        <MateriViewerModal activeMateri={activeMateri} onClose={closeViewer} />
      )}
    </div>
  );
};
