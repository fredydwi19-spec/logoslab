import React, { useState, useEffect } from 'react';
import { WordSearchGame } from './games/WordSearchGame';
import { CrosswordGame } from './games/CrosswordGame';

export const DashboardGamesPage = () => {
  const [games, setGames] = useState<any[]>([]);
  const [username, setUsername] = useState<string>(''); // Can be fetched from an API or derived from a central auth state
  
  const [filter, setFilter] = useState('ALL');
  
  // Game Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeGame, setActiveGame] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const [currentScore, setCurrentScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);
  
  const [gameData, setGameData] = useState<any>(null); // For WS/CW
  const [isCorrect, setIsCorrect] = useState(false);
  const [userFTBAnswers, setUserFTBAnswers] = useState<string[]>([]);
  const [submissionResults, setSubmissionResults] = useState<any[]>([]);

  useEffect(() => {
    fetchGames();
    // Fetch username if needed, or assume it's available via an auth context
    setUsername('User'); 
  }, []);

  const fetchGames = async () => {
    try {
      const res = await fetch('/api/dashboard/published-games');
      const json = await res.json();
      if (json.success) {
        setGames(json.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const gameTypeLabel: Record<string, string> = {
    QUIZ: "Kuis",
    FILL_THE_BLANK: "Isi Kosong",
    WORD_SEARCH: "Cari Kata",
    CROSSWORD: "TTS",
  };
  
  const gameTypeBadge: Record<string, string> = {
    QUIZ: "bg-blue-100 text-blue-700",
    FILL_THE_BLANK: "bg-purple-100 text-purple-700",
    WORD_SEARCH: "bg-emerald-100 text-emerald-700",
    CROSSWORD: "bg-orange-100 text-orange-700",
  };

  const getPoints = (diff: string) => {
    return { MUDAH: 10, SEDANG: 20, SULIT: 50, BONUS: 30 }[diff as keyof typeof getPoints] || 10;
  };

  const playGame = async (game: any) => {
    try {
      const res = await fetch('/api/projects/' + game.id);
      const json = await res.json();
      if (!json.success) { alert('Gagal memuat game.'); return; }
      
      const loadedGame = json.data;
      const loadedQuestions = loadedGame.questions || [];
      
      if (loadedGame.gameType !== 'WORD_SEARCH' && loadedGame.gameType !== 'CROSSWORD' && loadedQuestions.length === 0) {
        alert('Game ini belum memiliki soal.'); return;
      }
      
      setActiveGame(loadedGame);
      setQuestions(loadedQuestions);
      setMaxScore(loadedQuestions.reduce((acc: number, q: any) => acc + (q.score || getPoints(q.difficulty)), 0));
      setCurrentIndex(0); 
      setCurrentScore(0);
      setCorrectCount(0); 
      setWrongCount(0);
      setSelectedAnswer(null); 
      setShowFeedback(false);
      setGameFinished(false); 
      setGameData(null);
      setUserFTBAnswers([]); 
      setSubmissionResults([]);

      if (loadedGame.gameType === 'WORD_SEARCH') {
        const wsRes = await fetch('/api/word-search/' + game.id);
        const wsJson = await wsRes.json();
        if (wsJson.success && wsJson.data) { setGameData(wsJson.data); }
        else { alert('Data Word Search tidak ditemukan.'); return; }
      } else if (loadedGame.gameType === 'CROSSWORD') {
        const cwRes = await fetch('/api/crossword/' + game.id);
        const cwJson = await cwRes.json();
        if (cwJson.success && cwJson.data) { setGameData(cwJson.data); }
        else { alert('Data Crossword tidak ditemukan.'); return; }
      }
      
      setIsPlaying(true);
    } catch(e) {
      console.error(e); 
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const selectAnswer = (opt: string) => {
    if (showFeedback) return;
    setSelectedAnswer(opt);
    const q = questions[currentIndex];
    if (opt === q.correctAnswer) {
      setCurrentScore(prev => prev + (q.score || getPoints(q.difficulty)));
      setCorrectCount(prev => prev + 1);
      setIsCorrect(true);
    } else {
      setWrongCount(prev => prev + 1);
      setIsCorrect(false);
    }
    setShowFeedback(true);
  };

  const checkAnswerFTB = async () => {
    const q = questions[currentIndex];
    try {
      const res = await fetch('/api/projects/' + activeGame.id + '/submit', {
        method: 'POST', 
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ questionId: q.id, userAnswers: userFTBAnswers })
      });
      const json = await res.json();
      if (json.success) {
        setIsCorrect(json.allCorrect);
        setCurrentScore(prev => prev + json.scoreEarned);
        if (json.allCorrect) setCorrectCount(prev => prev + 1);
        else setWrongCount(prev => prev + 1);
        setSubmissionResults(json.details);
        setShowFeedback(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null); 
      setShowFeedback(false);
      setUserFTBAnswers([]); 
      setSubmissionResults([]);
    } else {
      setGameFinished(true);
    }
  };

  const quitGame = () => {
    setIsPlaying(false);
    setActiveGame(null);
    setGameFinished(false);
  };

  const handleFTBChange = (idx: number, val: string) => {
    const newAnswers = [...userFTBAnswers];
    newAnswers[idx] = val;
    setUserFTBAnswers(newAnswers);
  };

  const renderFTBComponent = (q: any) => {
    if (!q || !q.fullText) return null;
    let text = q.fullText;
    const sorted = [...(q.answers || [])].sort((a, b) => b.word.length - a.word.length);
    
    // We split the string by words to replace them with inputs.
    // For simplicity, since the original did regex replace, we can do a hacky approach 
    // or split properly. We'll use split with regex to map elements.
    
    // Create a regex to match any of the answers
    if (sorted.length === 0) return <span>{text}</span>;
    
    const escapeRegExp = (str: string) => str.replace(/[.*+?^$\{()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + sorted.map((a:any) => escapeRegExp(a.word)).join('|') + ')', 'gi');
    
    const parts = text.split(regex);
    
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 text-lg font-medium text-[#1A237E] mb-8 bg-white p-10 rounded-3xl shadow-inner border-2 border-slate-100 w-full">
        {parts.map((part: string, i: number) => {
          const matchIndex = sorted.findIndex((a:any) => a.word.toLowerCase() === part.toLowerCase());
          if (matchIndex !== -1) {
            return (
              <input 
                key={i}
                type="text" 
                className="ftb-input border-b-4 border-[#FFC107] outline-none text-center px-4 py-1 text-[#FF5722] bg-[#1A237E]/5 rounded-t-xl w-32 mx-2 font-black placeholder:text-slate-300 placeholder:opacity-50" 
                placeholder="..." 
                value={userFTBAnswers[matchIndex] || ''}
                onChange={(e) => handleFTBChange(matchIndex, e.target.value)}
              />
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </div>
    );
  };

  const filteredGames = games.filter(g => filter === 'ALL' || g.gameType === filter);

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-[#1A237E] uppercase tracking-wider flex items-center gap-3">
            <span className="w-2 h-8 bg-[#FFC107] rounded-full inline-block"></span>
            Katalog Game
          </h2>
          <p className="text-slate-500 text-sm mt-1 ml-5">Semua permainan yang telah dipublish oleh tim. Mainkan kapan saja!</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
          <i className="bi bi-controller text-[#FF5722] text-xl"></i>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Game</p>
            <p className="text-xl font-black text-[#1A237E]">{games.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['ALL', 'QUIZ', 'FILL_THE_BLANK', 'WORD_SEARCH', 'CROSSWORD'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all hover:shadow-md ${filter === f ? (
              f === 'ALL' ? 'bg-[#1A237E] text-white' :
              f === 'QUIZ' ? 'bg-blue-600 text-white' :
              f === 'FILL_THE_BLANK' ? 'bg-purple-600 text-white' :
              f === 'WORD_SEARCH' ? 'bg-emerald-600 text-white' :
              'bg-orange-500 text-white'
            ) : 'bg-white text-slate-600 border border-slate-200'}`}>
            {f === 'ALL' ? 'Semua' : 
             f === 'QUIZ' ? <><i className="bi bi-question-circle mr-1"></i> Kuis</> :
             f === 'FILL_THE_BLANK' ? <><i className="bi bi-input-cursor-text mr-1"></i> Isi Kosong</> :
             f === 'WORD_SEARCH' ? <><i className="bi bi-search mr-1"></i> Cari Kata</> :
             <><i className="bi bi-grid-3x3 mr-1"></i> TTS</>}
          </button>
        ))}
      </div>

      {/* Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredGames.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="text-6xl mb-4 opacity-20">🎮</div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada game yang sesuai filter.</p>
          </div>
        ) : (
          filteredGames.map((game) => (
            <div key={game.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-100 group transition-all duration-300 hover:-translate-y-1">
              {/* Thumbnail */}
              <div className="relative h-44 bg-gradient-to-br from-[#1A237E] to-blue-600 overflow-hidden cursor-pointer"
                   onClick={() => playGame(game)}>
                {game.thumbnailUrl ? (
                  <img src={game.thumbnailUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" alt={game.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                    {game.gameType === "QUIZ" ? "❓" : game.gameType === "FILL_THE_BLANK" ? "✏️" : game.gameType === "WORD_SEARCH" ? "🔍" : "🧩"}
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-[#1A237E]/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-[#FFC107] text-[#1A237E] font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                    <i className="bi bi-play-circle-fill text-lg"></i> Mainkan
                  </div>
                </div>
                {/* Type badge */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm ${gameTypeBadge[game.gameType] || "bg-slate-100 text-slate-600"}`}>
                    {gameTypeLabel[game.gameType] || game.gameType}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-5">
                <h3 className="font-bold text-[#1A237E] text-base line-clamp-1 cursor-pointer hover:text-[#FF5722] transition-colors mb-1"
                    onClick={() => playGame(game)}>{game.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">{game.description || "Game edukasi interaktif dari Logos LAB."}</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <i className="bi bi-person-fill"></i> Logos Team
                  </span>
                  <button onClick={() => playGame(game)}
                    className="bg-[#FF5722] text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest hover:bg-[#E64A19] transition-all shadow-sm hover:shadow-md flex items-center gap-1">
                    <i className="bi bi-play-fill"></i> Main
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== GAME PLAYER MODAL ===== */}
      {isPlaying && (
        <div className="fixed inset-0 bg-[#1A237E]/95 flex items-center justify-center z-[9999] backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-5xl h-[92vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border-8 border-white/20">
            
            {/* QUIZ / FTB Player */}
            {!gameFinished && activeGame?.gameType !== 'WORD_SEARCH' && activeGame?.gameType !== 'CROSSWORD' && (
              <div className="flex flex-col h-full">
                <div className="bg-[#1A237E] px-8 py-4 text-white flex justify-between items-center border-b-4 border-[#FFC107]">
                  <div className="flex items-center gap-4">
                    <img src="/public/assets/logo-logoslab.png" className="h-10 w-auto bg-white p-1 rounded-lg" alt="Logo" />
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#FFC107]">{activeGame?.title}</h3>
                      <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Soal {currentIndex + 1} dari {questions.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase opacity-60">Skor</p>
                      <div className="text-2xl font-black text-[#FFC107]">{currentScore}</div>
                    </div>
                    <button onClick={quitGame} className="bg-white/10 hover:bg-red-500 text-white p-3 rounded-full transition-all">
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
                <div className="h-2 bg-slate-100">
                  <div className="h-full bg-[#FF5722] transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 flex items-center justify-center">
                  <div className="w-full max-w-3xl text-center">
                    {questions[currentIndex] && (
                      <div className="inline-block bg-[#1A237E] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">
                        {questions[currentIndex].difficulty} (+{questions[currentIndex].score || getPoints(questions[currentIndex].difficulty)} POIN)
                      </div>
                    )}
                    
                    {/* Quiz */}
                    {activeGame?.gameType === 'QUIZ' && questions[currentIndex] && (
                      <div>
                        <h2 className="text-xl font-bold text-[#1A237E] mb-8 leading-tight">{questions[currentIndex].question}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <button key={opt} onClick={() => selectAnswer(opt)} disabled={showFeedback}
                              className={`border-4 p-5 rounded-2xl text-left flex items-center gap-4 transition-all disabled:cursor-default group ${
                                selectedAnswer === opt && !showFeedback ? 'border-[#FFC107] bg-yellow-50 scale-105' :
                                showFeedback && opt === questions[currentIndex].correctAnswer ? 'border-green-500 bg-green-50' :
                                showFeedback && selectedAnswer === opt && opt !== questions[currentIndex].correctAnswer ? 'border-red-500 bg-red-50' :
                                !showFeedback && selectedAnswer !== opt ? 'border-slate-100 bg-white hover:border-[#1A237E] hover:-translate-y-1' :
                                'border-slate-100 bg-white opacity-50'
                              }`}>
                              <span className={`h-10 w-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black transition-colors ${
                                showFeedback && opt === questions[currentIndex].correctAnswer ? 'bg-green-500 text-white' : 'bg-slate-100 group-hover:bg-[#FFC107] group-hover:text-[#1A237E] text-slate-400'
                              }`}>{opt}</span>
                              <span className="text-[#1A237E] font-semibold text-sm">{questions[currentIndex][`option${opt}`]}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* FTB */}
                    {activeGame?.gameType === 'FILL_THE_BLANK' && questions[currentIndex] && (
                      <div className="flex flex-col items-center">
                        {renderFTBComponent(questions[currentIndex])}
                        {!showFeedback && (
                          <div>
                            <button onClick={checkAnswerFTB} className="bg-[#FF5722] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-[#E64A19] transition-all">
                              PERIKSA JAWABAN
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Feedback */}
                    {showFeedback && (
                      <div className={`mt-8 p-6 rounded-3xl text-left border-4 border-dashed animate-in fade-in duration-300 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{isCorrect ? '✨' : '💡'}</span>
                          <h4 className={`font-black uppercase tracking-widest text-sm ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                            {isCorrect ? 'Jawaban Tepat!' : 'Belum Tepat, Ini Penjelasannya:'}
                          </h4>
                        </div>
                        {activeGame?.gameType === 'QUIZ' && (
                          <p className="text-slate-700 font-bold italic text-sm">{questions[currentIndex]?.explanation}</p>
                        )}
                        <div className="mt-4 flex justify-end">
                          <button onClick={nextQuestion} className="bg-[#1A237E] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg flex items-center gap-2 text-sm">
                            <span>{currentIndex === questions.length - 1 ? 'LIHAT HASIL' : 'SOAL BERIKUTNYA'}</span>
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Word Search */}
            {!gameFinished && activeGame?.gameType === 'WORD_SEARCH' && gameData && (
              <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                <button onClick={quitGame} className="absolute top-4 right-4 z-50 bg-[#1A237E] text-white p-3 rounded-full hover:bg-indigo-900 transition-all shadow-lg">
                   <i className="bi bi-x-lg"></i>
                </button>
                <WordSearchGame activeProject={activeGame} gameData={gameData} />
              </div>
            )}

            {/* Crossword */}
            {!gameFinished && activeGame?.gameType === 'CROSSWORD' && gameData && (
              <div className="flex-1 overflow-y-auto bg-slate-50 relative">
                <button onClick={quitGame} className="absolute top-4 right-4 z-50 bg-[#1A237E] text-white p-3 rounded-full hover:bg-indigo-900 transition-all shadow-lg">
                   <i className="bi bi-x-lg"></i>
                </button>
                <CrosswordGame activeProject={activeGame} gameData={gameData} />
              </div>
            )}

            {/* Result Screen (Quiz & FTB) */}
            {gameFinished && activeGame?.gameType !== 'WORD_SEARCH' && activeGame?.gameType !== 'CROSSWORD' && (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-white to-blue-50 text-center animate-in zoom-in duration-500">
                <div className="w-full max-w-xl">
                  <div className="text-8xl mb-6 animate-bounce">🏆</div>
                  <h2 className="text-3xl font-black text-[#1A237E] uppercase tracking-widest mb-2">Permainan Selesai!</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-10">Kerja bagus, {username}!</p>
                  <div className="grid grid-cols-3 gap-4 mb-10">
                    <div className="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-[#FFC107]">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Skor</div>
                      <div className="text-2xl font-black text-[#1A237E]"><span>{currentScore}</span><span className="text-xs opacity-30">/{maxScore}</span></div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-green-500">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Benar</div>
                      <div className="text-2xl font-black text-green-600">{correctCount}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-xl border-b-4 border-red-500">
                      <div className="text-[10px] font-black text-slate-400 uppercase mb-1">Salah</div>
                      <div className="text-2xl font-black text-red-600">{wrongCount}</div>
                    </div>
                  </div>
                  <button onClick={quitGame} className="w-full bg-[#1A237E] text-[#FFC107] py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-2xl">
                    TUTUP & KEMBALI
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};
