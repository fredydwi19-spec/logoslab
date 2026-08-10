interface Question {
  difficulty: 'RENDAH' | 'SEDANG' | 'SULIT' | 'BONUS';
  correctAnswer: string;
}

interface GameData {
  activeGame: any | null;
  questions: Question[];
  isPlaying: boolean;
  currentIndex: number;
  selectedAnswer: string | null;
  showFeedback: boolean;
  currentScore: number;
  maxScore: number;
  correctCount: number;
  wrongCount: number;
  gameFinished: boolean;
  username: string;
  playGame(id: string | number): Promise<void>;
  getPoints(diff: string): number;
  selectAnswer(opt: string): void;
  nextQuestion(): void;
  quitGame(): void;
}

const data = (): GameData => ({
  activeGame: null,
  questions: [],
  isPlaying: false,
  currentIndex: 0,
  selectedAnswer: null,
  showFeedback: false,
  currentScore: 0,
  maxScore: 0,
  correctCount: 0,
  wrongCount: 0,
  gameFinished: false,
  username: 'jujukalase732',
  
  async playGame(id: string | number) {
    console.log('Playing game:', id);
    try {
      const res = await fetch('/api/projects/' + id);
      const json = await res.json() as { success: boolean; data: any };
      if(json.success) {
        this.activeGame = json.data;
        this.questions = json.data.questions || [];
        if(this.questions.length === 0) {
           alert('Game ini belum memiliki soal.');
           return;
        }
        this.maxScore = this.questions.reduce((acc: number, q: Question) => acc + this.getPoints(q.difficulty), 0);
        this.currentIndex = 0;
        this.currentScore = 0;
        this.correctCount = 0;
        this.wrongCount = 0;
        this.selectedAnswer = null;
        this.showFeedback = false;
        this.gameFinished = false;
        this.isPlaying = true;
      } else {
         alert('Gagal memuat game dari server.');
      }
    } catch (e) {
      console.error('Error fetching game:', e);
      alert('Terjadi kesalahan jaringan.');
    }
  },

  getPoints(diff: string) {
     const points: Record<string, number> = { 'RENDAH': 10, 'SEDANG': 20, 'SULIT': 50, 'BONUS': 30 };
     return points[diff] || 10;
  },

  selectAnswer(opt: string) {
    if(this.showFeedback) return;
    this.selectedAnswer = opt;
    this.showFeedback = true;
    
    const currentQ = this.questions[this.currentIndex];
    if (currentQ && opt === currentQ.correctAnswer) {
       this.currentScore += this.getPoints(currentQ.difficulty);
       this.correctCount++;
    } else {
       this.wrongCount++;
    }
  },

  nextQuestion() {
    if(this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
      this.selectedAnswer = null;
      this.showFeedback = false;
    } else {
      this.gameFinished = true;
    }
  },

  quitGame() {
    this.isPlaying = false;
    this.activeGame = null;
  }
});
console.log("Syntax is valid!");
process.exit(0);
