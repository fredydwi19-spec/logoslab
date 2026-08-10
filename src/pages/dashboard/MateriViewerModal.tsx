import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';

interface MateriViewerModalProps {
  activeMateri: any;
  onClose: () => void;
}

export const MateriViewerModal: React.FC<MateriViewerModalProps> = ({ activeMateri, onClose }) => {
  const [timeSpentSeconds, setTimeSpentSeconds] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [videoWatchedPercentage, setVideoWatchedPercentage] = useState(0);
  const [canClaim, setCanClaim] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  
  // MANUAL logic
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [unlockedIdx, setUnlockedIdx] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastVideoTimeRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout>();
  const syncRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadProgress();
    
    // Setup timer
    timerRef.current = setInterval(() => {
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);
    
    // Sync to server every 10s
    syncRef.current = setInterval(() => {
      syncProgress();
    }, 10000);
    
    return () => {
      clearInterval(timerRef.current);
      clearInterval(syncRef.current);
      window.speechSynthesis.cancel();
    };
  }, [activeMateri]);

  useEffect(() => {
    checkEligibility();
  }, [timeSpentSeconds, scrollPercentage, videoWatchedPercentage]);

  const loadProgress = async () => {
    try {
      const res = await fetch(`/api/materi/${activeMateri.id}/progress`);
      const json = await res.json();
      if (json.success && json.data) {
        setTimeSpentSeconds(Math.max(0, json.data.timeSpentSeconds || 0));
        setScrollPercentage(Math.max(0, json.data.scrollPercentage || 0));
        setVideoWatchedPercentage(Math.max(0, json.data.videoWatchedPercentage || 0));
        setIsClaimed(json.data.isCompleted || false);
      }
    } catch(e) {}
  };

  const syncProgress = async () => {
    if (isClaimed) return;
    try {
      await fetch(`/api/materi/${activeMateri.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scrollPercentage,
          timeSpentSeconds,
          videoWatchedPercentage
        })
      });
    } catch(e) {}
  };

  const checkEligibility = () => {
    if (isClaimed) return;
    const isVideo = activeMateri.materiType === 'VIDEO';
    if (isVideo) {
      if (videoWatchedPercentage >= 90) setCanClaim(true);
    } else {
      if (timeSpentSeconds >= 120 && scrollPercentage >= 95) setCanClaim(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const claimAchievement = async () => {
    if (isClaimed) return;
    try {
      const res = await fetch(`/api/materi/${activeMateri.id}/claim-achievement`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        setIsClaimed(true);
        setCanClaim(false);
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      } else {
        alert(json.error || 'Gagal mengklaim achievement');
      }
    } catch (e) {
      alert('Terjadi kesalahan jaringan.');
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollTotal = container.scrollHeight - container.clientHeight;
    if (scrollTotal > 0) {
      const currentScroll = Math.max(scrollPercentage, Math.floor((container.scrollTop / scrollTotal) * 100));
      setScrollPercentage(currentScroll);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.duration) {
      if (video.currentTime - lastVideoTimeRef.current > 10) {
        video.currentTime = lastVideoTimeRef.current;
        return;
      }
      lastVideoTimeRef.current = video.currentTime;
      const currentPct = Math.floor((video.currentTime / video.duration) * 100);
      if (currentPct > videoWatchedPercentage) {
        setVideoWatchedPercentage(currentPct);
      }
    }
  };

  const handleVideoEnded = () => {
    setVideoWatchedPercentage(100);
  };

  // Text-to-Speech Logic (Simplified)
  const toggleSpeech = async () => {
    if (isExtracting) return;
    if (isReading) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }
    
    setIsExtracting(true);
    let text = "Ini adalah konten materi teks yang sedang dibacakan."; 
    // In reality, we extract from activeMateri.materiContents or PDF.js
    // Simulating extraction here...
    setTimeout(() => {
      setIsExtracting(false);
      setIsReading(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.onend = () => {
        setIsReading(false);
        setIsPaused(false);
      };
      window.speechSynthesis.speak(utterance);
    }, 1000);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsReading(false);
    setIsPaused(false);
    setSpeakingIdx(null);
  };

  const speakSection = (idx: number) => {
    const section = activeMateri.materialSections?.[idx];
    if (!section) return;
    if (speakingIdx === idx) {
      if (isPaused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } else {
        window.speechSynthesis.pause();
        setIsPaused(true);
      }
      return;
    }
    window.speechSynthesis.cancel();
    const plainText = section.content.replace(/<[^>]*>/g, '');
    setSpeakingIdx(idx);
    setIsReading(true);
    setIsPaused(false);
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'id-ID';
    utterance.onend = () => {
      setSpeakingIdx(null);
      setIsReading(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const checkAnswerQuiz = (opt: string) => {
    if (showExplanation) return;
    setSelectedAnswer(opt);
    const q = activeMateri.questions?.[currentQuestionIndex];
    if (q) {
      setIsCorrect(opt === q.correctAnswer);
      setShowExplanation(true);
    }
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setIsCorrect(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-50 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-[#1A237E] p-4 text-white flex justify-between items-center shadow-md z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
              <i className="bi bi-arrow-left text-xl"></i>
            </button>
            <div>
              <div className="text-[10px] font-black text-[#FFC107] uppercase tracking-widest mb-0.5">
                {activeMateri.materiType === 'VIDEO' ? '🎬 MATERI VIDEO' : (activeMateri.materiType === 'MANUAL' ? '📋 MATERI INTERAKTIF' : '📄 MATERI TEKS/PDF')}
              </div>
              <h2 className="text-xl font-bold">{activeMateri.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* TTS Button */}
            {(activeMateri.materiType === 'TEKS' || activeMateri.materiType === 'PDF' || activeMateri.materiType === 'MANUAL') && (
              <div className="flex items-center gap-2">
                <button onClick={toggleSpeech} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold text-xs transition-colors flex items-center gap-2">
                  {isExtracting ? (
                    <><i className="bi bi-hourglass-split"></i> Ekstrak...</>
                  ) : (
                    <><i className={`bi ${isReading && !isPaused ? 'bi-pause-fill' : 'bi-play-fill'}`}></i> {isReading ? (isPaused ? 'Lanjutkan' : 'Jeda') : 'Audio TTS'}</>
                  )}
                </button>
                {isReading && (
                  <button onClick={stopSpeech} className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-full font-bold text-xs">
                    Stop
                  </button>
                )}
              </div>
            )}
            
            {/* Timer */}
            <div className="bg-white/10 rounded-full px-4 py-2 flex items-center gap-2 border border-white/20">
              <i className="bi bi-stopwatch text-[#FFC107]"></i>
              <span className="font-mono font-bold text-sm">{formatTime(timeSpentSeconds)}</span>
            </div>
            
            {/* Claim Reward */}
            {canClaim && !isClaimed && (
              <button onClick={claimAchievement} className="bg-orange-500 text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2 animate-bounce">
                <span>Klaim Reward</span>
                <i className="bi bi-stars"></i>
              </button>
            )}
            {isClaimed && (
              <div className="bg-green-500 text-white px-4 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-inner flex items-center gap-2">
                <i className="bi bi-check-circle-fill"></i> Selesai
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(activeMateri.materiType === 'TEKS' || activeMateri.materiType === 'PDF' || activeMateri.materiType === 'MANUAL') && (
          <div className="w-full h-1 bg-slate-200 z-20 shrink-0">
            <div className="h-full bg-orange-500 transition-all" style={{ width: `${scrollPercentage}%` }}></div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto relative p-6 md:p-10" ref={containerRef} onScroll={handleScroll}>
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* PDF / IMAGE / VIDEO */}
            {activeMateri.materiType !== 'MANUAL' && activeMateri.materiContents?.map((content: any) => (
              <div key={content.id} className="w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                {content.contentType === 'IMAGE' && <img src={content.fileUrl} className="w-full h-auto object-contain" alt="Content" />}
                {(content.contentType === 'PDF' || content.contentType === 'PPT') && (
                  <iframe src={content.fileUrl} className="w-full h-[70vh] border-0" title="PDF Viewer"></iframe>
                )}
                {content.contentType === 'VIDEO' && (
                  <video 
                    src={content.fileUrl} 
                    controls 
                    className="w-full h-auto max-h-[70vh] bg-black"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                  ></video>
                )}
                {content.contentType === 'EMBED_URL' && (
                  <iframe src={content.fileUrl} className="w-full h-[600px] border-0" allowFullScreen></iframe>
                )}
              </div>
            ))}

            {/* MANUAL (Flashcard & Quiz) */}
            {activeMateri.materiType === 'MANUAL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style={{ perspective: '1200px' }}>
                {activeMateri.materialSections?.map((section: any, idx: number) => {
                  const flipped = flippedCards[idx] || false;
                  const isLocked = idx > unlockedIdx;
                  return (
                    <div key={idx} className="w-full relative min-h-[350px]">
                      {/* Front Card */}
                      {!flipped && (
                        <div 
                          onClick={() => {
                            if (!isLocked) {
                              setFlippedCards({...flippedCards, [idx]: true});
                              if (idx === unlockedIdx) setUnlockedIdx(idx + 1);
                            }
                          }}
                          className={`absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-10 bg-gradient-to-br from-[#1A237E] to-blue-900 text-white ${isLocked ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl transition-transform'}`}
                        >
                          {isLocked && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                              <i className="bi bi-lock-fill text-4xl text-[#FFC107] mb-3"></i>
                              <span className="bg-[#1A237E] text-white px-4 py-2 rounded-full font-bold text-sm">Buka kartu sebelumnya</span>
                            </div>
                          )}
                          <div className="relative z-10 text-center w-full flex flex-col items-center justify-center">
                            <span className="inline-block bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4">KARTU {idx + 1}</span>
                            <h2 className="text-2xl font-black">{section.subTitle || `Sub-Bab ${idx + 1}`}</h2>
                            {!isLocked && (
                              <button className="mt-8 flex items-center gap-2 text-[#FFC107] text-sm font-bold animate-bounce">
                                <i className="bi bi-hand-index"></i> Klik untuk Balik
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Back Card */}
                      {flipped && (
                        <div className="w-full h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                          <div className="bg-[#1A237E] text-white px-6 py-4 flex justify-between items-center border-b-4 border-orange-500">
                            <div className="flex items-center gap-3">
                              <button onClick={() => setFlippedCards({...flippedCards, [idx]: false})} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
                                <i className="bi bi-x-lg"></i>
                              </button>
                              <h2 className="font-bold">{section.subTitle || `Sub-Bab ${idx + 1}`}</h2>
                            </div>
                            <button onClick={() => speakSection(idx)} className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded-full text-xs font-black">
                              {speakingIdx === idx ? 'Stop TTS' : 'TTS'}
                            </button>
                          </div>
                          <div className="p-6 overflow-y-auto flex-1 text-slate-700 text-sm md:text-base font-medium whitespace-pre-wrap" dangerouslySetInnerHTML={{__html: section.content}}></div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Quiz Section for MANUAL */}
                {activeMateri.questions && activeMateri.questions.length > 0 && unlockedIdx >= (activeMateri.materialSections?.length || 0) && (
                  <div className="col-span-full mt-12 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                    <div className="bg-[#1A237E] text-white px-6 py-4 text-center font-black uppercase tracking-widest text-sm">
                       🎯 Kuis Evaluasi
                    </div>
                    <div className="p-8 text-center">
                      {currentQuestionIndex < activeMateri.questions.length ? (
                        <>
                          <div className="inline-block bg-slate-100 text-[#1A237E] px-4 py-1 rounded-full text-xs font-black mb-4">PERTANYAAN {currentQuestionIndex + 1} / {activeMateri.questions.length}</div>
                          <h3 className="text-xl font-bold text-[#1A237E] mb-8">{activeMateri.questions[currentQuestionIndex].question}</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {['A','B','C','D'].map(opt => (
                              <button key={opt} onClick={() => checkAnswerQuiz(opt)}
                                disabled={showExplanation}
                                className={`p-4 rounded-xl text-left font-bold transition-all flex items-center gap-3 border-2 ${
                                  selectedAnswer === opt && !showExplanation ? 'border-orange-400 bg-orange-50 text-orange-700' :
                                  showExplanation && opt === activeMateri.questions[currentQuestionIndex].correctAnswer ? 'border-green-500 bg-green-50 text-green-700' :
                                  showExplanation && selectedAnswer === opt && opt !== activeMateri.questions[currentQuestionIndex].correctAnswer ? 'border-red-500 bg-red-50 text-red-700' :
                                  'border-slate-100 bg-white hover:border-slate-200 text-[#1A237E]'
                                }`}>
                                <span className="h-8 w-8 rounded-lg flex items-center justify-center font-black bg-slate-100 shrink-0">{opt}</span>
                                <span>{activeMateri.questions[currentQuestionIndex][`option${opt}`]}</span>
                              </button>
                            ))}
                          </div>
                          
                          {showExplanation && (
                            <div className={`mt-6 p-4 rounded-xl text-left border ${isCorrect ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                              <p className="font-bold mb-1">{isCorrect ? 'Benar!' : 'Belum Tepat!'}</p>
                              <p className="text-sm italic">{activeMateri.questions[currentQuestionIndex].explanation}</p>
                            </div>
                          )}
                          
                          {showExplanation && (
                            <div className="mt-6">
                              <button onClick={nextQuestion} className="bg-[#1A237E] text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-900 transition-colors">
                                {currentQuestionIndex < activeMateri.questions.length - 1 ? 'Berikutnya' : 'Selesai'}
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-green-600 font-bold text-lg">
                          🎉 Kuis Selesai! Gulir ke bawah untuk menyelesaikan materi.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="h-20 flex items-center justify-center border-t border-slate-200 mt-10 opacity-50">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Akhir Dokumen</span>
            </div>
            
          </div>
        </div>
        
      </div>
    </div>
  );
};
