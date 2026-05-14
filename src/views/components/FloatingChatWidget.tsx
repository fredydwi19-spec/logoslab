export const FloatingChatWidget = ({ role, currentPage }: { role: string; currentPage: string }): string => {
  // Sanitize currentPage for safe injection into JS string
  const safePage = currentPage.replace(/'/g, "\\'").replace(/\n/g, " ");

  return `
    <!-- ===== LOGOS AI ASSISTANT FLOATING WIDGET ===== -->
    <div
      id="logosAIWidget"
      x-data="logosAIChat()"
      x-init="init()"
      class="fixed bottom-8 right-8 z-[200] flex flex-col items-end"
      style="pointer-events: none;"
    >
      <!-- ── Expanded Chat Panel ─────────────────────────────────────── -->
      <div
        x-show="isOpen"
        style="display: none; pointer-events: auto;"
        x-transition:enter="transition ease-out duration-300"
        x-transition:enter-start="opacity-0 translate-y-4 scale-95"
        x-transition:enter-end="opacity-100 translate-y-0 scale-100"
        x-transition:leave="transition ease-in duration-200"
        x-transition:leave-start="opacity-100 translate-y-0 scale-100"
        x-transition:leave-end="opacity-0 translate-y-4 scale-95"
        class="mb-4 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
        style="box-shadow: 0 25px 60px rgba(26,35,126,0.25);"
      >
        <!-- Header -->
        <div class="bg-[#1A237E] px-5 py-4 flex items-center justify-between border-b-4 border-[#FFC107] shrink-0">
          <div class="flex items-center gap-3">
            <img src="/public/assets/logo-logoslab.png" alt="Logos LAB" class="h-8 w-auto bg-white rounded-lg p-1 shadow-sm" onerror="this.style.display='none'"/>
            <div>
              <div class="text-white font-black text-sm uppercase tracking-widest leading-none">Logos AI</div>
              <div class="text-[#FFC107] text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">Assistant</div>
            </div>
          </div>
          <button
            @click="isOpen = false"
            class="text-white/50 hover:text-white text-2xl font-black transition-colors leading-none"
            aria-label="Tutup chat"
          >&times;</button>
        </div>

        <!-- Context Badge -->
        <div class="bg-[#1A237E]/5 border-b border-slate-100 px-5 py-2 shrink-0">
          <span class="text-[10px] text-[#1A237E] font-black uppercase tracking-widest opacity-60">📍</span>
          <span class="text-[10px] text-[#1A237E] font-bold ml-1" x-text="currentPage"></span>
        </div>

        <!-- Message Area -->
        <div
          id="logosAIChatMessages"
          class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]"
          x-ref="messageContainer"
        >
          <!-- Welcome message -->
          <template x-if="messages.length === 0">
            <div class="flex items-start gap-3">
              <div class="h-8 w-8 rounded-full bg-[#1A237E] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">AI</div>
              <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%] shadow-sm">
                <p class="text-[#1A237E] text-sm font-medium">Halo! Saya Logos AI Assistant 👋</p>
                <p class="text-slate-500 text-xs mt-1">Saya siap membantu Anda di halaman <strong x-text="currentPage"></strong>. Apa yang ingin Anda tanyakan?</p>
              </div>
            </div>
          </template>

          <!-- Chat Messages -->
          <template x-for="(msg, idx) in messages" :key="msg.id">
            <div>
              <!-- User Bubble -->
              <template x-if="msg.role === 'user'">
                <div class="flex justify-end">
                  <div class="bg-[#1A237E] text-white rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%] shadow-md">
                    <p class="text-sm font-medium" x-text="msg.text"></p>
                  </div>
                </div>
              </template>

              <!-- AI Bubble -->
              <template x-if="msg.role === 'ai'">
                <div class="flex items-start gap-3">
                  <div class="h-8 w-8 rounded-full bg-[#1A237E] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">AI</div>
                  <div class="flex flex-col gap-1 max-w-[80%]">
                    <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                      <p class="text-[#1A237E] text-sm font-medium leading-relaxed" x-text="msg.text"></p>
                    </div>
                    <!-- Feedback Row: "Was this helpful?" -->
                    <div class="flex items-center gap-2 px-1" x-show="msg.feedback === null || msg.feedback !== null">
                      <span class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Membantu?</span>
                      <button
                        @click="giveFeedback(msg.id, 'up')"
                        :disabled="msg.feedback !== null"
                        :class="msg.feedback === 'up' ? 'text-[#FFC107] scale-110' : 'text-slate-300 hover:text-[#FFC107]'"
                        class="transition-all transform text-base disabled:cursor-default"
                        :title="msg.feedback === 'up' ? 'Terima kasih!' : 'Ya, membantu'"
                      >👍</button>
                      <button
                        @click="giveFeedback(msg.id, 'down')"
                        :disabled="msg.feedback !== null"
                        :class="msg.feedback === 'down' ? 'text-[#FF5722] scale-110' : 'text-slate-300 hover:text-[#FF5722]'"
                        class="transition-all transform text-base disabled:cursor-default"
                        :title="msg.feedback === 'down' ? 'Kami akan meningkatkan AI.' : 'Tidak membantu'"
                      >👎</button>
                      <span x-show="msg.feedback === 'up'" class="text-[9px] text-[#FFC107] font-bold">Terima kasih! 🙏</span>
                      <span x-show="msg.feedback === 'down'" class="text-[9px] text-[#FF5722] font-bold">Feedback dicatat.</span>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </template>

          <!-- Loading / Typing Indicator -->
          <div x-show="isLoading" style="display:none;" class="flex items-start gap-3">
            <div class="h-8 w-8 rounded-full bg-[#1A237E] flex items-center justify-center text-white text-xs font-black shrink-0 shadow-md">AI</div>
            <div class="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div class="flex gap-1 items-center h-4">
                <span class="h-2 w-2 bg-[#1A237E] rounded-full animate-bounce" style="animation-delay: 0ms;"></span>
                <span class="h-2 w-2 bg-[#1A237E] rounded-full animate-bounce" style="animation-delay: 150ms;"></span>
                <span class="h-2 w-2 bg-[#1A237E] rounded-full animate-bounce" style="animation-delay: 300ms;"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-4 bg-white border-t border-slate-100 shrink-0">
          <div class="flex gap-2 items-end bg-slate-50 rounded-2xl border-2 border-slate-200 focus-within:border-[#1A237E] transition-colors p-2">
            <textarea
              x-model="inputText"
              @keydown.enter.prevent="if (!$event.shiftKey) sendMessage()"
              placeholder="Tanya sesuatu... (Enter untuk kirim)"
              rows="1"
              maxlength="1000"
              class="flex-1 bg-transparent outline-none resize-none text-sm text-slate-700 font-medium placeholder-slate-400 px-2 py-1 max-h-24 leading-relaxed"
              style="scrollbar-width: thin;"
            ></textarea>
            <button
              @click="sendMessage()"
              :disabled="isLoading || inputText.trim().length === 0"
              class="shrink-0 h-9 w-9 rounded-xl bg-[#FF5722] hover:bg-[#E64A19] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-md"
              title="Kirim pesan"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p class="text-[9px] text-slate-300 font-bold uppercase tracking-widest text-center mt-2">Logos AI — Logos LAB Platform</p>
        </div>
      </div>

      <!-- ── Toggle Button (Collapsed State) ───────────────────────────── -->
      <div style="pointer-events: auto;">
        <!-- Unread badge -->
        <div
          x-show="!isOpen && unreadCount > 0"
          class="absolute -top-2 -right-2 h-5 w-5 bg-[#FFC107] rounded-full flex items-center justify-center z-10 shadow-lg animate-pulse"
          style="display: none;"
        >
          <span class="text-[#1A237E] text-[9px] font-black" x-text="unreadCount"></span>
        </div>
        <button
          @click="toggleWidget()"
          class="h-16 w-16 rounded-full bg-[#FF5722] hover:bg-[#E64A19] text-white shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95"
          style="box-shadow: 0 8px 30px rgba(255,87,34,0.5);"
          :title="isOpen ? 'Tutup AI Assistant' : 'Buka AI Assistant'"
          aria-label="Toggle Logos AI Assistant"
        >
          <!-- Chat icon when closed -->
          <svg x-show="!isOpen" xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <!-- X icon when open -->
          <svg x-show="isOpen" style="display:none;" xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('logosAIChat', () => ({
          isOpen: false,
          isLoading: false,
          inputText: '',
          messages: [],
          unreadCount: 0,
          msgIdCounter: 0,
          currentPage: '${safePage}',

          init() {
            this.loadFromStorage();
          },

          toggleWidget() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
              this.unreadCount = 0;
              // Scroll to bottom after panel opens
              this.$nextTick(() => this.scrollToBottom());
            }
          },

          scrollToBottom() {
            const container = this.$refs.messageContainer;
            if (container) container.scrollTop = container.scrollHeight;
          },

          saveToStorage() {
            try {
              sessionStorage.setItem('logosai_chat', JSON.stringify(this.messages));
            } catch (e) {
              // sessionStorage full or unavailable — fail silently
            }
          },

          loadFromStorage() {
            try {
              const stored = sessionStorage.getItem('logosai_chat');
              if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                  this.messages = parsed;
                  this.msgIdCounter = parsed.length > 0
                    ? Math.max(...parsed.map(m => m.id || 0)) + 1
                    : 0;
                }
              }
            } catch (e) {
              // Corrupted storage — reset
              this.messages = [];
            }
          },

          giveFeedback(messageId, type) {
            const msg = this.messages.find(m => m.id === messageId);
            if (msg && msg.feedback === null) {
              msg.feedback = type;
              this.saveToStorage();
            }
          },

          async sendMessage() {
            const text = this.inputText.trim();
            if (!text || this.isLoading) return;

            // Add user message
            this.messages.push({
              id: this.msgIdCounter++,
              role: 'user',
              text,
              feedback: null
            });
            this.inputText = '';
            this.isLoading = true;
            this.saveToStorage();
            this.$nextTick(() => this.scrollToBottom());

            try {
              const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, context: this.currentPage })
              });

              const data = await res.json();

              const replyText = data.success
                ? data.reply
                : (data.error || 'Terjadi kesalahan. Coba lagi.');

              this.messages.push({
                id: this.msgIdCounter++,
                role: 'ai',
                text: replyText,
                feedback: null
              });

              if (!this.isOpen) this.unreadCount++;

            } catch (err) {
              this.messages.push({
                id: this.msgIdCounter++,
                role: 'ai',
                text: 'Koneksi ke AI gagal. Pastikan server berjalan dan coba lagi.',
                feedback: null
              });
            } finally {
              this.isLoading = false;
              this.saveToStorage();
              this.$nextTick(() => this.scrollToBottom());
            }
          }
        }));
      });
    </script>
    <!-- ===== END LOGOS AI ASSISTANT ===== -->
  `;
};
