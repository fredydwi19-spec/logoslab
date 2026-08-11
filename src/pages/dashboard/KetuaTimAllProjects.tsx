import React, { useState, useEffect } from 'react';

export const KetuaTimAllProjects = () => {
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  
  // Game & Preview States
  const [questions, setQuestions] = useState<any[]>([]);
  const [materiContents, setMateriContents] = useState<any[]>([]);
  const [gameData, setGameData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userFTBAnswers, setUserFTBAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');

  // Filter States
  const [filterTypeMain, setFilterTypeMain] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [statusTab, setStatusTab] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('GAME');
  const [editMode, setEditMode] = useState(false);
  const [editProjectData, setEditProjectData] = useState<any>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const availableCategories = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];
  
  // Flashcard states
  const [unlockedIdx, setUnlockedIdx] = useState(0);
  const [flippedCards, setFlippedCards] = useState<{[key: number]: boolean}>({});

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const json = await res.json() as any;
      if (json.success) setAllProjects(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const filteredProjects = allProjects.filter(p => {
    let match = true;
    if (filterTypeMain !== 'ALL') {
      if (p.type !== filterTypeMain) match = false;
    }
    if (filterType !== 'ALL') {
      if (filterTypeMain === 'GAME' && p.gameType !== filterType) match = false;
      if (filterTypeMain === 'MATERI' && p.materiType !== filterType) match = false;
    }
    if (statusTab !== 'ALL' && p.status !== statusTab) match = false;
    return match;
  });

  const openProject = async (id: number) => {
    try {
      const res = await fetch('/api/projects/' + id);
      const json = await res.json() as any;
      if (json.success) {
        setActiveProject(json.data);
        setQuestions(json.data.questions || []);
        setMateriContents(json.data.materiContents || []);
        setGameData(null);
        if (json.data.gameType === 'WORD_SEARCH') {
          const wsRes = await fetch('/api/word-search/' + id);
          const wsJson = await wsRes.json() as any;
          if (wsJson.success) setGameData(wsJson.data);
        } else if (json.data.gameType === 'CROSSWORD') {
          const cwRes = await fetch('/api/crossword/' + id);
          const cwJson = await cwRes.json() as any;
          if (cwJson.success) setGameData(cwJson.data);
        }
      } else {
        alert('Gagal memuat proyek: ' + (json.error || 'Terjadi kesalahan'));
      }
    } catch (err) {
      console.error('openProject error:', err);
      alert('Gagal terhubung ke server.');
    }
  };

  const closeProject = () => {
    setActiveProject(null);
    setMateriContents([]);
    setShowPreview(false);
    setFeedback('');
  };

  const openCreateModal = (type: string = 'GAME') => {
    setEditMode(false);
    setEditProjectData(null);
    setModalType(type);
    setSelectedCategories([]);
    setIsModalOpen(true);
  };

  const editProject = (p: any) => {
    setEditMode(true);
    setEditProjectData(p);
    setModalType(p.type);
    setSelectedCategories(p.category ? p.category.split(',').map((s: string) => s.trim()).filter((s: string) => s) : []);
    setIsModalOpen(true);
  };

  const addCategory = (val: string) => {
    if (val && !selectedCategories.includes(val)) {
      setSelectedCategories([...selectedCategories, val]);
    }
  };

  const removeCategory = (val: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== val));
  };

  const deleteProject = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus proyek ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    const res = await fetch('/api/projects/' + id, { method: 'DELETE' });
    if (res.ok) fetchProjects();
    else {
      const json = await res.json() as any;
      alert('Gagal menghapus proyek: ' + (json.error || 'Terjadi kesalahan'));
    }
  };

  const submitReview = async (statusGiven: string) => {
    if (statusGiven === 'REVISI' && !feedback) {
      alert("Mohon isi masukan/feedback untuk revisi.");
      return;
    }
    const res = await fetch('/api/projects/' + activeProject.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusGiven, feedback })
    });
    if (res.ok) {
      fetchProjects();
      closeProject();
    } else {
      const err = await res.json() as any;
      alert("Gagal submit review: " + (err.error || 'Terjadi kesalahan'));
    }
  };

  const publishProject = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin mempublish proyek ini?')) return;
    const res = await fetch('/api/projects/' + id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusGiven: 'ACCEPT', feedback: 'Disetujui dan dipublish oleh Ketua Tim' })
    });
    if (res.ok) fetchProjects();
    else {
      const err = await res.json() as any;
      alert("Gagal publish: " + (err.error || 'Terjadi kesalahan'));
    }
  };

  const handleModalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const projectId = data.id;
    delete data.id;

    const submitData = async (finalData: any) => {
      const url = projectId ? '/api/projects/' + projectId : '/api/projects';
      const method = projectId ? 'PATCH' : 'POST';
      finalData.type = modalType;
      
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchProjects();
      } else {
        const err = await res.json() as any;
        alert('Gagal memproses proyek: ' + (err.error || 'Terjadi kesalahan sistem'));
      }
    };

    const fileInput = form.elements.namedItem('thumbnailFile') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = function(evt) {
        data.thumbnailUrl = evt.target?.result as string;
        delete data.thumbnailFile;
        submitData(data);
      };
      reader.readAsDataURL(file);
    } else {
      delete data.thumbnailFile;
      submitData(data);
    }
  };

  // Preview Logic
  const previewGame = () => {
    if (activeProject?.type === 'MATERI') {
      const hasManualContent = activeProject?.materiType === 'MANUAL' && activeProject?.materialSections?.length > 0;
      const hasFileContent = activeProject?.materiType !== 'MANUAL' && materiContents.length > 0;
      
      if (!hasManualContent && !hasFileContent) {
        alert("Belum ada konten materi untuk di-preview.");
        return;
      }
      setShowPreview(true);
      return;
    }

    if (activeProject?.gameType !== 'WORD_SEARCH' && questions.length === 0) {
      alert("Belum ada soal untuk di-preview.");
      return;
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsCorrect(false);
    setUserFTBAnswers([]);
    setShowPreview(true);
  };

  const checkAnswerQuiz = (opt: string) => {
    if (showExplanation) return;
    setSelectedAnswer(opt);
    setIsCorrect(opt === questions[currentQuestionIndex].correctAnswer);
    setShowExplanation(true);
  };

  const checkAnswerFTB = () => {
    const q = questions[currentQuestionIndex];
    const answers = q.answers || [];
    let allCorrect = true;
    answers.forEach((ans: any, i: number) => {
      const userVal = (userFTBAnswers[i] || '').trim().toLowerCase();
      if (userVal !== ans.word.trim().toLowerCase()) allCorrect = false;
    });
    setIsCorrect(allCorrect);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setUserFTBAnswers([]);
    } else {
      setShowPreview(false);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setUserFTBAnswers([]);
    }
  };

  const applyTooltips = (text: string) => {
    if (!text) return "";
    let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const glossary = activeProject?.materialGlossary || [];
    
    const sorted = [...glossary].sort((a: any, b: any) => b.word.length - a.word.length);
    
    sorted.forEach((g: any) => {
      const regex = new RegExp(`\\b(${g.word})\\b`, 'gi');
      html = html.replace(regex, (match) => {
        return `<span class="relative group cursor-help font-bold text-[#FF5722] border-b-2 border-dotted border-[#FF5722] hover:bg-orange-50 transition-colors rounded px-1">${match}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A237E] text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 leading-relaxed pointer-events-none">${g.definition}</span></span>`;
      });
    });
    return { __html: html };
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-[#1A237E] p-6 rounded-xl shadow-lg border-b-4 border-[#FFC107] gap-4">
        <div className="flex items-center gap-4">
          <img src="/public/assets/Logo-LogosLAB.png" alt="Logos LAB" className="h-12 w-auto object-contain bg-white p-1 rounded shadow-sm" />
          <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-tight">Manajemen Proyek Game</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={() => openCreateModal('GAME')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest">
            + TAMBAH PROYEK GAME
          </button>
          <button onClick={() => openCreateModal('MATERI')} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 md:px-6 rounded-xl text-xs md:text-sm font-bold transition-all transform hover:scale-105 shadow-lg uppercase tracking-widest">
            + TUGASKAN MATERI
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {!activeProject && (
        <div className="bg-slate-50 p-8 rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-2 bg-[#FFC107] rounded-full"></div>
              <h2 className="text-lg md:text-xl font-semibold text-[#1A237E]">Daftar Aktifitas Produksi</h2>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <button onClick={() => { setFilterTypeMain('ALL'); setFilterType('ALL'); }} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filterTypeMain === 'ALL' ? 'bg-[#1A237E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>SEMUA PROYEK</button>
                <button onClick={() => { setFilterTypeMain('GAME'); setFilterType('ALL'); }} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filterTypeMain === 'GAME' ? 'bg-[#1A237E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>GAME</button>
                <button onClick={() => { setFilterTypeMain('MATERI'); setFilterType('ALL'); }} className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${filterTypeMain === 'MATERI' ? 'bg-[#1A237E] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>MATERI</button>
              </div>
              {filterTypeMain === 'GAME' && (
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>SEMUA GAME</button>
                  <button onClick={() => setFilterType('QUIZ')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'QUIZ' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>QUIZ</button>
                  <button onClick={() => setFilterType('FILL_THE_BLANK')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'FILL_THE_BLANK' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>FTB</button>
                  <button onClick={() => setFilterType('WORD_SEARCH')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'WORD_SEARCH' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>WORD SEARCH</button>
                  <button onClick={() => setFilterType('CROSSWORD')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'CROSSWORD' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>CROSSWORD</button>
                </div>
              )}
              {filterTypeMain === 'MATERI' && (
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
                  <button onClick={() => setFilterType('ALL')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'ALL' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>SEMUA MATERI</button>
                  <button onClick={() => setFilterType('TEKS')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'TEKS' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>TEKS</button>
                  <button onClick={() => setFilterType('VIDEO')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'VIDEO' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>VIDEO</button>
                  <button onClick={() => setFilterType('MANUAL')} className={`px-4 py-2 rounded-lg text-xs font-black transition-all whitespace-nowrap ${filterType === 'MANUAL' ? 'bg-[#1A237E] text-white' : 'text-slate-500 hover:text-slate-700'}`}>MANUAL</button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <div className="flex overflow-x-auto bg-[#1A237E]">
              {['ALL', 'DRAFT', 'REVIEW_PAKAR', 'REVISI_PAKAR', 'ACCEPTED_PAKAR', 'REVIEW_KETUA', 'REVISI_KETUA', 'UNPUBLISHED'].map(tab => (
                <button key={tab} onClick={() => setStatusTab(tab)}
                  className={`flex-shrink-0 px-4 py-3.5 text-[10px] font-black uppercase tracking-widest transition-all border-b-[3px] ${statusTab === tab ? 'bg-white text-[#1A237E] border-[#FFC107] shadow-inner' : 'text-white/60 border-transparent hover:text-white hover:bg-white/10'}`}>
                  {tab.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto bg-white">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs md:text-sm font-medium uppercase tracking-wider">
                    <th className="pb-4 pt-4 px-6">No.</th>
                    <th className="pb-4 pt-4 px-6">Judul Game / Materi</th>
                    <th className="pb-4 pt-4 px-6">Status</th>
                    <th className="pb-4 pt-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600">
                  {filteredProjects.length > 0 ? filteredProjects.map((p, index) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                      <td className="py-5 px-6 font-bold text-[#1A237E] text-sm md:text-base text-center">{index + 1}</td>
                      <td className="py-5 px-6">
                        <div className="font-semibold text-slate-800 text-base md:text-lg leading-tight mb-1">{p.title}</div>
                        <span className="text-[10px] bg-[#1A237E] text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">{p.type === 'MATERI' ? p.materiType : p.gameType}</span>
                      </td>
                      <td className="py-5 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter ${p.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : p.status === 'REVIEW_PAKAR' ? 'bg-blue-100 text-blue-800 border border-blue-200' : p.status === 'REVISI_PAKAR' ? 'bg-orange-100 text-orange-800 border border-orange-200' : p.status === 'ACCEPTED_PAKAR' ? 'bg-green-100 text-green-800 border border-green-200' : p.status === 'REVIEW_KETUA' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' : p.status === 'REVISI_KETUA' ? 'bg-red-100 text-red-800 border border-red-200' : p.status === 'UNPUBLISHED' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                          {p.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          {(p.status === 'DRAFT' || p.status === 'REVISI_KETUA' || p.status === 'REVISI_PAKAR') && (
                            <button onClick={() => editProject(p)} className="bg-blue-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-blue-600 transition-all shadow-md font-bold">Edit</button>
                          )}
                          {['REVIEW_KETUA', 'ACCEPTED_PAKAR'].includes(p.status) && (
                            <button onClick={() => publishProject(p.id)} className="bg-green-500 text-white px-3 py-2 rounded-lg text-xs font-black hover:bg-green-600 shadow-md transition-all uppercase tracking-widest">PUBLISH</button>
                          )}
                          <button onClick={() => deleteProject(p.id)} className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs hover:bg-red-600 transition-all shadow-md font-bold">Hapus</button>
                          <button onClick={() => openProject(p.id)} className="bg-[#1A237E] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-indigo-900 shadow-md transition-all uppercase tracking-widest">DETAIL</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="text-center py-10 text-slate-400 italic">Tidak ada proyek ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {activeProject && (
        <div className="space-y-6">
          <button onClick={closeProject} className="text-slate-500 hover:text-slate-800 mb-4 flex items-center gap-2 font-bold transition-colors">
            ← Kembali ke Daftar Proyek
          </button>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start">
             <div>
                <h3 className="text-2xl font-black text-[#1A237E] mb-2">{activeProject.title}</h3>
                <p className="text-slate-500">{activeProject.description}</p>
                <div className="mt-4 flex gap-4 text-sm font-bold text-slate-400">
                   <span>PIC: <span className="text-[#1A237E]">{activeProject.pembuatName || 'Belum Ditentukan'}</span></span>
                   <span>Pakar: <span className="text-[#1A237E]">{activeProject.pakarName || 'Belum Ditentukan'}</span></span>
                </div>
             </div>
             <div>
                <button onClick={previewGame} className="bg-orange-500 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-orange-600 font-bold uppercase tracking-widest text-sm flex items-center gap-2 transition-all">
                  <i className="bi bi-play-circle-fill"></i> PREVIEW
                </button>
             </div>
          </div>

          {['REVIEW_KETUA', 'ACCEPTED_PAKAR'].includes(activeProject.status) ? (
            <div className="bg-white p-8 border-2 border-slate-100 rounded-2xl shadow-xl">
              <h4 className="font-black text-[#1A237E] uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <span className="h-3 w-3 bg-[#FF5722] rounded-full animate-pulse"></span>
                Persetujuan Produksi
              </h4>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full border-2 border-slate-100 rounded-xl p-4 h-40 focus:border-[#1A237E] outline-none font-medium transition-all mb-6" placeholder="Tuliskan catatan atau instruksi pengerjaan..."></textarea>
              <div className="flex gap-4">
                <button onClick={() => submitReview('REVISI')} className="flex-1 bg-white border-4 border-[#FF5722] text-[#FF5722] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-50 transition-all shadow-lg">MINTA REVISI</button>
                <button onClick={() => submitReview('ACCEPT')} className="flex-1 bg-[#1A237E] text-[#FFC107] px-6 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg">SETUJUI &amp; PUBLISH</button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 text-center">
              <p className="text-slate-500 font-bold text-sm">Proyek ini berstatus <span className="font-black text-[#1A237E] uppercase">{activeProject.status.replace(/_/g,' ')}</span> dan tidak memerlukan tindakan review saat ini.</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1A237E]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] shadow-2xl border-4 border-[#1A237E] flex flex-col overflow-hidden">
            <div className="bg-[#1A237E] p-6 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
              <h3 className="font-black uppercase tracking-widest">{(editMode ? 'Edit Proyek' : 'Penugasan Proyek Baru') + (modalType === 'MATERI' ? ' (Materi)' : ' (Game)')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-8">
              <form onSubmit={handleModalSubmit} className="space-y-5">
                <input type="hidden" name="id" value={editProjectData?.id || ''} />
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">{modalType === 'MATERI' ? 'Judul Materi' : 'Judul Permainan'}</label>
                  <input type="text" name="title" defaultValue={editProjectData?.title || ''} required className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold text-slate-700" />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">{modalType === 'MATERI' ? 'Deskripsi Materi' : 'Deskripsi Game'}</label>
                  <textarea name="description" defaultValue={editProjectData?.description || ''} className="w-full border-2 border-slate-100 rounded-xl p-4 h-24 focus:border-[#1A237E] outline-none font-medium text-slate-600 resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Instruksi</label>
                  <textarea name="instructions" defaultValue={editProjectData?.instructions || ''} className="w-full border-2 border-slate-100 rounded-xl p-4 h-28 focus:border-[#1A237E] outline-none font-medium text-slate-600 resize-none"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {modalType === 'GAME' && (
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Jenis Game</label>
                      <select name="gameType" defaultValue={editProjectData?.gameType || 'QUIZ'} required className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                        <option value="QUIZ">Quiz</option>
                        <option value="FILL_THE_BLANK">Fill The Blank</option>
                        <option value="WORD_SEARCH">Word Search</option>
                        <option value="CROSSWORD">Crossword</option>
                      </select>
                    </div>
                  )}
                  {modalType === 'MATERI' && (
                    <div>
                      <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Jenis Materi</label>
                      <select name="materiType" defaultValue={editProjectData?.materiType || 'TEKS'} required className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white">
                        <option value="TEKS">Teks (PDF/PPT/Gambar)</option>
                        <option value="VIDEO">Video</option>
                        <option value="MANUAL">Materi Teks Manual (Sub-Bab + Glosarium)</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Kategori Kompetensi</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedCategories.map(cat => (
                        <span key={cat} className="bg-[#1A237E] text-white px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-sm border border-[#FFC107]/30">
                          <span>{cat}</span>
                          <button type="button" onClick={() => removeCategory(cat)} className="hover:text-[#FFC107] transition-colors focus:outline-none text-sm">&times;</button>
                        </span>
                      ))}
                    </div>
                    <select onChange={e => { addCategory(e.target.value); e.target.value=''; }} className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-[#1A237E] outline-none font-bold bg-white text-slate-700">
                      <option value="">+ Tambah Kompetensi...</option>
                      {availableCategories.map(avail => !selectedCategories.includes(avail) && (
                        <option key={avail} value={avail}>{avail}</option>
                      ))}
                    </select>
                    <input type="hidden" name="category" value={selectedCategories.join(',')} />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#1A237E] text-[#FFC107] py-4 rounded-xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-900 transition-all">
                  {editMode ? 'SIMPAN PERUBAHAN' : 'TUGASKAN PROYEK'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW SIMULATOR MODAL */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden relative shadow-2xl border-4 border-[#1A237E]">
            <button onClick={() => setShowPreview(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10 text-3xl font-black">&times;</button>
            <div className="bg-[#1A237E] p-6 text-white font-black text-center uppercase tracking-widest border-b-4 border-[#FFC107]">
              <span>{activeProject?.type === 'MATERI' ? 'PREVIEW MATERI: ' : 'SIMULASI GAME: '}</span> <span className="text-[#FFC107]">{activeProject?.title}</span>
            </div>
            <div className="p-8 flex-1 overflow-y-auto bg-slate-50 flex items-center justify-center">
              
              {activeProject?.type === 'MATERI' && (
                <div className="w-full flex flex-col items-center gap-8">
                  {activeProject?.materiType === 'MANUAL' ? (
                    <div className="w-full max-w-4xl flex flex-col gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {activeProject?.materialSections?.map((section: any, idx: number) => (
                          <div key={idx} className="w-full relative min-h-[350px]">
                            {/* Simple render of flashcards without 3d flip since we are replacing Alpine */}
                            {!flippedCards[idx] ? (
                              <div onClick={() => { if(idx <= unlockedIdx) { setFlippedCards({...flippedCards, [idx]: true}); if(idx === unlockedIdx) setUnlockedIdx(idx+1); } }}
                                   className={`absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-10 md:p-16 bg-gradient-to-br from-[#1A237E] to-blue-900 text-white ${idx > unlockedIdx ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl transition-transform hover:scale-[1.02]'}`}>
                                {idx > unlockedIdx && (
                                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all">
                                    <span className="bg-[#1A237E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl border border-[#FFC107]/30">Terkunci</span>
                                  </div>
                                )}
                                <div className="relative z-10 text-center w-full flex flex-col items-center h-full justify-center">
                                  <span className="inline-block bg-[#FF5722] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-md">KARTU MATERI {idx + 1}</span>
                                  <h2 className="text-2xl md:text-4xl font-black text-center tracking-tight leading-tight">{section.subTitle || 'Sub-Bab ' + (idx + 1)}</h2>
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                                <div className="bg-[#1A237E] text-white px-6 py-4 flex justify-between items-center min-h-[140px] border-b-4 border-[#FFC107] gap-4">
                                  <div className="flex items-center gap-3 flex-1">
                                    <button onClick={() => setFlippedCards({...flippedCards, [idx]: false})} className="shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" title="Tutup Kartu">
                                      <i className="bi bi-arrow-left"></i>
                                    </button>
                                    <h2 className="text-xl md:text-2xl font-bold leading-tight">{section.subTitle || 'Sub-Bab ' + (idx + 1)}</h2>
                                  </div>
                                </div>
                                <div className="p-6 md:p-10 flex-1 text-slate-700 leading-relaxed text-sm md:text-base font-medium max-w-2xl mx-auto" style={{whiteSpace: 'pre-wrap'}} dangerouslySetInnerHTML={applyTooltips(section.content)}></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center gap-8">
                      {materiContents.map((content: any, idx: number) => (
                        <div key={idx} className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                          {content.contentType === 'IMAGE' && <img src={content.fileUrl} className="w-full h-auto object-contain" alt="" />}
                          {(content.contentType === 'PDF' || content.contentType === 'PPT') && <iframe src={content.fileUrl} className="w-full h-[70vh] border-0" title="viewer"></iframe>}
                          {content.contentType === 'VIDEO' && <video src={content.fileUrl} controls className="w-full h-auto max-h-[70vh] bg-black"></video>}
                          {content.contentType === 'EMBED_URL' && <iframe src={content.fileUrl} className="w-full h-[500px] border-0" allowFullScreen></iframe>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeProject?.type === 'GAME' && (
                <div className="text-center w-full max-w-2xl space-y-6">
                  {['WORD_SEARCH', 'CROSSWORD'].includes(activeProject?.gameType) && (
                    <div className="bg-slate-100 p-8 rounded-xl italic text-slate-500">
                      (Preview untuk game Word Search dan Crossword belum tersedia di mode SPA. Akan menggunakan komponen game engine eksternal nantinya).
                    </div>
                  )}
                  
                  {!['WORD_SEARCH', 'CROSSWORD'].includes(activeProject?.gameType) && questions.length > 0 && (
                    <div>
                      <div className="inline-block bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest">
                        PERTANYAAN {currentQuestionIndex + 1} / {questions.length}
                      </div>
                      
                      {activeProject?.gameType === 'QUIZ' && (
                        <div>
                          <h3 className="text-2xl font-black text-[#1A237E] mb-8 leading-relaxed">{questions[currentQuestionIndex]?.question}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['A','B','C','D'].map(opt => (
                              <button key={opt} onClick={() => checkAnswerQuiz(opt)}
                                disabled={showExplanation}
                                className={`border-4 p-5 rounded-2xl text-[#1A237E] font-black transition-all text-left flex items-center gap-3 ${selectedAnswer === opt && !showExplanation ? 'border-yellow-400 bg-yellow-50' : showExplanation && opt === questions[currentQuestionIndex].correctAnswer ? 'border-green-500 bg-green-50' : showExplanation && selectedAnswer === opt && opt !== questions[currentQuestionIndex].correctAnswer ? 'border-red-500 bg-red-50' : !showExplanation && selectedAnswer !== opt ? 'border-slate-100 bg-white hover:border-yellow-300' : ''}`}>
                                <span className="h-8 w-8 rounded-lg flex items-center justify-center font-black bg-slate-100 shrink-0">{opt}</span>
                                <span>{questions[currentQuestionIndex]['option' + opt]}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {activeProject?.gameType === 'FILL_THE_BLANK' && (
                        <div>
                          {/* We will render FTB as a simple placeholder for now in SPA, since doing dangerousHTML with live inputs requires refs */}
                          <div className="text-xl font-bold text-[#1A237E] mb-8 leading-relaxed bg-white p-6 rounded-2xl shadow-inner border-2 border-slate-100">
                             {questions[currentQuestionIndex].fullText} (Preview input FTB via API)
                          </div>
                          {!showExplanation && <button onClick={checkAnswerFTB} className="bg-[#FF5722] text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest">PERIKSA JAWABAN</button>}
                        </div>
                      )}
                      
                      {showExplanation && (
                        <div className={`mt-6 p-5 rounded-2xl border-2 border-dashed text-left ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <p className={`font-black text-sm uppercase ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>{isCorrect ? 'Benar!' : 'Belum Tepat!'}</p>
                          <p className="text-sm text-slate-600 mt-1 italic">{questions[currentQuestionIndex]?.explanation}</p>
                        </div>
                      )}
                      
                      <div className="flex gap-4 mt-6 justify-center">
                        {currentQuestionIndex > 0 && <button onClick={prevQuestion} className="bg-slate-100 text-slate-700 px-6 py-2 rounded-xl font-black">← Prev</button>}
                        {showExplanation && <button onClick={nextQuestion} className="bg-[#1A237E] text-white px-6 py-2 rounded-xl font-black">{currentQuestionIndex < questions.length - 1 ? 'Berikutnya →' : 'Selesai'}</button>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
