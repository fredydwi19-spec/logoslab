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
              <span x-text="${projectVar}?.materiType === 'VIDEO' ? '🎬 MATERI VIDEO' : '📄 MATERI TEKS'"></span>
            </div>
            <h2 class="text-xl md:text-2xl font-bold" x-text="${projectVar}?.title"></h2>
          </div>
        </div>
        
        <!-- Timer/Progress -->
        <div class="flex items-center gap-4">
          <!-- Text to Speech Button -->
          <div x-show="${projectVar}?.materiType === 'TEKS'" class="flex items-center gap-2">
            <button 
              @click="toggleSpeech()"
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

      <!-- Progress Bar (Teks) -->
      <div x-show="${projectVar}?.materiType === 'TEKS'" class="w-full h-1 bg-slate-200 z-20 shrink-0">
        <div class="h-full bg-[#FF5722] transition-all" :style="\`width: \${scrollPercentage}%\`"></div>
      </div>

      <!-- Viewer Content Area -->
      <div class="flex-1 overflow-y-auto bg-slate-100 relative" id="materi-scroll-container" @scroll.passive="handleScroll">

        <div class="max-w-5xl mx-auto py-10 px-4 md:px-8 space-y-10 flex flex-col items-center">
          
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
          
          <!-- Intersection Target for Text Content -->
          <div x-show="${projectVar}?.materiType === 'TEKS'" id="materi-end-target" class="h-10 w-full flex items-center justify-center opacity-50">
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
