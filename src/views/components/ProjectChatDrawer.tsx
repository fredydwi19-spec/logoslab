export const ProjectChatDrawer = () => {
  return `
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('projectChatDrawer', () => ({
          isOpen: false,
          projectId: null,
          chats: [],
          newMessage: '',
          contextType: 'GENERAL',
          contextTargetId: null,
          targetName: 'Semua Chat',
          userRole: '',
          isLoading: false,

          async openDrawer(projectId, contextType = 'GENERAL', contextTargetId = null, targetName = 'Semua Chat', userRole = '') {
            this.projectId = projectId;
            this.contextType = contextType;
            this.contextTargetId = contextTargetId;
            this.targetName = targetName;
            this.userRole = userRole;
            this.isOpen = true;
            this.chats = [];
            await this.loadChats();
          },

          closeDrawer() {
            this.isOpen = false;
          },

          async loadChats() {
            this.isLoading = true;
            try {
              let url = \`/api/projects/\${this.projectId}/chats?contextType=\${this.contextType}\`;
              if (this.contextTargetId) url += \`&contextTargetId=\${this.contextTargetId}\`;
              const res = await fetch(url);
              if (res.ok) {
                this.chats = await res.json();
                this.scrollToBottom();
              }
            } catch (err) {
              console.error(err);
            }
            this.isLoading = false;
          },

          async sendMessage() {
            if (!this.newMessage.trim()) return;
            const message = this.newMessage;
            this.newMessage = '';
            
            // Add optimistic chat
            this.chats.push({
               id: Date.now(),
               message: message,
               senderName: 'Anda',
               senderRole: this.userRole,
               createdAt: new Date().toISOString(),
               isActionable: false,
               isResolved: false
            });
            this.scrollToBottom();

            try {
              const res = await fetch(\`/api/projects/\${this.projectId}/chats\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  message: message,
                  contextType: this.contextType,
                  contextTargetId: this.contextTargetId
                })
              });
              if (res.ok) {
                 await this.loadChats();
              }
            } catch (err) {
              console.error(err);
            }
          },

          async convertToTask(chatId) {
            try {
              const res = await fetch(\`/api/chats/\${chatId}/convert-to-task\`, { method: 'PATCH' });
              if (res.ok) {
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) chat.isActionable = true;
              }
            } catch (err) { console.error(err); }
          },

          async toggleResolve(chatId, currentStatus) {
            try {
              const res = await fetch(\`/api/chats/\${chatId}/toggle-resolve\`, { 
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isResolved: !currentStatus }) 
              });
              if (res.ok) {
                const chat = this.chats.find(c => c.id === chatId);
                if (chat) chat.isResolved = !currentStatus;
              }
            } catch (err) { console.error(err); }
          },

          scrollToBottom() {
             setTimeout(() => {
                const container = this.$refs.chatContainer;
                if (container) container.scrollTop = container.scrollHeight;
             }, 100);
          }
        }));
      });
    </script>
    <div x-data="projectChatDrawer()" @open-chat-drawer.window="openDrawer($event.detail.projectId, $event.detail.contextType, $event.detail.contextTargetId, $event.detail.targetName, $event.detail.userRole)">
      <!-- Slide Over Background -->
      <div x-show="isOpen" style="display: none;" class="fixed inset-0 bg-black/50 z-50 transition-opacity" @click="closeDrawer()"></div>
      
      <!-- Drawer Panel -->
      <div class="fixed inset-y-0 right-0 z-[60] w-full max-w-md bg-slate-50 shadow-2xl transform transition-transform duration-300 flex flex-col"
           :class="isOpen ? 'translate-x-0' : 'translate-x-full'">
           
           <!-- Header -->
           <div class="bg-[#1A237E] p-4 flex justify-between items-center text-white border-b-4 border-[#FFC107]">
              <div>
                 <h2 class="font-black tracking-widest uppercase text-sm">Diskusi Proyek</h2>
                 <p class="text-xs text-yellow-200" x-text="targetName"></p>
              </div>
              <button @click="closeDrawer()" class="text-white hover:text-red-300 font-bold text-xl">&times;</button>
           </div>
           
           <!-- Actionable Tasks Tab -->
           <div class="bg-white border-b border-slate-200 p-3 max-h-40 overflow-y-auto">
              <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Checklist Revisi (Actionable)</h3>
              <template x-for="chat in chats.filter(c => c.isActionable)" :key="chat.id">
                 <div class="flex items-start gap-2 mb-2 p-2 rounded bg-yellow-50 border border-yellow-200">
                    <input type="checkbox" :checked="chat.isResolved" @change="toggleResolve(chat.id, chat.isResolved)" class="mt-1 shrink-0 accent-[#FF5722]">
                    <div class="flex-1 text-xs text-slate-700" :class="chat.isResolved ? 'line-through text-slate-400' : ''" x-text="chat.message"></div>
                 </div>
              </template>
              <template x-if="chats.filter(c => c.isActionable).length === 0">
                 <div class="text-xs text-slate-400 italic">Belum ada catatan revisi.</div>
              </template>
           </div>

           <!-- Chat Messages -->
           <div class="flex-1 p-4 overflow-y-auto space-y-4" x-ref="chatContainer">
              <template x-if="isLoading">
                 <div class="text-center text-slate-400 text-sm">Memuat percakapan...</div>
              </template>
              <template x-for="chat in chats" :key="chat.id">
                 <div class="flex flex-col gap-1" :class="chat.senderRole === userRole ? 'items-end' : 'items-start'">
                    <!-- Badge / Sender Name -->
                    <div class="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" :class="chat.senderRole === 'PAKAR' || chat.senderName === 'Logos AI' ? 'text-orange-600' : 'text-slate-500'">
                       <template x-if="chat.senderName === 'Logos AI'">
                          <span class="bg-purple-600 text-white px-1.5 py-0.5 rounded text-[8px]">LOGOS AI</span>
                       </template>
                       <span x-text="chat.senderName + (chat.senderName !== 'Anda' && chat.senderName !== 'Logos AI' ? ' (' + chat.senderRole.replace('_', ' ') + ')' : '')"></span>
                    </div>
                    
                    <!-- Chat Bubble -->
                    <div class="p-3 rounded-2xl max-w-[85%] text-sm shadow-sm"
                         :class="chat.senderRole === userRole ? 'bg-[#1A237E] text-white rounded-br-sm' : (chat.senderName === 'Logos AI' ? 'bg-purple-50 text-purple-900 border border-purple-200 rounded-bl-sm' : 'bg-white text-slate-700 border border-slate-200 rounded-bl-sm')">
                       <p x-text="chat.message" style="white-space: pre-wrap;"></p>
                    </div>
                    
                    <!-- Action Button -->
                    <template x-if="(userRole === 'PAKAR' || userRole === 'KETUA_TIM') && !chat.isActionable && chat.senderName !== 'Logos AI'">
                       <button @click="convertToTask(chat.id)" class="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline mt-0.5">Jadikan Catatan Revisi</button>
                    </template>
                 </div>
              </template>
           </div>

           <!-- Input Area -->
           <div class="p-3 bg-white border-t border-slate-200">
              <form @submit.prevent="sendMessage()" class="flex flex-col gap-2">
                 <div class="text-[10px] text-slate-400 italic mb-1">💡 Hint: Ketik <span class="font-bold text-purple-600">@LogosAI</span> di awal pesan untuk bantuan AI.</div>
                 <div class="flex gap-2">
                    <input type="text" x-model="newMessage" placeholder="Ketik pesan..." class="flex-1 border-2 border-slate-200 rounded-lg py-2 px-3 text-sm outline-none focus:border-[#1A237E]" />
                    <button type="submit" class="bg-[#FF5722] text-white p-2 rounded-lg font-bold shadow-md hover:bg-[#E64A19] disabled:opacity-50" :disabled="!newMessage.trim() || isLoading">
                       <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                 </div>
              </form>
           </div>
      </div>
    </div>
  `;
};
