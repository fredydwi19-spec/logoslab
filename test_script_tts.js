
      function bankSoalTtsData() {
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
            clue: '',
            answer: '',
            difficulty: 'MUDAH',
            explanation: ''
          },
          init() {
            this.fetchData();
          },
          async fetchData() {
            this.loading = true;
            try {
              const res = await fetch('/api/bank-soal/tts');
              const json = await res.json();
              if (json.success) this.soalList = json.data;
            } catch (err) {
              console.error(err);
              alert("Gagal memuat data");
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
              this.formData = { id: null, clue: '', answer: '', difficulty: 'MUDAH', explanation: '' };
            }
            this.showForm = true;
          },
          async submitForm() {
            if (!this.formData.clue || !this.formData.answer) {
              alert("Petunjuk dan Jawaban wajib diisi");
              return;
            }
            try {
              const method = this.isEdit ? 'PUT' : 'POST';
              const url = this.isEdit ? `/api/bank-soal/tts/${this.formData.id}` : '/api/bank-soal/tts';
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
                alert(json.error || "Gagal menyimpan");
              }
            } catch (err) {
              alert("Kesalahan sistem");
            }
          },
          async deleteSoal(id) {
            if (!confirm("Hapus soal ini?")) return;
            try {
              const res = await fetch(`/api/bank-soal/tts/${id}`, { method: 'DELETE' });
              if (res.ok) this.fetchData();
            } catch (err) {
              alert("Gagal hapus");
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
              const res = await fetch('/api/bank-soal/import/tts', {
                method: 'POST',
                body: formData
              });
              const json = await res.json();
              if (json.success) {
                alert(`Berhasil mengimpor ${json.imported} soal.`);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                document.getElementById('fileImportTTS').value = '';
                this.fetchData();
              } else {
                alert(json.error || "Gagal import");
              }
            } catch (err) {
              alert("Kesalahan sistem saat import");
            } finally {
              this.isImporting = false;
            }
          },
          downloadTemplate() {
            const rows = [
              'clue,answer,difficulty,explanation',
              'Ibukota Indonesia,JAKARTA,MUDAH,Sekarang sedang dipindahkan ke IKN Nusantara',
              'Planet terbesar di tata surya,JUPITER,SEDANG,Planet gas raksasa dengan badai besar di permukaannya',
              'Ilmuwan yang menemukan hukum gravitasi,NEWTON,SULIT,Isaac Newton merumuskan hukum gravitasi universal'
            ];
            const csvContent = rows.join('\n');
            const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Template_Bank_Soal_TTS.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    