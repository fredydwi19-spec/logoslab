export const MateriViewer = ({ projectVar = 'activeMateri', contentVar = 'materiContents' }: { projectVar?: string; contentVar?: string } = {}) => {
  return `
    <div x-data="materiViewerData()" x-init="initViewer()" class="h-full flex flex-col">
      <!-- Viewer Header -->
      <div class="bg-[#1A237E] p-6 text-white flex justify-between items-center shadow-md z-10 shrink-0">
        <div class="flex items-center gap-4">
          <!-- Back Button -->
          <a href="/" onclick="if(window.history.length > 1) { window.history.back(); return false; }" class="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors flex items-center justify-center" title="Kembali">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <div class="text-[10px] font-black text-[#FFC107] uppercase tracking-widest mb-1">
              <span x-text="${projectVar}?.materiType === 'VIDEO' ? '🎬 MATERI VIDEO' : (${projectVar}?.materiType === 'MANUAL' ? '📋 MATERI MANUAL' : '📄 MATERI TEKS')"></span>
            </div>
            <h2 class="text-xl md:text-2xl font-bold" x-text="${projectVar}?.title"></h2>
          </div>
        </div>
        
        <!-- Timer/Progress -->
        <div class="flex items-center gap-4">
          <!-- Text to Speech Button (TEKS / MANUAL) -->
          <div x-show="${projectVar}?.materiType === 'TEKS' || ${projectVar}?.materiType === 'MANUAL'" class="flex items-center gap-2">
            <button 
              @click="${projectVar}?.materiType === 'MANUAL' ? speakAllSections() : toggleSpeech()"
              class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold text-xs transition-colors flex items-center gap-2 border border-white/20">
              <template x-if="isExtracting">
                 <span>⏳ Ekstrak Teks...</span>
              </template>
              <template x-if="!isExtracting">
                <div class="flex items-center gap-2">
                  <svg x-show="!isReading || isPaused" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 19h4.586a2 2 0 001.414-.586l4.828-4.828A2 2 0 0016 12.172V7.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 009.172 1H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  <svg x-show="isReading && !isPaused" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span x-text="isReading ? (isPaused ? 'Lanjutkan' : 'Jeda') : 'Bacakan'"></span>
                </div>
              </template>
            </button>
            <button 
              x-show="isReading"
              @click="stopSpeech()"
              class="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors flex items-center justify-center border border-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div class="bg-white/10 rounded-full px-4 py-2 flex items-center gap-2 border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-[#FFC107]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span class="font-mono font-bold text-sm" x-text="formatTime(timeSpentSeconds)">00:00</span>
          </div>
          
          <!-- Claim Button (Shown when requirements met) -->
          <button 
            x-show="canClaim && !isClaimed" 
            @click="claimAchievement()"
            class="bg-[#FF5722] text-white px-6 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-lg hover:bg-[#E64A19] transition-all transform hover:scale-105 flex items-center gap-2 animate-bounce">
            <span>Klaim Reward</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clip-rule="evenodd" /></svg>
          </button>

          <!-- Claimed Badge -->
          <div x-show="isClaimed" class="bg-green-500 text-white px-4 py-2 rounded-full font-black uppercase tracking-widest text-xs shadow-inner flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            Selesai
          </div>
        </div>
      </div>

      <!-- Progress Bar (Teks / Manual) -->
      <div x-show="${projectVar}?.materiType === 'TEKS' || ${projectVar}?.materiType === 'MANUAL'" class="w-full h-1 bg-slate-200 z-20 shrink-0">
        <div class="h-full bg-[#FF5722] transition-all" :style="\`width: \${scrollPercentage}%\`"></div>
      </div>

      <!-- Viewer Content Area -->
      <div class="flex-1 overflow-y-auto bg-slate-100 relative" id="materi-scroll-container" @scroll.passive="handleScroll">

        <div class="max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-10 flex flex-col items-center">
          
          <!-- OLD VIEWER: PDF, IMAGE, VIDEO, EMBED -->
          <div x-show="${projectVar}?.materiType !== 'MANUAL'" class="w-full space-y-10">
            <template x-for="content in ${contentVar}" :key="content.id">
              <div class="w-full bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
                
                <!-- IMAGE -->
                <template x-if="content.contentType === 'IMAGE'">
                  <img :src="content.fileUrl" class="w-full h-auto object-contain" />
                </template>
                
                <!-- PDF / PPT -->
                <template x-if="content.contentType === 'PDF' || content.contentType === 'PPT'">
                  <iframe :src="content.fileUrl" class="w-full h-[80vh] border-0"></iframe>
                </template>
                
                <!-- VIDEO UPLOAD -->
                <template x-if="content.contentType === 'VIDEO'">
                  <video 
                    :src="content.fileUrl" 
                    controls 
                    class="w-full h-auto max-h-[80vh] bg-black materi-video"
                    @timeupdate="handleTimeUpdate"
                    @ended="handleVideoEnded"
                  ></video>
                </template>
                
                <!-- EMBED URL (e.g. YouTube) -->
                <template x-if="content.contentType === 'EMBED_URL'">
                  <iframe :src="content.fileUrl" class="w-full h-[600px] border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </template>

              </div>
            </template>
          </div>

          <!-- NEW VIEWER: MANUAL TEXT BLOCKS + GLOSSARY -->
          <style>
            .flip-out { transform: rotateY(90deg); opacity: 0; }
            .flip-in { transform: rotateY(0deg); opacity: 1; }
            .flip-start { transform: rotateY(-90deg); opacity: 0; }
          </style>
          <div x-show="${projectVar}?.materiType === 'MANUAL'" class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full" style="perspective: 1200px;">
            <template x-for="(section, idx) in ${projectVar}?.materialSections || []" :key="idx">
              <div x-data="{ flipped: false }" class="w-full relative min-h-[350px]">
                
                <!-- Front of Flashcard -->
                <div x-show="!flipped" 
                     x-transition:leave="transition-all duration-300 ease-in"
                     x-transition:leave-start="flip-in"
                     x-transition:leave-end="flip-out"
                     @click="if(idx <= unlockedIdx) { flipped = true; if(idx === unlockedIdx) unlockedIdx++; }"
                     class="absolute inset-0 w-full h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col items-center justify-center p-10 md:p-16 bg-gradient-to-br from-[#1A237E] to-blue-900 text-white"
                     :class="idx > unlockedIdx ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-transform'">
                   <div class="absolute inset-0 bg-[url('/public/assets/pattern-bg.png')] opacity-10"></div>
                   
                   <!-- Locked Overlay -->
                   <div x-show="idx > unlockedIdx" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center z-20 transition-all">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-[#FFC107] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <span class="bg-[#1A237E] text-white px-4 py-2 rounded-full font-bold text-sm shadow-xl border border-[#FFC107]/30">Buka kartu sebelumnya terlebih dahulu</span>
                   </div>

                   <div class="relative z-10 text-center w-full flex flex-col items-center h-full justify-center">
                     <span class="inline-block bg-[#FF5722] text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 shadow-md" x-text="'KARTU MATERI ' + (idx + 1)"></span>
                     <h2 class="text-2xl md:text-4xl font-black text-center tracking-tight leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                     <button x-show="idx <= unlockedIdx" class="mt-8 flex items-center justify-center gap-2 text-[#FFC107] text-sm font-bold animate-bounce bg-white/10 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                       Buka Kartu
                     </button>
                   </div>
                </div>
                
                <!-- Back of Flashcard -->
                <div x-show="flipped" style="display: none;" 
                     x-transition:enter="transition-all duration-300 ease-out delay-300"
                     x-transition:enter-start="flip-start"
                     x-transition:enter-end="flip-in"
                     class="w-full h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
                  <div class="bg-[#1A237E] text-white px-6 py-4 flex justify-between items-center min-h-[140px] border-b-4 border-[#FFC107] gap-4">
                    <div class="flex items-center gap-3 flex-1">
                      <button @click="flipped = false" class="shrink-0 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors" title="Tutup Kartu">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      </button>
                      <h2 class="text-xl md:text-2xl font-bold leading-tight" x-text="section.subTitle || 'Sub-Bab ' + (idx + 1)"></h2>
                    </div>
                    <!-- Speaker Button Per Section -->
                    <button @click="speakSection(idx)" class="shrink-0 bg-[#FF5722] hover:bg-[#E64A19] px-4 py-2 rounded-full transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-md">
                      <template x-if="speakingIdx === idx && !isPaused">
                         <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Jeda</div>
                      </template>
                      <template x-if="speakingIdx === idx && isPaused">
                         <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg> Lanjut</div>
                      </template>
                      <template x-if="speakingIdx !== idx">
                         <div class="flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5 19h4.586a2 2 0 001.414-.586l4.828-4.828A2 2 0 0016 12.172V7.828a2 2 0 00-.586-1.414l-4.828-4.828A2 2 0 009.172 1H5a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> Dengar</div>
                      </template>
                    </button>
                  </div>
                  <div class="p-6 md:p-10 flex-1 text-slate-700 leading-relaxed text-sm md:text-base max-w-2xl mx-auto font-medium" style="white-space: pre-wrap;" x-html="applyTooltips(section.content)"></div>
                </div>
              </div>
            </template>
            
            <!-- Quiz Slot at the end of Manual Material -->
            <div x-show="(${projectVar}?.questions || []).length > 0" class="mt-16 bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
              <div class="bg-indigo-900 text-[#FFC107] px-6 py-4 flex justify-between items-center font-black uppercase tracking-widest text-sm text-center justify-center">
                 🎯 Kuis Evaluasi Materi
              </div>
              <div class="p-6 md:p-10 text-center">
                <div class="inline-block bg-[#1A237E] text-[#FFC107] px-4 py-1 rounded-full text-[10px] font-black mb-4 uppercase tracking-widest" x-text="'PERTANYAAN ' + (currentQuestionIndex + 1) + ' / ' + ${projectVar}?.questions?.length"></div>
                
                <h3 class="text-2xl font-black text-[#1A237E] mb-8 leading-relaxed" x-text="(${projectVar}?.questions || [])[currentQuestionIndex]?.question"></h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <template x-for="opt in ['A','B','C','D']">
                    <button @click="checkAnswerQuiz(opt)"
                      :class="{
                        'border-yellow-400 bg-yellow-50': selectedAnswer === opt && !showExplanation,
                        'border-green-500 bg-green-50': showExplanation && opt === (${projectVar}?.questions || [])[currentQuestionIndex]?.correctAnswer,
                        'border-red-500 bg-red-50': showExplanation && selectedAnswer === opt && opt !== (${projectVar}?.questions || [])[currentQuestionIndex]?.correctAnswer,
                        'border-slate-100 bg-white hover:border-yellow-300': !showExplanation && selectedAnswer !== opt
                      }"
                      class="border-4 p-5 rounded-2xl text-[#1A237E] font-black transition-all text-left flex items-center gap-3"
                      :disabled="showExplanation">
                      <span class="h-8 w-8 rounded-lg flex items-center justify-center font-black bg-slate-100 shrink-0" x-text="opt"></span>
                      <span x-text="(${projectVar}?.questions || [])[currentQuestionIndex]?.[ 'option' + opt ]"></span>
                    </button>
                  </template>
                </div>

                <div x-show="showExplanation" class="mt-6 p-5 rounded-2xl border-2 border-dashed text-left" :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                  <p class="font-black text-sm uppercase" :class="isCorrect ? 'text-green-700' : 'text-red-700'" x-text="isCorrect ? 'Benar!' : 'Belum Tepat!'"></p>
                  <p class="text-sm text-slate-600 mt-1 italic" x-text="(${projectVar}?.questions || [])[currentQuestionIndex]?.explanation"></p>
                </div>
                
                <div class="flex gap-4 mt-6 justify-center">
                  <button @click="nextQuestion()" x-show="showExplanation && currentQuestionIndex < (${projectVar}?.questions || []).length - 1" class="bg-[#1A237E] text-white px-6 py-2 rounded-xl font-black">Berikutnya →</button>
                  <div x-show="showExplanation && currentQuestionIndex === (${projectVar}?.questions || []).length - 1" class="text-green-600 font-black flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Kuis Selesai! Gulir ke bawah untuk Klaim Reward.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Intersection Target for Text Content -->
          <div x-show="${projectVar}?.materiType === 'TEKS' || ${projectVar}?.materiType === 'MANUAL'" id="materi-end-target" class="h-10 w-full flex items-center justify-center opacity-50">
            <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Akhir Dokumen</span>
          </div>

        </div>
      </div>
      
      <!-- Confetti Canvas -->
      <canvas id="confetti-canvas" class="fixed inset-0 pointer-events-none z-[999]" style="display:none;"></canvas>
    </div>
  `;
};

export const MateriViewerScript = ({ contentVar = 'materiContents' }: { contentVar?: string } = {}) => {
  return `
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
    <script>
      if(window['pdfjs-dist/build/pdf']) {
        window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
      }

      window.materiViewerData = function() {
        return {
          activeMateri: window.activeMateri || null,
          timeSpentSeconds: 0,
          scrollPercentage: 0,
          videoWatchedPercentage: 0,
          canClaim: false,
          isClaimed: false,
          timerInterval: null,
          syncInterval: null,
          lastVideoTime: 0,
          
          isReading: false,
          isPaused: false,
          utterance: null,
          extractedText: "",
          isExtracting: false,
          
          // MANUAL Type variables
          primed: false,
          speakingIdx: null,
          unlockedIdx: 0,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,

          initViewer() {
            // Start timer
            this.timerInterval = setInterval(() => {
              this.timeSpentSeconds++;
              this.checkEligibility();
            }, 1000);

            // Setup intersection observer for text content
            setTimeout(() => {
              const target = document.getElementById('materi-end-target');
              if (target) {
                const observer = new IntersectionObserver((entries) => {
                  if (entries[0].isIntersecting) {
                    this.scrollPercentage = 100;
                    this.checkEligibility();
                  }
                }, { threshold: 0.8 });
                observer.observe(target);
              }
            }, 1000);

            // Sync progress to server every 10 seconds
            this.syncInterval = setInterval(() => {
              this.syncProgress();
            }, 10000);
            
            // Load initial progress
            this.loadProgress();
          },

          handleScroll(e) {
            const container = e.target;
            const scrollTotal = container.scrollHeight - container.clientHeight;
            if (scrollTotal > 0) {
              const currentScroll = Math.max(this.scrollPercentage, Math.floor((container.scrollTop / scrollTotal) * 100));
              this.scrollPercentage = currentScroll;
              this.checkEligibility();
            }
          },

          handleTimeUpdate(e) {
            const video = e.target;
            if (video.duration) {
              // Prevent skipping hacking (if user jumps > 10 seconds forward)
              if (video.currentTime - this.lastVideoTime > 10) {
                video.currentTime = this.lastVideoTime; // rollback
                return;
              }
              
              this.lastVideoTime = video.currentTime;
              const currentPct = Math.floor((video.currentTime / video.duration) * 100);
              // Only increase
              if (currentPct > this.videoWatchedPercentage) {
                this.videoWatchedPercentage = currentPct;
                this.checkEligibility();
              }
            }
          },

          handleVideoEnded() {
            this.videoWatchedPercentage = 100;
            this.checkEligibility();
          },

          checkEligibility() {
            if (this.isClaimed) return;
            
            // Assuming we can access activeMateri from parent scope, else default to TEKS logic
            const isVideo = this.activeMateri?.materiType === 'VIDEO';
            
            if (isVideo) {
              if (this.videoWatchedPercentage >= 90) {
                this.canClaim = true;
              }
            } else {
              // Teks logic: 2 minutes minimum + scrolled to bottom
              if (this.timeSpentSeconds >= 120 && this.scrollPercentage >= 95) {
                this.canClaim = true;
              }
            }
          },

          formatTime(seconds) {
            const m = Math.floor(seconds / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            return \`\${m}:\${s}\`;
          },
          
          async toggleSpeech() {
            if (this.isExtracting) return;
            
            if (!this.primed) {
                // Prime the speech engine synchronously with the click event
                const prime = new SpeechSynthesisUtterance("");
                prime.volume = 0;
                window.speechSynthesis.speak(prime);
                window.speechSynthesis.cancel();
                this.primed = true;
            }

            if (this.isReading) {
              if (this.isPaused) {
                window.speechSynthesis.resume();
                this.isPaused = false;
              } else {
                window.speechSynthesis.pause();
                this.isPaused = true;
              }
              return;
            }
            
            if (this.extractedText) {
              this.playText(this.extractedText);
              return;
            }

            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            if (!pdfjsLib) {
               alert("Sistem pembaca PDF belum dimuat. Coba beberapa saat lagi.");
               return;
            }

            this.isExtracting = true;
            let fullText = "";
            
            const contents = ${contentVar} || [];
            
            for (const content of contents) {
              if (content.contentType === 'PDF') {
                try {
                  let pdfData = content.fileUrl;
                  let docInitParams = { url: pdfData };

                  if (pdfData.startsWith('data:application/pdf;base64,')) {
                    const base64 = pdfData.replace('data:application/pdf;base64,', '');
                    const binary = atob(base64);
                    const len = binary.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                      bytes[i] = binary.charCodeAt(i);
                    }
                    docInitParams = { data: bytes };
                  }

                  const pdf = await pdfjsLib.getDocument(docInitParams).promise;
                  for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + ' ';
                  }
                } catch(e) {
                  console.error('Failed to read PDF:', e);
                }
              }
            }
            
            this.isExtracting = false;
            
            if (fullText.trim().length > 0) {
              this.extractedText = fullText;
              this.playText(fullText);
            } else {
              alert("Maaf, tidak ada teks yang dapat dibaca di dalam file PDF tersebut.");
            }
          },
          
          playText(text) {
            console.log("Extracted Text Length:", text.length);
            
            // Clean up text
            let cleanText = text.replace(/\\s+/g, ' ').trim();
            if (!cleanText) return;

            // Robust chunking: split into chunks of max 150 characters to prevent API silent failure
            const chunks = [];
            let currentStr = cleanText;
            while(currentStr.length > 0) {
              if (currentStr.length <= 150) {
                chunks.push(currentStr);
                break;
              }
              let splitIndex = currentStr.lastIndexOf(' ', 150);
              if (splitIndex === -1) splitIndex = 150;
              chunks.push(currentStr.substring(0, splitIndex));
              currentStr = currentStr.substring(splitIndex).trim();
            }
            
            this.isReading = true;
            this.isPaused = false;
            
            let currentIndex = 0;
            
            // Cancel any ongoing speech first
            window.speechSynthesis.cancel();
            
            const speakNext = () => {
              if (!this.isReading) return;
              
              if (currentIndex >= chunks.length) {
                this.isReading = false;
                this.isPaused = false;
                return;
              }
              
              const utterance = new SpeechSynthesisUtterance(chunks[currentIndex].trim());
              utterance.lang = 'id-ID';
              
              utterance.onend = () => {
                currentIndex++;
                speakNext();
              };
              
              utterance.onerror = (e) => {
                console.error("SpeechSynthesis Error:", e);
                currentIndex++;
                speakNext();
              };
              
              window.speechSynthesis.speak(utterance);
            };
            
            speakNext();
          },
          
          stopSpeech() {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            this.isReading = false;
            this.isPaused = false;
            this.speakingIdx = null;
          },

          // MANUAL TTS Logic
          speakSection(idx) {
            const sections = this.activeMateri?.materialSections || [];
            const section = sections[idx];
            if (!section) return;

            if (this.speakingIdx === idx) {
              if (this.isPaused) {
                window.speechSynthesis.resume();
                this.isPaused = false;
              } else {
                window.speechSynthesis.pause();
                this.isPaused = true;
              }
              return;
            }

            // Stop any ongoing speech
            window.speechSynthesis.cancel();
            
            const plainText = section.content.replace(/<[^>]*>/g, '');
            this.speakingIdx = idx;
            this.isReading = true;
            this.isPaused = false;

            const utterance = new SpeechSynthesisUtterance(plainText);
            utterance.lang = 'id-ID';
            utterance.onend = () => {
              this.speakingIdx = null;
              this.isReading = false;
              this.isPaused = false;
            };
            window.speechSynthesis.speak(utterance);
          },

          speakAllSections() {
            const sections = this.activeMateri?.materialSections || [];
            if (sections.length === 0) return;
            
            if (this.isReading) {
               this.stopSpeech();
               return;
            }

            let currentIndex = 0;
            this.isReading = true;
            this.isPaused = false;
            window.speechSynthesis.cancel();

            const speakNext = () => {
              if (currentIndex >= sections.length || !this.isReading) {
                this.stopSpeech();
                return;
              }
              
              this.speakingIdx = currentIndex;
              const plainText = sections[currentIndex].content.replace(/<[^>]*>/g, '');
              const utterance = new SpeechSynthesisUtterance(plainText);
              utterance.lang = 'id-ID';
              
              utterance.onend = () => {
                currentIndex++;
                speakNext();
              };
              
              window.speechSynthesis.speak(utterance);
            };

            speakNext();
          },

          applyTooltips(text) {
             if (!text) return "";
             let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
             const glossary = this.activeMateri?.materialGlossary || [];
             
             // Sort by length descending to prevent partial match issues
             const sorted = [...glossary].sort((a, b) => b.word.length - a.word.length);
             
             sorted.forEach(g => {
                // simple case-insensitive regex for whole word
                const regex = new RegExp(\`\\\\b(\${g.word})\\\\b\`, 'gi');
                html = html.replace(regex, (match) => {
                  return \`<span class="relative group cursor-help font-bold text-[#FF5722] border-b-2 border-dotted border-[#FF5722] hover:bg-orange-50 transition-colors rounded px-1">\${match}<span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A237E] text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 leading-relaxed pointer-events-none">\${g.definition}</span></span>\`;
                });
             });
             return html;
          },
          
          checkAnswerQuiz(opt) {
            if (this.showExplanation) return;
            this.selectedAnswer = opt;
            const q = (this.activeMateri?.questions || [])[this.currentQuestionIndex];
            this.isCorrect = opt === q.correctAnswer;
            this.showExplanation = true;
          },

          nextQuestion() {
            this.currentQuestionIndex++;
            this.selectedAnswer = null;
            this.showExplanation = false;
            this.isCorrect = false;
          },
          
          async loadProgress() {
            if (!this.activeMateri) return;
            try {
              const res = await fetch(\`/api/materi/\${this.activeMateri.id}/progress\`);
              const json = await res.json();
              if (json.success && json.data) {
                this.timeSpentSeconds = Math.max(this.timeSpentSeconds, json.data.timeSpentSeconds || 0);
                this.scrollPercentage = Math.max(this.scrollPercentage, json.data.scrollPercentage || 0);
                this.videoWatchedPercentage = Math.max(this.videoWatchedPercentage, json.data.videoWatchedPercentage || 0);
                this.isClaimed = json.data.isCompleted || false;
              }
            } catch(e) { console.error('Error loading progress:', e); }
          },

          async syncProgress() {
            if (!this.activeMateri || this.isClaimed) return;
            try {
              await fetch(\`/api/materi/\${this.activeMateri.id}/progress\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  scrollPercentage: this.scrollPercentage,
                  timeSpentSeconds: this.timeSpentSeconds,
                  videoWatchedPercentage: this.videoWatchedPercentage
                })
              });
            } catch(e) { console.error('Error syncing progress:', e); }
          },

          async claimAchievement() {
            if (!this.activeMateri || this.isClaimed) return;
            try {
              const res = await fetch(\`/api/materi/\${this.activeMateri.id}/claim-achievement\`, {
                method: 'POST'
              });
              const json = await res.json();
              
              if (json.success) {
                this.isClaimed = true;
                this.canClaim = false;
                this.fireConfetti();
                alert('Selamat! Anda mendapatkan achievement untuk materi ini!');
              } else {
                alert(json.error || 'Gagal mengklaim achievement');
              }
            } catch(e) {
              console.error('Error claiming achievement:', e);
              alert('Terjadi kesalahan jaringan.');
            }
          },

          fireConfetti() {
            if (typeof confetti === 'function') {
              const canvas = document.getElementById('confetti-canvas');
              if (canvas) canvas.style.display = 'block';
              
              var duration = 3000;
              var end = Date.now() + duration;

              (function frame() {
                confetti({
                  particleCount: 5,
                  angle: 60,
                  spread: 55,
                  origin: { x: 0 },
                  colors: ['#FFC107', '#1A237E', '#FF5722']
                });
                confetti({
                  particleCount: 5,
                  angle: 120,
                  spread: 55,
                  origin: { x: 1 },
                  colors: ['#FFC107', '#1A237E', '#FF5722']
                });

                if (Date.now() < end) {
                  requestAnimationFrame(frame);
                } else {
                  if(canvas) canvas.style.display = 'none';
                }
              }());
            }
          },
          
          // Cleanup when component is destroyed
          destroy() {
            if(this.timerInterval) clearInterval(this.timerInterval);
            if(this.syncInterval) clearInterval(this.syncInterval);
            this.stopSpeech();
          }
        };
      };
    </script>
  `;
};
