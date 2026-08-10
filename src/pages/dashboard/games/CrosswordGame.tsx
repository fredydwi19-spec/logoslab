import React, { useState, useEffect } from 'react';

export const CrosswordGame = ({ activeProject, gameData, isReadOnly = false }: { activeProject: any, gameData: any, isReadOnly?: boolean }) => {
  const [grid, setGrid] = useState<any[][]>([]);
  const [gridSize, setGridSize] = useState(15);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [clues, setClues] = useState<any[]>([]);
  
  const [userGrid, setUserGrid] = useState<string[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number}>({r: -1, c: -1});
  const [direction, setDirection] = useState<'ACROSS'|'DOWN'>('ACROSS');
  
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  
  const [showEduModal, setShowEduModal] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (gameData) {
      try {
        let rawGrid = gameData.gridData || gameData.grid || [];
        if (typeof rawGrid === 'string') rawGrid = JSON.parse(rawGrid);
        const parsedGrid = Array.isArray(rawGrid) ? JSON.parse(JSON.stringify(rawGrid)) : [];
        setGrid(parsedGrid);
        
        let rawClues = gameData.clues || [];
        if (typeof rawClues === 'string') rawClues = JSON.parse(rawClues);
        const parsedClues = Array.isArray(rawClues) ? JSON.parse(JSON.stringify(rawClues)) : [];
        setClues(parsedClues);
        
        setGridSize(gameData.gridSize || 15);
        setDifficulty(gameData.difficulty || 'MEDIUM');
        
        if (parsedGrid && parsedGrid.length > 0) {
          setUserGrid(parsedGrid.map((row: any) => row.map((cell: any) => '')));
        }
      } catch (e) {
        console.error("Failed to parse crossword data", e);
      }
    }
  }, [gameData]);

  useEffect(() => {
    let interval: any;
    if (!isReadOnly && !showEduModal && !showSummary) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isReadOnly, showEduModal, showSummary]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedCell.r === -1 || showEduModal || showSummary) return;
      
      if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
        handleInput(e.key.toUpperCase());
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'ArrowRight') {
        moveSelection(0, 1);
      } else if (e.key === 'ArrowLeft') {
        moveSelection(0, -1);
      } else if (e.key === 'ArrowUp') {
        moveSelection(-1, 0);
      } else if (e.key === 'ArrowDown') {
        moveSelection(1, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, direction, showEduModal, showSummary, userGrid]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectCell = (r: number, c: number) => {
    if (!grid[r] || !grid[r][c] || grid[r][c].isBlack) return;
    
    if (selectedCell.r === r && selectedCell.c === c) {
      setDirection(direction === 'ACROSS' ? 'DOWN' : 'ACROSS');
    } else {
      setSelectedCell({ r, c });
    }
  };

  const handleInput = (char: string) => {
    const { r, c } = selectedCell;
    const newUserGrid = [...userGrid];
    newUserGrid[r][c] = char;
    setUserGrid(newUserGrid);
    checkWordComplete(r, c, newUserGrid);
    moveSelectionForward();
  };

  const handleBackspace = () => {
    const { r, c } = selectedCell;
    const newUserGrid = [...userGrid];
    if (newUserGrid[r][c] !== '') {
      newUserGrid[r][c] = '';
      setUserGrid(newUserGrid);
    } else {
      moveSelectionBackward(newUserGrid);
    }
  };

  const moveSelectionForward = () => {
    const { r, c } = selectedCell;
    let nextR = r, nextC = c;
    if (direction === 'ACROSS') nextC++; else nextR++;
    
    if (nextR < gridSize && nextC < gridSize && !grid[nextR][nextC].isBlack) {
      setSelectedCell({ r: nextR, c: nextC });
    }
  };

  const moveSelectionBackward = (currentGrid: string[][]) => {
    const { r, c } = selectedCell;
    let nextR = r, nextC = c;
    if (direction === 'ACROSS') nextC--; else nextR--;
    
    if (nextR >= 0 && nextC >= 0 && !grid[nextR][nextC].isBlack) {
      setSelectedCell({ r: nextR, c: nextC });
      const newUserGrid = [...currentGrid];
      newUserGrid[nextR][nextC] = '';
      setUserGrid(newUserGrid);
    }
  };

  const moveSelection = (dr: number, dc: number) => {
    let nextR = selectedCell.r + dr;
    let nextC = selectedCell.c + dc;
    if (nextR >= 0 && nextR < gridSize && nextC >= 0 && nextC < gridSize && !grid[nextR][nextC].isBlack) {
      setSelectedCell({ r: nextR, c: nextC });
    }
  };

  const checkWordComplete = (r: number, c: number, currentGrid: string[][]) => {
    ['ACROSS', 'DOWN'].forEach(dir => {
      const clue = findClueForCell(r, c, dir as 'ACROSS'|'DOWN');
      if (clue) {
        const isCorrect = isWordCorrect(clue, currentGrid);
        if (isCorrect && !clue.alreadyFound) {
          const newClues = [...clues];
          const clueIndex = newClues.findIndex(c => c === clue);
          newClues[clueIndex].alreadyFound = true;
          setClues(newClues);
          handleSuccess(newClues[clueIndex], newClues);
        }
      }
    });
  };

  const findClueForCell = (r: number, c: number, dir: 'ACROSS'|'DOWN') => {
    return clues.find(clue => {
      if (clue.direction !== dir) return false;
      const startR = parseInt(clue.startRow);
      const startC = parseInt(clue.startCol);
      const len = clue.answer.length;
      
      if (dir === 'ACROSS') {
        return r === startR && c >= startC && c < startC + len;
      } else {
        return c === startC && r >= startR && r < startR + len;
      }
    });
  };

  const isWordCorrect = (clue: any, currentGrid: string[][]) => {
    const startR = parseInt(clue.startRow);
    const startC = parseInt(clue.startCol);
    const dir = clue.direction;
    const answer = clue.answer.toUpperCase();
    
    for (let i = 0; i < answer.length; i++) {
      const currR = dir === 'ACROSS' ? startR : startR + i;
      const currC = dir === 'ACROSS' ? startC + i : startC;
      if (currentGrid[currR][currC] !== answer[i]) return false;
    }
    return true;
  };

  const handleSuccess = (clue: any, currentClues: any[]) => {
    const earnedScore = difficulty === 'EASY' ? 10 : difficulty === 'MEDIUM' ? 20 : 50;
    setScore(s => s + earnedScore);
    setCurrentExplanation(clue.explanation);
    setCurrentAnswer(clue.answer);
    setShowEduModal(true);
    
    if (currentClues.every(c => c.alreadyFound)) {
      if (!isReadOnly) submitScore(score + earnedScore);
    }
  };

  const submitScore = async (finalScore: number) => {
    try {
      await fetch('/api/crossword/' + activeProject.id + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scoreEarned: finalScore,
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
    if (clues.every(c => c.alreadyFound)) {
      setShowSummary(true);
    }
  };

  const getCellStatus = (r: number, c: number) => {
    if (!userGrid[r]) return '';
    const char = userGrid[r][c];
    if (!char) return '';
    if (grid[r][c].letter === char) return 'text-green-600';
    return 'text-red-600';
  };

  const isCellHighlighted = (r: number, c: number) => {
    if (selectedCell.r === -1) return false;
    if (selectedCell.r === r && selectedCell.c === c) return true;
    
    const clue = findClueForCell(selectedCell.r, selectedCell.c, direction);
    if (clue) {
       const startR = parseInt(clue.startRow);
       const startC = parseInt(clue.startCol);
       const len = clue.answer.length;
       if (direction === 'ACROSS') {
         return r === startR && c >= startC && c < startC + len;
       } else {
         return c === startC && r >= startR && r < startR + len;
       }
    }
    return false;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 animate-in fade-in duration-700">
      
      {/* Header Stats */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 bg-[#FFC107] rounded-2xl flex items-center justify-center shadow-xl transform rotate-3">
             <i className="bi bi-grid-3x3 text-2xl text-[#1A237E]"></i>
           </div>
           <div>
             <h2 className="text-2xl font-black text-[#1A237E] uppercase tracking-tighter">{activeProject?.title}</h2>
             <div className="flex items-center gap-2">
               <span className="text-[10px] font-black bg-[#1A237E] text-white px-2 py-0.5 rounded uppercase tracking-widest">{difficulty}</span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gridSize}x{gridSize} GRID</span>
             </div>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
          <div className="bg-white p-3 px-6 rounded-2xl border-2 border-slate-100 shadow-sm text-center">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
            <div className="text-xl font-black text-[#1A237E]">{formatTime(timer)}</div>
          </div>
          <div className="bg-[#1A237E] p-3 px-6 rounded-2xl border-b-4 border-[#FFC107] shadow-lg text-center">
            <div className="text-[8px] font-black text-blue-200 uppercase tracking-widest">SKOR</div>
            <div className="text-xl font-black text-[#FFC107]">{score}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Center: Crossword Grid */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="bg-[#1A237E] p-4 sm:p-8 rounded-[3rem] shadow-2xl border-[10px] border-white/5 relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
             
             <div className="relative z-10 select-none">
                <div className="grid gap-px bg-white/20 border border-white/20 shadow-2xl" 
                     style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}>
                  {grid.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                      <div key={`${rIdx}-${cIdx}`} onClick={() => selectCell(rIdx, cIdx)}
                           className={`h-6 w-6 sm:h-8 sm:w-8 md:h-9 md:w-9 relative cursor-pointer transition-all duration-200 ${
                             cell.isBlack ? 'bg-[#0D1240]' : 
                             isCellHighlighted(rIdx, cIdx) && (selectedCell.r === rIdx && selectedCell.c === cIdx) ? 'ring-2 ring-[#FF5722] z-20 bg-[#FFC107] scale-105 shadow-lg' :
                             isCellHighlighted(rIdx, cIdx) ? 'bg-[#FFC107] scale-105 z-10 shadow-lg ring-2 ring-white' :
                             'bg-white'
                           }`}>
                        
                        {/* Number Label */}
                        {cell.number && (
                          <span className={`absolute top-0.5 left-0.5 text-[6px] md:text-[8px] font-black leading-none ${cell.isBlack ? 'text-white/20' : 'text-[#1A237E]'}`}>
                            {cell.number}
                          </span>
                        )}
                        
                        {/* Letter */}
                        {!cell.isBlack && userGrid[rIdx] && (
                          <span className={`w-full h-full flex items-center justify-center font-black text-[10px] md:text-sm uppercase ${getCellStatus(rIdx, cIdx)}`}>
                            {userGrid[rIdx][cIdx]}
                          </span>
                        )}
                      </div>
                    ))
                  ))}
                </div>
             </div>
          </div>
          
          <div className="mt-6 flex gap-4">
             <button onClick={() => setDirection(direction === 'ACROSS' ? 'DOWN' : 'ACROSS')} className="bg-white border-2 border-slate-100 px-6 py-3 rounded-2xl font-black text-[#1A237E] text-[10px] uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <i className="bi bi-arrow-down-up"></i>
                ARAH: <span>{direction}</span>
             </button>
          </div>
        </div>

        {/* Right: Clue List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Across Clues */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <h3 className="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-[#FFC107] rounded-full"></div>
                Mendatar (Across)
             </h3>
             <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {clues.filter(c => c.direction === 'ACROSS').map(clue => (
                   <div key={clue.number} onClick={() => { selectCell(parseInt(clue.startRow), parseInt(clue.startCol)); setDirection('ACROSS'); }}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          clue.alreadyFound ? 'bg-green-50 border-green-100 opacity-60' :
                          (selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'ACROSS') ? 'bg-yellow-50 border-[#FFC107]' :
                          'bg-slate-50 border-transparent hover:border-[#FFC107]'
                        }`}>
                      <div className="flex gap-3">
                         <span className="font-black text-[#1A237E] text-xs">{clue.number}.</span>
                         <span className="font-bold text-slate-600 text-[11px] leading-relaxed">{clue.clue}</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          {/* Down Clues */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
             <h3 className="text-[10px] font-black text-[#1A237E] uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-[#FF5722] rounded-full"></div>
                Menurun (Down)
             </h3>
             <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {clues.filter(c => c.direction === 'DOWN').map(clue => (
                   <div key={clue.number} onClick={() => { selectCell(parseInt(clue.startRow), parseInt(clue.startCol)); setDirection('DOWN'); }}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          clue.alreadyFound ? 'bg-green-50 border-green-100 opacity-60' :
                          (selectedCell.r == clue.startRow && selectedCell.c == clue.startCol && direction == 'DOWN') ? 'bg-yellow-50 border-[#FFC107]' :
                          'bg-slate-50 border-transparent hover:border-[#FFC107]'
                        }`}>
                      <div className="flex gap-3">
                         <span className="font-black text-[#1A237E] text-xs">{clue.number}.</span>
                         <span className="font-bold text-slate-600 text-[11px] leading-relaxed">{clue.clue}</span>
                      </div>
                   </div>
                ))}
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
                <div className="h-20 w-20 bg-[#FFC107] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
                  <i className="bi bi-check-circle-fill text-4xl text-[#1A237E]"></i>
                </div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Jawaban Benar!</h2>
                <h3 className="text-4xl font-black text-[#FFC107] mt-2 italic uppercase">{currentAnswer}</h3>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 italic text-[#1A237E] font-bold leading-relaxed text-base text-center">{currentExplanation}</div>
              <button onClick={closeEduModal} className="w-full bg-[#1A237E] text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-900 transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-4 text-xs">
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
              <div className="text-[10px] font-black text-[#FF5722] uppercase tracking-[0.5em]">CROSSWORD COMPLETED</div>
              <h2 className="text-6xl font-black text-[#1A237E] uppercase tracking-tighter italic leading-none">MASTER<br/><span className="text-[#FFC107]">ALKITAB</span></h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 py-6">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL SKOR</div>
                <div className="text-6xl font-black text-[#FF5722]">{score}</div>
              </div>
              <div className="space-y-1 border-l-2 border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WAKTU</div>
                <div className="text-6xl font-black text-[#1A237E]">{formatTime(timer)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <button onClick={() => window.location.href='/app'} className="w-full bg-[#1A237E] text-[#FFC107] py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] text-xl hover:bg-indigo-900 transition-all shadow-[0_20px_50px_rgba(26,35,126,0.3)] flex items-center justify-center gap-4 group">
                SELESAI & KEMBALI
                <i className="bi bi-arrow-right transition-transform group-hover:translate-x-2"></i>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
