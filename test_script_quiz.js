
      function bankSoalQuizData() {
        return {
          soalList: [],
          loading: true,
          showForm: false,
          isEdit: false,
          openImportModal: false,
          selectedFile: null,
          selectedFileName: "",
          isImporting: false,
          formData: {
            id: null,
            question: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'A',
            difficulty: 'MUDAH',
            explanation: ''
          },
          init() {
            this.fetchData();
          },
          async fetchData() {
            this.loading = true;
            try {
              const res = await fetch('/api/bank-soal/quiz');
              const json = await res.json();
              if (json.success) this.soalList = json.data;
            } catch (err) {
              console.error(err);
              alert("Gagal memuat data bank soal");
            } finally {
              this.loading = false;
            }
          },
          openFormModal(soal = null) {
            if (soal) {
              this.isEdit = true;
              this.formData = { ...soal };
            } else {
              this.isEdit = false;
              this.formData = { id: null, question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A', difficulty: 'MUDAH', explanation: '' };
            }
            this.showForm = true;
          },
          async submitForm() {
            try {
              const method = this.isEdit ? 'PUT' : 'POST';
              const url = this.isEdit ? `/api/bank-soal/quiz/${this.formData.id}` : '/api/bank-soal/quiz';
              const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.formData)
              });
              const json = await res.json();
              if (json.success) {
                this.showForm = false;
                this.fetchData();
              } else {
                alert(json.error || "Gagal menyimpan data");
              }
            } catch (err) {
              alert("Terjadi kesalahan sistem");
            }
          },
          async deleteSoal(id) {
            if (!confirm("Hapus soal ini?")) return;
            try {
              const res = await fetch(`/api/bank-soal/quiz/${id}`, { method: 'DELETE' });
              if (res.ok) this.fetchData();
            } catch (err) {
              alert("Gagal menghapus soal");
            }
          },
          handleFileChange(e) {
            const file = e.target.files[0];
            if (file) {
              this.selectedFile = file;
              this.selectedFileName = file.name;
            }
          },
          async submitImport() {
            if (!this.selectedFile) return;
            this.isImporting = true;
            const formData = new FormData();
            formData.append('file', this.selectedFile);
            try {
              const res = await fetch('/api/bank-soal/import/quiz', {
                method: 'POST',
                body: formData
              });
              const json = await res.json();
              if (json.success) {
                alert(`Berhasil mengimpor ${json.imported} soal.`);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                document.getElementById('fileImport').value = '';
                this.fetchData();
              } else {
                alert(json.error || "Gagal import");
              }
            } catch (err) {
              alert("Terjadi kesalahan saat import");
            } finally {
              this.isImporting = false;
            }
          },
          downloadTemplate() {
            const rows = [
              'question,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation',
              'Siapa proklamator kemerdekaan Indonesia?,Soekarno dan Hatta,Suharto dan Habibie,Megawati dan Gus Dur,Jokowi dan Ma'ruf,A,MUDAH,Soekarno-Hatta memproklamasikan kemerdekaan pada 17 Agustus 1945',
              'Berapakah hasil dari 7 x 8?,54,56,58,60,B,SEDANG,7 dikali 8 sama dengan 56',
              'Apa nama hukum fisika yang menyatakan setiap aksi ada reaksi yang sama besar dan berlawanan arah?,Hukum Newton I,Hukum Newton II,Hukum Newton III,Hukum Archimedes,C,SULIT,Ini adalah Hukum Newton III tentang aksi-reaksi'
            ];
            const csvContent = rows.join('\n');
            const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Template_Bank_Soal_Quiz.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    