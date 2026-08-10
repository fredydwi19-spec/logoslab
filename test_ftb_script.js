
      function bankSoalFtbData() {
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
            fullText: '',
            answers: [],
            difficulty: 'MUDAH'
          },
          init() {
            this.fetchData();
          },
          async fetchData() {
            this.loading = true;
            try {
              const res = await fetch('/api/bank-soal/ftb');
              const json = await res.json();
              if (json.success) this.soalList = json.data;
            } catch (err) {
              console.error(err);
              alert("Gagal memuat data");
            } finally {
              this.loading = false;
            }
          },
          extractAnswers() {
            const matches = [...this.formData.fullText.matchAll(/\[(.*?)\]/g)];
            // Pertahankan penjelasan yang sudah diisi jika kata sama
            const newAnswers = matches.map(m => m[1]).filter(w => w.trim() !== "");
            
            const currentAnsMap = {};
            this.formData.answers.forEach(a => { currentAnsMap[a.word] = a.explanation; });

            this.formData.answers = newAnswers.map(word => ({
              word: word,
              explanation: currentAnsMap[word] || ""
            }));
          },
          openFormModal(soal = null) {
            if (soal) {
              this.isEdit = true;
              this.formData = { ...soal, answers: JSON.parse(JSON.stringify(soal.answers)) };
            } else {
              this.isEdit = false;
              this.formData = { id: null, fullText: '', answers: [], difficulty: 'MUDAH' };
            }
            this.showForm = true;
          },
          async submitForm() {
            if (this.formData.answers.length === 0) {
              alert("Harap ekstrak kata rumpang terlebih dahulu");
              return;
            }
            try {
              const method = this.isEdit ? 'PUT' : 'POST';
              const url = this.isEdit ? `/api/bank-soal/ftb/${this.formData.id}` : '/api/bank-soal/ftb';
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
              const res = await fetch(`/api/bank-soal/ftb/${id}`, { method: 'DELETE' });
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
              const res = await fetch('/api/bank-soal/import/ftb', {
                method: 'POST',
                body: formData
              });
              const json = await res.json();
              if (json.success) {
                alert(`Berhasil mengimpor ${json.imported} soal.`);
                this.openImportModal = false;
                this.selectedFile = null;
                this.selectedFileName = "";
                document.getElementById('fileImportFTB').value = '';
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
              'fullText,difficulty,word1,explanation1,word2,explanation2,word3,explanation3',
              'Ibukota Indonesia adalah [Jakarta] yang terletak di Pulau [Jawa].,MUDAH,Jakarta,Kota metropolitan terbesar di Indonesia,Jawa,Pulau terpadat di Indonesia,,',
              'Proses fotosintesis menghasilkan [oksigen] dan [glukosa] dengan bantuan cahaya matahari.,SEDANG,oksigen,Gas yang dibutuhkan makhluk hidup untuk bernafas,glukosa,Sumber energi bagi tumbuhan,,',
              'Teori relativitas dikemukakan oleh [Einstein] pada tahun [1905].,SULIT,Einstein,Fisikawan brilian asal Jerman,1905,Tahun diterbitkannya teori relativitas khusus,,'
            ];
            const csvContent = rows.join('\n');
            const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Template_Bank_Soal_FTB.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        };
      }
    