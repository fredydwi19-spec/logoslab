import React, { useState, useEffect } from 'react';

export const BankSoalTts = () => {
  const [soalList, setSoalList] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('SEMUA');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [openImportModal, setOpenImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: null as number | null,
    clue: '',
    answer: '',
    difficulty: 'MUDAH',
    explanation: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bank-soal/tts');
      const json = await res.json() as any;
      if (json.success) setSoalList(json.data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data bank soal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSoalList = soalList.filter(s => {
    const matchSearch = searchQuery.trim() === '' || (s.clue || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchDiff = filterDifficulty === 'SEMUA' || s.difficulty === filterDifficulty;
    return matchSearch && matchDiff;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSoalList.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const openFormModal = (soal: any = null) => {
    if (soal) {
      setIsEdit(true);
      setFormData({ ...soal });
    } else {
      setIsEdit(false);
      setFormData({ id: null, clue: '', answer: '', difficulty: 'MUDAH', explanation: '' });
    }
    setShowForm(true);
  };

  const submitForm = async () => {
    if (!formData.clue || !formData.answer) {
      alert("Petunjuk dan Jawaban wajib diisi");
      return;
    }
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? '/api/bank-soal/tts/' + formData.id : '/api/bank-soal/tts';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json() as any;
      if (json.success) {
        setShowForm(false);
        fetchData();
      } else {
        alert(json.error || "Gagal menyimpan data");
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm("Hapus " + selectedIds.length + " soal terpilih?")) return;
    try {
      const res = await fetch('/api/bank-soal/tts/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        fetchData();
      }
    } catch (err) {
      alert("Gagal menghapus soal terpilih");
    }
  };

  const deleteSoal = async (id: number) => {
    if (!window.confirm("Hapus soal ini?")) return;
    try {
      const res = await fetch('/api/bank-soal/tts/' + id, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      alert("Gagal menghapus soal");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const submitImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    const formDataObj = new FormData();
    formDataObj.append('file', selectedFile);
    try {
      const res = await fetch('/api/bank-soal/import/tts', {
        method: 'POST',
        body: formDataObj
      });
      const json = await res.json() as any;
      if (json.success) {
        let msg = 'Berhasil mengimpor ' + json.imported + ' soal.';
        if (json.warnings && json.warnings.length > 0) {
          const dup = json.warnings.filter((w: string) => w.includes('ganda')).length;
          const skip = json.warnings.length - dup;
          if (dup > 0) msg += ' | ' + dup + ' duplikat dilewati.';
          if (skip > 0) msg += ' | ' + skip + ' baris lain dilewati.';
        }
        alert(msg);
        setOpenImportModal(false);
        setSelectedFile(null);
        fetchData();
      } else {
        alert(json.error || 'Gagal import');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat import');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    window.location.href = '/api/bank-soal/template/tts';
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A237E] font-poppins">Bank Soal TTS</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola petunjuk dan jawaban Teka-Teki Silang.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:w-64">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari clue..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1A237E] outline-none" />
          </div>
          <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="w-full sm:w-auto border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#1A237E] outline-none bg-white font-semibold text-slate-600">
            <option value="SEMUA">Semua Kesulitan</option>
            <option value="MUDAH">Mudah</option>
            <option value="SEDANG">Sedang</option>
            <option value="SULIT">Sulit</option>
          </select>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button onClick={deleteSelected} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-bold flex items-center gap-2 flex-1 justify-center sm:flex-none">
                <i className="bi bi-trash"></i> <span>Hapus ({selectedIds.length})</span>
              </button>
            )}
            <button onClick={() => setOpenImportModal(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold flex items-center gap-2 flex-1 justify-center sm:flex-none">
              <i className="bi bi-file-earmark-excel"></i> Import Excel
            </button>
            <button onClick={() => openFormModal()} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-bold flex items-center gap-2 shadow-md flex-1 justify-center sm:flex-none">
              <i className="bi bi-plus-lg"></i> Tambah Soal
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input type="checkbox" className="rounded text-[#1A237E] focus:ring-[#1A237E] cursor-pointer" 
                         checked={filteredSoalList.length > 0 && selectedIds.length === filteredSoalList.length}
                         onChange={handleSelectAll} />
                </th>
                <th className="p-4 font-semibold w-1/2">Petunjuk (Clue)</th>
                <th className="p-4 font-semibold">Jawaban</th>
                <th className="p-4 font-semibold text-center">Tingkat Kesulitan</th>
                <th className="p-4 font-semibold text-center w-24 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              )}
              {!loading && soalList.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada soal di Bank Soal TTS.</td></tr>
              )}
              {filteredSoalList.map(soal => (
                <tr key={soal.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(soal.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4 text-center align-top">
                    <input type="checkbox" className="rounded text-[#1A237E] focus:ring-[#1A237E] cursor-pointer" checked={selectedIds.includes(soal.id)} onChange={() => handleSelectOne(soal.id)} />
                  </td>
                  <td className="p-4 text-sm text-slate-700 align-top break-words">
                    <div>{soal.clue}</div>
                    {soal.explanation && <div className="text-xs text-slate-400 mt-1 italic">{soal.explanation}</div>}
                  </td>
                  <td className="p-4 align-top">
                    <span className="font-mono text-sm tracking-[0.2em] font-bold text-blue-900 bg-blue-50 px-2 py-1 border border-blue-200 rounded">{soal.answer}</span>
                  </td>
                  <td className="p-4 text-center align-top">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${soal.difficulty === 'MUDAH' ? 'bg-green-100 text-green-700' : soal.difficulty === 'SEDANG' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {soal.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-center align-top space-x-2 whitespace-nowrap">
                    <button onClick={() => openFormModal(soal)} className="text-blue-500 hover:text-blue-700" title="Edit"><i className="bi bi-pencil-square"></i></button>
                    <button onClick={() => deleteSoal(soal.id)} className="text-red-500 hover:text-red-700" title="Hapus"><i className="bi bi-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-[#1A237E]">{isEdit ? 'Edit Soal TTS' : 'Tambah Soal TTS'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Petunjuk (Clue)</label>
                <textarea value={formData.clue} onChange={e => setFormData({...formData, clue: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows={3} placeholder="Masukkan petunjuk atau pertanyaan..."></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Jawaban (Tanpa spasi)</label>
                <input type="text" value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value.replace(/\s+/g, '').toUpperCase()})} className="w-full font-mono tracking-widest border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none uppercase" placeholder="JAWABAN" />
                <p className="text-[10px] text-slate-400 mt-1">Hanya huruf, tanpa spasi, otomatis dikapitalisasi.</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Penjelasan Ekstra (Opsional)</label>
                <input type="text" value={formData.explanation} onChange={e => setFormData({...formData, explanation: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" placeholder="..." />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
              <button onClick={submitForm} className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 font-semibold text-sm">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {openImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-[#1A237E]">Import Bank Soal TTS</h3>
              <button onClick={() => setOpenImportModal(false)} className="text-slate-400 hover:text-red-500">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Gunakan file template Excel (.xlsx) untuk mengimpor petunjuk TTS secara massal. Format kolom wajib sesuai template.</p>
              <button onClick={downloadTemplate} className="w-full py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-sm font-semibold flex items-center justify-center gap-2">
                <i className="bi bi-file-earmark-excel"></i> Unduh Template Excel (.xlsx)
              </button>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                <input type="file" id="fileImportTTS" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                <label htmlFor="fileImportTTS" className="cursor-pointer flex flex-col items-center">
                  <i className="bi bi-file-earmark-excel text-3xl mb-2 text-green-500"></i>
                  <span className="text-sm font-semibold text-slate-700">{selectedFile?.name || 'Klik untuk memilih file Excel (.xlsx)'}</span>
                  <span className="text-xs text-slate-400 mt-1">Hanya file .xlsx / .xls yang diterima</span>
                </label>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setOpenImportModal(false)} className="px-4 py-2 text-slate-600 bg-slate-200 rounded-lg hover:bg-slate-300 font-semibold text-sm">Batal</button>
              <button onClick={submitImport} disabled={!selectedFile || isImporting} className="px-4 py-2 text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 font-semibold text-sm">
                <span>{isImporting ? 'Mengimpor...' : 'Import'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
