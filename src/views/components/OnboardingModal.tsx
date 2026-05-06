export const OnboardingModal = () => {
  const interests = [
    "Biblical Knowledge",
    "Eksegesis & Hermeneutik",
    "Biblical Theory",
    "Homiletika",
    "Apologetika"
  ];

  return `
    <div id="onboarding-modal" class="onboarding-overlay">
      <div class="onboarding-card">
        <div class="onboarding-header">
          <h2>Halo, Teman Baru! 📖</h2>
          <p>Pilih kategori yang paling membuatmu penasaran untuk pengalaman belajar yang lebih personal.</p>
        </div>
        
        <form id="onboarding-form" class="onboarding-form">
          <div class="interests-grid">
            ${interests.map(interest => `
              <label class="interest-item">
                <input type="checkbox" name="interests" value="${interest}" class="hidden-checkbox">
                <div class="interest-box">
                  <span class="icon">🔍</span>
                  <span class="label">${interest}</span>
                </div>
              </label>
            `).join('')}
          </div>
          
          <button type="submit" class="onboarding-submit" id="onboarding-submit-btn">
            Mulai Perjalanan Saya
          </button>
        </form>
      </div>
    </div>

    <style>
      .onboarding-overlay {
        position: fixed;
        inset: 0;
        background: rgba(26, 35, 126, 0.85);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease;
      }
      .onboarding-overlay.active {
        opacity: 1;
        pointer-events: auto;
      }
      .onboarding-card {
        background: white;
        width: 100%;
        max-width: 600px;
        border-radius: 32px;
        padding: 48px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        transform: translateY(20px);
        transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .onboarding-overlay.active .onboarding-card {
        transform: translateY(0);
      }
      .onboarding-header {
        text-align: center;
        margin-bottom: 40px;
      }
      .onboarding-header h2 {
        font-size: 28px;
        font-weight: 800;
        color: #1A237E;
        margin-bottom: 12px;
      }
      .onboarding-header p {
        color: #64748b;
        font-size: 16px;
        line-height: 1.6;
      }
      .interests-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 40px;
      }
      .interest-item {
        cursor: pointer;
      }
      .hidden-checkbox {
        display: none;
      }
      .interest-box {
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 16px;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        transition: all 0.2s ease;
        text-align: center;
      }
      .interest-box .icon {
        font-size: 24px;
      }
      .interest-box .label {
        font-weight: 600;
        font-size: 14px;
        color: #334155;
      }
      .hidden-checkbox:checked + .interest-box {
        background: #fff5f2;
        border-color: #FF5722;
        transform: scale(1.02);
        box-shadow: 0 10px 15px -3px rgba(255, 87, 34, 0.1);
      }
      .hidden-checkbox:checked + .interest-box .label {
        color: #FF5722;
      }
      .onboarding-submit {
        width: 100%;
        background: #FF5722;
        color: white;
        border: none;
        padding: 18px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 10px 15px -3px rgba(255, 87, 34, 0.3);
      }
      .onboarding-submit:hover {
        background: #E64A19;
        transform: translateY(-2px);
        box-shadow: 0 15px 20px -5px rgba(255, 87, 34, 0.4);
      }
      .onboarding-submit:disabled {
        background: #cbd5e1;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
    </style>

    <script>
      (function() {
        const modal = document.getElementById('onboarding-modal');
        const form = document.getElementById('onboarding-form');
        const submitBtn = document.getElementById('onboarding-submit-btn');

        if (modal && form) {
          // Show modal with a small delay
          setTimeout(() => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
          }, 1000);

          form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const selectedInterests = formData.getAll('interests');
            
            if (selectedInterests.length === 0) {
              alert('Pilih setidaknya satu minat untuk melanjutkan.');
              return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = 'Menyimpan...';

            try {
              const response = await fetch('/profile/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ interests: selectedInterests })
              });

              if (response.ok) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                // Optional: Trigger a reload or update the UI
                window.location.reload();
              } else {
                alert('Gagal menyimpan pilihan.');
              }
            } catch (err) {
              console.error(err);
              alert('Terjadi kesalahan koneksi.');
            } finally {
              submitBtn.disabled = false;
              submitBtn.innerText = 'Mulai Perjalanan Saya';
            }
          });
        }
      })();
    </script>
  `;
};
