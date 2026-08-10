import React from 'react';

export const PakarDashboard = () => {
  return (
    <>
      {/* 
        This component was automatically converted from SSR HTML to JSX.
        Alpine.js logic has been disabled (attributes prefixed with data-x-) 
        to ensure valid JSX compilation. 
      */}
      
    
    
    
    <script>
      document.addEventListener('alpine:init', () => {
        Alpine.data('pakarDashboard', () => ({
          tab: 'REVIEW_PAKAR',
          search: '',
          searchPublished: '',
          viewMode: new URLSearchParams(window.location.search).get('view') === 'all' ? 'all' : 'active',
          activeProject: null,
          questions: [],
          materiContents: [],
          gameData: null,
          feedback: '',
          showPreview: false,
          showElearningReviewer: false,
          showAuditLog: false,
          currentQuestionIndex: 0,
          selectedAnswer: null,
          showExplanation: false,
          isCorrect: false,
          userFTBAnswers: [],
          speakingIdx: null,
          unlockedIdx: 0,
          isReading: false,
          isPaused: false,
          allProjects: JSON.parse(document.getElementById('pakarProjectsData').textContent || '[]'),
          publishedProjects: JSON.parse(document.getElementById('pakarPublishedData').textContent || '[]'),
          allUsers: JSON.parse(document.getElementById('pakarUsersData').textContent || '[]'),

          getUserName(id) {
            const u = this.allUsers.find(u => u.id === id);
            return u ? u.name : '-';
          },


          filteredProjects() {
            return this.allProjects.filter(p => {
              let show = false;
              if (this.tab === 'REVIEW_PAKAR')  show = p.status === 'REVIEW_PAKAR';
              else if (this.tab === 'REVISI_PAKAR') show = p.status === 'REVISI_PAKAR';
              else if (this.tab === 'ACCEPTED')  show = p.status === 'ACCEPTED_PAKAR';
              else if (this.tab === 'KETUA')     show = ['REVIEW_KETUA', 'REVISI_KETUA'].includes(p.status);
              if (this.search && show) {
                show = p.title.toLowerCase().includes(this.search.toLowerCase());
              }
              return show;
            });
          },

          filteredPublishedProjects() {
            return this.publishedProjects.filter(p =>
              !this.searchPublished || p.title.toLowerCase().includes(this.searchPublished.toLowerCase())
            );
          },

          async openProject(id) {
            try {
              const res = await fetch('/api/projects/' + id);
              const json = await res.json();
              if (json.success) {
                this.activeProject = json.data;
                this.questions = json.data.questions || [];
                this.materiContents = json.data.materiContents || [];
                this.feedback = '';
                this.gameData = null;
                this.showAuditLog = false;
                if (this.activeProject.gameType === 'WORD_SEARCH') {
                  const wsRes = await fetch('/api/word-search/' + id);
                  const wsJson = await wsRes.json();
                  if (wsJson.success && wsJson.data) this.gameData = wsJson.data;
                } else if (this.activeProject.gameType === 'CROSSWORD') {
                  const cwRes = await fetch('/api/crossword/' + id);
                  const cwJson = await cwRes.json();
                  if (cwJson.success && cwJson.data) this.gameData = cwJson.data;
                }
              } else {
                alert('Gagal memuat proyek: ' + (json.error || 'Terjadi kesalahan'));
              }
            } catch (err) {
              console.error('openProject error:', err);
              alert('Gagal terhubung ke server.');
            }
          },

          closeProject() {
            this.activeProject = null;
            this.materiContents = [];
            this.showAuditLog = false;
            this.showPreview = false;
            this.showElearningReviewer = false;
            this.feedback = '';
            this.stopSpeech();
          },

          // MANUAL Audio & Tooltips Logic
          speakingIdx: null,
          isReading: false,
          isPaused: false,
          
          stopSpeech() {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            this.isReading = false;
            this.isPaused = false;
            this.speakingIdx = null;
          },

          speakSection(idx) {
            const sections = this.activeProject?.materialSections || [];
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
            const sections = this.activeProject?.materialSections || [];
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
             const glossary = this.activeProject?.materialGlossary || [];
             
             const sorted = [...glossary].sort((a, b) => b.word.length - a.word.length);
             
             sorted.forEach(g => {
                const regex = new RegExp(\`\\\\b(\{/* Interpolated: g.word */})\\\\b\`, 'gi');
                html = html.replace(regex, (match) => {
                  return \`<span className="relative group cursor-help font-bold text-[#FF5722] border-b-2 border-dotted border-[#FF5722] hover:bg-orange-50 transition-colors rounded px-1">\{/* Interpolated: match */}<span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#1A237E] text-white text-xs font-normal p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-50 leading-relaxed pointer-events-none">\{/* Interpolated: g.definition */}</span></span>\
    </>
  );
};
