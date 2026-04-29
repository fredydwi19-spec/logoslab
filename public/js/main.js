/**
 * Logos LAB - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initCarousel();
  initRevealAnimations();
  initCounters();

  // ========== LOGIN MODAL LOGIC ==========
  const loginModal = document.getElementById('login-modal');
  const loginTrigger = document.getElementById('btn-login-trigger');
  const loginClose = document.getElementById('login-modal-close');
  const loginOverlay = document.getElementById('login-modal-overlay');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginSubmitBtn = document.getElementById('login-submit-btn');

  if (loginTrigger && loginModal) {
    loginTrigger.addEventListener('click', () => {
      loginModal.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scroll
    });

    const closeModal = () => {
      loginModal.classList.remove('active');
      document.body.style.overflow = '';
      loginError.style.display = 'none';
      loginForm.reset();
    };

    loginClose.addEventListener('click', closeModal);
    loginOverlay.addEventListener('click', closeModal);

    // Handle Form Submission
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
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
          // Success! Redirect to dashboard
          window.location.href = result.redirect;
        } else {
          // Error
          loginError.textContent = result.error || 'Login gagal. Silakan coba lagi.';
          loginError.style.display = 'block';
        }
      } catch (err) {
        console.error('Login error:', err);
        loginError.textContent = 'Terjadi kesalahan koneksi.';
        loginError.style.display = 'block';
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.textContent = 'Masuk Sekarang';
      }
    });
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
