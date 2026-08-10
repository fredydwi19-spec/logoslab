import React, { useState, useEffect } from 'react';

export const WordSearchGame = ({ activeProject, gameData }: { activeProject: any, gameData: any }) => {
  const [grid, setGrid] = useState<any[][]>([]);
  const [gridSize, setGridSize] = useState(10);
  const [difficulty, setDifficulty] = useState('EASY');
  const [wordsData, setWordsData] = useState<any[]>([]);
  const [wordsList, setWordsList] = useState<string[]>([]);
  
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState<{r: number, c: number} | null>(null);
  const [currentCell, setCurrentCell] = useState<{r: number, c: number} | null>(null);
  const [foundCells, setFoundCells] = useState<{r: number, c: number}[]>([]);
  
  const [showEduModal, setShowEduModal] = useState(false);
  const [currentWord, setCurrentWord] = useState<any>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (gameData) {
      setGrid(gameData.gridData || []);
      setGridSize(gameData.gridSize || 10);
      setDifficulty(gameData.difficulty || 'EASY');
      setWordsData(gameData.words || []);
      setWordsList((gameData.words || []).map((w: any) => w.word));
      setTotalWords((gameData.words || []).length);
    }
  }, [gameData]);

  useEffect(() => {
    let interval: any;
    if (!showEduModal && !showSummary) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showEduModal, showSummary]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellFromEvent = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    const cell = el.closest('.cell') as HTMLElement;
    if (!cell) return null;
    return {
      r: parseInt(cell.dataset.row || '0'),
      c: parseInt(cell.dataset.col || '0')
    };
  };

  const startSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (showEduModal || showSummary) return;
    const cell = getCellFromEvent(e);
    if (cell) {
      setIsSelecting(true);
      setStartCell(cell);
      setCurrentCell(cell);
      if (window.navigator.vibrate) window.navigator.vibrate(10);
    }
  };

  const updateSelection = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSelecting) return;
    const cell = getCellFromEvent(e);
    if (cell && currentCell && (cell.r !== currentCell.r || cell.c !== currentCell.c)) {
      setCurrentCell(cell);
    }
  };

  const getSelectedCells = (start: {r: number, c: number} | null, current: {r: number, c: number} | null) => {
    if (!start || !current) return [];
    
    const dr = current.r - start.r;
    const dc = current.c - start.c;
    
    const dist = Math.max(Math.abs(dr), Math.abs(dc));
    if (dist === 0) return [start];

    const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
    const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
    
    if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return [start];

    const cells = [];
    for (let i = 0; i <= dist; i++) {
      cells.push({
        r: start.r + i * stepR,
        c: start.c + i * stepC
      });
    }
    return cells;
  };

  const endSelection = () => {
    if (!isSelecting) return;
    setIsSelecting(false);
    checkSelection(startCell, currentCell);
  };

  const checkSelection = (start: {r: number, c: number} | null, current: {r: number, c: number} | null) => {
    const selectedCells = getSelectedCells(start, current);
    if (selectedCells.length === 0) return;
    const word = selectedCells.map(c => grid[c.r][c.c]).join('');
    const reversedWord = word.split('').reverse().join('');

    if (wordsList.includes(word) && !foundWords.includes(word)) {
      handleSuccess(word, selectedCells);
    } else if (wordsList.includes(reversedWord) && !foundWords.includes(reversedWord)) {
      handleSuccess(reversedWord, selectedCells);
    }
    
    setStartCell(null);
    setCurrentCell(null);
  };

  const handleSuccess = (word: string, cells: {r: number, c: number}[]) => {
    const newFoundWords = [...foundWords, word];
    setFoundWords(newFoundWords);
    
    const newFoundCells = [...foundCells];
    cells.forEach(c => {
      if (!isCellInFoundWords(c.r, c.c, newFoundCells)) {
        newFoundCells.push({r: c.r, c: c.c});
      }
    });
    setFoundCells(newFoundCells);
    
    const earnedScore = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 50;
    setScore(s => s + earnedScore);
    
    const matchedWord = wordsData.find(w => w.word === word);
    setCurrentWord(matchedWord);
    setShowEduModal(true);
    
    if (newFoundWords.length === totalWords) {
      submitScore(newFoundWords.length);
    }
  };

  const isCellInFoundWords = (r: number, c: number, cells = foundCells) => {
    return cells.some(fc => fc.r === r && fc.c === c);
  };

  const submitScore = async (foundCount: number) => {
    try {
      await fetch('/api/word-search/' + activeProject.id + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foundWordsCount: foundCount,
          totalWords: totalWords,
          difficulty: difficulty,
          timeSpent: timer
        })
      });
    } catch(e) {
      console.error(e);
    }
  };

  const closeEduModal = () => {
    setShowEduModal(false);
    if (foundWords.length === totalWords) {
      setShowSummary(true);
    }
  };

  const getCellClass = (r: number, c: number) => {
    if (isSelecting) {
      const selected = getSelectedCells(startCell, currentCell);
      if (selected.some(sc => sc.r === r && sc.c === c)) {
        return 'bg-[#FF5722] text-white scale-110 z-20 shadow-lg ring-2 ring-white';
      }
    }
    return '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
             <i className="bi bi-search text-[#1A237E] text-2xl"></i>
           </div>
           <div>
             <h2 className="text-xl md:text-2xl font-bold text-[#1A237E] uppercase tracking-tighter">{activeProject?.title}</h2>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black bg-[#1A237E] text-white px-2 py-0.5 rounded uppercase tracking-widest">{difficulty}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gridSize}x{gridSize} GRID</span>
             </div>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-white p-3 px-6 rounded-2xl border-2 border-slate-100 shadow-sm text-center">
            <div className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest">WAKTU</div>
            <div className="text-xl md:text-2xl font-bold text-[#1A237E]">{formatTime(timer)}</div>
          </div>
          <div className="bg-[#1A237E] p-3 px-6 rounded-2xl border-b-4 border-[#FFC107] shadow-lg text-center">
            <div className="text-xs md:text-sm font-medium text-blue-200 uppercase tracking-widest">SKOR</div>
            <div className="text-xl md:text-2xl font-bold text-[#FFC107]">{score}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Word List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl relative overflow-hidden">
            <h3 className="text-sm font-black text-[#1A237E] uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="h-2 w-2 bg-[#FFC107] rounded-full animate-ping"></span>
              Kata Tersembunyi:
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {wordsList.map(w => (
                <div key={w} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-500 ${foundWords.includes(w) ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-transparent text-slate-700'}`}>
                  <div className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all ${foundWords.includes(w) ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {foundWords.includes(w) ? (
                      <i className="bi bi-check-lg text-xs"></i>
                    ) : (
                      <span className="text-[8px] font-black">{w[0]}</span>
                    )}
                  </div>
                  <span className={`font-black text-xs uppercase tracking-wider ${foundWords.includes(w) ? 'line-through opacity-40' : ''}`}>{w}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-100">
             <p className="text-[10px] font-bold text-orange-800 leading-relaxed italic">"Temukan kata-kata di samping pada grid dengan cara menarik garis (drag) pada huruf-hurufnya. Kata bisa mendatar, menurun, atau diagonal!"</p>
          </div>
        </div>

        {/* Right: Game Grid */}
        <div className="lg:col-span-2">
          <div className="bg-[#1A237E] p-4 sm:p-10 rounded-[3.5rem] shadow-2xl border-[12px] border-white/5 relative overflow-hidden flex items-center justify-center min-h-[450px]">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            <div className="relative z-10 select-none touch-none" 
                 onMouseDown={startSelection} 
                 onMouseMove={updateSelection} 
                 onMouseUp={endSelection}
                 onTouchStart={startSelection} 
                 onTouchMove={updateSelection} 
                 onTouchEnd={endSelection}
                 onMouseLeave={endSelection}>
              
              <div className="grid gap-1 bg-[#1A237E]/30 p-3 rounded-2xl backdrop-blur-sm" style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                {grid.map((row, rIdx) => (
                  row.map((char, cIdx) => (
                    <div key={`${rIdx}-${cIdx}`} data-row={rIdx} data-col={cIdx}
                         className={`h-7 w-7 sm:h-9 sm:w-9 md:h-11 md:w-11 flex items-center justify-center font-black text-white text-[10px] sm:text-sm md:text-xl rounded-lg transition-all duration-150 cursor-pointer cell relative ${getCellClass(rIdx, cIdx)}`}>
                      <span className="relative z-10">{char}</span>
                      {isCellInFoundWords(rIdx, cIdx) && (
                        <div className="absolute inset-0 bg-[#FFC107] rounded-lg shadow-inner transform scale-90"></div>
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Modal */}
      {showEduModal && (
        <div className="fixed inset-0 bg-[#1A237E]/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl border-4 border-[#FFC107] overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1A237E] p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10">
                <div className="h-24 w-24 bg-[#FFC107] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                  <i className="bi bi-star-fill text-4xl text-[#1A237E]"></i>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter">Luar Biasa!</h2>
                <p className="text-blue-200 font-medium uppercase tracking-[0.3em] text-xs mt-2">Wawasan Baru:</p>
                <h3 className="text-3xl md:text-4xl font-bold text-[#FFC107] mt-2 italic">{currentWord?.word}</h3>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 italic text-[#1A237E] font-bold leading-relaxed text-lg text-center">{currentWord?.explanation}</div>
              <button onClick={closeEduModal} className="w-full bg-[#1A237E] text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-4">
                LANJUTKAN MISI
                <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-[#1A237E]/95 backdrop-blur-2xl flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-[4rem] w-full max-w-xl shadow-2xl border-[12px] border-white/10 overflow-hidden text-center p-12 py-16 space-y-10 animate-in slide-in-from-bottom duration-700 relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#FFC107] via-[#FF5722] to-[#FFC107]"></div>
            
            <div className="space-y-4">
              <div className="text-xs md:text-sm font-medium text-[#FF5722] uppercase tracking-[0.5em]">MISSION COMPLETED</div>
              <h2 className="text-4xl md:text-5xl font-bold text-[#1A237E] uppercase tracking-tighter italic leading-none">PAKAR KATA!<br/><span className="text-[#FFC107]">TERLATIH</span></h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 py-6">
              <div className="space-y-1">
                <div className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest">TOTAL SKOR</div>
                <div className="text-4xl md:text-5xl font-bold text-[#FF5722]">{score}</div>
              </div>
              <div className="space-y-1 border-l-2 border-slate-100">
                <div className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest">WAKTU</div>
                <div className="text-4xl md:text-5xl font-bold text-[#1A237E]">{formatTime(timer)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <button onClick={() => window.location.href='/app'} className="w-full bg-[#1A237E] text-[#FFC107] py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-indigo-900 transition-all shadow-[0_20px_50px_rgba(26,35,126,0.3)] flex items-center justify-center gap-4 group">
                KEMBALI KE DASHBOARD
                <i className="bi bi-arrow-right transition-transform group-hover:translate-x-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
