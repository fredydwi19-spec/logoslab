import React, { useState, useEffect } from 'react';

export const BankSoalFtb = () => {
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
    fullText: '',
    answers: [] as { word: string; explanation: string }[],
    difficulty: 'MUDAH'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bank-soal/ftb');
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
    const matchSearch = searchQuery.trim() === '' || (s.fullText || '').toLowerCase().includes(searchQuery.toLowerCase());
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

  const extractAnswers = () => {
    const regex = /\[(.*?)\]/g;
    const matches = [...formData.fullText.matchAll(regex)];
    const newAnswers = matches.map(m => m[1]).filter(w => w.trim() !== "");
    
    const currentAnsMap: Record<string, string> = {};
    formData.answers.forEach(a => { currentAnsMap[a.word] = a.explanation; });
    
    const nextAnswers = newAnswers.map(word => ({
      word: word,
      explanation: currentAnsMap[word] || ''
    }));
    
    setFormData({ ...formData, answers: nextAnswers });
  };

  const updateAnswerExplanation = (index: number, explanation: string) => {
    const newAnswers = [...formData.answers];
    newAnswers[index].explanation = explanation;
    setFormData({ ...formData, answers: newAnswers });
  };

  const openFormModal = (soal: any = null) => {
    if (soal) {
      setIsEdit(true);
      setFormData({ id: soal.id, fullText: soal.fullText, difficulty: soal.difficulty, answers: JSON.parse(JSON.stringify(soal.answers)) });
    } else {
      setIsEdit(false);
      setFormData({ id: null, fullText: '', answers: [], difficulty: 'MUDAH' });
    }
    setShowForm(true);
  };

  const submitForm = async () => {
    if (formData.answers.length === 0) {
      alert("Harap ekstrak kata rumpang terlebih dahulu");
      return;
    }
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? '/api/bank-soal/ftb/' + formData.id : '/api/bank-soal/ftb';
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
      const res = await fetch('/api/bank-soal/ftb/bulk-delete', {
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
      const res = await fetch('/api/bank-soal/ftb/' + id, { method: 'DELETE' });
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
      const res = await fetch('/api/bank-soal/import/ftb', {
        method: 'POST',
        body: formDataObj
      });
      const json = await res.json() as any;
      if (json.success) {
        let msg = 'Berhasil mengimpor ' + json.imported + ' soal.';
        if (json.warnings && json.warnings.length > 0) {
          msg += ' | ' + json.warnings.length + ' baris dilewati (cek console untuk detail).';
          console.warn('[FTB Import Warnings]', json.warnings);
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
    window.location.href = '/api/bank-soal/template/ftb';
  };

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1A237E] font-poppins">Bank Soal Fill The Blank</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola bank soal rumpang secara global.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full sm:w-64">
            <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari teks rumpang..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1A237E] outline-none" />
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
                <th className="p-4 font-semibold w-2/5">Teks Utuh</th>
                <th className="p-4 font-semibold">Kata Rumpang</th>
                <th className="p-4 font-semibold text-center">Tingkat Kesulitan</th>
                <th className="p-4 font-semibold text-center w-24 whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Memuat data...</td></tr>
              )}
              {!loading && soalList.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Belum ada soal di Bank Soal FTB.</td></tr>
              )}
              {filteredSoalList.map(soal => (
                <tr key={soal.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(soal.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="p-4 text-center align-top">
                    <input type="checkbox" className="rounded text-[#1A237E] focus:ring-[#1A237E] cursor-pointer" checked={selectedIds.includes(soal.id)} onChange={() => handleSelectOne(soal.id)} />
                  </td>
                  <td className="p-4 text-sm text-slate-700 align-top break-words">{soal.fullText}</td>
                  <td className="p-4 text-xs text-slate-600 align-top">
                    <ul className="list-disc pl-4">
                      {soal.answers?.map((ans: any, idx: number) => (
                        <li key={idx}><strong>{ans.word}</strong> {ans.explanation ? <span className="text-slate-400">({ans.explanation})</span> : null}</li>
                      ))}
                    </ul>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-[#1A237E]">{isEdit ? 'Edit Soal FTB' : 'Tambah Soal FTB'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-red-500">&times;</button>
            </div>
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Teks Utuh</label>
                <textarea value={formData.fullText} onChange={e => setFormData({...formData, fullText: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none" rows={4} placeholder="Masukkan teks. Gunakan tanda kurung siku untuk menandai kata rumpang. Contoh: Ibukota Indonesia adalah [Jakarta]."></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tingkat Kesulitan</label>
                <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#FFC107] outline-none">
                  <option value="MUDAH">Mudah</option>
                  <option value="SEDANG">Sedang</option>
                  <option value="SULIT">Sulit</option>
                </select>
              </div>
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Kata Rumpang</h4>
                <p className="text-xs text-slate-500 mb-3">Klik tombol untuk mengekstrak kata dalam kurung siku [...] dari teks utuh.</p>
                <button onClick={extractAnswers} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-semibold mb-3">
                  Ekstrak Kata
                </button>
                <div className="space-y-2">
                  {formData.answers.map((ans, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" value={ans.word} className="w-1/3 border border-slate-200 rounded p-1.5 text-xs bg-slate-100" readOnly />
                      <input type="text" value={ans.explanation} onChange={e => updateAnswerExplanation(idx, e.target.value)} placeholder="Penjelasan (opsional)" className="flex-1 border border-slate-200 rounded p-1.5 text-xs focus:ring-1 focus:ring-[#FFC107] outline-none" />
                    </div>
                  ))}
                  {formData.answers.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Belum ada kata rumpang. Pastikan teks mengandung [...] lalu klik Ekstrak Kata.</p>
                  )}
                </div>
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
              <h3 className="text-lg font-bold text-[#1A237E]">Import Bank Soal FTB</h3>
              <button onClick={() => setOpenImportModal(false)} className="text-slate-400 hover:text-red-500">&times;</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">Gunakan file template Excel (.xlsx) untuk mengimpor soal FTB secara massal. Format kolom wajib sesuai template.</p>
              <button onClick={downloadTemplate} className="w-full py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 text-sm font-semibold flex items-center justify-center gap-2">
                <i className="bi bi-file-earmark-excel"></i> Unduh Template Excel (.xlsx)
              </button>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                <input type="file" id="fileImportFTB" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                <label htmlFor="fileImportFTB" className="cursor-pointer flex flex-col items-center">
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
