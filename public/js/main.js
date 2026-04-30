/**
 * Logos LAB - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initCarousel();
  initRevealAnimations();
  initCounters();

  // ========== UNIFIED AUTH MODAL LOGIC ==========
  const authModal = document.getElementById('auth-modal');
  const authContainer = document.getElementById('auth-container');
  const authTrigger = document.getElementById('btn-login-trigger');
  const authClose = document.getElementById('auth-modal-close');
  const signUpBtn = document.getElementById('signUp');
  const signInBtn = document.getElementById('signIn');

  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const loginError = document.getElementById('login-error');
  const signupError = document.getElementById('signup-error');
  const signupSuccess = document.getElementById('signup-success');
  const loginSubmitBtn = document.getElementById('login-submit-btn');
  const signupSubmitBtn = document.getElementById('signup-submit-btn');

  if (authTrigger && authModal && authContainer) {
    authTrigger.addEventListener('click', () => {
      authModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeAuthModal = () => {
      authModal.classList.remove('active');
      document.body.style.overflow = '';
      if(loginError) loginError.style.display = 'none';
      if(signupError) signupError.style.display = 'none';
      if(signupSuccess) signupSuccess.style.display = 'none';
      if(loginForm) loginForm.reset();
      if(signupForm) signupForm.reset();
      authContainer.classList.remove('right-panel-active');
    };

    if (authClose) authClose.addEventListener('click', closeAuthModal);
    authModal.addEventListener('click', (e) => {
      if (e.target === authModal) closeAuthModal();
    });

    if (signUpBtn) {
      signUpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.add('right-panel-active');
      });
    }

    if (signInBtn) {
      signInBtn.addEventListener('click', (e) => {
        e.preventDefault();
        authContainer.classList.remove('right-panel-active');
      });
    }

    // Handle Login Submission
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        loginSubmitBtn.disabled = true;
        loginSubmitBtn.textContent = 'Memproses...';

        const formData = new FormData(loginForm);
        const payload = Object.fromEntries(formData.entries());

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const result = await response.json();

          if (response.ok) {
            window.location.href = result.redirect;
          } else {
            loginError.textContent = result.error || 'Login gagal. Silakan coba lagi.';
            loginError.style.display = 'block';
          }
        } catch (err) {
          console.error('Login error:', err);
          loginError.textContent = 'Terjadi kesalahan koneksi.';
          loginError.style.display = 'block';
        } finally {
          loginSubmitBtn.disabled = false;
          loginSubmitBtn.textContent = 'Masuk';
        }
      });
    }

    // Handle Signup Submission
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        signupError.style.display = 'none';
        signupSuccess.style.display = 'none';

        const formData = new FormData(signupForm);
        const payload = Object.fromEntries(formData.entries());

        if (payload.password !== payload.password_confirm) {
          signupError.textContent = 'Konfirmasi password tidak cocok.';
          signupError.style.display = 'block';
          return;
        }

        signupSubmitBtn.disabled = true;
        signupSubmitBtn.textContent = 'Memproses...';

        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: payload.name,
              email: payload.email,
              password: payload.password
            })
          });

          const result = await response.json();

          if (response.ok) {
            signupSuccess.textContent = result.message || 'Pendaftaran berhasil. Silakan cek email Anda.';
            signupSuccess.style.display = 'block';
            signupForm.reset();
          } else {
            signupError.textContent = result.error || 'Pendaftaran gagal.';
            signupError.style.display = 'block';
          }
        } catch (err) {
          console.error('Signup error:', err);
          signupError.textContent = 'Terjadi kesalahan koneksi.';
          signupError.style.display = 'block';
        } finally {
          signupSubmitBtn.disabled = false;
          signupSubmitBtn.textContent = 'Daftar';
        }
      });
    }
  }
});

/* --- Header Scroll Effect --- */
function initHeaderScroll() {
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* --- Games Carousel Logic --- */
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  
  if (!track || !btnPrev || !btnNext) return;
  
  const scrollAmount = 320; // Width of card + gap
  
  btnNext.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
  
  btnPrev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
}

/* --- Scroll Reveal Animations --- */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100; // Trigger point
    
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('visible');
      }
    });
  };
  
  // Initial check
  revealOnScroll();
  
  // Listen for scroll
  window.addEventListener('scroll', revealOnScroll);
}

/* --- Stats Counters --- */
async function initCounters() {
  const userCountEl = document.getElementById('user-count');
  const visitCountEl = document.getElementById('visit-count');
  
  // 1. Handle Visit Count (Dummy / LocalStorage)
  let visits = localStorage.getItem('logoslab_visits');
  if (!visits) {
    visits = 1250; // Base dummy number
  } else {
    visits = parseInt(visits) + 1;
  }
  localStorage.setItem('logoslab_visits', visits);
  
  if (visitCountEl) {
    animateCounter(visitCountEl, 0, parseInt(visits), 2000);
  }
  
  // 2. Fetch User Count from API
  try {
    const response = await fetch('/users');
    if (response.ok) {
      const data = await response.json();
      if (userCountEl && data.count !== undefined) {
        // Base users + actual users to make it look active
        const totalUsers = 500 + data.count; 
        animateCounter(userCountEl, 0, totalUsers, 2000);
      }
    } else {
      // Fallback
      if (userCountEl) userCountEl.innerText = "500+";
    }
  } catch (error) {
    console.error("Failed to fetch user count:", error);
    if (userCountEl) userCountEl.innerText = "500+";
  }
}

/* --- Utility: Animate Counter --- */
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeProgress * (end - start) + start);
    
    element.innerText = current.toLocaleString('id-ID');
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.innerText = end.toLocaleString('id-ID') + (end >= 500 ? '+' : '');
    }
  };
  
  window.requestAnimationFrame(step);
}
